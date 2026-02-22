import type { ChatMessage } from "../types/chat.js";

export class SqliteStore {
  constructor(private readonly dbPath: string) {}

  async connect(): Promise<void> {
    void this.dbPath;
  }

  async saveMessage(chatId: string, message: ChatMessage): Promise<void> {
    void chatId;
    void message;
  }

  async status(): Promise<string> {
    return "ready";
  }
}

