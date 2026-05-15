import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { type WorkspaceMemory, type BranchMemory, MEMORY_FILE } from './types/memory.js';

const UBERCLI_DIR = '.ubercli';

function getMemoryPath(): string {
	return join(process.cwd(), UBERCLI_DIR, MEMORY_FILE);
}

export function getCurrentGitBranch(): string | null {
	try {
		const branch = execSync('git rev-parse --abbrev-ref HEAD', {
			cwd: process.cwd(),
			stdio: ['pipe', 'pipe', 'pipe'],
		}).toString().trim();
		return branch === 'HEAD' ? null : branch;
	} catch {
		return null;
	}
}

export function isGitRepo(): boolean {
	try {
		execSync('git rev-parse --git-dir', {
			cwd: process.cwd(),
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		return true;
	} catch {
		return false;
	}
}

export function loadWorkspaceMemory(): WorkspaceMemory {
	const path = getMemoryPath();
	if (!existsSync(path)) {
		return {
			workspace: process.cwd(),
			baseSummary: '',
			branches: {},
			lastUpdated: new Date().toISOString(),
		};
	}
	try {
		return JSON.parse(readFileSync(path, 'utf8')) as WorkspaceMemory;
	} catch {
		return {
			workspace: process.cwd(),
			baseSummary: '',
			branches: {},
			lastUpdated: new Date().toISOString(),
		};
	}
}

export function saveWorkspaceMemory(mem: WorkspaceMemory): void {
	const dir = join(process.cwd(), UBERCLI_DIR);
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
	writeFileSync(getMemoryPath(), JSON.stringify(mem, null, 2), 'utf8');
}

export function resolveBranchKey(): string {
	if (!isGitRepo()) return '__default__';
	const branch = getCurrentGitBranch();
	return branch ?? '__default__';
}

export function getOrCreateBranchMemory(mem: WorkspaceMemory, branchKey: string): BranchMemory {
	if (mem.branches[branchKey]) return mem.branches[branchKey];
	return {
		branch: branchKey,
		summary: '',
		rawTurns: [],
		lastUpdated: new Date().toISOString(),
		tokenEstimate: 0,
	};
}

export function appendTurns(
	mem: WorkspaceMemory,
	branchKey: string,
	turns: { role: 'user' | 'assistant'; content: string }[]
): WorkspaceMemory {
	const branch = getOrCreateBranchMemory(mem, branchKey);
	const updated: BranchMemory = {
		...branch,
		rawTurns: [...branch.rawTurns, ...turns],
		lastUpdated: new Date().toISOString(),
		tokenEstimate: branch.tokenEstimate + turns.reduce((s, t) => s + Math.ceil(t.content.length / 4), 0),
	};
	return {
		...mem,
		branches: { ...mem.branches, [branchKey]: updated },
		lastUpdated: new Date().toISOString(),
	};
}

export function updateBranchSummary(
	mem: WorkspaceMemory,
	branchKey: string,
	summary: string,
	clearRaw = false
): WorkspaceMemory {
	const branch = getOrCreateBranchMemory(mem, branchKey);
	const updated: BranchMemory = {
		...branch,
		summary,
		rawTurns: clearRaw ? [] : branch.rawTurns,
		lastUpdated: new Date().toISOString(),
		tokenEstimate: Math.ceil(summary.length / 4),
	};
	return {
		...mem,
		branches: { ...mem.branches, [branchKey]: updated },
		lastUpdated: new Date().toISOString(),
	};
}

export function updateBaseSummary(mem: WorkspaceMemory, baseSummary: string): WorkspaceMemory {
	return { ...mem, baseSummary, lastUpdated: new Date().toISOString() };
}

export function buildSystemPrompt(mem: WorkspaceMemory, branchKey: string): string {
	const branch = getOrCreateBranchMemory(mem, branchKey);
	const parts: string[] = [];

	if (mem.baseSummary) {
		parts.push(`## Workspace Memory (shared across all branches)\n${mem.baseSummary}`);
	}
	if (branch.summary) {
		parts.push(`## Branch Memory (${branchKey})\n${branch.summary}`);
	}
	if (branch.rawTurns.length > 0) {
		const recent = branch.rawTurns
			.slice(-20)
			.map(t => `${t.role === 'user' ? 'User' : 'AI'}: ${t.content}`)
			.join('\n');
		parts.push(`## Recent conversation\n${recent}`);
	}

	if (parts.length === 0) return '';
	return parts.join('\n\n');
}
