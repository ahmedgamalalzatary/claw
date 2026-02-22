export interface GatewayConfig {
  timezone: string;
  provider: ProviderConfig;
  whatsapp: WhatsAppConfig;
  commands: CommandsConfig;
  retries: RetryConfig;
  heartbeat: HeartbeatConfig;
  storage: StorageConfig;
  logging: LoggingConfig;
  hotReload: HotReloadConfig;
}

export interface ProviderConfig {
  name: string;
  apiKey: string;
  primaryModel: string;
  fallbackModels: string[];
  params: ProviderParams;
}

export interface ProviderParams {
  temperature: number;
  topP: number;
  maxOutputTokens: number;
}

export interface WhatsAppConfig {
  driver: "baileys";
  mode: "dm_only";
  authPath: string;
  textOnly: boolean;
}

export interface CommandsConfig {
  enabled: string[];
  unknownCommandBehavior: "ignore";
}

export interface RetryConfig {
  maxRetries: number;
  delaysMs: number[];
  applyTo: "ai_calls_only";
  fallbackOrder: string[];
}

export interface HeartbeatConfig {
  enabled: boolean;
  intervalMinutes: number;
}

export interface StorageConfig {
  sessionsDir: string;
  memoryDir: string;
  sqlitePath: string;
  vector: VectorConfig;
}

export interface VectorConfig {
  engine: "sqlite-vec";
  enabled: boolean;
  indexSource: "chat_messages";
  triggerMode: "bot_action_only";
}

export interface LoggingConfig {
  dir: string;
  mode: "session_split";
  output: Array<"file" | "console">;
  metadataOnly: boolean;
  redact: string[];
}

export interface HotReloadConfig {
  enabled: boolean;
  files: string[];
}

