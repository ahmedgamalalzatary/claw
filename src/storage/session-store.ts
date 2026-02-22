import { appendFile, mkdir, readFile, rename } from "node:fs/promises"
import { createHash, randomBytes } from "node:crypto"
import path from "node:path"
import type { ChatMessage } from "../types/chat.js"

const memoryFileDigits = 16n
const memoryFileMod = 10n ** memoryFileDigits

export class SessionStore {
  constructor(
    private readonly sessionsDir: string,
    private readonly memoryDir: string
  ) { }

  buildSessionPath(chatId: string, date = new Date()): string {
    const y = date.getUTCFullYear()
    const m = String(date.getUTCMonth() + 1).padStart(2, "0")
    const d = String(date.getUTCDate()).padStart(2, "0")
    const h = String(date.getUTCHours()).padStart(2, "0")
    const min = String(date.getUTCMinutes()).padStart(2, "0")
    const s = String(date.getUTCSeconds()).padStart(2, "0")
    const chatScope = this.buildChatScope(chatId)

    return path.join(this.sessionsDir, chatScope, `${y}-${m}-${d}`, `${h}-${min}-${s}.md`)
  }

  async appendMessage(sessionPath: string, message: ChatMessage): Promise<void> {
    await mkdir(path.dirname(sessionPath), { recursive: true })
    const block = `\n## ${message.role} (${message.createdAt})\n${message.content}\n`
    await appendFile(sessionPath, block, "utf8")
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

  async moveSessionToMemory(sessionPath: string, chatId: string): Promise<string> {
    const chatScope = this.buildChatScope(chatId)
    const targetDir = path.join(this.memoryDir, chatScope)
    await mkdir(targetDir, { recursive: true })
    const target = path.join(targetDir, `${this.buildMemoryFileId()}.md`)
    await rename(sessionPath, target)
    return target
  }

  private buildChatScope(chatId: string): string {
    const normalized = chatId
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32)
    const digest = createHash("sha1").update(chatId).digest("hex").slice(0, 10)
    const base = normalized || "chat"
    return `${base}_${digest}`
  }

  private buildMemoryFileId(): string {
    const bytes = randomBytes(8)
    const value = BigInt(`0x${bytes.toString("hex")}`) % memoryFileMod
    return value.toString().padStart(Number(memoryFileDigits), "0")
  }
}

