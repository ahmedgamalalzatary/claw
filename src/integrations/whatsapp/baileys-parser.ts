import type { proto } from "@whiskeysockets/baileys"

type WebMessageInfo = proto.IWebMessageInfo
type Message = proto.IMessage

export function extractTextFromBaileysMessage(message: WebMessageInfo): string | null {
  const root = message?.message
  if (!root) {
    return null
  }

  if (typeof root.conversation === "string") {
    return root.conversation.trim()
  }

  if (typeof root.extendedTextMessage?.text === "string") {
    return root.extendedTextMessage.text.trim()
  }

  if (root.ephemeralMessage?.message) {
    return extractNestedTextFromBaileysMessage(root.ephemeralMessage.message)
  }

  if (root.viewOnceMessageV2?.message) {
    return extractNestedTextFromBaileysMessage(root.viewOnceMessageV2.message)
  }

  return null
}

export function extractNestedTextFromBaileysMessage(nested: Message): string | null {
  if (typeof nested?.conversation === "string") {
    return nested.conversation.trim()
  }
  if (typeof nested?.extendedTextMessage?.text === "string") {
    return nested.extendedTextMessage.text.trim()
  }
  return null
}
