import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../context/ThemeContext.js';

export interface PaletteItem {
	cmd: string;
	description: string;
}

export const PALETTE_ITEMS: PaletteItem[] = [
	{ cmd: '/settings', description: 'Open settings (theme, API keys, models)'  },
	{ cmd: '/plugins',  description: 'Manage tools & profiles for LLM tool use' },
	{ cmd: '/memory',   description: 'View or clear workspace memory'           },
	{ cmd: '/exit',     description: 'Exit UBER CLI'                            },
];

interface CommandPaletteProps {
	query: string;
	cursor: number;
}

export default function CommandPalette({ query, cursor }: CommandPaletteProps): React.JSX.Element {
	const theme = useTheme();

	const filtered = PALETTE_ITEMS.filter(item =>
		item.cmd.startsWith(query) || query === '/'
	);

	if (filtered.length === 0) return <></>;

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor={theme.border}
			paddingX={1}
			marginBottom={0}
		>
			{filtered.map((item, i) => {
				const active = i === cursor;
				return (
					<Box key={item.cmd} gap={2}>
						<Text color={active ? theme.secondary : theme.border} bold>
							{active ? '›' : ' '}
						</Text>
						<Text color={active ? theme.accent : theme.primary} bold>
							{item.cmd.padEnd(12)}
						</Text>
						<Text color={active ? theme.secondary : theme.muted}>
							{item.description}
						</Text>
					</Box>
				);
			})}
			<Box marginTop={0}>
				<Text color={theme.muted} dimColor>↑↓ navigate  Enter/Tab select  Esc close</Text>
			</Box>
		</Box>
	);
}
