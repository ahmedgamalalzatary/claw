# Claw Gateway Features

This file captures all features discussed in this chat (MVP and non-MVP).

## Core Product

- `user -> gateway -> ai` architecture.
- Personal gateway for your own WhatsApp usage.
- Priorities: performance, modular ecosystem, memory usage, logging, retrying.
- Gateway should be extensible (providers, models, commands, skills, tools).

## User/Channel Scope

- WhatsApp transport via `Baileys`.
- 24/7 online assistant.
- Reply to all inbound DMs.
- Group support is out of MVP scope (DM-only for current implementation).
- Group behavior configuration is future scope.
- Text only for MVP.
- Non-text formats are future scope.
- No rate limits for now.
- Single-user behavior now (owner usage).
- Allowlist numbers are future scope and should be editable in `config.json`.

## Provider/Model

- Google model provider for MVP.
- API key from `config.json` (not env for now).
- Primary model from config.
- Fallback models from config.
- Generation params configurable (`temperature`, `topP`, `maxOutputTokens`).
- User decides model/cost tradeoff.
- No OpenAI-compatible API for now.
- OAuth is a future feature.

## Command System

- Slash command only if message starts with `/`.
- Text containing `/...` later is normal message.
- Slash commands are case-sensitive (`/ping` valid, `/Ping` invalid).
- Unknown slash commands ignored.
- `/status` returns: uptime, active model, active session id.
- `/ping` returns gateway latency + UTC timestamp, no AI call.
- `/new` starts a brand-new chat/session with a new session id and resets session context.
- `/new` must notify the user whether session creation succeeded.
- `/stop` and tool-calling are out of MVP scope.

## Session/Memory/Persistence

- Core files: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `USER.md`, `HEARTBEAT.md`.
- Session files in `sessions/` as `.md`.
- Session filename format in UTC: `sessions/YYYY-MM-DD/HH-mm-ss.md`.
- One active session file per session.
- On session end, move to `memory/<id>.md`.
- Memory id format is UTC compact timestamp `YYYYMMDDHHmmss` (example: `20260223151450.md`).
- Session end triggers: `/new` and compaction.
- No memory expiry.
- Inbound write order: session `.md` first, then SQLite.
- SQLite acts as the indexer.
- Markdown files are the canonical long-text storage.
- Avoid storing large text blobs in SQLite.
- SQLite should store references (file path and line/position metadata) to markdown content.
- Persist inbound message before AI call.
- Persist assistant output even if WhatsApp send fails.
- Source preference: recent from session file, search/history from SQLite.
- Restore state from DB + session files.
- Compaction at `64k` tokens.
- Compaction output should use structured sections.
- After compaction, keep latest 2 raw messages (last user + last assistant).
- Persist compaction output to DB + markdown history.
- `sessions/` and `memory/` are gateway-managed read-only areas for AI/tooling (AI cannot create/update/delete there).
- Checkpoint feature: every `10min`, gateway copies the current `workspace/` state to an immutable checkpoint artifact.
- Checkpoint artifacts are auto-managed by gateway only (not user/AI managed).

## Search and Retrieval (Two-Layer Design)

Storage reads use two complementary search layers:

- **SQL search (SQLite)**: fast, structured, keyword/date queries. Used for exact matches, recent history, and metadata lookups (e.g., "last 20 messages", "messages from March 1st", `WHERE content LIKE '%keyword%'`). Cheap, instant, local. Serves as the default search path.
- **Vector search (sqlite-vec)**: slower, semantic, meaning-based. Used for finding contextually similar messages even when exact keywords don't match (e.g., "that trip we talked about" finds messages about "travel plans to Cairo"). Requires embedding generation. Gated by explicit bot/model trigger.

SQL search is the foundation; vector search layers on top for complex/semantic retrieval. Both read from the same underlying message data.

## Vector Memory

- Use `sqlite-vec`.
- Index source: chat messages.
- Disabled by default.
- Retrieval only when explicitly triggered by bot/model action.
- Future intent: add user-triggered retrieval command support.
- Retrieval params/topK can be model-driven.
- Memory index file role: lightweight/manual memory index. ( lazyway for searching instead of vector search) It lists folder/file structure under `memory/` and gives each memory file a 1-2 line summary for manual lookup by the model/tooling.

## Prompt/Workspace Files

- Working boundary is `/workspace`.
- File actions (read/write/create/edit) are restricted to `/workspace`.
- System command execution is allowed, but file modifications must stay inside `/workspace`.
- Core files: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `USER.md`, `HEARTBEAT.md`.
- System prompt source is `AGENTS.md`.
- Context assembly order (normal user messages): `AGENTS -> SOUL -> TOOLS -> USER -> chat context`.
- Context assembly order (heartbeat): `AGENTS -> SOUL -> TOOLS -> USER -> HEARTBEAT -> heartbeat message`.
- Skills concept discussed as markdown skill files (`.agent/[skill]/Skill.md` style).
- AI updating files via tools is part of the intended design path.
- Autonomous task runs must create `workspace/todo/todo.md` and update it on each task step (gateway-enforced).
- Task complexity self-assessment: AI evaluates task complexity. Tasks above low-mid complexity require creating `workspace/todo/todo.md`. Todos can be rewritten (updated), checked off, or deleted (file removed). Rule is defined in `AGENTS.md` CORE:LOCK section.

### Workspace File Protection (CORE:LOCK)

Workspace files (e.g., `AGENTS.md`, `TOOLS.md`) contain both owner-defined rules and AI-editable sections. Section markers control what the AI can and cannot modify:
- `<!-- CORE:LOCK -->` ... `<!-- /CORE:LOCK -->`: Owner-defined content. Immutable to AI.
- `<!-- AI:OPEN -->` ... `<!-- /AI:OPEN -->`: AI-editable content. AI can read, write, and update freely.
- AI reads the entire file for full context but can only write within `AI:OPEN` blocks.
- Owner can edit anything (both sections) directly — not constrained by markers.

Protection is enforced through three layers:
- **Layer 1 — Prompt-level (soft)**: `AGENTS.md` instructs the AI to never modify `CORE:LOCK` sections. Handles 99% of cases through instruction following.
- **Layer 2 — File write tool (hard)**: Gateway extracts `CORE:LOCK` content before and after a file write. If locked content changed, the write is rejected.
- **Layer 3 — Post-execution revert (safety net)**: At startup, gateway hashes and caches all `CORE:LOCK` sections. After any tool execution (`exec`, `spawn`, file write), gateway re-hashes and compares. If a hash changed, the locked section is auto-restored from cache and the tamper is logged. This catches indirect writes via shell commands that bypass the file write tool.

Layer 3 is revert-based (not prevention-based) because raw `exec` cannot be fully intercepted at the code level — any shell command variant can touch files. Revert catches all methods regardless of how the write was performed.

## Heartbeat

- Default interval `30min`, configurable in `config.json`.
- Heartbeat does not require cron for MVP; default behavior is in-app periodic scheduling while gateway is running.
- Optional advanced mode: users may run heartbeat via `systemd timer`/cron for stricter wall-clock scheduling and host-level reliability.
- Heartbeat runs as new/no-history chat.
- Heartbeat context includes `HEARTBEAT + TOOLS + AGENTS + SOUL + USER`.
- If AI returns `heartbeat ok`, send nothing.
- Otherwise send heartbeat output to WhatsApp.
- If heartbeat processing fails, notify user and log the failure.
- Store heartbeat output in `sessions/heartbeat/YYYY-MM-DD/HH-mm.md`.
- Heartbeat status detection: treat an exact normalized response of `heartbeat ok` as success; any other non-empty output is forwarded to WhatsApp.

## Reliability

- AI retries enabled.
- DB write retries enabled.
- Max retries `3` (internal defaults, not user-configurable in `config.json` for now).
- Delay sequence: `5s`, `10s`, `10s`.
- Fallback sequence: same model retry, then fallback model 1, then fallback model 2.
- Fallback attempts must use the exact same prompt/context.
- No explicit AI timeout cutoff.
- On final AI failure: send rich error details to user via WhatsApp and keep process alive.
- Rich error message includes: models tried in order, specific error type/message, and suggestion (e.g., "wait and retry"). No redaction — single-user, full transparency.
- No API key validation at startup. If the key is bad, the first message will fail with a rich error explaining what went wrong.
- If DB write still fails after retries, notify user.
- On WhatsApp disconnect: reconnect forever.
- Process messages in parallel; strict sequential processing is not required.
- Out-of-order replies during bursts are acceptable.
- Use message-id deduplication to avoid processing duplicate inbound events.
- Dedup lives in Gateway (not transport layer). Gateway is the central coordinator — all messages pass through it.
- Implementation: in-memory `Set<string>` of recent message IDs in Gateway. Skip if already seen.

## Logging

- “All logs” intent for operations.
- Logs should not be sent into WhatsApp chat.
- Output target: files + console.
- Split/rotate by session boundary.
- Log retention is forever.
- No automatic redaction.

## Infra/Runtime

- TypeScript + Node `22` + `npm`.
- Docker deployment on VPS.
- MVP preference: single container.
- Pure worker process for MVP.
- For worker-only MVP, Docker health checks use a file-based health signal (no HTTP `/health` endpoint).
- Gateway writes a timestamp to `data/health` periodically. Docker healthcheck reads the file age to determine if the process is alive and functional.
- Support both dev and production commands.
- Hot-reload scope: `config.json` only.
- Tooling surface for now: `exec` and `spawn` (with intent to add `node-pty` later).
- Web integration is two-layer:
  - **Layer 1 (default)**: Node.js built-in `fetch()` + readability parser for simple page reads. Zero extra dependencies, same process.
  - **Layer 2 (advanced)**: Python `scrapling` + web-fetch MCP server for JS-rendered pages and anti-bot bypass scenarios.
- Web-fetch MCP server is started automatically, but its context/content is only loaded into AI context when explicitly requested.

## Testing and CI

- Test framework: `vitest` only (no Jest mix).
- Test layers:
  - Unit tests for pure/isolated modules.
  - Integration tests for gateway flow with mocked AI/WhatsApp clients.
  - Adapter contract tests for Baileys parsing/filtering.
  - Live smoke tests (nightly) for real provider/connectivity checks.
- Test structure:
  - `tests/unit/**/*.test.ts`
  - `tests/integration/**/*.test.ts`
  - `tests/contract/**/*.test.ts`
  - `tests/live/**/*.test.ts`
  - `tests/helpers/**`
- CI checks must include typecheck, coverage gate, and build.
- Coverage gate target: lines `>=80%`, branches `>=80%`.

## MVP Success Definition

- WhatsApp message -> gateway -> AI -> gateway -> WhatsApp reply.
- No tool-calling required for MVP.
