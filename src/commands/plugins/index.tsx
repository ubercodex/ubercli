import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useTheme } from '../../context/ThemeContext.js';
import { type PluginStore, type PluginTool } from '../../types/plugins.js';
import { type Settings } from '../../types/settings.js';
import ToolList from './toolList.js';
import ToolEditor from './toolEditor.js';
import ToolCreator from './toolCreator.js';
import ProfileList from './profileList.js';

type PluginView = 'menu' | 'tools' | 'editor' | 'creator' | 'profiles';

interface PluginsCommandProps {
	store: PluginStore;
	settings: Settings;
	onSave: (store: PluginStore) => void;
	onBack: () => void;
}

const MENU_ITEMS = [
	{ id: 'tools'    as const, label: 'Manage Tools',    description: 'Enable, disable, create or edit tools' },
	{ id: 'profiles' as const, label: 'Manage Profiles', description: 'Create profiles and assign tools'       },
];

export default function PluginsCommand({ store, settings, onSave, onBack }: PluginsCommandProps): React.JSX.Element {
	const theme = useTheme();
	const [view, setView]         = useState<PluginView>('tools'); // Start directly at tools
	const [cursor, setCursor]     = useState(0);
	const [editingTool, setEditingTool] = useState<PluginTool | null>(null);

	const activeProfile = store.profiles.find(p => p.id === store.activeProfileId);

	useInput((_char, key) => {
		if (view !== 'menu') return;
		if (key.upArrow)   setCursor(c => Math.max(0, c - 1));
		if (key.downArrow) setCursor(c => Math.min(MENU_ITEMS.length - 1, c + 1));
		if (key.return)    setView(MENU_ITEMS[cursor].id as PluginView);
		if (key.escape)    onBack();
	});

	if (view === 'tools') {
		return (
			<ToolList
				store={store}
				onSave={onSave}
				onEdit={t => { setEditingTool(t); setView('editor'); }}
				onNew={() => setView('creator')}
				onBack={onBack}
			/>
		);
	}

	if (view === 'creator') {
		return (
			<ToolCreator
				store={store}
				settings={settings}
				onSave={onSave}
				onBack={() => setView('tools')}
			/>
		);
	}

	if (view === 'editor' && editingTool) {
		return (
			<ToolEditor
				store={store}
				tool={editingTool}
				settings={settings}
				onSave={onSave}
				onBack={() => setView('tools')}
			/>
		);
	}

	if (view === 'profiles') {
		return (
			<ProfileList
				store={store}
				onSave={onSave}
				onBack={() => setView('menu')}
			/>
		);
	}

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			<Box marginBottom={1} gap={2}>
				<Text bold color={theme.primary}>🔌 Plugins</Text>
				<Text color={theme.muted}>↑↓ navigate  Enter open  Esc back</Text>
			</Box>

			{activeProfile && (
				<Box marginBottom={1} gap={1}>
					<Text color={theme.muted}>Active profile:</Text>
					<Text color={theme.secondary} bold>{activeProfile.name}</Text>
					<Text color={theme.muted}>({activeProfile.toolIds.length} tool{activeProfile.toolIds.length !== 1 ? 's' : ''})</Text>
				</Box>
			)}

			<Box flexDirection="column" borderStyle="round" borderColor={theme.border} paddingX={2} paddingY={0}>
				{MENU_ITEMS.map((item, i) => {
					const active = i === cursor;
					return (
						<Box key={item.id} gap={2}>
							<Text color={active ? theme.secondary : theme.border} bold>{active ? '›' : ' '}</Text>
							<Text color={active ? theme.accent : theme.primary} bold>{item.label.padEnd(20)}</Text>
							<Text color={theme.muted}>{item.description}</Text>
						</Box>
					);
				})}
			</Box>
		</Box>
	);
}
