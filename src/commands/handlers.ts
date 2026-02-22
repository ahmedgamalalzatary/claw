export function handleStatus(
  uptimeMs: number,
  currentModel: string,
  fallbackCount: number,
  dbStatus: string,
  whatsappStatus: string
): string {
  return [
    `uptime: ${Math.floor(uptimeMs / 1000)}s`,
    `model: ${currentModel}`,
    `fallbacks: ${fallbackCount}`,
    `db: ${dbStatus}`,
    `whatsapp: ${whatsappStatus}`
  ].join("\n");
}

export function handlePing(latencyMs: number): string {
  return `pong ${latencyMs}ms ${new Date().toISOString()}`;
}

export function handleNewSessionMessage(): string {
  return "new session started";
}

