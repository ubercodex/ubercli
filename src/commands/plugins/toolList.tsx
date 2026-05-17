import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { useTheme } from '../../context/ThemeContext.js';
import { type PluginStore, type PluginTool } from '../../types/plugins.js';

interface ToolListProps {
	store: PluginStore;
	onSave: (store: PluginStore) => void;
	onEdit: (tool: PluginTool) => void;
	onNew: () => void;
	onBack: () => void;
}

export default function ToolList({ store, onSave, onEdit, onNew, onBack }: ToolListProps): React.JSX.Element {
	const theme = useTheme();
	const [cursor, setCursor] = useState(0);
	const [exportMessage, setExportMessage] = useState<string | null>(null);
	const tools = store.tools;

	const exportTool = (tool: PluginTool) => {
		if (tool.kind !== 'custom') {
			setExportMessage('Cannot export built-in tools');
			setTimeout(() => setExportMessage(null), 3000);
			return;
		}

		const exportData = {
			name: tool.name,
			description: tool.description,
			params: tool.params,
			code: tool.code,
		};

		const filename = `${tool.name}.json`;
		const filepath = join(process.cwd(), filename);
		
		try {
			writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf-8');
			setExportMessage(`✓ Exported to ${filename}`);
			setTimeout(() => setExportMessage(null), 3000);
		} catch (err) {
			setExportMessage(`✗ Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
			setTimeout(() => setExportMessage(null), 3000);
		}
	};

	useInput((_char, key) => {
		if (key.upArrow)   { setCursor(c => Math.max(0, c - 1)); return; }
		if (key.downArrow) { setCursor(c => Math.min(tools.length, c + 1)); return; }
		if (key.escape)    { onBack(); return; }

		if (key.return) {
			if (cursor === tools.length) { onNew(); return; }
			onEdit(tools[cursor]);
			return;
		}

		if (_char === ' ') {
			if (cursor === tools.length) return;
			const updated = tools.map((t, i) =>
				i === cursor ? { ...t, enabled: !t.enabled } : t
			);
			onSave({ ...store, tools: updated });
		}

		if (_char === 'e' || _char === 'E') {
			if (cursor === tools.length) return;
			exportTool(tools[cursor]);
		}
	});

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			<Box marginBottom={1} gap={2}>
				<Text bold color={theme.primary}>🔧 Tools</Text>
				<Text color={theme.muted}>↑↓ navigate  Space toggle  E export  Enter edit  Esc back</Text>
			</Box>

			{exportMessage && (
				<Box marginBottom={1} paddingX={2} paddingY={0} borderStyle="round" borderColor={exportMessage.startsWith('✓') ? '#4ade80' : '#f87171'}>
					<Text color={exportMessage.startsWith('✓') ? '#4ade80' : '#f87171'}>{exportMessage}</Text>
				</Box>
			)}

			<Box flexDirection="column" borderStyle="round" borderColor={theme.border} paddingX={2} paddingY={0}>
				{tools.map((t, i) => {
					const active = i === cursor;
					return (
						<Box key={t.id} gap={2}>
							<Text color={active ? theme.secondary : theme.border} bold>{active ? '›' : ' '}</Text>
							<Text color={t.enabled ? '#4ade80' : theme.muted}>{t.enabled ? '●' : '○'}</Text>
							<Text color={active ? theme.accent : theme.primary} bold>{t.name.padEnd(20)}</Text>
							<Text color={theme.muted}>{t.kind === 'builtin' ? '[builtin]' : '[custom] '}</Text>
							<Text color={active ? theme.secondary : theme.muted}>{t.description}</Text>
						</Box>
					);
				})}
				<Box key="__new__" gap={2} marginTop={1}>
					<Text color={cursor === tools.length ? theme.secondary : theme.border} bold>
						{cursor === tools.length ? '›' : ' '}
					</Text>
					<Text color={cursor === tools.length ? theme.accent : theme.muted}>+ New tool</Text>
				</Box>
			</Box>

			<Box marginTop={1}>
				<Text color={theme.muted} dimColor>Space toggles a tool on/off without removing it</Text>
			</Box>
		</Box>
	);
}
