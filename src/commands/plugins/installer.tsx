import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { randomBytes } from 'crypto';
import { useTheme } from '../../context/ThemeContext.js';
import { type PluginStore, type PluginTool } from '../../types/plugins.js';

interface InstallerProps {
	pluginName: string;
	store: PluginStore;
	onSave: (store: PluginStore) => void;
	onBack: () => void;
}

export default function Installer({ pluginName, store, onSave, onBack }: InstallerProps): React.JSX.Element {
	const theme = useTheme();
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
	const [message, setMessage] = useState('Fetching plugin from registry...');

	useEffect(() => {
		const installPlugin = async () => {
			try {
				const apiUrl = process.env.ZAL_REGISTRY_URL || 'https://zalcli.com/api';
				
				// Parse plugin name (format: author-pluginname or author-pluginname@version)
				let version: string | undefined;
				let pluginNameWithoutVersion = pluginName;
				
				if (pluginName.includes('@')) {
					const atIndex = pluginName.lastIndexOf('@');
					pluginNameWithoutVersion = pluginName.substring(0, atIndex);
					version = pluginName.substring(atIndex + 1);
				}
				
				const parts = pluginNameWithoutVersion.split('-');
				if (parts.length < 2) {
					throw new Error('Invalid plugin name format. Use: author-pluginname or author-pluginname@version');
				}
				
				const author = parts[0];
				const name = parts.slice(1).join('-');
				
				setMessage(`Downloading ${author}/${name}${version ? `@${version}` : ''}...`);
				
				const url = version 
					? `${apiUrl}/plugins/${author}/${name}?version=${version}`
					: `${apiUrl}/plugins/${author}/${name}`;
				const response = await fetch(url);
				
				if (!response.ok) {
					if (response.status === 404) {
						throw new Error(`Plugin "${pluginName}" not found in registry`);
					}
					throw new Error(`Failed to fetch plugin: ${response.statusText}`);
				}
				
				const plugin = await response.json();
				
				// Check if plugin is approved (only install approved plugins)
				if (plugin.status !== 'approved') {
					throw new Error(`Plugin "${pluginName}" is not approved yet (status: ${plugin.status}). Only approved plugins can be installed.`);
				}
				
				// Check if already installed with same version
				const existing = store.tools.find(t => t.name === plugin.name);
				if (existing) {
					if (existing.version === plugin.version) {
						throw new Error(`Plugin "${plugin.name}" v${plugin.version} is already installed`);
					}
					// Different version - will upgrade/downgrade
					setMessage(`Upgrading ${plugin.name} from v${existing.version} to v${plugin.version}...`);
				} else {
					setMessage('Installing plugin...');
				}
				
				// Create tool from plugin
				const newTool: PluginTool = {
					id: randomBytes(8).toString('hex'),
					name: plugin.name,
					description: plugin.description,
					params: plugin.parameters,
					code: plugin.code,
					kind: 'custom',
					enabled: true,
					version: plugin.version,
				};
				
				// If upgrading, remove old version
				let updatedTools = store.tools;
				if (existing) {
					updatedTools = store.tools.filter(t => t.id !== existing.id);
				}
				
				// Add tool to the active profile
				const activeProfileId = store.activeProfileId || 'default';
				const updatedProfiles = store.profiles.map(profile => {
					if (profile.id === activeProfileId) {
						// If upgrading, replace the tool ID, otherwise add new
						const toolIds = existing 
							? profile.toolIds.map(id => id === existing.id ? newTool.id : id)
							: [...profile.toolIds, newTool.id];
						return {
							...profile,
							toolIds,
						};
					}
					return profile;
				});
				
				// Add to store
				const updatedStore: PluginStore = {
					...store,
					tools: [...updatedTools, newTool],
					profiles: updatedProfiles,
				};
				
				onSave(updatedStore);
				
				setStatus('success');
				setMessage(`✅ Successfully installed "${plugin.name}" v${plugin.version}!`);
				
				// Auto-close after 2 seconds
				setTimeout(() => {
					onBack();
				}, 2000);
				
			} catch (error: any) {
				setStatus('error');
				setMessage(`❌ ${error.message || 'Installation failed'}`);
				
				// Auto-close after 3 seconds
				setTimeout(() => {
					onBack();
				}, 3000);
			}
		};
		
		installPlugin();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pluginName]); // Only run when pluginName changes, not on store updates

	const color = status === 'loading' ? theme.muted : status === 'success' ? 'green' : 'red';

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			<Box marginBottom={1} gap={2}>
				<Text bold color={theme.primary}>📦 Plugin Installer</Text>
			</Box>

			<Box flexDirection="column" borderStyle="round" borderColor={theme.border} paddingX={2} paddingY={1}>
				<Box marginBottom={1}>
					<Text color={theme.muted}>Plugin: </Text>
					<Text bold color={theme.accent}>{pluginName}</Text>
				</Box>
				
				<Box>
					<Text color={color}>{message}</Text>
				</Box>
			</Box>
			
			{status !== 'loading' && (
				<Box marginTop={1}>
					<Text color={theme.muted}>Closing...</Text>
				</Box>
			)}
		</Box>
	);
}
