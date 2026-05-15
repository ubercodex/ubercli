export interface PluginParameter {
	name: string;
	type: 'string' | 'number' | 'boolean';
	description: string;
	required: boolean;
	default?: string | number | boolean;
}

export interface Plugin {
	id: string;
	author: string;
	name: string;
	version: string;
	description: string;
	code: string;
	parameters: PluginParameter[];
	tags: string[];
	downloads: number;
	createdAt: string;
	updatedAt: string;
	authorGithub?: string;
	authorAvatar?: string;
}

export interface PluginCreateInput {
	name: string;
	description: string;
	code: string;
	parameters: PluginParameter[];
	tags: string[];
}

export interface PluginUpdateInput {
	version: string;
	description?: string;
	code?: string;
	parameters?: PluginParameter[];
	tags?: string[];
}

export interface User {
	id: string;
	username: string;
	email: string;
	githubId: string;
	avatar: string;
	createdAt: string;
}

export interface AuthResponse {
	token: string;
	user: User;
}

export interface PluginSearchQuery {
	q?: string;
	author?: string;
	tag?: string;
	limit?: number;
	offset?: number;
}
