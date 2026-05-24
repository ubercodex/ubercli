import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { createRequire } from 'module';
import { type WorkspaceConfig, DEFAULT_WORKSPACE } from './types/workspace.js';
import { useTheme } from './context/ThemeContext.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const LOGO = [
	'▄▀▀▄ █▀▀▄ █   █ ▄▀▀▄',
	'█  █ █▄▄▀ ▀▄ ▄▀ █  █',
	' ▀▀  ▀  ▀   ▀    ▀▀ ',
];

interface SplashProps {
	workspace?: WorkspaceConfig;
	animated?: boolean;
}

export default function Splash({ workspace = DEFAULT_WORKSPACE, animated = true }: SplashProps): React.JSX.Element {
	const theme = useTheme();
	const colors = [theme.primary, theme.secondary, theme.accent, theme.border, theme.muted];
	
	// Track brightness state for each character position
	const totalChars = LOGO.reduce((sum, line) => sum + line.length, 0);
	const [pixelStates, setPixelStates] = useState<number[]>(() => 
		Array(totalChars).fill(0).map(() => Math.random())
	);

	useEffect(() => {
		if (!animated) return;
		const id = setInterval(() => {
			setPixelStates(prev => 
				prev.map(() => Math.random())
			);
		}, 150);
		return () => clearInterval(id);
	}, [animated]);

	const getCharColor = (row: number, col: number): string => {
		const charIndex = LOGO.slice(0, row).reduce((sum, line) => sum + line.length, 0) + col;
		const brightness = pixelStates[charIndex] || 0;
		
		if (brightness > 0.7) return theme.primary;
		if (brightness > 0.5) return theme.secondary;
		if (brightness > 0.3) return theme.accent;
		if (brightness > 0.15) return theme.border;
		return theme.muted;
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
							<Text key={col} bold color={char !== ' ' ? getCharColor(row, col) : undefined}>
								{char}
							</Text>
						))}
						{row === LOGO.length - 1 && (
							<>
								<Text color={theme.border}>  │  </Text>
								<Text color={theme.primary} bold>ORVO </Text>
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
