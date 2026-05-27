import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { type PluginStore, type PluginTool } from './types/plugins.js';
import { tools as builtinTools } from './tools/index.js';
import { makeToolFn } from './toolRuntime.js';

const PARAM_SCHEMA: Record<string, z.ZodTypeAny> = {
	string: z.string(),
	number: z.number(),
	boolean: z.boolean(),
};

function buildCustomTool(pluginTool: PluginTool) {
	const shape: Record<string, z.ZodTypeAny> = {};
	for (const p of pluginTool.params) {
		const base = PARAM_SCHEMA[p.type] ?? z.string();
		shape[p.name] = p.required ? base : base.optional();
	}

	const code = pluginTool.code ?? '';
	const paramNames = pluginTool.params.map(p => p.name);

	return tool({
		description: pluginTool.description,
		inputSchema: z.object(shape),
		execute: async (input: Record<string, unknown>) => {
			try {
				const fn = makeToolFn(paramNames, code);
				const paramValues = paramNames.map(name => input[name]);
				const result = await fn(...paramValues);
				return result ?? { ok: true };
			} catch (err) {
				return { error: err instanceof Error ? err.message : String(err) };
			}
		},
	});
}

export function resolveActiveTools(store: PluginStore): ToolSet {
	const profile = store.profiles.find(p => p.id === store.activeProfileId);
	const activeIds = new Set(
		profile ? profile.toolIds : store.tools.filter(t => t.enabled).map(t => t.id)
	);

	const result: ToolSet = {};

	for (const pluginTool of store.tools) {
		if (!pluginTool.enabled) continue;
		if (!activeIds.has(pluginTool.id)) continue;

		if (pluginTool.kind === 'builtin') {
			const builtin = (builtinTools as unknown as ToolSet)[pluginTool.name];
			if (builtin) result[pluginTool.name] = builtin;
		} else {
			result[pluginTool.name] = buildCustomTool(pluginTool) as unknown as ToolSet[string];
		}
	}

	return result;
}
