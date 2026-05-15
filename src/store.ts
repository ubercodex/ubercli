import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { type Settings, type ProviderName, DEFAULT_SETTINGS } from './types/settings.js';
import { encryptKey, decryptKey } from './crypto.js';

const UBERCLI_DIR = '.ubercli';
const SETTINGS_FILE = 'settings.json';
const PROVIDER_NAMES: ProviderName[] = ['anthropic', 'google', 'openai'];

function getSettingsPath(): string {
	return join(process.cwd(), UBERCLI_DIR, SETTINGS_FILE);
}

function decryptProviderKeys(settings: Settings): Settings {
	const providers = { ...settings.providers };
	for (const p of PROVIDER_NAMES) {
		providers[p] = {
			...providers[p],
			apiKey: decryptKey(providers[p].apiKey),
		};
	}
	return { ...settings, providers };
}

function encryptProviderKeys(settings: Settings): Settings {
	const providers = { ...settings.providers };
	for (const p of PROVIDER_NAMES) {
		providers[p] = {
			...providers[p],
			apiKey: encryptKey(providers[p].apiKey),
		};
	}
	return { ...settings, providers };
}

export function loadSettings(): Settings {
	const settingsPath = getSettingsPath();
	if (!existsSync(settingsPath)) return { ...DEFAULT_SETTINGS };

	try {
		const raw = readFileSync(settingsPath, 'utf8');
		const parsed = JSON.parse(raw) as Partial<Settings>;
		const merged: Settings = {
			...DEFAULT_SETTINGS,
			...parsed,
			providers: {
				...DEFAULT_SETTINGS.providers,
				...(parsed.providers ?? {}),
			},
		};
		const decrypted = decryptProviderKeys(merged);

		const hasPlaintext = PROVIDER_NAMES.some(
			p => merged.providers[p].apiKey && !merged.providers[p].apiKey.startsWith('enc:')
		);
		if (hasPlaintext) saveSettings(decrypted);

		return decrypted;
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}

export function saveSettings(settings: Settings): void {
	const dir = join(process.cwd(), UBERCLI_DIR);
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
	const encrypted = encryptProviderKeys(settings);
	writeFileSync(
		join(dir, SETTINGS_FILE),
		JSON.stringify(encrypted, null, 2) + '\n',
		'utf8'
	);
}

export function getWorkspaceName(): string {
	return process.cwd().split(/[\\/]/).pop() ?? process.cwd();
}
