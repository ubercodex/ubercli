import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getWorkspace } from './index.js';
import type { ChatMessageData } from '../components/ChatMessage.js';

// Two-layer memory system:
//   1. Shared baseline at <workspace>/.ubercli/memory/shared.md — facts that hold across
//      every branch (architecture, conventions, run commands, project structure).
//   2. Per-branch overlay at <workspace>/.ubercli/memory/<branch>.md —
//      branch-specific in-flight work, decisions, gotchas, current tasks.
// Both are loaded into the system prompt every turn. Background updates after
// each turn target the overlay when inside a git repo, otherwise the shared file.
// Each layer is independently capped at MEMORY_TOKEN_LIMIT and gets a second
// LLM compaction pass if the refreshed text exceeds it.

const execFileP = promisify(execFile);

const SHARED_MEMORY_FILENAME = 'shared.md';
const BRANCH_MEMORY_SUBDIR = path.join('.ubercli', 'memory');

export const MEMORY_TOKEN_LIMIT = 10000;
// Rough estimate: ~4 characters per token
const CHARS_PER_TOKEN = 4;

export function memoryTokens(content: string): number {
  return Math.ceil(content.length / CHARS_PER_TOKEN);
}

export function getSharedMemoryPath(): string {
  return path.join(getWorkspace(), BRANCH_MEMORY_SUBDIR, SHARED_MEMORY_FILENAME);
}

// Returns the current git branch name in the workspace, a "detached-<sha>"
// label if HEAD is detached, or null if we aren't inside a git repo.
// 1.5s timeout so a stalled git never blocks the UI.
export async function getCurrentBranch(): Promise<string | null> {
  try {
    const { stdout } = await execFileP(
      'git',
      ['rev-parse', '--abbrev-ref', 'HEAD'],
      { cwd: getWorkspace(), timeout: 1500 },
    );
    const name = stdout.trim();
    if (!name) return null;
    if (name === 'HEAD') {
      try {
        const r = await execFileP(
          'git',
          ['rev-parse', '--short', 'HEAD'],
          { cwd: getWorkspace(), timeout: 1500 },
        );
        return `detached-${r.stdout.trim()}`;
      } catch {
        return 'detached';
      }
    }
    return name;
  } catch {
    return null;
  }
}

// Branches like `feature/foo` or `release/1.2` are common; flatten to a single
// safe filename so the on-disk layout stays predictable.
function sanitizeBranchName(branch: string): string {
  return branch.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');
}

export async function getBranchMemoryPath(): Promise<string | null> {
  const branch = await getCurrentBranch();
  if (!branch) return null;
  return path.join(
    getWorkspace(),
    BRANCH_MEMORY_SUBDIR,
    `${sanitizeBranchName(branch)}.md`,
  );
}

async function readFileOrEmpty(p: string): Promise<string> {
  try {
    return await fs.readFile(p, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return '';
    throw err;
  }
}

export interface LoadedMemory {
  shared: string;
  sharedPath: string;
  branch: string | null;
  branchPath: string | null;
  branchContent: string;
}

export async function loadMemory(): Promise<LoadedMemory> {
  const sharedPath = getSharedMemoryPath();
  const shared = await readFileOrEmpty(sharedPath);
  const branch = await getCurrentBranch();
  let branchPath: string | null = null;
  let branchContent = '';
  if (branch) {
    branchPath = path.join(
      getWorkspace(),
      BRANCH_MEMORY_SUBDIR,
      `${sanitizeBranchName(branch)}.md`,
    );
    branchContent = await readFileOrEmpty(branchPath);
  }
  return { shared, sharedPath, branch, branchPath, branchContent };
}

// Idempotent: appends an ignore block on the first save inside a git repo,
// then leaves .gitignore alone forever. Marker comment lets us detect prior runs.
async function ensureGitignore(): Promise<void> {
  const ws = getWorkspace();
  try {
    await fs.access(path.join(ws, '.git'));
  } catch {
    return;
  }
  const gi = path.join(ws, '.gitignore');
  let cur = '';
  try {
    cur = await fs.readFile(gi, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
  const marker = '# Uber CLI per-branch workspace memory';
  if (cur.includes(marker)) return;
  const sep = cur === '' || cur.endsWith('\n') ? '' : '\n';
  const block =
    `${sep}\n${marker}\n` +
    `uber-memory*.md\n` +
    `.ubercli/\n`;
  await fs.writeFile(gi, cur + block, 'utf8');
}

async function saveSharedMemory(content: string): Promise<void> {
  await fs.writeFile(getSharedMemoryPath(), content, 'utf8');
  await ensureGitignore();
}

async function saveBranchMemory(branchPath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(branchPath), { recursive: true });
  await fs.writeFile(branchPath, content, 'utf8');
  await ensureGitignore();
}

// Internal helper for AI-powered memory updates (not currently used)
function buildMemoryUpdatePrompt(
  target: 'shared' | 'branch',
  branch: string | null,
): string {
  const role =
    target === 'branch'
      ? `the per-branch memory overlay (current branch: ${branch}) for the Uber CLI coding agent`
      : `the shared workspace memory file for the Uber CLI coding agent`;
  const scope =
    target === 'branch'
      ? `Capture only branch-specific work: in-flight changes, decisions tied ` +
        `to this branch, files actively being touched, gotchas you hit while ` +
        `on this branch. Do NOT duplicate cross-branch facts already present ` +
        `in the shared baseline (general architecture, build/run commands, ` +
        `project-wide conventions).`
      : `Capture cross-branch facts: architecture, conventions, key file paths, ` +
        `build/run/test commands, gotchas, decisions and rationale, durable ` +
        `user preferences.`;
  return (
    `You maintain ${role}. The file is loaded into the assistant's system ` +
    `prompt every turn, so it MUST stay under ${MEMORY_TOKEN_LIMIT} tokens ` +
    `and contain only durable, semantic meaning — never transcripts. ` +
    `${scope} Drop chat filler, intermediate steps, debug output, and ` +
    `anything obvious from reading the code. Never invent details. If the ` +
    `latest exchange adds nothing durable, output the existing memory verbatim. ` +
    `Output ONLY the markdown body of the file — no preamble, no fences, no commentary.`
  );
}

const COMPACT_SYSTEM =
  `Compress this workspace memory file. Preserve every distinct durable ` +
  `learning, drop redundancy and verbosity. Target well under ` +
  `${MEMORY_TOKEN_LIMIT} tokens (roughly ${MEMORY_TOKEN_LIMIT * CHARS_PER_TOKEN} ` +
  `characters). Output ONLY the compacted markdown body — no preamble, no fences.`;

const TOOL_RESULT_RENDER_CAP = 600;

function renderExchange(messages: ChatMessageData[]): string {
  const lines: string[] = [];
  for (const m of messages) {
    if (m.role === 'user') {
      lines.push(`USER: ${m.content}`);
    } else if (m.role === 'assistant') {
      lines.push(`ASSISTANT: ${m.content}`);
    } else if (m.role === 'tool') {
      const text =
        m.content.length > TOOL_RESULT_RENDER_CAP
          ? m.content.slice(0, TOOL_RESULT_RENDER_CAP) + '... (truncated)'
          : m.content;
      lines.push(`TOOL_RESULT ${m.toolName ?? ''}: ${text}`);
    }
  }
  return lines.join('\n');
}

// Helper to manually update memory (can be called from chat command)
export async function updateMemoryContent(
  target: 'shared' | 'branch',
  content: string,
): Promise<void> {
  const m = await loadMemory();
  if (target === 'branch' && m.branchPath) {
    await saveBranchMemory(m.branchPath, content);
  } else {
    await saveSharedMemory(content);
  }
  console.log(`[memory] Updated ${target} memory (${memoryTokens(content)} tokens)`);
}

// Build system prompt section with memory content
export async function buildMemorySystemPrompt(): Promise<string> {
  const m = await loadMemory();
  let section = '';
  const sharedTrim = m.shared.trim();
  const branchTrim = m.branchContent.trim();
  if (sharedTrim || branchTrim) {
    section = `\n\nWorkspace memory (durable, semantic-only learnings; rewritten in the background after each turn).`;
    if (sharedTrim) {
      section +=
        `\nShared baseline — applies to every branch:\n` +
        `<<< BEGIN ${m.sharedPath} >>>\n${sharedTrim}\n<<< END >>>`;
    }
    if (branchTrim && m.branch) {
      section +=
        `\n\nPer-branch overlay (${m.branch}):\n` +
        `<<< BEGIN ${m.branchPath} >>>\n${branchTrim}\n<<< END >>>`;
    }
  }
  return section;
}
