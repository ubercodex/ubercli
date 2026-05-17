export function getWorkspace(): string {
  return process.cwd();
}

export function getWorkspaceName(): string {
  return process.cwd().split(/[/\\]/).pop() ?? process.cwd();
}
