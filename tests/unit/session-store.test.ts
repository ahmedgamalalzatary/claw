import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { SessionStore } from "../../src/storage/session-store.ts"
import { createTempDir, removeTempDir } from "../helpers/temp-dir.ts"

const tempDirs: string[] = []

afterEach(async () => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()
    if (dir) {
      await removeTempDir(dir)
    }
  }
})

describe("SessionStore", () => {
  it("builds UTC session path with expected format", () => {
    const store = new SessionStore("sessions", "memory")
    const date = new Date("2026-01-02T03:04:05.000Z")
    expect(store.buildSessionPath(date)).toBe(path.join("sessions", "2026-01-02", "03-04-05.md"))
  })

  it("appends markdown message blocks", async () => {
    const dir = await createTempDir("session-append")
    tempDirs.push(dir)

    const sessionsDir = path.join(dir, "sessions")
    const memoryDir = path.join(dir, "memory")
    const store = new SessionStore(sessionsDir, memoryDir)
    const sessionPath = store.buildSessionPath(new Date("2026-01-02T03:04:05.000Z"))

    await store.appendMessage(sessionPath, {
      role: "user",
      content: "hello",
      createdAt: "2026-01-02T03:04:05.000Z"
    })

    const content = await readFile(sessionPath, "utf8")
    expect(content).toContain("## user (2026-01-02T03:04:05.000Z)")
    expect(content).toContain("hello")
  })

  it("moves a session file into memory directory", async () => {
    const dir = await createTempDir("session-move")
    tempDirs.push(dir)

    const sessionsDir = path.join(dir, "sessions")
    const memoryDir = path.join(dir, "memory")
    const store = new SessionStore(sessionsDir, memoryDir)
    const sessionPath = store.buildSessionPath(new Date("2026-01-02T03:04:05.000Z"))

    await mkdir(path.dirname(sessionPath), { recursive: true })
    await writeFile(sessionPath, "content", "utf8")

    const movedPath = await store.moveSessionToMemory(sessionPath)
    expect(movedPath.startsWith(memoryDir)).toBe(true)
    const movedContent = await readFile(movedPath, "utf8")
    expect(movedContent).toBe("content")
  })
})
