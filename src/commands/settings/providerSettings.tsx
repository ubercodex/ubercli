import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import {
	type ProviderName,
	type Settings,
	PROVIDER_LABELS,
	PROVIDER_MODELS,
} from '../../types/settings.js';
import { useTheme } from '../../context/ThemeContext.js';

type ProviderView = 'list' | 'apikey' | 'models';

interface ProviderSettingsProps {
	settings: Settings;
	onSave: (updated: Settings) => void;
	onBack: () => void;
}

export default function ProviderSettings({ settings, onSave, onBack }: ProviderSettingsProps): React.JSX.Element {
	const theme = useTheme();
	const providers: ProviderName[] = ['anthropic', 'google', 'openai'];

	const [view, setView] = useState<ProviderView>('list');
	const [selectedProvider, setSelectedProvider] = useState(0);
	const [selectedModel, setSelectedModel] = useState(0);
	const [apiKeyInput, setApiKeyInput] = useState('');
	const [showKey, setShowKey] = useState(false);

	const activeProvider = providers[selectedProvider];
	const activeConfig = settings.providers[activeProvider];
	const models = PROVIDER_MODELS[activeProvider];

	useInput((char, key) => {
		if (view === 'list') {
			if (key.upArrow) setSelectedProvider(p => Math.max(0, p - 1));
			if (key.downArrow) setSelectedProvider(p => Math.min(providers.length - 1, p + 1));
			if (key.return) {
				setApiKeyInput(settings.providers[activeProvider].apiKey);
				setShowKey(false);
				setView('apikey');
			}
			if (key.escape) onBack();
			return;
		}

		if (view === 'apikey') {
			if (key.escape) { setView('list'); return; }
			if (key.tab || (key.return && apiKeyInput.length > 0)) {
				onSave({
					...settings,
					providers: {
						...settings.providers,
						[activeProvider]: { ...activeConfig, apiKey: apiKeyInput },
					},
				});
				const cur = settings.providers[activeProvider].selectedModel;
				setSelectedModel(Math.max(0, models.indexOf(cur)));
				setView('models');
				return;
			}
			if (key.backspace || key.delete) { setApiKeyInput(p => p.slice(0, -1)); return; }
			if (char === '\t') return;
			if (char) setApiKeyInput(p => p + char);
			return;
		}

		if (view === 'models') {
			if (key.upArrow) setSelectedModel(m => Math.max(0, m - 1));
			if (key.downArrow) setSelectedModel(m => Math.min(models.length - 1, m + 1));
			if (key.return) {
				onSave({
					...settings,
					providers: {
						...settings.providers,
						[activeProvider]: { ...activeConfig, selectedModel: models[selectedModel] },
					},
				});
				setView('list');
			}
			if (key.escape) setView('list');
		}
	});

	const maskedKey = (key: string) =>
		key.length === 0 ? '(not set)' : showKey ? key : '•'.repeat(Math.min(key.length, 12)) + '…';

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			<Box marginBottom={1}>
				<Text bold color={theme.primary}>Provider Settings</Text>
				<Text color={theme.border}>  ↑↓ navigate  Enter select  Esc back</Text>
			</Box>

			{view === 'list' && (
				<Box flexDirection="column" borderStyle="round" borderColor={theme.border} paddingX={2} paddingY={0}>
					{providers.map((p, i) => {
						const cfg = settings.providers[p];
						const hasKey = cfg.apiKey.length > 0;
						const hasModel = cfg.selectedModel.length > 0;
						const active = i === selectedProvider;
						return (
							<Box key={p} gap={2}>
								<Text color={active ? theme.secondary : theme.border} bold>{active ? '›' : ' '}</Text>
								<Text color={active ? theme.accent : theme.primary} bold>{PROVIDER_LABELS[p].padEnd(12)}</Text>
								<Text color={hasKey ? '#4ade80' : theme.muted}>
									{hasKey ? '● key set' : '○ no key'}
								</Text>
								<Text color={hasModel ? theme.secondary : theme.muted}>
									{hasModel ? `  ${cfg.selectedModel}` : '  no model'}
								</Text>
							</Box>
						);
					})}
				</Box>
			)}

			{view === 'apikey' && (
				<Box flexDirection="column" borderStyle="round" borderColor={theme.border} paddingX={2} paddingY={1} gap={1}>
					<Text bold color={theme.secondary}>{PROVIDER_LABELS[activeProvider]} — API Key</Text>
					<Box gap={1}>
						<Text color={theme.primary}>Current:</Text>
						<Text color={activeConfig.apiKey ? theme.accent : theme.muted}>
							{maskedKey(activeConfig.apiKey)}
						</Text>
					</Box>
					<Box gap={1} marginTop={1}>
						<Text color={theme.primary}>New key: </Text>
						<Text color={theme.accent}>{apiKeyInput}</Text>
						<Text color={theme.border}>█</Text>
					</Box>
					<Text color={theme.muted} dimColor>Enter/Tab to confirm · Esc to cancel</Text>
				</Box>
			)}

			{view === 'models' && (
				<Box flexDirection="column" borderStyle="round" borderColor={theme.border} paddingX={2} paddingY={1} gap={1}>
					<Text bold color={theme.secondary}>{PROVIDER_LABELS[activeProvider]} — Select Model</Text>
					{models.map((m, i) => {
						const active = i === selectedModel;
						const isCurrent = m === activeConfig.selectedModel;
						return (
							<Box key={m} gap={2}>
								<Text color={active ? theme.secondary : theme.border} bold>{active ? '›' : ' '}</Text>
								<Text color={active ? theme.accent : theme.primary}>{m}</Text>
								{isCurrent && <Text color="#4ade80"> ✓</Text>}
							</Box>
						);
					})}
					<Text color={theme.muted} dimColor>Enter to select · Esc to cancel</Text>
				</Box>
			)}
		</Box>
	);
}
