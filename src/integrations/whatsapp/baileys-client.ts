import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import pino from "pino";
import type { MessageHandler, WhatsAppClient } from "./client.js";
import type { Logger } from "../../core/logger.js";

export class BaileysClient implements WhatsAppClient {
  private currentStatus = "disconnected";
  private onMessage: MessageHandler | null = null;
  private socket: ReturnType<typeof makeWASocket> | null = null;

  constructor(
    private readonly authPath: string,
    private readonly logger?: Logger
  ) { }

  async start(onMessage: MessageHandler): Promise<void> {
    this.onMessage = onMessage;
    await this.connect();
  }

  async sendText(chatId: string, text: string): Promise<void> {
    if (!this.socket) {
      throw new Error("WhatsApp socket is not connected.");
    }
    await this.socket.sendMessage(chatId, { text });
  }

  status(): string {
    return this.currentStatus;
  }

  private async connect(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState(this.authPath);
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: "silent" }),
      markOnlineOnConnect: false
    });
    this.socket = sock;

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", async (update) => {
      const { connection } = update;
      if (connection === "open") {
        this.currentStatus = "connected";
        await this.logger?.info("WhatsApp connection opened.");
      }

      if (connection === "close") {
        this.currentStatus = "disconnected";
        await this.logger?.warn("WhatsApp connection closed. Reconnecting...");
        setTimeout(() => {
          this.connect().catch(async (err) => {
            await this.logger?.error?.(`Reconnection failed: ${err}`);
          });
        }, 2000);
      }
    });

    sock.ev.on("messages.upsert", async (event: any) => {
      if (event.type !== "notify") {
        return;
      }

      for (const message of event.messages ?? []) {
        await this.handleIncomingMessage(message);
      }
    });
  }

  private async handleIncomingMessage(message: any): Promise<void> {
    const onMessage = this.onMessage
    if (!onMessage) {
      return;
    }

    const remoteJid = message?.key?.remoteJid as string | undefined;
    const fromMe = Boolean(message?.key?.fromMe);
    if (!remoteJid || fromMe) {
      return;
    }

    // DM only for MVP.
    if (!remoteJid.endsWith("@s.whatsapp.net")) {
      return;
    }

    const text = extractText(message);
    if (!text) {
      return;
    }

    const timestamp = message?.messageTimestamp;
    const receivedAt = timestamp
      ? new Date(Number(timestamp) * 1000).toISOString()
      : new Date().toISOString();

    await onMessage({
      chatId: remoteJid,
      senderId: (message?.key?.participant as string | undefined) ?? remoteJid,
      text,
      receivedAt
    });
  }
}

function extractText(message: any): string | null {
  const root = message?.message;
  if (!root) {
    return null;
  }

  if (typeof root.conversation === "string") {
    return root.conversation.trim();
  }

  if (typeof root.extendedTextMessage?.text === "string") {
    return root.extendedTextMessage.text.trim();
  }

  if (root.ephemeralMessage?.message) {
    return extractNestedText(root.ephemeralMessage.message);
  }

  if (root.viewOnceMessageV2?.message) {
    return extractNestedText(root.viewOnceMessageV2.message);
  }

  return null;
}

function extractNestedText(nested: any): string | null {
  if (typeof nested?.conversation === "string") {
    return nested.conversation.trim();
  }
  if (typeof nested?.extendedTextMessage?.text === "string") {
    return nested.extendedTextMessage.text.trim();
  }
  return null;
}
