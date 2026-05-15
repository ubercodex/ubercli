import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { type Settings } from '../../types/settings.js';
import ProviderSettings from './providerSettings.js';
import ThemeSettings from './themeSettings.js';
import { useTheme } from '../../context/ThemeContext.js';

type SettingsView = 'menu' | 'providers' | 'theme';

interface SettingsCommandProps {
	settings: Settings;
	onSave: (updated: Settings) => void;
	onBack: () => void;
}

const MENU_ITEMS = [
	{ id: 'providers' as const, label: 'Provider Settings', description: 'API keys & model selection' },
	{ id: 'theme' as const, label: 'Theme Settings',    description: 'Color theme of the CLI'       },
];

export default function SettingsCommand({ settings, onSave, onBack }: SettingsCommandProps): React.JSX.Element {
	const theme = useTheme();
	const [view, setView] = useState<SettingsView>('menu');
	const [cursor, setCursor] = useState(0);

	useInput((_char, key) => {
		if (view !== 'menu') return;
		if (key.upArrow) setCursor(c => Math.max(0, c - 1));
		if (key.downArrow) setCursor(c => Math.min(MENU_ITEMS.length - 1, c + 1));
		if (key.return) setView(MENU_ITEMS[cursor].id as SettingsView);
		if (key.escape) onBack();
	});

	if (view === 'providers') {
		return (
			<ProviderSettings
				settings={settings}
				onSave={onSave}
				onBack={() => setView('menu')}
			/>
		);
	}

	if (view === 'theme') {
		return (
			<ThemeSettings
				settings={settings}
				onSave={onSave}
				onBack={() => setView('menu')}
			/>
		);
	}

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			<Box marginBottom={1} gap={2}>
				<Text bold color={theme.primary}>⚙  Settings</Text>
				<Text color={theme.border}>↑↓ navigate  Enter open  Esc back</Text>
			</Box>

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
