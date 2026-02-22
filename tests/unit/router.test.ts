import { describe, expect, it } from "vitest"
import { parseSlashCommand } from "../../src/commands/router.ts"

describe("parseSlashCommand", () => {
  it("returns null when text does not start with slash", () => {
    expect(parseSlashCommand("hello /ping")).toBeNull()
  })

  it("parses command name from slash command", () => {
    const parsed = parseSlashCommand("/ping now")
    expect(parsed).toEqual({
      name: "/ping",
      raw: "/ping now"
    })
  })
})
