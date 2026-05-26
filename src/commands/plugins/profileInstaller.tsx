import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { randomBytes } from 'crypto';
import { useTheme } from '../../context/ThemeContext.js';
import { type PluginStore, type PluginTool, type ToolProfile } from '../../types/plugins.js';

interface ProfileInstallerProps {
	profileName: string;
	store: PluginStore;
	onSave: (store: PluginStore) => void;
	onBack: () => void;
	setAsDefault?: boolean;
}

export default function ProfileInstaller({ 
	profileName, 
	store, 
	onSave, 
	onBack,
	setAsDefault = false 
}: ProfileInstallerProps): React.JSX.Element {
	const theme = useTheme();
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
	const [message, setMessage] = useState('Fetching profile from registry...');
	const [progress, setProgress] = useState('');

	useEffect(() => {
		const installProfile = async () => {
			try {
				const apiUrl = process.env.ZAL_REGISTRY_URL || 'https://zalcli.com/api';
				
				// Parse profile name (format: author-profilename)
				const parts = profileName.split('-');
				if (parts.length < 2) {
					throw new Error('Invalid profile name format. Use: author-profilename');
				}
				
				const author = parts[0];
				const name = parts.slice(1).join('-');
				
				setMessage(`Downloading ${author}/${name}...`);
				
				const response = await fetch(`${apiUrl}/profiles/${author}/${name}`);
				
				if (!response.ok) {
					if (response.status === 404) {
						throw new Error(`Profile "${profileName}" not found in registry`);
					}
					const text = await response.text();
					throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}\n${text.substring(0, 200)}`);
				}
				
				let profile;
				try {
					profile = await response.json();
				} catch (err) {
					const text = await response.text();
					throw new Error(`Invalid JSON response from server. Got HTML instead. Server may not be running or profile routes not registered.\n${text.substring(0, 200)}`)
				}
				
				// Check if profile already exists
				const existing = store.profiles.find(p => p.name === profile.name);
				if (existing) {
					throw new Error(`Profile "${profile.name}" already exists`);
				}
				
				setMessage(`Installing profile with ${profile.plugins.length} plugins...`);
				
				// Install all plugins from the profile
				const newTools: PluginTool[] = [];
				const installedPluginIds: string[] = [];
				
				for (let i = 0; i < profile.plugins.length; i++) {
					const plugin = profile.plugins[i];
					setProgress(`[${i + 1}/${profile.plugins.length}] ${plugin.name}`);
					
					// Check if plugin already installed
					const existingTool = store.tools.find(t => t.name === plugin.name);
					if (existingTool) {
						installedPluginIds.push(existingTool.id);
						continue;
					}
					
					// Create new tool
					const toolId = randomBytes(8).toString('hex');
					const newTool: PluginTool = {
						id: toolId,
						name: plugin.name,
						description: plugin.description,
						params: plugin.parameters,
						code: plugin.code,
						kind: 'custom',
						enabled: true,
					};
					
					newTools.push(newTool);
					installedPluginIds.push(toolId);
				}
				
				setMessage('Creating profile...');
				setProgress('');
				
				// Create the profile
				const profileId = randomBytes(8).toString('hex');
				const newProfile: ToolProfile = {
					id: profileId,
					name: profile.name,
					description: profile.description,
					toolIds: installedPluginIds,
				};
				
				// Update store
				const updatedStore: PluginStore = {
					...store,
					tools: [...store.tools, ...newTools],
					profiles: [...store.profiles, newProfile],
					activeProfileId: setAsDefault ? profileId : store.activeProfileId,
				};
				
				onSave(updatedStore);
				
				setStatus('success');
				const defaultMsg = setAsDefault ? ' and set as default' : '';
				setMessage(`✅ Successfully installed profile "${profile.name}"${defaultMsg}!`);
				setProgress(`Installed ${newTools.length} new plugins, reused ${installedPluginIds.length - newTools.length} existing`);
				
				// Auto-close after 3 seconds
				setTimeout(() => {
					onBack();
				}, 3000);
				
			} catch (error: any) {
				setStatus('error');
				setMessage(`❌ ${error.message || 'Installation failed'}`);
				setProgress('');
				
				// Auto-close after 4 seconds
				setTimeout(() => {
					onBack();
				}, 4000);
			}
		};
		
		installProfile();
	}, [profileName, store, onSave, onBack, setAsDefault]);

	const color = status === 'loading' ? theme.muted : status === 'success' ? 'green' : 'red';

	return (
		<Box flexDirection="column" padding={1}>
			<Box marginBottom={1}>
				<Text bold color={theme.primary}>Profile Installer</Text>
			</Box>
			
			<Box marginBottom={1}>
				<Text color={color}>{message}</Text>
			</Box>
			
			{progress && (
				<Box>
					<Text color={theme.muted}>{progress}</Text>
				</Box>
			)}
			
			{status === 'loading' && (
				<Box marginTop={1}>
					<Text color={theme.muted}>Please wait...</Text>
				</Box>
			)}
		</Box>
	);
}
