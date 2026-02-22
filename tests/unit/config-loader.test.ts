import { writeFile } from "node:fs/promises"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { ConfigLoader } from "../../src/config/loader.js"
import { createTempDir, removeTempDir } from "../helpers/temp-dir.js"

const sampleConfig = {
  timezone: "UTC",
  provider: {
    name: "google",
    apiKey: "x",
    primaryModel: "m1",
    fallbackModels: ["m2"],
    params: {
      temperature: 0.2,
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
    delaysMs: [5000, 10000, 10000],
    applyTo: "ai_calls_only",
    fallbackOrder: ["retry same model", "fallback model 1", "fallback model 2"]
  },
  heartbeat: {
    enabled: true,
    intervalMinutes: 30
  },
  storage: {
    sessionsDir: "sessions",
    memoryDir: "memory",
    sqlitePath: "db/gateway.sqlite",
    vector: {
      engine: "sqlite-vec",
      enabled: false,
      indexSource: "chat_messages",
      triggerMode: "bot_action_only"
    }
  },
  logging: {
    dir: "logs",
    mode: "session_split",
    output: ["file"],
    metadataOnly: false,
    redact: ["api_keys"]
  },
  hotReload: {
    enabled: true,
    files: ["config.json"]
  }
}

describe("ConfigLoader", () => {
  it("loads config file and exposes current config", async () => {
    const dir = await createTempDir("config-loader")
    try {
      const configPath = path.join(dir, "config.json")
      await writeFile(configPath, JSON.stringify(sampleConfig), "utf8")

      const loader = new ConfigLoader(configPath)
      const loaded = await loader.load()
      expect(loaded.provider.primaryModel).toBe("m1")
      expect(loader.getCurrent().timezone).toBe("UTC")
    } finally {
      await removeTempDir(dir)
    }
  })

  it("throws if getCurrent is called before load", () => {
    const loader = new ConfigLoader("config.json")
    expect(() => loader.getCurrent()).toThrow(/Config has not been loaded yet/)
  })
})
