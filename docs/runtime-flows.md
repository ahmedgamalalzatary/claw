# Runtime Flows

## Normal Message Flow

1. Receive DM text via Baileys.
2. If message starts with `/`, route to slash-command handler.
3. Else treat as normal user message.
4. Append user message to session `.md`.
5. Persist user message row to SQLite.
6. Build AI context from core workspace files + session context.
7. Call model with retry/fallback policy.
8. On success:
   - Send assistant response to WhatsApp.
   - Persist assistant response to session `.md` and SQLite.
9. On final failure after retries:
   - Send error message (API/log error text) to WhatsApp.
   - Keep process alive.

## Slash Commands

Slash detection rule:

- Command only if first character is `/`.
- Any message containing `/` later in text is not a command.

Commands:

- `/status`: minimal status output
  - `uptime`
  - `current model`
  - `fallback count`
  - `db status`
  - `whatsapp status`
- `/ping`: immediate gateway latency + UTC timestamp (no AI call)
- `/new`: close active session and start a new one

Unknown slash commands:

- Ignored (no response).

## AI Retry and Fallback

- AI retry scope: AI calls only
- Max retries: `3`
- Retry delays:
  - retry 1: `5s`
  - retry 2: `10s`
  - retry 3: `10s`
- Routing order:
  - retry on same model first
  - then fallback model 1
  - then fallback model 2
- No AI timeout fail limit configured for MVP.

## WhatsApp Connection Flow

- If disconnected, reconnect with infinite retries.
- Do not terminate process due to transport disconnect.

## Heartbeat Flow

1. Run on schedule (`30m` default, editable in config).
2. Start a new heartbeat chat context (no normal chat history).
3. Send these files as context:
   - `workspace/HEARTBEAT.md`
   - `workspace/TOOLS.md`
   - `workspace/AGENTS.md`
   - `workspace/SOUL.md`
   - `workspace/USER.md`
4. If AI response is exactly `heartbeat ok`, send nothing to WhatsApp.
5. Otherwise:
   - send output to WhatsApp
   - store heartbeat output at `sessions/heartbeat/YYYY-MM-DD/HH-mm.md`

