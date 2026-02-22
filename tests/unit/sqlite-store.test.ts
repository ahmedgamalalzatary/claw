import { describe, expect, it } from "vitest"
import { SqliteStore } from "../../src/storage/sqlite-store.ts"

describe("SqliteStore", () => {
  it("supports connect and save calls without throwing", async () => {
    const store = new SqliteStore("db/test.sqlite")
    await expect(store.connect()).resolves.toBeUndefined()
    await expect(
      store.saveMessage("chat-1", {
        role: "user",
        content: "hello",
        createdAt: new Date().toISOString()
      })
    ).resolves.toBeUndefined()
  })

  it("returns ready status", async () => {
    const store = new SqliteStore("db/test.sqlite")
    await expect(store.status()).resolves.toBe("ready")
  })
})
