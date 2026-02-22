import type { MessageHandler, WhatsAppClient } from "./client.js";

export class BaileysClient implements WhatsAppClient {
  private currentStatus = "disconnected";

  async start(onMessage: MessageHandler): Promise<void> {
    void onMessage;
    this.currentStatus = "connected";
  }

  async sendText(chatId: string, text: string): Promise<void> {
    void chatId;
    void text;
  }

  status(): string {
    return this.currentStatus;
  }
}

