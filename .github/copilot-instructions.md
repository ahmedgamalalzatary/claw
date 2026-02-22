# Copilot Instructions — Claw Gateway

Personal 24/7 WhatsApp AI gateway. Single-user, DM-only. Worker process (no HTTP server), Dockerized for VPS.

**Flow:** `WhatsApp DM → BaileysClient → Gateway → GoogleAIClient → WhatsApp DM`

## Architecture

```
src/index.ts              # Entry: wires all deps, starts gateway + hot-reload + heartbeat
src/core/gateway.ts       # Central coordinator — message routing, AI calls, session lifecycle
src/integrations/ai/      # AIClient interface + GoogleAIClient implementation
src/integrations/whatsapp/# WhatsAppClient interface + BaileysClient implementation
src/commands/             # router.ts (parseSlashCommand) + handlers.ts (pure string formatters)
src/storage/              # SessionStore (markdown files), SqliteStore (stub), VectorStore (stub)
src/prompts/context-builder.ts  # Loads workspace/*.md as system-role ChatMessages
src/heartbeat/scheduler.ts      # setInterval wrapper; fires callback every intervalMinutes
src/tools/workspace-guard.ts    # assertWithinWorkspace — path safety for any file/exec tool
src/core/logger.ts        # Session-split file logger; log file named by session ID
src/core/retry-policy.ts  # buildRetryPlan — builds ordered model+delay array from config
```

## Critical Patterns

**Interface/implementation split** — every external integration defines a contract in `client.ts` and a concrete class separately (e.g., `AIClient`/`GoogleAIClient`, `WhatsAppClient`/`BaileysClient`). New providers must implement the interface, not extend the concrete class.

**ESM with `.js` import extensions** — `"type": "module"` and `"moduleResolution": "NodeNext"`. All internal imports use `.js` even for `.ts` source files:
```ts
import { Logger } from "./logger.js"; // correct
import { Logger } from "./logger";    // breaks at runtime
```

**Command handlers are pure functions** — `handlers.ts` returns plain strings; `Gateway` owns `sendText`. Never call `whatsapp.sendText` inside a handler.

**Session storage format** — chat turns appended to `sessions/YYYY-MM-DD/HH-MM-SS.md`. `/new` command calls `moveSessionToMemory()` which renames the file to `memory/<uuid>.md`. Logs live in `logs/<sessionId>.log`.

**Workspace context files** — `workspace/AGENTS.md`, `SOUL.md`, `TOOLS.md`, `USER.md` are loaded as `system`-role messages via `buildBaseContext()`. `HEARTBEAT.md` is added for heartbeat-triggered flows. Edit these to change the AI persona.

**Retry/fallback chain** — `config.retries` drives model cycling in `Gateway.generateAssistantReply`: tries `primaryModel`, then each `fallbackModels[i]`, with `delaysMs[i]` between attempts. Only AI calls retry; WhatsApp reconnects loop forever independently.

**Hot-reload** — `ConfigLoader.watch()` uses `node:fs` watch on `config.json`. `Gateway.updateConfig()` accepts the new config live; only provider/retry config is effectively swapped.

## Developer Workflows

```bash
npm run dev        # tsx watch — live-reloads TS, prints QR on first WhatsApp auth
npm run typecheck  # tsc --noEmit, no build output
npm run build      # tsc → dist/
npm start          # node dist/index.js (production)
```

Node ≥ 22 required. First run prints a QR code in the terminal — scan with WhatsApp to create auth state in `data/whatsapp/`.

Docker: `docker-compose up --build` for VPS deployment (see `docker-compose.yml`).

## Stubs to Implement

- `SqliteStore` — `connect()`, `saveMessage()`, `status()` are no-ops; `better-sqlite3` is installed.
- `VectorStore` — scaffold only; `sqlite-vec` is installed but not wired.
- `buildBaseContext()` / context injection into `Gateway.generateAssistantReply()` — context builder exists but is not yet called from the gateway.

## Config Contract

`config.json` is the single source of truth — see `src/config/types.ts` for the full typed shape and `docs/config.md` for annotated example. Key fields: `provider.apiKey`, `provider.primaryModel`, `provider.fallbackModels`, `whatsapp.authPath`.
