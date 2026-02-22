export interface ParsedCommand {
  name: string;
  raw: string;
}

export function parseSlashCommand(text: string): ParsedCommand | null {
  if (!text.startsWith("/")) {
    return null;
  }

  const [name] = text.trim().split(/\s+/, 1);
  return { name, raw: text };
}

