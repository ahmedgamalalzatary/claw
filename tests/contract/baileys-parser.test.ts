import { describe, expect, it } from "vitest"
import {
  extractNestedTextFromBaileysMessage,
  extractTextFromBaileysMessage
} from "../../src/integrations/whatsapp/baileys-parser.js"

describe("baileys message text extraction", () => {
  it("extracts root conversation text", () => {
    const text = extractTextFromBaileysMessage({
      message: {
        conversation: "  hello  "
      }
    })
    expect(text).toBe("hello")
  })

  it("extracts extended text message", () => {
    const text = extractTextFromBaileysMessage({
      message: {
        extendedTextMessage: {
          text: "  extended  "
        }
      }
    })
    expect(text).toBe("extended")
  })

  it("extracts nested ephemeral text", () => {
    const text = extractTextFromBaileysMessage({
      message: {
        ephemeralMessage: {
          message: {
            conversation: "  nested  "
          }
        }
      }
    })
    expect(text).toBe("nested")
  })

  it("extracts nested view-once text", () => {
    const text = extractTextFromBaileysMessage({
      message: {
        viewOnceMessageV2: {
          message: {
            extendedTextMessage: {
              text: "  view once  "
            }
          }
        }
      }
    })
    expect(text).toBe("view once")
  })

  it("returns null for non-text payloads", () => {
    const text = extractTextFromBaileysMessage({
      message: {
        imageMessage: {
          caption: "ignored"
        }
      }
    })
    expect(text).toBeNull()
  })

  it("extracts nested helper conversation text", () => {
    const text = extractNestedTextFromBaileysMessage({
      conversation: "  child  "
    })
    expect(text).toBe("child")
  })
})
