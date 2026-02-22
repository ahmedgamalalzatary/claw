import { describe, expect, it } from "vitest"
import { handleNewSessionMessage, handlePing, handleStatus } from "../../src/commands/handlers.ts"

describe("command handlers", () => {
  it("formats ping response", () => {
    const text = handlePing(123)
    expect(text.startsWith("pong 123ms ")).toBe(true)
    expect(text).toMatch(/\d{4}-\d{2}-\d{2}T/)
  })

  it("formats status response", () => {
    const text = handleStatus(5_000, "gemini", 2, "ready", "connected")
    expect(text).toContain("uptime: 5s")
    expect(text).toContain("model: gemini")
    expect(text).toContain("fallbacks: 2")
    expect(text).toContain("db: ready")
    expect(text).toContain("whatsapp: connected")
  })

  it("returns new session confirmation text", () => {
    expect(handleNewSessionMessage()).toBe("new session started")
  })
})
