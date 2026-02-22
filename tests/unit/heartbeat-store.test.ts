import { readFile } from "node:fs/promises"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { HeartbeatStore } from "../../src/storage/heartbeat-store.js"
import { createTempDir, removeTempDir } from "../helpers/temp-dir.js"

describe("HeartbeatStore", () => {
  it("builds expected UTC heartbeat path", () => {
    const store = new HeartbeatStore("sessions")
    const pathname = store.buildPath(new Date("2026-01-02T03:04:05.000Z"))
    expect(pathname).toBe(path.join("sessions", "heartbeat", "2026-01-02", "03-04.md"))
  })

  it("appends content to heartbeat markdown file", async () => {
    const dir = await createTempDir("heartbeat-store")
    try {
      const store = new HeartbeatStore(dir)
      const pathname = store.buildPath(new Date("2026-01-02T03:04:05.000Z"))

      await store.append(pathname, "heartbeat output")
      const content = await readFile(pathname, "utf8")
      expect(content).toContain("heartbeat output")
    } finally {
      await removeTempDir(dir)
    }
  })
})
