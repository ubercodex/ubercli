import { generateText } from 'ai';
import { type Settings } from './types/settings.js';
import { type WorkspaceMemory, type BranchMemory, estimateTokens } from './types/memory.js';
import { resolveActiveProvider, getLanguageModel } from './llm.js';
import {
	getOrCreateBranchMemory,
	updateBranchSummary,
	updateBaseSummary,
} from './memory.js';

const MODEL_TOKEN_LIMITS: Record<string, number> = {
	'gemini-2.5-flash':         1_000_000,
	'gemini-2.5-pro':           1_000_000,
	'gemini-2.0-flash':         1_000_000,
	'claude-opus-4-5':            200_000,
	'claude-sonnet-4-5':          200_000,
	'claude-haiku-3-5':           200_000,
	'gpt-4o':                     128_000,
	'gpt-4o-mini':                128_000,
	'gpt-4-turbo':                128_000,
	'o3':                         200_000,
	'o4-mini':                    200_000,
};
const DEFAULT_LIMIT = 32_000;
const COMPACT_THRESHOLD = 0.70;

export function getModelTokenLimit(model: string): number {
	return MODEL_TOKEN_LIMITS[model] ?? DEFAULT_LIMIT;
}

export function shouldCompact(
	settings: Settings,
	conversationTokens: number,
	memoryTokens: number
): boolean {
	const provider = resolveActiveProvider(settings);
	if (!provider) return false;
	const limit = getModelTokenLimit(provider.model);
	const used = conversationTokens + memoryTokens;
	return used / limit >= COMPACT_THRESHOLD;
}

const COMPACT_SYSTEM = `You are a semantic memory compressor for an AI terminal assistant.
You receive a previous summary and new conversation turns.
Produce an updated summary that:
- Preserves all factual knowledge, decisions, code patterns, and user preferences learned
- Removes filler, pleasantries, and redundant exchanges
- Keeps specific values (file names, versions, commands, config values) verbatim
- Merges duplicate facts into one
- Is written in dense third-person note style, not prose
- Must not exceed 800 words
Output ONLY the updated summary text — no heading, no markdown, no preamble.`;

const BASE_COMPACT_SYSTEM = `You are a semantic memory compressor.
Given branch summaries from the same git repository, extract the shared knowledge that applies across all branches:
project structure, tech stack, coding conventions, recurring user preferences.
Omit branch-specific work. Be concise — max 400 words.
Output ONLY the base summary text.`;

export async function compactBranchMemory(
	settings: Settings,
	mem: WorkspaceMemory,
	branchKey: string
): Promise<WorkspaceMemory> {
	const provider = resolveActiveProvider(settings);
	if (!provider) return mem;

	const branch = getOrCreateBranchMemory(mem, branchKey);
	if (branch.rawTurns.length === 0) return mem;

	const model = getLanguageModel(settings, provider);
	const turns = branch.rawTurns
		.map(t => `${t.role === 'user' ? 'User' : 'AI'}: ${t.content}`)
		.join('\n');

	const { text } = await generateText({
		model,
		system: COMPACT_SYSTEM,
		prompt: `Previous summary:\n${branch.summary || '(none)'}\n\nNew turns:\n${turns}`,
	});

	return updateBranchSummary(mem, branchKey, text.trim(), true);
}

export async function compactBaseSummary(
	settings: Settings,
	mem: WorkspaceMemory
): Promise<WorkspaceMemory> {
	const provider = resolveActiveProvider(settings);
	if (!provider) return mem;

	const branchSummaries = Object.values(mem.branches)
		.filter(b => b.summary)
		.map(b => `Branch [${b.branch}]:\n${b.summary}`)
		.join('\n\n---\n\n');

	if (!branchSummaries) return mem;

	const model = getLanguageModel(settings, provider);
	const { text } = await generateText({
		model,
		system: BASE_COMPACT_SYSTEM,
		prompt: `Workspace: ${mem.workspace}\n\nBranch summaries:\n${branchSummaries}`,
	});

	return updateBaseSummary(mem, text.trim());
}

export function estimateConversationTokens(
	messages: { role: string; content: string }[]
): number {
	return messages.reduce((s, m) => s + estimateTokens(m.content), 0);
}
