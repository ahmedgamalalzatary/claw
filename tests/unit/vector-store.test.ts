import { describe, expect, it } from "vitest"
import { VectorStore } from "../../src/storage/vector-store.ts"

describe("VectorStore", () => {
  it("reports disabled state", () => {
    const store = new VectorStore(false)
    expect(store.isEnabled()).toBe(false)
  })

  it("reports enabled state", () => {
    const store = new VectorStore(true)
    expect(store.isEnabled()).toBe(true)
  })
})
