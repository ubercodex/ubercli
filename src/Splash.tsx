import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { createRequire } from 'module';
import { type WorkspaceConfig, DEFAULT_WORKSPACE } from './types/workspace.js';
import { useTheme } from './context/ThemeContext.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const LOGO = [
	'█  █ █▀▄ █▀▀ █▀█  █▀▀ █   █',
	'█  █ █▀▄ █▀▀ █▀▄  █   █   █',
	'█▄▄█ █▄▀ █▄▄ █ █  █▄▄ █▄▄ █',
];

const buildWave = (primary: string, secondary: string, accent: string, muted: string): string[] => [
	muted, muted, primary, primary, secondary, secondary, accent, secondary, secondary, primary, primary, muted,
];

interface SplashProps {
	workspace?: WorkspaceConfig;
}

export default function Splash({ workspace = DEFAULT_WORKSPACE }: SplashProps): React.JSX.Element {
	const theme = useTheme();
	const waveColors = buildWave(theme.primary, theme.secondary, theme.accent, theme.border);
	const [frame, setFrame] = useState(0);

	useEffect(() => {
		const id = setInterval(() => {
			setFrame(f => f + 1);
		}, 80);
		return () => clearInterval(id);
	}, []);

	const getColColor = (col: number): string => {
		const idx = (col + frame) % waveColors.length;
		return waveColors[(idx + waveColors.length) % waveColors.length];
	};

	return (
		<Box flexDirection="column" paddingLeft={1} paddingTop={1} paddingBottom={1}>

			{/* ── Branded box ── */}
			<Box
				flexDirection="column"
				borderStyle="round"
				borderColor={theme.border}
				paddingX={2}
				paddingY={0}
			>
				{LOGO.map((line, row) => (
					<Box key={row} flexDirection="row">
						{line.split('').map((char, col) => (
							<Text key={col} bold color={char !== ' ' ? getColColor(col) : undefined}>
								{char}
							</Text>
						))}
					</Box>
				))}

				<Box marginTop={1} justifyContent="flex-end">
					<Text color={theme.primary} bold>UBER CLI  </Text>
					<Text color={theme.secondary} bold>v{version}</Text>
				</Box>
			</Box>

			{/* ── Workspace / model status ── */}
			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor={theme.border}
				paddingX={2}
				paddingY={0}
				marginTop={1}
			>
				<Box gap={1}>
					<Text color={theme.primary} bold>Workspace</Text>
					<Text color={theme.secondary}>›</Text>
					<Text color={workspace.name === DEFAULT_WORKSPACE.name ? theme.muted : theme.accent}>
						{workspace.name}
					</Text>
				</Box>

				<Box gap={1}>
					<Text color={theme.primary} bold>Model    </Text>
					<Text color={theme.secondary}>›</Text>
					<Text color={workspace.model === DEFAULT_WORKSPACE.model ? theme.muted : theme.accent}>
						{workspace.model}
					</Text>
				</Box>
			</Box>

		</Box>
	);
}
