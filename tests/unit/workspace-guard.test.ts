import path from "node:path"
import { describe, expect, it } from "vitest"
import { assertWithinWorkspace } from "../../src/tools/workspace-guard.ts"

describe("assertWithinWorkspace", () => {
  it("allows paths inside workspace", () => {
    const workspaceRoot = path.join("workspace")
    const targetPath = path.join("workspace", "AGENTS.md")
    expect(() => assertWithinWorkspace(workspaceRoot, targetPath)).not.toThrow()
  })

  it("throws for paths outside workspace", () => {
    expect(() => assertWithinWorkspace("workspace", "../config.json")).toThrow(
      /Access denied outside workspace/
    )
  })
})
