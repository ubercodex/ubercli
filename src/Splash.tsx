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
	animated?: boolean;
}

export default function Splash({ workspace = DEFAULT_WORKSPACE, animated = true }: SplashProps): React.JSX.Element {
	const theme = useTheme();
	const waveColors = buildWave(theme.primary, theme.secondary, theme.accent, theme.border);
	const [frame, setFrame] = useState(0);

	useEffect(() => {
		if (!animated) return;
		const id = setInterval(() => {
			setFrame(f => (f + 1) % waveColors.length);
		}, 220);
		return () => clearInterval(id);
	}, [animated, waveColors.length]);

	const getColColor = (col: number): string => {
		const idx = (col + frame) % waveColors.length;
		return waveColors[(idx + waveColors.length) % waveColors.length];
	};

	return (
		<Box flexDirection="column" paddingLeft={1} paddingTop={1} paddingBottom={1}>
			<Box
				flexDirection="column"
				borderStyle="round"
				borderColor={theme.border}
				paddingX={2}
				paddingY={0}
			>
				{/* Logo rows — last row gets version appended inline */}
				{LOGO.map((line, row) => (
					<Box key={row} flexDirection="row">
						{line.split('').map((char, col) => (
							<Text key={col} bold color={char !== ' ' ? getColColor(col) : undefined}>
								{char}
							</Text>
						))}
						{row === LOGO.length - 1 && (
							<>
								<Text color={theme.border}>  │  </Text>
								<Text color={theme.primary} bold>UBER CLI </Text>
								<Text color={theme.secondary} bold>v{version}</Text>
							</>
						)}
					</Box>
				))}

				{/* Compact status row */}
				<Box gap={2} marginTop={1}>
					<Box gap={1}>
						<Text color={theme.muted}>workspace</Text>
						<Text color={theme.border}>›</Text>
						<Text color={workspace.name === DEFAULT_WORKSPACE.name ? theme.muted : theme.accent} bold>
							{workspace.name}
						</Text>
					</Box>
					<Text color={theme.border}>·</Text>
					<Box gap={1}>
						<Text color={theme.muted}>model</Text>
						<Text color={theme.border}>›</Text>
						<Text color={workspace.model === DEFAULT_WORKSPACE.model ? theme.muted : theme.accent} bold>
							{workspace.model || 'none'}
						</Text>
					</Box>
					<Text color={theme.border}>·</Text>
					<Box gap={1}>
						<Text color={theme.muted}>profile</Text>
						<Text color={theme.border}>›</Text>
						<Text color={theme.secondary} bold>{workspace.profile}</Text>
					</Box>
				</Box>
			</Box>
		</Box>
	);
}
