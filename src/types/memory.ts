export interface MemoryEntry {
	role: 'user' | 'assistant';
	content: string;
}

export interface BranchMemory {
	branch: string;
	summary: string;
	rawTurns: MemoryEntry[];
	lastUpdated: string;
	tokenEstimate: number;
}

export interface WorkspaceMemory {
	workspace: string;
	baseSummary: string;
	branches: Record<string, BranchMemory>;
	lastUpdated: string;
}

export const MEMORY_FILE = 'memory.json';

export function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

export function totalMemoryTokens(mem: BranchMemory): number {
	const rawTokens = mem.rawTurns.reduce((s, t) => s + estimateTokens(t.content), 0);
	return estimateTokens(mem.summary) + rawTokens;
}
