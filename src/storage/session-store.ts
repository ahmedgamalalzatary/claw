import { mkdir, appendFile, readFile, rename } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import type { ChatMessage } from "../types/chat.js";

export class SessionStore {
  constructor(
    private readonly sessionsDir: string,
    private readonly memoryDir: string
  ) { }

  buildSessionPath(date = new Date()): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    const h = String(date.getUTCHours()).padStart(2, "0");
    const min = String(date.getUTCMinutes()).padStart(2, "0");
    const s = String(date.getUTCSeconds()).padStart(2, "0");

    return path.join(this.sessionsDir, `${y}-${m}-${d}`, `${h}-${min}-${s}.md`);
  }

  async appendMessage(sessionPath: string, message: ChatMessage): Promise<void> {
    await mkdir(path.dirname(sessionPath), { recursive: true });
    const block = `\n## ${message.role} (${message.createdAt})\n${message.content}\n`;
    await appendFile(sessionPath, block, "utf8");
  }

  async getMessages(sessionPath: string): Promise<ChatMessage[]> {
    let raw: string
    try {
      raw = await readFile(sessionPath, "utf8")
    } catch {
      return []
    }

    const messages: ChatMessage[] = []
    const sectionPattern = /\n## (system|user|assistant) \(([^)]+)\)\n([\s\S]*?)(?=\n## (?:system|user|assistant) \(|$)/g

    for (const match of raw.matchAll(sectionPattern)) {
      const role = match[1] as ChatMessage["role"]
      const createdAt = match[2]
      const content = match[3]?.trim() ?? ""

      if (!role || !createdAt) {
        continue
      }

      messages.push({
        role,
        content,
        createdAt
      })
    }

    return messages
  }

  async moveSessionToMemory(sessionPath: string): Promise<string> {
    await mkdir(this.memoryDir, { recursive: true });
    const uuid = randomUUID();
    const target = path.join(this.memoryDir, `${uuid}.md`);
    await rename(sessionPath, target);
    return target;
  }
}

