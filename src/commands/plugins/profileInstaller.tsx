import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import { useInput } from 'ink';
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
	const hasRun = useRef(false);

	useEffect(() => {
		// Prevent multiple runs
		if (hasRun.current) return;
		hasRun.current = true;

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
					setMessage(`Profile "${profile.name}" already exists. Reinstalling...`);
					await new Promise(resolve => setTimeout(resolve, 1000)); // Show message briefly
					// Remove the old profile so we can reinstall it
					const filteredProfiles = store.profiles.filter(p => p.name !== profile.name);
					store = { ...store, profiles: filteredProfiles };
				}
				
				setMessage(`Installing profile "${profile.name}" with ${profile.plugins.length} plugins...`);
				
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
					systemPrompt: profile.system_prompt || undefined,
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
				
			} catch (error: any) {
				setStatus('error');
				setMessage(`❌ ${error.message || 'Installation failed'}`);
				setProgress('');
			}
		};
		
		installProfile();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Handle key press to exit when done
	useInput((input, key) => {
		if (status !== 'loading' && (key.return || key.escape || input === ' ')) {
			onBack();
		}
	});

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
			
			{status !== 'loading' && (
				<Box marginTop={1}>
					<Text color={theme.muted}>Press Enter, Space, or Esc to continue...</Text>
				</Box>
			)}
		</Box>
	);
}
