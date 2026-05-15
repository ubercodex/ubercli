import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { type ThemeName, type Settings, THEMES } from '../../types/settings.js';
import { useTheme } from '../../context/ThemeContext.js';

interface ThemeSettingsProps {
	settings: Settings;
	onSave: (updated: Settings) => void;
	onBack: () => void;
}

const THEME_NAMES = Object.keys(THEMES) as ThemeName[];

export default function ThemeSettings({ settings, onSave, onBack }: ThemeSettingsProps): React.JSX.Element {
	const activeTheme = useTheme();
	const [cursor, setCursor] = useState<number>(
		Math.max(0, THEME_NAMES.indexOf(settings.theme))
	);

	useInput((_char, key) => {
		if (key.upArrow) setCursor(c => Math.max(0, c - 1));
		if (key.downArrow) setCursor(c => Math.min(THEME_NAMES.length - 1, c + 1));
		if (key.return) {
			onSave({ ...settings, theme: THEME_NAMES[cursor] });
			onBack();
		}
		if (key.escape) onBack();
	});

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			<Box marginBottom={1}>
				<Text bold color={activeTheme.primary}>Theme Settings</Text>
				<Text color={activeTheme.border}>  ↑↓ navigate  Enter select  Esc back</Text>
			</Box>

			<Box flexDirection="column" borderStyle="round" borderColor={activeTheme.border} paddingX={2} paddingY={0}>
				{THEME_NAMES.map((name, i) => {
					const theme = THEMES[name];
					const active = i === cursor;
					const isCurrent = name === settings.theme;
					return (
						<Box key={name} gap={2}>
							<Text color={active ? theme.secondary : theme.muted} bold>
								{active ? '›' : ' '}
							</Text>
							<Text color={active ? theme.accent : theme.primary} bold>
								{theme.label.padEnd(16)}
							</Text>
							<Text color={theme.primary}>■ </Text>
							<Text color={theme.secondary}>■ </Text>
							<Text color={theme.accent}>■</Text>
							{isCurrent && <Text color={theme.secondary}>  ✓ active</Text>}
						</Box>
					);
				})}
			</Box>

			<Box marginTop={1}>
				<Text color={activeTheme.muted} dimColor>Preview: </Text>
				{(() => {
					const t = THEMES[THEME_NAMES[cursor]];
					return (
						<Box gap={1}>
							<Text color={t.primary} bold>Primary</Text>
							<Text color={t.secondary}>Secondary</Text>
							<Text color={t.accent}>Accent</Text>
							<Text color={t.border}>Border</Text>
						</Box>
					);
				})()}
			</Box>
		</Box>
	);
}
