export function isMissingFileError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false
  }
  const maybeNodeError = error as { code?: string }
  return maybeNodeError.code === "ENOENT"
}
