// New memory system using markdown files instead of JSON
// This replaces the old JSON-based memory.ts with the proper two-layer markdown system

import { type WorkspaceMemory, type BranchMemory } from './types/memory.js';
import {
	loadMemory,
	getCurrentBranch,
	getSharedMemoryPath,
	getBranchMemoryPath,
} from './workspace/memory.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export function getCurrentGitBranch(): string | null {
	// Use async version but make it sync for compatibility
	try {
		const { execSync } = require('child_process');
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
		const { execSync } = require('child_process');
		execSync('git rev-parse --git-dir', {
			cwd: process.cwd(),
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		return true;
	} catch {
		return false;
	}
}

// Load memory from markdown files and convert to WorkspaceMemory format
export function loadWorkspaceMemory(): WorkspaceMemory {
	try {
		const sharedPath = getSharedMemoryPath();
		const shared = existsSync(sharedPath) ? readFileSync(sharedPath, 'utf8') : '';
		
		const branch = getCurrentGitBranch() ?? '__default__';
		const branches: Record<string, BranchMemory> = {};
		
		// Try to load branch-specific memory
		const branchPath = getBranchMemoryPathSync(branch);
		const branchContent = existsSync(branchPath) ? readFileSync(branchPath, 'utf8') : '';
		
		branches[branch] = {
			branch,
			summary: branchContent,
			rawTurns: [], // No longer storing raw turns
			lastUpdated: new Date().toISOString(),
			tokenEstimate: Math.ceil(branchContent.length / 4),
		};
		
		return {
			workspace: process.cwd(),
			baseSummary: shared,
			branches,
			lastUpdated: new Date().toISOString(),
		};
	} catch {
		return {
			workspace: process.cwd(),
			baseSummary: '',
			branches: {},
			lastUpdated: new Date().toISOString(),
		};
	}
}

function getBranchMemoryPathSync(branch: string): string {
	const sanitized = branch.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');
	const { join } = require('path');
	return join(process.cwd(), '.ubercli', 'memory', `${sanitized}.md`);
}

// Save memory to markdown files
export function saveWorkspaceMemory(mem: WorkspaceMemory): void {
	try {
		// Save shared baseline
		const sharedPath = getSharedMemoryPath();
		const sharedDir = dirname(sharedPath);
		if (!existsSync(sharedDir)) mkdirSync(sharedDir, { recursive: true });
		writeFileSync(sharedPath, mem.baseSummary, 'utf8');
		
		// Save branch-specific memory
		const branch = getCurrentGitBranch() ?? '__default__';
		const branchMem = mem.branches[branch];
		if (branchMem) {
			const branchPath = getBranchMemoryPathSync(branch);
			const branchDir = dirname(branchPath);
			if (!existsSync(branchDir)) mkdirSync(branchDir, { recursive: true });
			writeFileSync(branchPath, branchMem.summary || '', 'utf8');
		}
	} catch (err) {
		console.error('Failed to save memory:', err);
	}
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

// Append turns is now deprecated - we store summaries, not raw turns
export function appendTurns(
	mem: WorkspaceMemory,
	branchKey: string,
	turns: { role: 'user' | 'assistant'; content: string }[]
): WorkspaceMemory {
	// For backward compatibility, just return the memory unchanged
	// The compaction process will handle summarization
	return mem;
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
		rawTurns: [],
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

	if (parts.length === 0) return '';
	return parts.join('\n\n');
}
