import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Splash from './Splash.js';
import SettingsCommand from './commands/settings/index.js';
import { type Settings, THEMES } from './types/settings.js';
import { ThemeContext } from './context/ThemeContext.js';
import { loadSettings, saveSettings, getWorkspaceName } from './store.js';

type ActiveCommand = null | 'settings';

export default function App(): React.JSX.Element {
	const { exit } = useApp();
	const [input, setInput] = useState<string>('');
	const [activeCommand, setActiveCommand] = useState<ActiveCommand>(null);
	const [settings, setSettings] = useState<Settings>(() => loadSettings());
	const workspaceName = getWorkspaceName();

	const handleCommand = (raw: string) => {
		const cmd = raw.trim().toLowerCase();
		if (cmd === '/settings') { setActiveCommand('settings'); return; }
		if (cmd === '/exit' || cmd === '/quit') { exit(); return; }
	};

	const handleSaveSettings = (updated: Settings) => {
		setSettings(updated);
		saveSettings(updated);
	};

	useInput((char: string, key) => {
		if (activeCommand !== null) return;

		if (key.ctrl && char === 'c') { exit(); return; }
		if (key.escape) { setInput(''); return; }

		if (key.backspace || key.delete) {
			setInput(prev => prev.slice(0, -1));
			return;
		}

		if (key.return) {
			handleCommand(input);
			setInput('');
			return;
		}

		if (char) setInput(prev => prev + char);
	});

	const theme = THEMES[settings.theme];

	if (activeCommand === 'settings') {
		return (
			<ThemeContext.Provider value={theme}>
				<Box flexDirection="column">
					<SettingsCommand
						settings={settings}
						onSave={handleSaveSettings}
						onBack={() => setActiveCommand(null)}
					/>
				</Box>
			</ThemeContext.Provider>
		);
	}

	return (
		<ThemeContext.Provider value={theme}>
			<Box flexDirection="column">
				<Splash workspace={{ name: workspaceName, model: settings.providers.anthropic.selectedModel || settings.providers.openai.selectedModel || settings.providers.google.selectedModel || '' }} />

				<Box paddingLeft={1} paddingBottom={1}>
					<Text color={theme.primary}>{'> '}</Text>
					<Text color={theme.accent}>{input}</Text>
					<Text color={theme.muted}>█</Text>
				</Box>

				<Box paddingLeft={1}>
					<Text color={theme.muted} dimColor>/settings  /exit</Text>
				</Box>
			</Box>
		</ThemeContext.Provider>
	);
}
