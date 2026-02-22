import type { GatewayConfig } from "../config/types.js";
import type { AIClient } from "../integrations/ai/client.js";
import type { WhatsAppClient } from "../integrations/whatsapp/client.js";
import type { ChatMessage, IncomingWhatsAppMessage } from "../types/chat.js";
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
  private readonly sessionPathByChatId = new Map<string, string>();
  private readonly startupSessionId =
    `gateway_${new Date().toISOString().replace(/[:.]/g, "-")}`;

  constructor(
    private config: GatewayConfig,
    private readonly ai: AIClient,
    private readonly whatsapp: WhatsAppClient,
    private readonly sessions: SessionStore,
    private readonly sqlite: SqliteStore,
    private readonly logger: Logger
  ) { }

  async start(): Promise<void> {
    await this.logger.setSession(this.startupSessionId);
    await this.sqlite.connect();
    await this.whatsapp.start(async (message) => this.onMessage(message));
    await this.logger.info("Gateway started.");
  }

  async updateConfig(next: GatewayConfig): Promise<void> {
    this.config = next;
    await this.logger.info("Config hot-reloaded.");
  }

  private async onMessage(message: IncomingWhatsAppMessage): Promise<void> {
    const userText = message.text.trim();
    if (!userText) {
      return;
    }
    await this.logger.info(
      `Inbound chatId=${message.chatId} text=${JSON.stringify(userText)}`
    );

    const cmd = parseSlashCommand(userText);
    if (cmd) {
      await this.handleCommand(message.chatId, cmd.name);
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: userText,
      createdAt: new Date().toISOString()
    };

    try {
      const sessionPath = await this.getOrCreateSessionPath(message.chatId);
      await this.logger.setSession(this.sessionIdFromPath(sessionPath));
      const history = await this.sessions.getMessages(sessionPath);
      await this.sessions.appendMessage(sessionPath, userMessage);
      await this.sqlite.saveMessage(message.chatId, userMessage, sessionPath);

      const aiResponse = await this.generateAssistantReply([...history, userMessage]);
      const finalText = this.formatAssistantReply(aiResponse.text);
      await this.logger.info(
        `Outbound chatId=${message.chatId} model=${aiResponse.model} text=${JSON.stringify(finalText)}`
      );
      await this.whatsapp.sendText(message.chatId, finalText);

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: finalText,
        createdAt: new Date().toISOString()
      };
      await this.sessions.appendMessage(sessionPath, assistantMessage);
      await this.sqlite.saveMessage(message.chatId, assistantMessage, sessionPath);
      await this.logger.info(`Replied using model: ${aiResponse.model}`);
    } catch (error) {
      const errorDetails =
        error instanceof Error
          ? error.stack ?? error.message
          : JSON.stringify(error);
      await this.logger.error(
        `Failed to process message for chatId=${message.chatId} text=${JSON.stringify(userText)} details=${errorDetails}`
      );
      await this.whatsapp.sendText(
        message.chatId,
        "An internal error occurred, please try again later."
      );
    }
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
      const currentSessionPath = await this.getExistingSessionPath(chatId);
      if (currentSessionPath) {
        try {
          await this.sessions.moveSessionToMemory(currentSessionPath, chatId);
        } catch (error) {
          if (!isMissingFileError(error)) {
            throw error;
          }
        }
      }

      const nextSessionPath = await this.createSessionPath(chatId);
      await this.logger.setSession(this.sessionIdFromPath(nextSessionPath));
      await this.whatsapp.sendText(chatId, handleNewSessionMessage());
      return;
    }

    // Unknown commands are intentionally ignored for MVP.
  }

  private sessionIdFromPath(filePath: string): string {
    return filePath.replace(/[\\/]/g, "_").replace(".md", "");
  }

  private async getOrCreateSessionPath(chatId: string): Promise<string> {
    const existing = await this.getExistingSessionPath(chatId);
    if (existing) {
      return existing;
    }
    return this.createSessionPath(chatId);
  }

  private async getExistingSessionPath(chatId: string): Promise<string | null> {
    const cached = this.sessionPathByChatId.get(chatId);
    if (cached) {
      return cached;
    }

    const persisted = await this.sqlite.getActiveSessionPath(chatId);
    if (persisted) {
      this.sessionPathByChatId.set(chatId, persisted);
    }
    return persisted;
  }

  private async createSessionPath(chatId: string): Promise<string> {
    const sessionPath = this.sessions.buildSessionPath(chatId, new Date());
    this.sessionPathByChatId.set(chatId, sessionPath);
    await this.sqlite.setActiveSessionPath(chatId, sessionPath);
    return sessionPath;
  }

  private async generateAssistantReply(
    input: ChatMessage[]
  ): Promise<{ text: string; model: string }> {
    const modelChain = [
      this.config.provider.primaryModel,
      ...this.config.provider.fallbackModels
    ];

    const maxAttempts = Math.max(1, this.config.retries.maxRetries);
    let lastError: unknown = null;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const model = modelChain[Math.min(attempt, modelChain.length - 1)];
      try {
        return await this.ai.complete(input, model, this.config.provider.params);
      } catch (error) {
        lastError = error;
        const isLast = attempt === maxAttempts - 1;
        if (isLast) {
          break;
        }
        const delayMs =
          this.config.retries.delaysMs[Math.min(attempt, this.config.retries.delaysMs.length - 1)] ??
          0;
        await this.logger.warn(
          `AI attempt ${attempt + 1} failed on model ${model}. Retrying in ${delayMs}ms.`
        );
        await wait(delayMs);
      }
    }

    throw lastError instanceof Error ? lastError : new Error("AI call failed.");
  }

  private formatAssistantReply(text: string): string {
    const normalized = text.replace(/\r\n/g, "\n").trim();
    return normalized || "empty response";
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.max(0, ms));
  });
}

function isMissingFileError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const maybeNodeError = error as { code?: string };
  return maybeNodeError.code === "ENOENT";
}
