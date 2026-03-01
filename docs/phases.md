# Claw Gateway Phases

This file is the phase plan only.  
Implementation status is tracked in `docs/Checklist.md`.

## Phase 1: Foundation

- Initialize Node 22 + TypeScript project.
- Add dev/prod scripts (`dev`, `build`, `start`, `typecheck`).
- Create runtime folders:
- `data/whatsapp`
- `logs`
- `sessions`
- `sessions/heartbeat`
- `memory`
- `db`
- `workspace`
- Add Dockerfile + docker-compose for single-container worker deployment.
- Keep UTC runtime.

## Phase 2: Base Runtime Contract

- Gateway runs as a worker process (no HTTP admin server in MVP).
- Run 24/7 on VPS in Docker.
- Keep no OpenAI-compatible API surface for MVP.
- Keep no rate limit for single-user MVP.
- Keep no allowlist enforcement for MVP (future feature).

## Phase 3: WhatsApp Transport (Baileys)

- Use Baileys as WhatsApp transport.
- Use multi-file auth state at `data/whatsapp`.
- Enable QR terminal auth flow.
- Keep DM-only scope.
- Keep text-only scope.
- Reply to each normal incoming DM text message.
- Reconnect with exponential backoff when disconnected (e.g., 1s, 2s, 4s, 8s, max 60s).

## Phase 4: Google Provider Wiring

- Use Google model provider only for MVP.
- Read API key from `config.json` (not env for MVP).
- Read primary model from `config.json`.
- Read fallback model list from `config.json`.
- Read generation params from `config.json`:
- `temperature`
- `topP`
- `maxOutputTokens`
- Keep timeout behavior as no explicit AI timeout fail.

## Phase 5: Core MVP Message Loop

- Receive message from WhatsApp.
- Send to AI model.
- Receive model response.
- Apply minimal response formatting.
- Send response back to WhatsApp.
- Send explicit error text to WhatsApp when AI call fails after retries.
- Keep process alive after per-message AI failure.

## Phase 6: Command Routing

- Treat message as slash command only if first char is `/`.
- Any text containing ` /cmd` later in message is normal text.
- Ignore unknown slash commands.
- Implement:
- `/status` (minimal output)
- `/ping` (gateway-side response with timestamp, no AI call)
- `/new` (new session)

## Phase 7: Session and Memory Files

- Use session files as markdown (`.md`).
- Session path format (UTC): `sessions/YYYY-MM-DD/HH-mm-ss.md`.
- Keep one active session file.
- On session end, move session file to `memory/<uuid>.md`.
- Session end triggers:
- `/new`
- compaction event
- No TTL/expiry memory deletion.
- Treat `sessions/` and `memory/` as read-only for AI/tooling writes (gateway-only mutation).

## Phase 8: Persistence and Source-of-Truth Rules

- Persist inbound user message before AI call.
- Write order for inbound flow:
- session `.md` first
- SQLite second
- Persist assistant message in session and SQLite.
- Source preference:
- recent/current context from session `.md`
- fast search/history from SQLite
- One SQLite row per message with role (`user`/`assistant`/`system`).
- Restore state on restart from DB + session files.

## Phase 9: Retry and Fallback Policy

- Retry scope is AI calls only.
- Default retry plan configurable in `config.json`:
- attempts: 3
- delays: 5s, 10s, 10s
- fallback order:
- attempt 1: same model retry
- attempt 2: fallback model 1
- attempt 3: fallback model 2

## Phase 10: Logging Contract

- Log to files + console.
- Keep logs out of WhatsApp chat output.
- Use per-session log file split.
- Keep all operational logs (gateway/provider/transport/retries/errors).
- Redact API keys in logs.
- Rotate/split logs by session boundaries.

## Phase 11: Config and Hot Reload

- Use `config.json` as runtime config.
- Keep precedence contract for MVP as defaults/file-first (no env override path).
- Support hot reload scope: `config.json` only.
- Apply config updates at runtime without full process restart.

## Phase 12: Prompt Context Assembly

- Core context files live in `/workspace`:
- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `USER.md`
- `HEARTBEAT.md`
- Base prompt order:
- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `USER.md`
- `HEARTBEAT.md` or current user message
- chat context
- System prompt source is `AGENTS.md`.

## Phase 13: Heartbeat Loop

- Scheduler interval default: 30 minutes, configurable.
- Heartbeat runs as a separate no-history chat.
- Heartbeat context includes:
- `HEARTBEAT.md`
- `TOOLS.md`
- `AGENTS.md`
- `SOUL.md`
- `USER.md`
- If response equals `heartbeat ok`, send nothing to WhatsApp.
- Otherwise send output to WhatsApp.
- Persist heartbeat output under:
- `sessions/heartbeat/YYYY-MM-DD/HH-mm.md`

## Phase 14: Compaction and Long Context Control

- Track token count for full chat.
- Trigger compaction at 64k tokens.
- Compress all older history.
- Keep only 2 latest raw turns:
- last user message
- last assistant message
- Persist compaction result to SQLite.
- Persist compaction result as markdown history message.

## Phase 15: Vector Memory

- Use `sqlite-vec`.
- Index source is chat messages.
- Keep vector retrieval disabled by default.
- Enable retrieval only when explicitly triggered by bot/model action.
- Keep a memory index file as a manual/lazy memory index:
- list memory folder/file tree
- include 1-2 line summary per memory file

## Phase 16: Workspace Boundary for Tooling

- Restrict tool/file/exec actions to `/workspace` only.
- Reject paths outside `/workspace`.
- Keep this enforcement active from first tool execution release.
- Keep skills/tools behavior aligned with:
- skills as markdown guidance files
- model decides action flow based on provided skill/tool docs
- Tooling surface now:
- `exec`
- `spawn`
- Intent to integrate `node-pty` later.
- If an AI agent starts an autonomous task, it must create `workspace/todo/todo.md` and update it on each step (gateway-enforced).

## Phase 17: Checkpointing

- Every `10min`, gateway creates a copy of current `workspace/` state.
- Checkpoint artifacts are immutable and only gateway can create/manage them.

## Phase 18: Web Access Integration

- Integrate web access through Python `scrapling`.
- Provide a web-fetch MCP server.
- Start web-fetch MCP server automatically, but load its context/content only when explicitly requested by AI/model.

## Phase 19: Post-MVP Extensions

- OAuth auth path (future).
- Allowlist controls (future).
- Additional providers/models (future).
- Group chat support (future).
- Media input support (future).

## Phase 20: Testing and Delivery Quality

- Keep `vitest` as the single test framework.
- Maintain test layers:
- unit
- integration (mocked external services)
- adapter contract
- live smoke
- Keep test layout under:
- `tests/unit/**`
- `tests/integration/**`
- `tests/contract/**`
- `tests/live/**`
- Enforce CI quality gates:
- `typecheck`
- coverage gate (`>=80%` lines and branches)
- build
- Keep nightly live smoke checks in CI.
