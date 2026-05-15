import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../context/ThemeContext.js';

export type MessageRole = 'user' | 'assistant' | 'tool' | 'error';

export interface ChatMessageData {
	id: string;
	role: MessageRole;
	content: string;
	toolName?: string;
}

interface ChatMessageProps {
	message: ChatMessageData;
}

export default function ChatMessage({ message }: ChatMessageProps): React.JSX.Element {
	const theme = useTheme();

	if (message.role === 'user') {
		return (
			<Box gap={1} marginBottom={0}>
				<Text color={theme.secondary} bold>You</Text>
				<Text color={theme.border}>›</Text>
				<Text color={theme.accent}>{message.content}</Text>
			</Box>
		);
	}

	if (message.role === 'tool') {
		return (
			<Box
				borderStyle="single"
				borderColor={theme.border}
				paddingX={1}
				gap={2}
				marginLeft={2}
			>
				<Text color={theme.secondary} bold>⚙ {message.toolName ?? 'tool'}</Text>
				<Text color={theme.border}>│</Text>
				<Text color={theme.muted}>{message.content}</Text>
			</Box>
		);
	}

	if (message.role === 'error') {
		return (
			<Box gap={1} marginBottom={0}>
				<Text color="#ef4444" bold>Error</Text>
				<Text color="#ef4444">›</Text>
				<Text color="#fca5a5">{message.content}</Text>
			</Box>
		);
	}

	return (
		<Box gap={1} marginBottom={0}>
			<Text color={theme.primary} bold>AI</Text>
			<Text color={theme.border}>›</Text>
			<Text color="white">{message.content}</Text>
		</Box>
	);
}
