export function handleStatus(
  uptimeMs: number,
  currentModel: string,
  fallbackCount: number,
  dbStatus: string,
  whatsappStatus: string,
  sessionPath: string
): string {
  return [
    `uptime: ${Math.floor(uptimeMs / 1000)}s`,
    `model: ${currentModel}`,
    `fallbacks: ${fallbackCount}`,
    `db: ${dbStatus}`,
    `whatsapp: ${whatsappStatus}`,
    `session: ${sessionPath}`
  ].join("\n");
}

export function handlePing(latencyMs: number, nowIso: string): string {
  return `pong ${latencyMs}ms ${nowIso}`;
}

export function handleNewSessionMessage(): string {
  return "new session started";
}
