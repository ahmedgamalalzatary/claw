export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface IncomingWhatsAppMessage {
  chatId: string;
  senderId: string;
  text: string;
  receivedAt: string;
}

