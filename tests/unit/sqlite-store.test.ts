import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { SqliteStore } from "../../src/storage/sqlite-store.ts"

describe("SqliteStore", () => {
  let store: SqliteStore

  beforeEach(async () => {
    store = new SqliteStore(":memory:")
    await store.connect()
  })

  afterEach(async () => {
    const closable = store as unknown as {
      close?: () => Promise<void> | void
      dispose?: () => Promise<void> | void
    }

    if (typeof closable.close === "function") {
      await closable.close()
      return
    }

    if (typeof closable.dispose === "function") {
      await closable.dispose()
    }
  })

  it("supports connect and save calls without throwing", async () => {
    await expect(
      store.saveMessage("chat-1", {
        role: "user",
        content: "hello",
        createdAt: new Date().toISOString()
      })
    ).resolves.toBeUndefined()
  })

  it("returns ready status", async () => {
    await expect(store.status()).resolves.toBe("ready")
  })
})
