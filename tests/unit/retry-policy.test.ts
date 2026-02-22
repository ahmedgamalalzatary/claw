import { describe, expect, it } from "vitest"
import {
  buildRetryPlan,
  DEFAULT_DELAYS_MS,
  DEFAULT_MAX_ATTEMPTS
} from "../../src/core/retry-policy.js"
import type { ProviderConfig } from "../../src/config/types.js"

function buildProvider(): ProviderConfig {
  return {
    name: "google",
    apiKey: "x",
    primaryModel: "model-a",
    fallbackModels: ["model-b", "model-c"],
    params: {
      temperature: 0.2,
      topP: 1,
      maxOutputTokens: 512
    },
  }
}

describe("buildRetryPlan", () => {
  it("builds plan from internal defaults", () => {
    const plan = buildRetryPlan(buildProvider())
    expect(plan).toEqual([
      { model: "model-a", delayMs: DEFAULT_DELAYS_MS[0] },
      { model: "model-b", delayMs: DEFAULT_DELAYS_MS[1] },
      { model: "model-c", delayMs: DEFAULT_DELAYS_MS[2] }
    ])
    expect(plan).toHaveLength(DEFAULT_MAX_ATTEMPTS)
  })

  it("reuses last model and delay when overrides exceed configured arrays", () => {
    const plan = buildRetryPlan(buildProvider(), {
      maxAttempts: 4,
      delaysMs: [10]
    })
    expect(plan).toEqual([
      { model: "model-a", delayMs: 10 },
      { model: "model-b", delayMs: 10 },
      { model: "model-c", delayMs: 10 },
      { model: "model-c", delayMs: 10 }
    ])
  })
})
