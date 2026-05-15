export type ThemeName = 'blue' | 'green' | 'purple' | 'red' | 'orange';

export interface Theme {
	name: ThemeName;
	label: string;
	primary: string;
	secondary: string;
	accent: string;
	muted: string;
	border: string;
}

export const THEMES: Record<ThemeName, Theme> = {
	blue: {
		name: 'blue',
		label: 'Ocean Blue',
		primary: '#3b82f6',
		secondary: '#60a5fa',
		accent: '#93c5fd',
		muted: '#1e3a8a',
		border: '#1d4ed8',
	},
	green: {
		name: 'green',
		label: 'Matrix Green',
		primary: '#22c55e',
		secondary: '#4ade80',
		accent: '#86efac',
		muted: '#14532d',
		border: '#16a34a',
	},
	purple: {
		name: 'purple',
		label: 'Neon Purple',
		primary: '#a855f7',
		secondary: '#c084fc',
		accent: '#d8b4fe',
		muted: '#3b0764',
		border: '#7c3aed',
	},
	red: {
		name: 'red',
		label: 'Crimson',
		primary: '#ef4444',
		secondary: '#f87171',
		accent: '#fca5a5',
		muted: '#7f1d1d',
		border: '#dc2626',
	},
	orange: {
		name: 'orange',
		label: 'Amber',
		primary: '#f97316',
		secondary: '#fb923c',
		accent: '#fdba74',
		muted: '#7c2d12',
		border: '#ea580c',
	},
};

export type ProviderName = 'anthropic' | 'google' | 'openai';

export interface ProviderConfig {
	apiKey: string;
	selectedModel: string;
}

export interface Settings {
	theme: ThemeName;
	providers: Record<ProviderName, ProviderConfig>;
}

export const DEFAULT_SETTINGS: Settings = {
	theme: 'blue',
	providers: {
		anthropic: { apiKey: '', selectedModel: '' },
		google: { apiKey: '', selectedModel: '' },
		openai: { apiKey: '', selectedModel: '' },
	},
};

export const PROVIDER_MODELS: Record<ProviderName, string[]> = {
	anthropic: [
		'claude-opus-4-5',
		'claude-sonnet-4-5',
		'claude-haiku-3-5',
	],
	google: [
		'gemini-2.5-pro',
		'gemini-2.5-flash',
		'gemini-2.0-flash',
	],
	openai: [
		'gpt-4.1',
		'gpt-4.1-mini',
		'o4-mini',
	],
};

export const PROVIDER_LABELS: Record<ProviderName, string> = {
	anthropic: 'Anthropic',
	google: 'Google',
	openai: 'OpenAI',
};
