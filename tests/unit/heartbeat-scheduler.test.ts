import { afterEach, describe, expect, it, vi } from "vitest"
import { HeartbeatScheduler } from "../../src/heartbeat/scheduler.ts"

afterEach(() => {
  vi.useRealTimers()
})

describe("HeartbeatScheduler", () => {
  it("runs callback on configured interval and stops cleanly", async () => {
    vi.useFakeTimers()
    const scheduler = new HeartbeatScheduler()
    const run = vi.fn()

    scheduler.start(1, run)
    await vi.advanceTimersByTimeAsync(60_000)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(run).toHaveBeenCalledTimes(2)

    scheduler.stop()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(run).toHaveBeenCalledTimes(2)
  })
})
