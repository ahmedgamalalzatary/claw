import { describe, expect, it } from "vitest"
import { buildRetryPlan } from "../../src/core/retry-policy.ts"
import type { GatewayConfig } from "../../src/config/types.ts"

function buildConfig(): GatewayConfig {
  return {
    timezone: "UTC",
    provider: {
      name: "google",
      apiKey: "x",
      primaryModel: "model-a",
      fallbackModels: ["model-b", "model-c"],
      params: {
        temperature: 0.2,
        topP: 1,
        maxOutputTokens: 512
      }
    },
    whatsapp: {
      driver: "baileys",
      mode: "dm_only",
      authPath: "data/whatsapp",
      textOnly: true
    },
    commands: {
      enabled: ["/ping", "/status", "/new"],
      unknownCommandBehavior: "ignore"
    },
    retries: {
      maxRetries: 2,
      delaysMs: [100, 200, 300],
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
      redact: []
    },
    hotReload: {
      enabled: false,
      files: ["config.json"]
    }
  }
}

describe("buildRetryPlan", () => {
  it("builds plan from configured models and delays", () => {
    const plan = buildRetryPlan(buildConfig())
    expect(plan).toEqual([
      { model: "model-a", delayMs: 100 },
      { model: "model-b", delayMs: 200 }
    ])
  })
})
