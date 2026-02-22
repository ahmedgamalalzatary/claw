import type { IncomingWhatsAppMessage } from "../../types/chat.js";

export type MessageHandler = (
  message: IncomingWhatsAppMessage
) => Promise<void> | void;

export interface WhatsAppClient {
  start(onMessage: MessageHandler): Promise<void>;
  sendText(chatId: string, text: string): Promise<void>;
  status(): string;
}

