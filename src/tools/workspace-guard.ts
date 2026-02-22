import path from "node:path";

export function assertWithinWorkspace(
  workspaceRoot: string,
  targetPath: string
): void {
  const root = path.resolve(workspaceRoot);
  const target = path.resolve(targetPath);
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error(`Access denied outside workspace: ${targetPath}`);
  }
}

