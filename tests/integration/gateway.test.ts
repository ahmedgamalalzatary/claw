import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { Gateway } from "../../src/core/gateway.ts"
import { Logger } from "../../src/core/logger.ts"
import { SessionStore } from "../../src/storage/session-store.ts"
import { SqliteStore } from "../../src/storage/sqlite-store.ts"
import type { GatewayConfig, ProviderParams } from "../../src/config/types.ts"
import type { AIResponse, AIClient } from "../../src/integrations/ai/client.ts"
import type { ChatMessage, IncomingWhatsAppMessage } from "../../src/types/chat.ts"
import type { MessageHandler, WhatsAppClient } from "../../src/integrations/whatsapp/client.ts"
import { createTempDir, removeTempDir } from "../helpers/temp-dir.ts"

class FakeAI implements AIClient {
  public readonly calls: string[] = []
  private readonly queue: Array<AIResponse | Error>
  private readonly events: string[]

  constructor(queue: Array<AIResponse | Error>, events: string[]) {
    this.queue = queue
    this.events = events
  }

  async complete(input: ChatMessage[], model: string, params: ProviderParams): Promise<AIResponse> {
    void input
    void params
    this.calls.push(model)
    this.events.push(`ai:${model}`)
    const next = this.queue.shift()
    if (next instanceof Error) {
      throw next
    }
    if (!next) {
      return { text: "default-response", model }
    }
    return next
  }
}

class FakeWhatsApp implements WhatsAppClient {
  public readonly sent: Array<{ chatId: string; text: string }> = []
  private onMessage: MessageHandler | null = null

  async start(onMessage: MessageHandler): Promise<void> {
    this.onMessage = onMessage
  }

  async sendText(chatId: string, text: string): Promise<void> {
    this.sent.push({ chatId, text })
  }

  status(): string {
    return "connected"
  }

  async emit(text: string, chatId = "user@s.whatsapp.net"): Promise<void> {
    if (!this.onMessage) {
      throw new Error("FakeWhatsApp must be started before emit.")
    }

    const message: IncomingWhatsAppMessage = {
      chatId,
      senderId: chatId,
      text,
      receivedAt: new Date().toISOString()
    }
    await this.onMessage(message)
  }
}

class TrackingSessionStore extends SessionStore {
  constructor(
    sessionsDir: string,
    memoryDir: string,
    private readonly events: string[]
  ) {
    super(sessionsDir, memoryDir)
  }

  override async appendMessage(sessionPath: string, message: ChatMessage): Promise<void> {
    this.events.push(`session:${message.role}`)
    await super.appendMessage(sessionPath, message)
  }
}

class TrackingSqliteStore extends SqliteStore {
  constructor(dbPath: string, private readonly events: string[]) {
    super(dbPath)
  }

  override async connect(): Promise<void> {
    this.events.push("sqlite:connect")
  }

  override async saveMessage(chatId: string, message: ChatMessage): Promise<void> {
    void chatId
    this.events.push(`sqlite:${message.role}`)
  }

  override async status(): Promise<string> {
    return "ready"
  }
}

let rootDir = ""
let sessionsDir = ""
let memoryDir = ""
let dbPath = ""

beforeEach(async () => {
  rootDir = await createTempDir("gateway-integration")
  sessionsDir = path.join(rootDir, "sessions")
  memoryDir = path.join(rootDir, "memory")
  dbPath = path.join(rootDir, "gateway.sqlite")
})

afterEach(async () => {
  if (rootDir) {
    await removeTempDir(rootDir)
  }
})

function buildConfig(): GatewayConfig {
  return {
    timezone: "UTC",
    provider: {
      name: "google",
      apiKey: "test",
      primaryModel: "model-a",
      fallbackModels: ["model-b", "model-c"],
      params: {
        temperature: 0.1,
        topP: 1,
        maxOutputTokens: 256
      }
    },
    whatsapp: {
      driver: "baileys",
      mode: "dm_only",
      authPath: "data/whatsapp",
      textOnly: true
    },
    commands: {
      enabled: ["/status", "/ping", "/new"],
      unknownCommandBehavior: "ignore"
    },
    retries: {
      maxRetries: 3,
      delaysMs: [0, 0, 0],
      applyTo: "ai_calls_only",
      fallbackOrder: ["retry same model", "fallback model 1", "fallback model 2"]
    },
    heartbeat: {
      enabled: false,
      intervalMinutes: 30
    },
    storage: {
      sessionsDir,
      memoryDir,
      sqlitePath: dbPath,
      vector: {
        engine: "sqlite-vec",
        enabled: false,
        indexSource: "chat_messages",
        triggerMode: "bot_action_only"
      }
    },
    logging: {
      dir: path.join(rootDir, "logs"),
      mode: "session_split",
      output: ["file"],
      metadataOnly: false,
      redact: []
    },
    hotReload: {
      enabled: false,
      files: ["config.json"]
    }
  }
}

describe("Gateway integration", () => {
  it("processes normal message and replies through AI", async () => {
    const events: string[] = []
    const ai = new FakeAI([{ text: "hello from ai", model: "model-a" }], events)
    const whatsapp = new FakeWhatsApp()
    const sessions = new TrackingSessionStore(sessionsDir, memoryDir, events)
    const sqlite = new TrackingSqliteStore(dbPath, events)
    const gateway = new Gateway(
      buildConfig(),
      ai,
      whatsapp,
      sessions,
      sqlite,
      new Logger(path.join(rootDir, "logs"), false)
    )

    await gateway.start()
    await whatsapp.emit("hello gateway")

    expect(whatsapp.sent).toHaveLength(1)
    expect(whatsapp.sent[0]?.text).toBe("hello from ai")
    expect(ai.calls).toEqual(["model-a"])
    expect(events.indexOf("session:user")).toBeGreaterThan(-1)
    expect(events.indexOf("sqlite:user")).toBeGreaterThan(-1)
    expect(events.indexOf("ai:model-a")).toBeGreaterThan(events.indexOf("sqlite:user"))
  })

  it("handles slash commands without calling AI", async () => {
    const events: string[] = []
    const ai = new FakeAI([{ text: "unused", model: "model-a" }], events)
    const whatsapp = new FakeWhatsApp()
    const sessions = new TrackingSessionStore(sessionsDir, memoryDir, events)
    const sqlite = new TrackingSqliteStore(dbPath, events)
    const gateway = new Gateway(
      buildConfig(),
      ai,
      whatsapp,
      sessions,
      sqlite,
      new Logger(path.join(rootDir, "logs"), false)
    )

    await gateway.start()
    await whatsapp.emit("/ping")
    await whatsapp.emit("/unknown")

    expect(ai.calls).toHaveLength(0)
    expect(whatsapp.sent[0]?.text.startsWith("pong ")).toBe(true)
    expect(whatsapp.sent).toHaveLength(1)
  })

  it("moves current session to memory when /new is called", async () => {
    const events: string[] = []
    const ai = new FakeAI([{ text: "hello", model: "model-a" }], events)
    const whatsapp = new FakeWhatsApp()
    const sessions = new TrackingSessionStore(sessionsDir, memoryDir, events)
    const sqlite = new TrackingSqliteStore(dbPath, events)
    const gateway = new Gateway(
      buildConfig(),
      ai,
      whatsapp,
      sessions,
      sqlite,
      new Logger(path.join(rootDir, "logs"), false)
    )

    await gateway.start()
    await whatsapp.emit("first")
    await whatsapp.emit("/new")

    const memoryFiles = await readdir(memoryDir)
    expect(memoryFiles.length).toBe(1)
    expect(memoryFiles[0]?.endsWith(".md")).toBe(true)
    expect(whatsapp.sent.at(-1)?.text).toBe("new session started")
  })

  it("uses fallback model after primary fails", async () => {
    const events: string[] = []
    const ai = new FakeAI(
      [new Error("primary failed"), { text: "fallback response", model: "model-b" }],
      events
    )
    const whatsapp = new FakeWhatsApp()
    const sessions = new TrackingSessionStore(sessionsDir, memoryDir, events)
    const sqlite = new TrackingSqliteStore(dbPath, events)
    const gateway = new Gateway(
      buildConfig(),
      ai,
      whatsapp,
      sessions,
      sqlite,
      new Logger(path.join(rootDir, "logs"), false)
    )

    await gateway.start()
    await whatsapp.emit("retry please")

    expect(ai.calls).toEqual(["model-a", "model-b"])
    expect(whatsapp.sent[0]?.text).toBe("fallback response")
  })

  it("returns internal error text when AI ultimately fails", async () => {
    const events: string[] = []
    const ai = new FakeAI(
      [new Error("a"), new Error("b"), new Error("c")],
      events
    )
    const whatsapp = new FakeWhatsApp()
    const sessions = new TrackingSessionStore(sessionsDir, memoryDir, events)
    const sqlite = new TrackingSqliteStore(dbPath, events)
    const gateway = new Gateway(
      buildConfig(),
      ai,
      whatsapp,
      sessions,
      sqlite,
      new Logger(path.join(rootDir, "logs"), false)
    )

    await gateway.start()
    await whatsapp.emit("fail now")

    expect(whatsapp.sent[0]?.text).toContain("internal error")
  })

  it("writes session markdown with user and assistant messages", async () => {
    const events: string[] = []
    const ai = new FakeAI([{ text: "ack", model: "model-a" }], events)
    const whatsapp = new FakeWhatsApp()
    const sessions = new TrackingSessionStore(sessionsDir, memoryDir, events)
    const sqlite = new TrackingSqliteStore(dbPath, events)
    const gateway = new Gateway(
      buildConfig(),
      ai,
      whatsapp,
      sessions,
      sqlite,
      new Logger(path.join(rootDir, "logs"), false)
    )

    await gateway.start()
    await whatsapp.emit("persist me")

    const dayDir = (await readdir(sessionsDir))[0]
    const fileName = (await readdir(path.join(sessionsDir, dayDir)))[0]
    const content = await readFile(path.join(sessionsDir, dayDir, fileName), "utf8")
    expect(content).toContain("## user")
    expect(content).toContain("persist me")
    expect(content).toContain("## assistant")
    expect(content).toContain("ack")
  })
})
