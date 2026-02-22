import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

export async function createTempDir(prefix: string): Promise<string> {
  return mkdtemp(path.join(tmpdir(), `${prefix}-`))
}

export async function removeTempDir(target: string): Promise<void> {
  await rm(target, { recursive: true, force: true })
}
