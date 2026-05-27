import React, { useState } from 'react';
import { Box, useApp } from 'ink';
import Splash from './Splash.js';
import SettingsCommand from './commands/settings/index.js';
import ChatCommand from './commands/chat/index.js';
import PluginsCommand from './commands/plugins/index.js';
import ProfilesCommand from './commands/profiles/index.js';
import Installer from './commands/plugins/installer.js';
import ProfileInstaller from './commands/plugins/profileInstaller.js';
import MemoryCommand from './commands/memory/index.js';
import { type Settings, THEMES } from './types/settings.js';
import { type PluginStore } from './types/plugins.js';
import { type WorkspaceMemory } from './types/memory.js';
import { ThemeContext } from './context/ThemeContext.js';
import { loadSettings, saveSettings, getWorkspaceName, loadPluginStore, savePluginStore } from './store.js';
import { loadWorkspaceMemory, saveWorkspaceMemory } from './memory.js';

type Overlay = null | 'settings' | 'plugins' | 'profiles' | 'plugin-install' | 'profile-install' | 'memory';

interface AppProps {
	initialCommand?: string;
}

export default function App({ initialCommand }: AppProps = {}): React.JSX.Element {
	const { exit } = useApp();
	const [overlay, setOverlay] = useState<Overlay>(null);
	const [settings, setSettings] = useState<Settings>(() => loadSettings());
	const [pluginStore, setPluginStore] = useState<PluginStore>(() => loadPluginStore());
	const [memory, setMemory] = useState<WorkspaceMemory>(() => loadWorkspaceMemory());
	const [hasTyped, setHasTyped] = useState(false);
	const [pluginToInstall, setPluginToInstall] = useState<string>('');
	const [profileToInstall, setProfileToInstall] = useState<string>('');
	const [setProfileAsDefault, setSetProfileAsDefault] = useState(false);
	const workspaceName = getWorkspaceName();

	// Handle initial command from CLI args
	React.useEffect(() => {
		if (initialCommand) {
			handleChatCommand(initialCommand);
		}
	}, [initialCommand]);

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
		if (cmd === '/profiles') { setOverlay('profiles'); return; }
		if (cmd.startsWith('/plugins install ')) {
			const pluginName = cmd.replace('/plugins install ', '').trim();
			if (pluginName) {
				setOverlay('plugin-install');
				setPluginToInstall(pluginName);
			}
			return;
		}
		if (cmd.startsWith('/profiles install ')) {
			const profileName = cmd.replace('/profiles install ', '').trim();
			if (profileName) {
				setOverlay('profile-install');
				setProfileToInstall(profileName);
				setSetProfileAsDefault(false);
			}
			return;
		}
		if (cmd.startsWith('/profiles install-default ')) {
			const profileName = cmd.replace('/profiles install-default ', '').trim();
			if (profileName) {
				setOverlay('profile-install');
				setProfileToInstall(profileName);
				setSetProfileAsDefault(true);
			}
			return;
		}
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

	if (overlay === 'profiles') {
		return (
			<ThemeContext.Provider value={theme}>
				<ProfilesCommand
					store={pluginStore}
					onSave={handleSavePluginStore}
					onBack={() => setOverlay(null)}
				/>
			</ThemeContext.Provider>
		);
	}

	if (overlay === 'plugin-install') {
		return (
			<ThemeContext.Provider value={theme}>
				<Installer
					pluginName={pluginToInstall}
					store={pluginStore}
					onSave={handleSavePluginStore}
					onBack={() => setOverlay(null)}
				/>
			</ThemeContext.Provider>
		);
	}

	if (overlay === 'profile-install') {
		return (
			<ThemeContext.Provider value={theme}>
				<ProfileInstaller
					profileName={profileToInstall}
					store={pluginStore}
					onSave={handleSavePluginStore}
					onBack={() => setOverlay(null)}
					setAsDefault={setProfileAsDefault}
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
				<Splash workspace={{ name: workspaceName, model: activeModel, profile: activeProfile }} animated={!hasTyped} />
				<ChatCommand
					settings={settings}
					pluginStore={pluginStore}
					onBack={exit}
					onCommand={handleChatCommand}
					onFirstInput={() => setHasTyped(true)}
				/>
			</Box>
		</ThemeContext.Provider>
	);
}
