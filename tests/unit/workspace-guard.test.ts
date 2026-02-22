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
    const workspaceRoot = path.join("workspace")
    const targetPath = path.join("..", "config.json")
    expect(() => assertWithinWorkspace(workspaceRoot, targetPath)).toThrow(
      /Access denied outside workspace/
    )
  })

  it("throws for traversal paths that start inside workspace then escape", () => {
    const workspaceRoot = path.join("workspace")
    const escapedFromRoot = path.join("workspace", "..", "config.json")
    const escapedFromSubdir = path.join("workspace", "subdir", "..", "..", "secret")

    expect(() => assertWithinWorkspace(workspaceRoot, escapedFromRoot)).toThrow(
      /Access denied outside workspace/
    )
    expect(() => assertWithinWorkspace(workspaceRoot, escapedFromSubdir)).toThrow(
      /Access denied outside workspace/
    )
  })
})
