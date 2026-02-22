import { mkdir } from "node:fs/promises"
import path from "node:path"
import Database from "better-sqlite3"
import type { ChatMessage } from "../types/chat.js"

type SqliteDatabase = InstanceType<typeof Database>

interface CountRow {
  readonly count: number
}

interface SessionPathRow {
  readonly session_path: string
}

export class SqliteStore {
  private db: SqliteDatabase | null = null

  constructor(private readonly dbPath: string) { }

  async connect(): Promise<void> {
    if (this.db) {
      return
    }

    if (this.dbPath !== ":memory:") {
      await mkdir(path.dirname(this.dbPath), { recursive: true })
    }

    const db = new Database(this.dbPath)
    db.pragma("journal_mode = WAL")
    db.exec(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        chat_id TEXT PRIMARY KEY,
        session_path TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        session_path TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created
      ON chat_messages(chat_id, created_at);
    `)

    this.db = db
  }

  async close(): Promise<void> {
    if (!this.db) {
      return
    }
    this.db.close()
    this.db = null
  }

  async saveMessage(chatId: string, message: ChatMessage, sessionPath: string): Promise<void> {
    const db = this.getDb()
    db.prepare(`
      INSERT INTO chat_messages (
        chat_id,
        role,
        content,
        created_at,
        session_path
      ) VALUES (?, ?, ?, ?, ?)
    `).run(chatId, message.role, message.content, message.createdAt, sessionPath)
  }

  async getActiveSessionPath(chatId: string): Promise<string | null> {
    const db = this.getDb()
    const row = db
      .prepare(`
        SELECT session_path
        FROM chat_sessions
        WHERE chat_id = ?
      `)
      .get(chatId) as SessionPathRow | undefined

    return row?.session_path ?? null
  }

  async setActiveSessionPath(chatId: string, sessionPath: string): Promise<void> {
    const db = this.getDb()
    db.prepare(`
      INSERT INTO chat_sessions (
        chat_id,
        session_path,
        updated_at
      ) VALUES (?, ?, ?)
      ON CONFLICT(chat_id) DO UPDATE SET
        session_path = excluded.session_path,
        updated_at = excluded.updated_at
    `).run(chatId, sessionPath, new Date().toISOString())
  }

  async status(): Promise<string> {
    const db = this.getDb()
    const messageRow = db
      .prepare("SELECT COUNT(*) AS count FROM chat_messages")
      .get() as CountRow | undefined
    const sessionRow = db
      .prepare("SELECT COUNT(*) AS count FROM chat_sessions")
      .get() as CountRow | undefined

    const messageCount = messageRow?.count ?? 0
    const sessionCount = sessionRow?.count ?? 0
    return `ready messages=${messageCount} sessions=${sessionCount}`
  }

  private getDb(): SqliteDatabase {
    if (!this.db) {
      throw new Error("SQLite is not connected.")
    }
    return this.db
  }
}
