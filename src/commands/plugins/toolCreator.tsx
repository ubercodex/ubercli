import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { generateText } from 'ai';
import { useTheme } from '../../context/ThemeContext.js';
import { type PluginStore, type PluginTool, type ToolParam } from '../../types/plugins.js';
import { type Settings } from '../../types/settings.js';
import { resolveActiveProvider, getLanguageModel } from '../../llm.js';
import { makeToolFn } from '../../toolRuntime.js';

interface ToolCreatorProps {
	store: PluginStore;
	settings: Settings;
	onSave: (store: PluginStore) => void;
	onBack: () => void;
}

type CreatorStep = 'describe' | 'generating' | 'preview' | 'error';

interface GeneratedTool {
	name: string;
	description: string;
	params: ToolParam[];
	code: string;
}

const SYSTEM_PROMPT = `You are a Node.js tool generator for a CLI assistant. The user will describe a tool they want.

Generate a JSON object with this exact shape:
{
  "name": "camelCaseName",
  "description": "one sentence describing what the tool does",
  "params": [
    { "name": "paramName", "type": "string|number|boolean", "description": "what it is", "required": true|false }
  ],
  "code": "// JavaScript function body only — no function declaration wrapper\\n// Use only Node.js built-ins (fs, path, os, crypto, etc.) — no npm imports\\n// Return a plain object or primitive\\nreturn { result: ... };"
}

CRITICAL RULES FOR PARAMETERS:
- Parameters are passed as INDIVIDUAL FUNCTION ARGUMENTS, NOT as an object
- If you define a param named "fileName", access it directly as: fileName
- NEVER use: params.fileName, args.fileName, input.fileName, or any object notation
- NEVER destructure from params: const { fileName } = params; ❌ WRONG
- Just use the parameter name directly: fileName ✅ CORRECT

Example with parameter "targetPath":
❌ WRONG: const { targetPath } = params; const fs = require('fs'); return fs.readFileSync(targetPath);
✅ CORRECT: const fs = require('fs'); return fs.readFileSync(targetPath);

Other Rules:
- code is a JS function body. It runs inside: async function execute(param1, param2, ...) { <code> }
- Use only Node.js built-ins available via require(), e.g. const os = require('os');
- Always return something useful (object, array, string, number, etc.)
- Respond with ONLY the raw JSON, no markdown fences, no explanation`;

function parseGenerated(raw: string): GeneratedTool {
	const cleaned = raw.trim().replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
	return JSON.parse(cleaned) as GeneratedTool;
}

export default function ToolCreator({ store, settings, onSave, onBack }: ToolCreatorProps): React.JSX.Element {
	const theme = useTheme();
	const [step, setStep]           = useState<CreatorStep>('describe');
	const [description, setDescription] = useState('');
	const [generated, setGenerated] = useState<GeneratedTool | null>(null);
	const [errorMsg, setErrorMsg]   = useState('');
	const [testResult, setTestResult] = useState('');
	const [testing, setTesting]     = useState(false);

	const provider = resolveActiveProvider(settings);

	const generate = useCallback(async (desc: string) => {
		if (!provider) { setErrorMsg('No LLM provider configured. Go to /settings first.'); setStep('error'); return; }
		setStep('generating');
		try {
			const model = getLanguageModel(settings, provider);
			const { text } = await generateText({
				model,
				system: SYSTEM_PROMPT,
				prompt: desc,
			});
			const tool = parseGenerated(text);
			setGenerated(tool);
			setStep('preview');
		} catch (err) {
			setErrorMsg(err instanceof Error ? err.message : String(err));
			setStep('error');
		}
	}, [provider, settings]);

	const handleRegister = useCallback(() => {
		if (!generated) return;
		const newTool: PluginTool = {
			id: `custom_${Date.now()}`,
			name: generated.name,
			description: generated.description,
			kind: 'custom',
			enabled: true,
			params: generated.params,
			code: generated.code,
		};
		const tools = [...store.tools, newTool];
		const profiles = store.profiles.map(p =>
			p.id === store.activeProfileId
				? { ...p, toolIds: [...p.toolIds, newTool.id] }
				: p
		);
		onSave({ ...store, tools, profiles });
		onBack();
	}, [generated, store, onSave, onBack]);

	const handleTest = useCallback(async () => {
		if (!generated) return;
		setTesting(true);
		setTestResult('');
		try {
			const argNames = generated.params.map(p => p.name);
			const fn = makeToolFn(argNames, generated.code);
			const result = await fn(...argNames.map(() => undefined));
			setTestResult(JSON.stringify(result ?? null, null, 2));
		} catch (err) {
			setTestResult(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
		} finally {
			setTesting(false);
		}
	}, [generated]);

	useInput((char, key) => {
		if (step === 'describe') {
			if (key.escape) { onBack(); return; }
			if (key.return && description.trim()) { generate(description.trim()); return; }
			if (key.backspace || key.delete) { setDescription(p => p.slice(0, -1)); return; }
			if (char) setDescription(p => p + char);
			return;
		}

		if (step === 'generating') return;

		if (step === 'error') {
			if (key.escape || key.return) { setStep('describe'); return; }
			return;
		}

		if (step === 'preview') {
			if (key.escape)                       { setStep('describe'); return; }
			if (key.return)                       { handleRegister(); return; }
			if (key.ctrl && char === 't')         { handleTest(); return; }
			if (key.ctrl && char === 'r')         { generate(description); return; }
		}
	});

	/* ── describe ── */
	if (step === 'describe') {
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Box marginBottom={1} gap={2}>
					<Text bold color={theme.primary}>+ New Tool</Text>
					<Text color={theme.muted}>Describe what the tool should do  ·  Enter to generate  ·  Esc back</Text>
				</Box>
				<Box borderStyle="round" borderColor={theme.secondary} paddingX={2} paddingY={0}>
					<Text color={theme.accent}>{description || ' '}</Text>
					<Text color={theme.muted}>█</Text>
				</Box>
				{!provider && (
					<Box marginTop={1}>
						<Text color="#ef4444">No LLM provider — configure one in /settings first</Text>
					</Box>
				)}
				<Box marginTop={1}>
					<Text color={theme.muted} dimColor>
						Example: "a tool that reads a file path and returns its contents"
					</Text>
				</Box>
			</Box>
		);
	}

	/* ── generating ── */
	if (step === 'generating') {
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Box gap={2}>
					<Text color={theme.primary} bold>⚙</Text>
					<Text color={theme.muted}>Generating tool with {provider?.name ?? 'AI'}…</Text>
				</Box>
				<Box marginTop={1}>
					<Text color={theme.muted} dimColor>"{description}"</Text>
				</Box>
			</Box>
		);
	}

	/* ── error ── */
	if (step === 'error') {
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Text color="#ef4444" bold>Generation failed</Text>
				<Box borderStyle="single" borderColor="#ef4444" paddingX={1} marginTop={1}>
					<Text color="#fca5a5">{errorMsg}</Text>
				</Box>
				<Box marginTop={1}>
					<Text color={theme.muted} dimColor>Enter or Esc to go back and try again</Text>
				</Box>
			</Box>
		);
	}

	/* ── preview ── */
	if (!generated) return <></>;

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			<Box marginBottom={1} gap={2}>
				<Text bold color={theme.primary}>Generated Tool Preview</Text>
				<Text color={theme.muted}>Enter register  Ctrl+T test  Ctrl+R regenerate  Esc back</Text>
			</Box>

			<Box flexDirection="column" borderStyle="round" borderColor={theme.secondary} paddingX={2} paddingY={1} gap={1}>
				<Box gap={2}>
					<Text color={theme.primary} bold>{'Name'.padEnd(12)}</Text>
					<Text color={theme.border}>│</Text>
					<Text color={theme.accent} bold>{generated.name}</Text>
				</Box>

				<Box gap={2}>
					<Text color={theme.primary} bold>{'Description'.padEnd(12)}</Text>
					<Text color={theme.border}>│</Text>
					<Text color={theme.secondary}>{generated.description}</Text>
				</Box>

				<Box gap={2}>
					<Text color={theme.primary} bold>{'Params'.padEnd(12)}</Text>
					<Text color={theme.border}>│</Text>
					{generated.params.length === 0
						? <Text color={theme.muted}>none</Text>
						: generated.params.map(p => (
							<Box key={p.name} borderStyle="single" borderColor={theme.border} paddingX={1}>
								<Text color={theme.secondary}>{p.name}</Text>
								<Text color={theme.muted}>:{p.type}{p.required ? '' : '?'}</Text>
							</Box>
						))
					}
				</Box>

				<Box flexDirection="column" gap={0}>
					<Box gap={2}>
						<Text color={theme.primary} bold>{'Code'.padEnd(12)}</Text>
						<Text color={theme.border}>│</Text>
						<Text color={theme.muted} dimColor>generated</Text>
					</Box>
					<Box borderStyle="single" borderColor={theme.border} paddingX={1} marginLeft={2}>
						<Text color={theme.accent}>{generated.code}</Text>
					</Box>
				</Box>
			</Box>

			{testResult !== '' && (
				<Box
					borderStyle="single"
					borderColor={testResult.startsWith('ERROR') ? '#ef4444' : theme.border}
					paddingX={1}
					marginTop={1}
				>
					<Text color={theme.secondary} bold>⚙ test </Text>
					<Text color={theme.border}>│ </Text>
					<Text color={testResult.startsWith('ERROR') ? '#fca5a5' : theme.accent}>
						{testing ? 'running…' : testResult}
					</Text>
				</Box>
			)}

			<Box marginTop={1}>
				<Text color='#4ade80' bold>Will be added to active profile: </Text>
				<Text color={theme.accent}>{store.profiles.find(p => p.id === store.activeProfileId)?.name ?? 'Default'}</Text>
			</Box>
		</Box>
	);
}
