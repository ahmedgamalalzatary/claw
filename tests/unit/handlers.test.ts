import { describe, expect, it } from "vitest"
import { handleNewSessionMessage, handlePing, handleStatus } from "../../src/commands/handlers.js"

describe("command handlers", () => {
  it("formats ping response", () => {
    const text = handlePing(123, "2026-02-23T15:14:50.000Z")
    expect(text).toBe("pong 123ms 2026-02-23T15:14:50.000Z")
  })

  it("formats status response", () => {
    const text = handleStatus(
      5_000,
      "gemini",
      2,
      "ready",
      "connected",
      "sessions/2026-02-23/15-14-50.md"
    )
    expect(text).toContain("uptime: 5s")
    expect(text).toContain("model: gemini")
    expect(text).toContain("fallbacks: 2")
    expect(text).toContain("db: ready")
    expect(text).toContain("whatsapp: connected")
    expect(text).toContain("session: sessions/2026-02-23/15-14-50.md")
  })

  it("returns new session confirmation text", () => {
    expect(handleNewSessionMessage()).toBe("new session started")
  })
})
