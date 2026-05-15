import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useTheme } from '../../context/ThemeContext.js';
import { type WorkspaceMemory } from '../../types/memory.js';
import { resolveBranchKey, isGitRepo, getCurrentGitBranch, saveWorkspaceMemory } from '../../memory.js';

interface MemoryCommandProps {
	memory: WorkspaceMemory;
	onUpdate: (mem: WorkspaceMemory) => void;
	onBack: () => void;
}

type MemoryView = 'overview' | 'branch' | 'base';

export default function MemoryCommand({ memory, onUpdate, onBack }: MemoryCommandProps): React.JSX.Element {
	const theme = useTheme();
	const [view, setView] = useState<MemoryView>('overview');
	const [selectedBranch, setSelectedBranch] = useState(resolveBranchKey());
	const [cursor, setCursor] = useState(0);
	const [confirmClear, setConfirmClear] = useState(false);

	const git = isGitRepo();
	const currentBranch = getCurrentGitBranch();
	const branchKeys = Object.keys(memory.branches);
	const menuItems = ['Overview', ...branchKeys.map(b => `Branch: ${b}`), 'Base summary'];

	const clearBranch = (key: string) => {
		const updated: WorkspaceMemory = {
			...memory,
			branches: {
				...memory.branches,
				[key]: {
					...memory.branches[key],
					summary: '',
					rawTurns: [],
					tokenEstimate: 0,
					lastUpdated: new Date().toISOString(),
				},
			},
		};
		saveWorkspaceMemory(updated);
		onUpdate(updated);
		setConfirmClear(false);
	};

	const clearBase = () => {
		const updated: WorkspaceMemory = { ...memory, baseSummary: '', lastUpdated: new Date().toISOString() };
		saveWorkspaceMemory(updated);
		onUpdate(updated);
		setConfirmClear(false);
	};

	const clearAll = () => {
		const updated: WorkspaceMemory = {
			...memory,
			baseSummary: '',
			branches: {},
			lastUpdated: new Date().toISOString(),
		};
		saveWorkspaceMemory(updated);
		onUpdate(updated);
		setConfirmClear(false);
	};

	useInput((char, key) => {
		if (confirmClear) {
			if (char === 'y' || char === 'Y') {
				if (view === 'base') clearBase();
				else if (view === 'branch') clearBranch(selectedBranch);
				else clearAll();
			} else {
				setConfirmClear(false);
			}
			return;
		}

		if (key.escape) {
			if (view !== 'overview') { setView('overview'); return; }
			onBack();
			return;
		}

		if (view === 'overview') {
			if (key.upArrow)   { setCursor(c => Math.max(0, c - 1)); return; }
			if (key.downArrow) { setCursor(c => Math.min(menuItems.length - 1, c + 1)); return; }
			if (key.return) {
				if (cursor === 0) return;
				if (cursor === menuItems.length - 1) { setView('base'); return; }
				const key2 = branchKeys[cursor - 1];
				if (key2) { setSelectedBranch(key2); setView('branch'); }
				return;
			}
			if (char === 'x') { setConfirmClear(true); return; }
		}

		if (view === 'branch' || view === 'base') {
			if (char === 'x') { setConfirmClear(true); return; }
		}
	});

	const formatDate = (iso: string) => {
		try { return new Date(iso).toLocaleString(); } catch { return iso; }
	};

	/* ── confirm clear ── */
	if (confirmClear) {
		const target = view === 'base' ? 'base summary' : view === 'branch' ? `branch [${selectedBranch}]` : 'all memory';
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Text color="#ef4444" bold>Clear {target}?</Text>
				<Box marginTop={1} gap={2}>
					<Text color={theme.muted}>Press</Text>
					<Text color="#ef4444" bold>Y</Text>
					<Text color={theme.muted}>to confirm or any other key to cancel</Text>
				</Box>
			</Box>
		);
	}

	/* ── branch detail ── */
	if (view === 'branch') {
		const b = memory.branches[selectedBranch];
		if (!b) return <Box><Text color={theme.muted}>No data for branch {selectedBranch}</Text></Box>;
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Box marginBottom={1} gap={2}>
					<Text bold color={theme.primary}>Branch memory: {selectedBranch}</Text>
					<Text color={theme.muted}>X clear  ·  Esc back</Text>
				</Box>
				<Box flexDirection="column" borderStyle="round" borderColor={theme.border} paddingX={2} paddingY={1} gap={1}>
					<Box gap={2}><Text color={theme.primary} bold>{'Updated'.padEnd(12)}</Text><Text color={theme.border}>│</Text><Text color={theme.muted}>{formatDate(b.lastUpdated)}</Text></Box>
					<Box gap={2}><Text color={theme.primary} bold>{'Tokens ~'.padEnd(12)}</Text><Text color={theme.border}>│</Text><Text color={theme.accent}>{b.tokenEstimate.toLocaleString()}</Text></Box>
					<Box gap={2}><Text color={theme.primary} bold>{'Raw turns'.padEnd(12)}</Text><Text color={theme.border}>│</Text><Text color={theme.muted}>{b.rawTurns.length}</Text></Box>
					{b.summary ? (
						<Box flexDirection="column" gap={0}>
							<Box gap={2}><Text color={theme.primary} bold>{'Summary'.padEnd(12)}</Text><Text color={theme.border}>│</Text></Box>
							<Box borderStyle="single" borderColor={theme.border} paddingX={1} marginLeft={2}>
								<Text color={theme.secondary}>{b.summary}</Text>
							</Box>
						</Box>
					) : (
						<Box gap={2}><Text color={theme.primary} bold>{'Summary'.padEnd(12)}</Text><Text color={theme.border}>│</Text><Text color={theme.muted}>none yet</Text></Box>
					)}
				</Box>
			</Box>
		);
	}

	/* ── base summary ── */
	if (view === 'base') {
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Box marginBottom={1} gap={2}>
					<Text bold color={theme.primary}>Base summary (shared across branches)</Text>
					<Text color={theme.muted}>X clear  ·  Esc back</Text>
				</Box>
				<Box borderStyle="round" borderColor={theme.border} paddingX={2} paddingY={1}>
					{memory.baseSummary
						? <Text color={theme.secondary}>{memory.baseSummary}</Text>
						: <Text color={theme.muted}>No base summary yet. It is built automatically after branch compaction.</Text>
					}
				</Box>
			</Box>
		);
	}

	/* ── overview ── */
	const totalTurns = Object.values(memory.branches).reduce((s, b) => s + b.rawTurns.length, 0);
	const totalTokens = Object.values(memory.branches).reduce((s, b) => s + b.tokenEstimate, 0);

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			<Box marginBottom={1} gap={2}>
				<Text bold color={theme.primary}>Workspace Memory</Text>
				<Text color={theme.muted}>↑↓ navigate  Enter open  X clear all  Esc back</Text>
			</Box>

			<Box flexDirection="column" borderStyle="round" borderColor={theme.border} paddingX={2} paddingY={1} gap={1}>
				<Box gap={2}>
					<Text color={theme.primary} bold>{'Workspace'.padEnd(14)}</Text>
					<Text color={theme.border}>│</Text>
					<Text color={theme.muted}>{memory.workspace}</Text>
				</Box>
				<Box gap={2}>
					<Text color={theme.primary} bold>{'Git repo'.padEnd(14)}</Text>
					<Text color={theme.border}>│</Text>
					<Text color={git ? theme.accent : theme.muted}>{git ? `yes  ·  current: ${currentBranch ?? 'detached'}` : 'no'}</Text>
				</Box>
				<Box gap={2}>
					<Text color={theme.primary} bold>{'Branches'.padEnd(14)}</Text>
					<Text color={theme.border}>│</Text>
					<Text color={theme.muted}>{branchKeys.length}</Text>
				</Box>
				<Box gap={2}>
					<Text color={theme.primary} bold>{'Total turns'.padEnd(14)}</Text>
					<Text color={theme.border}>│</Text>
					<Text color={theme.muted}>{totalTurns}</Text>
				</Box>
				<Box gap={2}>
					<Text color={theme.primary} bold>{'Tokens ~'.padEnd(14)}</Text>
					<Text color={theme.border}>│</Text>
					<Text color={theme.accent}>{totalTokens.toLocaleString()}</Text>
				</Box>
			</Box>

			<Box flexDirection="column" borderStyle="single" borderColor={theme.border} paddingX={2} paddingY={0} marginTop={1}>
				{menuItems.map((item, i) => {
					const active = i === cursor;
					const isCurrent = item === `Branch: ${currentBranch ?? '__default__'}` || (currentBranch === null && item === 'Branch: __default__');
					return (
						<Box key={item} gap={2}>
							<Text color={active ? theme.secondary : theme.border} bold>{active ? '›' : ' '}</Text>
							<Text color={active ? theme.accent : theme.primary}>{item}</Text>
							{isCurrent && <Text color={theme.secondary} dimColor> ← active</Text>}
						</Box>
					);
				})}
			</Box>
		</Box>
	);
}
