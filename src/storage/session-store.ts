import { mkdir, appendFile, rename } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { ChatMessage } from "../types/chat.js";

export class SessionStore {
  constructor(
    private readonly sessionsDir: string,
    private readonly memoryDir: string
  ) {}

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

  async moveSessionToMemory(sessionPath: string): Promise<string> {
    await mkdir(this.memoryDir, { recursive: true });
    const uuid = randomUUID();
    const target = path.join(this.memoryDir, `${uuid}.md`);
    await rename(sessionPath, target);
    return target;
  }
}

