import type { GatewayConfig } from "../config/types.js";
import type { AIClient } from "../integrations/ai/client.js";
import type { WhatsAppClient } from "../integrations/whatsapp/client.js";
import type { IncomingWhatsAppMessage } from "../types/chat.js";
import { parseSlashCommand } from "../commands/router.js";
import {
  handleNewSessionMessage,
  handlePing,
  handleStatus
} from "../commands/handlers.js";
import { SessionStore } from "../storage/session-store.js";
import { SqliteStore } from "../storage/sqlite-store.js";
import { Logger } from "./logger.js";

export class Gateway {
  private readonly bootAt = Date.now();
  private sessionPath = "";

  constructor(
    private config: GatewayConfig,
    private readonly ai: AIClient,
    private readonly whatsapp: WhatsAppClient,
    private readonly sessions: SessionStore,
    private readonly sqlite: SqliteStore,
    private readonly logger: Logger
  ) {}

  async start(): Promise<void> {
    this.sessionPath = this.sessions.buildSessionPath(new Date());
    await this.logger.setSession(this.sessionIdFromPath(this.sessionPath));
    await this.sqlite.connect();
    await this.whatsapp.start(async (message) => this.onMessage(message));
    await this.logger.info("Gateway started.");
  }

  async updateConfig(next: GatewayConfig): Promise<void> {
    this.config = next;
    await this.logger.info("Config hot-reloaded.");
  }

  private async onMessage(message: IncomingWhatsAppMessage): Promise<void> {
    const cmd = parseSlashCommand(message.text);
    if (cmd) {
      await this.handleCommand(message.chatId, cmd.name);
      return;
    }

    await this.logger.info("Received normal message.");
  }

  private async handleCommand(chatId: string, command: string): Promise<void> {
    if (command === "/ping") {
      const latency = Date.now() - this.bootAt;
      await this.whatsapp.sendText(chatId, handlePing(latency));
      return;
    }

    if (command === "/status") {
      const text = handleStatus(
        Date.now() - this.bootAt,
        this.config.provider.primaryModel,
        this.config.provider.fallbackModels.length,
        await this.sqlite.status(),
        this.whatsapp.status()
      );
      await this.whatsapp.sendText(chatId, text);
      return;
    }

    if (command === "/new") {
      if (this.sessionPath) {
        await this.sessions.moveSessionToMemory(this.sessionPath);
      }
      this.sessionPath = this.sessions.buildSessionPath(new Date());
      await this.logger.setSession(this.sessionIdFromPath(this.sessionPath));
      await this.whatsapp.sendText(chatId, handleNewSessionMessage());
      return;
    }

    // Unknown commands are intentionally ignored for MVP.
  }

  private sessionIdFromPath(filePath: string): string {
    return filePath.replace(/[\\/]/g, "_").replace(".md", "");
  }
}

