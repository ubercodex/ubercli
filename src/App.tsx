import React, { useState } from 'react';
import { Box, useApp } from 'ink';
import Splash from './Splash.js';
import SettingsCommand from './commands/settings/index.js';
import ChatCommand from './commands/chat/index.js';
import PluginsCommand from './commands/plugins/index.js';
import MemoryCommand from './commands/memory/index.js';
import { type Settings, THEMES } from './types/settings.js';
import { type PluginStore } from './types/plugins.js';
import { type WorkspaceMemory } from './types/memory.js';
import { ThemeContext } from './context/ThemeContext.js';
import { loadSettings, saveSettings, getWorkspaceName, loadPluginStore, savePluginStore } from './store.js';
import { loadWorkspaceMemory, saveWorkspaceMemory } from './memory.js';

type Overlay = null | 'settings' | 'plugins' | 'memory';

export default function App(): React.JSX.Element {
	const { exit } = useApp();
	const [overlay, setOverlay] = useState<Overlay>(null);
	const [settings, setSettings] = useState<Settings>(() => loadSettings());
	const [pluginStore, setPluginStore] = useState<PluginStore>(() => loadPluginStore());
	const [memory, setMemory] = useState<WorkspaceMemory>(() => loadWorkspaceMemory());
	const workspaceName = getWorkspaceName();

	const handleSaveSettings = (updated: Settings) => {
		setSettings(updated);
		saveSettings(updated);
	};

	const handleSavePluginStore = (updated: PluginStore) => {
		setPluginStore(updated);
		savePluginStore(updated);
	};

	const handleUpdateMemory = (updated: WorkspaceMemory) => {
		setMemory(updated);
		saveWorkspaceMemory(updated);
	};

	const handleChatCommand = (cmd: string) => {
		if (cmd === '/settings') { setOverlay('settings'); return; }
		if (cmd === '/plugins')  { setOverlay('plugins');  return; }
		if (cmd === '/memory')   { setOverlay('memory');   return; }
		if (cmd === '/exit' || cmd === '/quit') { exit(); return; }
	};


	const theme = THEMES[settings.theme];
	const activeModel =
		settings.providers.anthropic.selectedModel ||
		settings.providers.openai.selectedModel ||
		settings.providers.google.selectedModel ||
		'';
	const activeProfile = pluginStore.profiles.find(p => p.id === pluginStore.activeProfileId)?.name ?? 'Default';

	if (overlay === 'settings') {
		return (
			<ThemeContext.Provider value={theme}>
				<Box flexDirection="column">
					<SettingsCommand
						settings={settings}
						onSave={handleSaveSettings}
						onBack={() => setOverlay(null)}
					/>
				</Box>
			</ThemeContext.Provider>
		);
	}

	if (overlay === 'plugins') {
		return (
			<ThemeContext.Provider value={theme}>
				<PluginsCommand
					store={pluginStore}
					settings={settings}
					onSave={handleSavePluginStore}
					onBack={() => setOverlay(null)}
				/>
			</ThemeContext.Provider>
		);
	}

	if (overlay === 'memory') {
		return (
			<ThemeContext.Provider value={theme}>
				<MemoryCommand
					memory={memory}
					onUpdate={handleUpdateMemory}
					onBack={() => setOverlay(null)}
				/>
			</ThemeContext.Provider>
		);
	}

	return (
		<ThemeContext.Provider value={theme}>
			<Box flexDirection="column">
				<Splash workspace={{ name: workspaceName, model: activeModel, profile: activeProfile }} />
				<ChatCommand
					settings={settings}
					pluginStore={pluginStore}
					onBack={exit}
					onCommand={handleChatCommand}
				/>
			</Box>
		</ThemeContext.Provider>
	);
}
