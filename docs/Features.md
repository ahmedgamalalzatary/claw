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
- Compaction at `32k` tokens.
- Compaction output should use structured sections.
- After compaction, keep latest 2 raw messages (last user + last assistant).
- Persist compaction output to DB + markdown history.

## Vector Memory

- Use `sqlite-vec`.
- Index source: chat messages.
- Disabled by default.
- Retrieval only when explicitly triggered by bot/model action.
- Future intent: add user-triggered retrieval command support.
- Retrieval params/topK can be model-driven.

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

## Heartbeat

- Default interval `30min`, configurable in `config.json`.
- Heartbeat does not require cron for MVP; default behavior is in-app periodic scheduling while gateway is running.
- Optional advanced mode: users may run heartbeat via `systemd timer`/cron for stricter wall-clock scheduling and host-level reliability.
- Heartbeat runs as new/no-history chat.
- Heartbeat context includes ` TOOLS + AGENTS + SOUL + USER`.
- If AI returns `heartbeat ok`, send nothing.
- Otherwise send heartbeat output to WhatsApp.
- If heartbeat processing fails, notify user and log the failure.
- Store heartbeat output in `sessions/heartbeat/YYYY-MM-DD/HH-mm.md`.
- Heartbeat status detection: treat an exact normalized response of `heartbeat ok` as success; any other non-empty output is forwarded to WhatsApp.

## Reliability

- AI retries enabled.
- DB write retries enabled.
- Max retries `3` (configurable).
- Delay sequence: `5s`, `10s`, `10s`.
- Fallback sequence: same model retry, then fallback model 1, then fallback model 2.
- Fallback attempts must use the exact same prompt/context.
- No explicit AI timeout cutoff.
- On final AI failure: send error text to user and keep process alive.
- If DB write still fails after retries, notify user.
- On WhatsApp disconnect: reconnect forever.
- Process messages in parallel; strict sequential processing is not required.
- Out-of-order replies during bursts are acceptable.
- Use message-id deduplication to avoid processing duplicate inbound events.

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
- For worker-only MVP, Docker health checks should rely on process/container status, not an HTTP `/health` endpoint.
- Support both dev and production commands.
- Hot-reload scope: `config.json` only.

## MVP Success Definition

- WhatsApp message -> gateway -> AI -> gateway -> WhatsApp reply.
- No tool-calling required for MVP.
