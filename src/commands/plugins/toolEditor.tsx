import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { generateText } from 'ai';
import { useTheme } from '../../context/ThemeContext.js';
import { type PluginStore, type PluginTool, type ToolParam } from '../../types/plugins.js';
import { type Settings } from '../../types/settings.js';
import { tools as builtinTools } from '../../tools/index.js';
import { makeToolFn } from '../../toolRuntime.js';
import { resolveActiveProvider, getLanguageModel } from '../../llm.js';

interface ToolEditorProps {
	store: PluginStore;
	tool: PluginTool;
	settings: Settings;
	onSave: (store: PluginStore) => void;
	onBack: () => void;
}

type EditorMode = 'view' | 'asking' | 'updating' | 'error';
type TestStatus = 'idle' | 'collecting' | 'running' | 'done' | 'error';

const UPDATE_SYSTEM = `You are a tool code updater. You are given an existing tool definition and a user request for changes.
Output ONLY a JSON object with this exact shape (all fields required):
{
  "name": "camelCaseName",
  "description": "one sentence description",
  "params": [{ "name": "...", "type": "string|number|boolean", "description": "...", "required": true|false }],
  "code": "// JS function body only — no wrapper\\nreturn { ... };"
}

CRITICAL: Parameters are passed as INDIVIDUAL FUNCTION ARGUMENTS, NOT as an object.
- If param is "fileName", use: fileName (NOT params.fileName or args.fileName)
- NEVER use: const { fileName } = params; ❌
- Just use the parameter name directly ✅

Preserve unchanged fields exactly. Only modify what the user asks for.
Respond with ONLY the raw JSON — no markdown, no explanation.`;

function openInEditor(code: string, toolName: string): string {
	const tmpFile = join(tmpdir(), `zal_tool_${toolName}_${Date.now()}.js`);
	writeFileSync(tmpFile, code, 'utf8');
	try {
		const editor = process.env.EDITOR ?? process.env.VISUAL ?? (process.platform === 'win32' ? 'notepad' : 'nano');
		execSync(`${editor} "${tmpFile}"`, { stdio: 'inherit' });
		return readFileSync(tmpFile, 'utf8');
	} catch {
		return code;
	}
}

export default function ToolEditor({ store, tool, settings, onSave, onBack }: ToolEditorProps): React.JSX.Element {
	const theme     = useTheme();
	const isBuiltin = tool.kind === 'builtin';

	const [currentTool, setCurrentTool] = useState<PluginTool>(tool);
	const [mode, setMode]               = useState<EditorMode>('view');
	const [askInput, setAskInput]       = useState('');
	const [errorMsg, setErrorMsg]       = useState('');

	const [testStatus, setTestStatus]   = useState<TestStatus>('idle');
	const [testResult, setTestResult]   = useState('');
	const [testInputs, setTestInputs]   = useState<Record<string, string>>({});
	const [collectIdx, setCollectIdx]   = useState(0);
	const [collectVal, setCollectVal]   = useState('');

	const params = currentTool.params;
	const codeLines = (currentTool.code ?? '').split('\n').length;

	const provider = resolveActiveProvider(settings);

	const handleSave = useCallback((t: PluginTool) => {
		const existing = store.tools.find(x => x.id === t.id);
		const tools = existing
			? store.tools.map(x => x.id === t.id ? t : x)
			: [...store.tools, t];
		onSave({ ...store, tools });
	}, [store, onSave]);

	const handleDelete = useCallback(() => {
		if (isBuiltin) return;
		const tools = store.tools.filter(t => t.id !== currentTool.id);
		const profiles = store.profiles.map(p => ({
			...p,
			toolIds: p.toolIds.filter(id => id !== currentTool.id),
		}));
		onSave({ ...store, tools, profiles });
		onBack();
	}, [isBuiltin, currentTool, store, onSave, onBack]);

	const handleOpenEditor = useCallback(() => {
		const updated = openInEditor(currentTool.code ?? '', currentTool.name);
		if (updated !== currentTool.code) {
			const next = { ...currentTool, code: updated };
			setCurrentTool(next);
			handleSave(next);
		}
	}, [currentTool, handleSave]);

	const handleAiUpdate = useCallback(async (request: string) => {
		if (!provider) { setErrorMsg('No LLM provider configured — go to /settings first.'); setMode('error'); return; }
		setMode('updating');
		try {
			const model = getLanguageModel(settings, provider);
			const context = JSON.stringify({
				name: currentTool.name,
				description: currentTool.description,
				params: currentTool.params,
				code: currentTool.code,
			}, null, 2);
			const { text } = await generateText({
				model,
				system: UPDATE_SYSTEM,
				prompt: `Current tool:\n${context}\n\nChange request: ${request}`,
			});
			const cleaned = text.trim().replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
			const parsed = JSON.parse(cleaned) as { name: string; description: string; params: ToolParam[]; code: string };
			const next: PluginTool = {
				...currentTool,
				name: parsed.name,
				description: parsed.description,
				params: parsed.params,
				code: parsed.code,
			};
			setCurrentTool(next);
			handleSave(next);
			setMode('view');
		} catch (err) {
			setErrorMsg(err instanceof Error ? err.message : String(err));
			setMode('error');
		}
	}, [provider, settings, currentTool, handleSave]);

	const runWithInputs = useCallback(async (inputs: Record<string, string>) => {
		setTestStatus('running');
		setTestResult('');
		try {
			let result: unknown;
			if (isBuiltin) {
				const bt = (builtinTools as Record<string, { execute?: (args: Record<string, unknown>) => Promise<unknown> }>)[currentTool.name];
				if (!bt?.execute) throw new Error('No execute function found for builtin');
				result = await bt.execute(inputs);
			} else {
				const argNames = params.map(p => p.name);
				const fn = makeToolFn(argNames, currentTool.code ?? '');
				result = await fn(...argNames.map(n => inputs[n]));
			}
			setTestResult(JSON.stringify(result ?? null, null, 2));
			setTestStatus('done');
		} catch (err) {
			setTestResult(err instanceof Error ? err.message : String(err));
			setTestStatus('error');
		}
	}, [isBuiltin, currentTool, params]);

	const handleTest = useCallback(() => {
		if (params.length === 0) { runWithInputs({}); return; }
		setTestInputs({});
		setCollectIdx(0);
		setCollectVal('');
		setTestStatus('collecting');
	}, [params, runWithInputs]);

	useInput((char, key) => {
		if (testStatus === 'collecting') {
			if (key.escape) { setTestStatus('idle'); setCollectVal(''); return; }
			if (key.return) {
				const p = params[collectIdx];
				const updated = { ...testInputs, [p.name]: collectVal };
				if (collectIdx < params.length - 1) {
					setTestInputs(updated); setCollectIdx(i => i + 1); setCollectVal('');
				} else {
					setCollectVal(''); runWithInputs(updated);
				}
				return;
			}
			if (key.backspace || key.delete) { setCollectVal(v => v.slice(0, -1)); return; }
			if (char) { setCollectVal(v => v + char); return; }
			return;
		}

		if (mode === 'asking') {
			if (key.escape) { setMode('view'); setAskInput(''); return; }
			if (key.return && askInput.trim()) { handleAiUpdate(askInput.trim()); setAskInput(''); return; }
			if (key.backspace || key.delete) { setAskInput(v => v.slice(0, -1)); return; }
			if (char) { setAskInput(v => v + char); return; }
			return;
		}

		if (mode === 'error') { setMode('view'); return; }
		if (mode === 'updating') return;

		if (key.escape) { onBack(); return; }
		if (key.ctrl && char === 't') { handleTest(); return; }
		if (isBuiltin) return;
		if (key.ctrl && char === 'e') { handleOpenEditor(); return; }
		if (key.ctrl && char === 'a') { setMode('asking'); return; }
		if (key.ctrl && char === 'd') { handleDelete(); return; }
	});

	/* ── AI asking prompt ── */
	if (mode === 'asking') {
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Box marginBottom={1} gap={2}>
					<Text bold color={theme.primary}>What do you want to change?</Text>
					<Text color={theme.muted}>Enter to apply  ·  Esc to cancel</Text>
				</Box>
				<Box borderStyle="round" borderColor={theme.secondary} paddingX={2} paddingY={0}>
					<Text color={theme.accent}>{askInput || ' '}</Text>
					<Text color={theme.muted}>█</Text>
				</Box>
				<Box marginTop={1}>
					<Text color={theme.muted} dimColor>
						e.g. "add an optional currency param" · "change interval to 4h" · "also return the volume in USD"
					</Text>
				</Box>
			</Box>
		);
	}

	/* ── AI updating ── */
	if (mode === 'updating') {
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Box gap={2}>
					<Text color={theme.primary} bold>⚙</Text>
					<Text color={theme.muted}>Updating {currentTool.name} with AI…</Text>
				</Box>
			</Box>
		);
	}

	/* ── Error ── */
	if (mode === 'error') {
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Text color="#ef4444" bold>Update failed</Text>
				<Box borderStyle="single" borderColor="#ef4444" paddingX={1} marginTop={1}>
					<Text color="#fca5a5">{errorMsg}</Text>
				</Box>
				<Box marginTop={1}><Text color={theme.muted} dimColor>Any key to go back</Text></Box>
			</Box>
		);
	}

	/* ── Main view ── */
	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			<Box marginBottom={1} gap={2}>
				<Text bold color={theme.primary}>{isBuiltin ? 'View' : 'Edit'}: {currentTool.name}</Text>
				{isBuiltin
					? <Text color={theme.muted}>Ctrl+T test  ·  Esc back  ·  read-only</Text>
					: <Text color={theme.muted}>Ctrl+A ask AI  ·  Ctrl+E open code editor  ·  Ctrl+T test  ·  Ctrl+D delete  ·  Esc back</Text>
				}
			</Box>

			<Box flexDirection="column" borderStyle="round" borderColor={theme.border} paddingX={2} paddingY={1} gap={1}>
				<Box gap={2}>
					<Text color={theme.primary} bold>{'Name'.padEnd(12)}</Text>
					<Text color={theme.border}>│</Text>
					<Text color={isBuiltin ? theme.muted : theme.accent} bold>{currentTool.name}</Text>
					{isBuiltin && <Text color={theme.border}> [builtin]</Text>}
				</Box>

				<Box gap={2}>
					<Text color={theme.primary} bold>{'Description'.padEnd(12)}</Text>
					<Text color={theme.border}>│</Text>
					<Text color={theme.secondary}>{currentTool.description}</Text>
				</Box>

				<Box gap={2}>
					<Text color={theme.primary} bold>{'Params'.padEnd(12)}</Text>
					<Text color={theme.border}>│</Text>
					{params.length === 0
						? <Text color={theme.muted}>none</Text>
						: params.map(p => (
							<Box key={p.name} borderStyle="single" borderColor={theme.border} paddingX={1}>
								<Text color={theme.secondary}>{p.name}</Text>
								<Text color={theme.muted}>:{p.type}{p.required ? '' : '?'}</Text>
							</Box>
						))
					}
				</Box>

				{!isBuiltin && (
					<Box gap={2}>
						<Text color={theme.primary} bold>{'Code'.padEnd(12)}</Text>
						<Text color={theme.border}>│</Text>
						<Text color={theme.muted}>{codeLines} line{codeLines !== 1 ? 's' : ''}</Text>
						<Text color={theme.border}>·</Text>
						<Text color={theme.secondary}>Ctrl+E to open in editor</Text>
					</Box>
				)}
			</Box>

			{/* Param collection */}
			{testStatus === 'collecting' && (() => {
				const p = params[collectIdx];
				return (
					<Box flexDirection="column" borderStyle="round" borderColor={theme.secondary} paddingX={2} paddingY={0} marginTop={1}>
						<Box gap={1}>
							<Text color={theme.primary} bold>Test input</Text>
							<Text color={theme.muted}>({collectIdx + 1}/{params.length})  Enter confirm · Esc cancel</Text>
						</Box>
						<Box gap={2}>
							<Text color={theme.secondary} bold>{p.name}</Text>
							<Text color={theme.muted}>:{p.type}{p.required ? '' : '?'}</Text>
							<Text color={theme.border}>›</Text>
							<Text color={theme.accent}>{collectVal}</Text>
							<Text color={theme.muted}>█</Text>
						</Box>
						{p.description ? <Text color={theme.muted} dimColor>{p.description}</Text> : null}
					</Box>
				);
			})()}

			{/* Test result */}
			{(testStatus === 'running' || testStatus === 'done' || testStatus === 'error') && (
				<Box
					borderStyle="single"
					borderColor={testStatus === 'error' ? '#ef4444' : theme.border}
					paddingX={1}
					marginTop={1}
				>
					<Text color={theme.secondary} bold>⚙ test </Text>
					<Text color={theme.border}>│ </Text>
					<Text color={testStatus === 'error' ? '#fca5a5' : theme.accent}>
						{testStatus === 'running' ? 'running…' : testResult}
					</Text>
				</Box>
			)}

			<Box marginTop={1} gap={3}>
				{!isBuiltin && <Text color={theme.muted} dimColor>Ctrl+A ask AI to change</Text>}
				{!isBuiltin && <Text color={theme.muted} dimColor>Ctrl+E edit code</Text>}
				<Text color={theme.muted} dimColor>Ctrl+T test</Text>
				{!isBuiltin && <Text color={theme.muted} dimColor>Ctrl+D delete</Text>}
			</Box>
		</Box>
	);
}
