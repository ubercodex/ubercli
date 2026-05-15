export interface WorkspaceConfig {
	name: string;
	model: string;
}

export const DEFAULT_WORKSPACE: WorkspaceConfig = {
	name: 'No workspace loaded',
	model: 'No model selected',
};
