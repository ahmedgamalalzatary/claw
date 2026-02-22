import { describe, expect, it } from "vitest"
import { GoogleAIClient } from "../../src/integrations/ai/google-client.js"
import type { ChatMessage } from "../../src/types/chat.js"

const hasLiveConfig = Boolean(process.env.GOOGLE_API_KEY && process.env.GOOGLE_MODEL)
const describeLive = hasLiveConfig ? describe : describe.skip

describeLive("Google live smoke", () => {
  it(
    "returns non-empty output for a minimal prompt",
    { timeout: 60_000 },
    async () => {
      const client = new GoogleAIClient(process.env.GOOGLE_API_KEY as string)
      const input: ChatMessage[] = [
        {
          role: "user",
          content: "Reply with the single word ok",
          createdAt: new Date().toISOString()
        }
      ]

      const response = await client.complete(input, process.env.GOOGLE_MODEL as string, {
        temperature: 0,
        topP: 1,
        maxOutputTokens: 16
      })

      expect(response.text.length).toBeGreaterThan(0)
    }
  )
})
