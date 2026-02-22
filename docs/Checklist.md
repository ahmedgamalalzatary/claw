# Claw Gateway Checklist

Only implemented items are checked.

## Phase 1: Foundation

- [x] Node 22 + TypeScript project.
- [x] Dev/prod scripts (`dev`, `build`, `start`, `typecheck`).
- [x] Runtime folder structure exists (`data`, `logs`, `sessions`, `memory`, `db`, `workspace`).
- [x] Dockerfile + docker-compose baseline.
- [x] UTC runtime env in compose.

## Phase 2: Base Runtime Contract

- [x] Worker process shape (no HTTP admin server).
- [x] Single-container runtime model.
- [x] No OpenAI-compatible API surface in MVP code.
- [x] No rate limit behavior implemented.
- [x] No allowlist behavior implemented.

## Phase 3: WhatsApp Transport (Baileys)

- [x] Baileys integration exists.
- [x] Multi-file auth state at `data/whatsapp`.
- [x] QR auth in terminal.
- [x] DM-only message handling.
- [x] Text-only handling path.
- [x] Reply path for normal inbound messages.
- [x] Infinite reconnect behavior.

## Phase 4: Google Provider Wiring

- [x] Google provider client integrated.
- [x] API key read from `config.json`.
- [x] Primary model read from config.
- [x] Fallback models read from config.
- [x] Generation params (`temperature`, `topP`, `maxOutputTokens`) read from config.
- [x] No explicit AI timeout policy in code.

## Phase 5: Core MVP Message Loop

- [x] Receive WhatsApp message in gateway.
- [x] Send prompt to AI model.
- [x] Receive model response.
- [x] Minimal response formatting.
- [x] Send response back to WhatsApp.
- [x] Send explicit error text when AI flow fails.
- [x] Keep process alive after per-message AI failure.

## Phase 6: Command Routing

- [x] Slash command parsed only when text starts with `/`.
- [x] Message containing slash later treated as normal message.
- [x] Unknown slash commands ignored.
- [x] `/status` command implemented.
- [x] `/ping` command implemented with no AI call.
- [x] `/new` command implemented.
- [ ] `/ping` currently reports boot-time delta instead of strict per-request latency.

## Phase 7: Session and Memory Files

- [x] Session files use markdown.
- [x] Session path format `sessions/YYYY-MM-DD/HH-mm-ss.md` (UTC).
- [x] User messages appended to active session file.
- [x] Assistant messages appended to active session file.
- [x] Session moved to `memory/<uuid>.md` on `/new`.
- [ ] Session moved to memory on compaction trigger.
- [x] No TTL/expiry deletion behavior implemented.

## Phase 8: Persistence and Source-of-Truth Rules

- [x] Inbound user message write happens before AI call.
- [x] Inbound write order in gateway code is session then SQLite call.
- [ ] Real SQLite persistence implemented.
- [ ] One DB row per message with role (`user`/`assistant`/`system`).
- [ ] Assistant message persisted even if WhatsApp send fails.
- [ ] Source preference enforcement (session-first, SQLite for search/history) in runtime read path.
- [ ] State restore from DB + session on restart.

## Phase 9: Retry and Fallback Policy

- [x] Retry scope is AI calls only.
- [x] Retry count from config is used.
- [x] Retry delays from config are used.
- [x] Primary + fallback model chain exists.
- [ ] Exact required order (same-model retry first, then fallback1, then fallback2).
- [x] No explicit AI timeout failure cutoff.

## Phase 10: Logging Contract

- [x] File logging.
- [x] Console logging.
- [x] Per-session log file split.
- [x] Gateway operational logs exist.
- [ ] Full all-module operational logging coverage.
- [ ] API key redaction in log pipeline.
- [x] Logs are not posted into WhatsApp chat flow.

## Phase 11: Config and Hot Reload

- [x] `config.json` is runtime config source.
- [x] Hot reload watcher exists for `config.json`.
- [x] Gateway config object updates at runtime.
- [ ] Runtime-wide module reconfiguration after reload.
- [ ] Explicit defaults precedence contract implementation.

## Phase 12: Prompt Context Assembly

- [x] `/workspace/AGENTS.md` exists.
- [x] `/workspace/SOUL.md` exists.
- [x] `/workspace/TOOLS.md` exists.
- [x] `/workspace/USER.md` exists.
- [x] `/workspace/HEARTBEAT.md` exists.
- [ ] Core context files injected in live AI calls.
- [ ] Prompt order enforced:
- [ ] `AGENTS -> SOUL -> TOOLS -> USER -> HEARTBEAT/message -> chat context`.
- [ ] System prompt behavior explicitly sourced from `AGENTS.md`.

## Phase 13: Heartbeat Loop

- [x] Scheduler module exists.
- [x] Interval is config-driven.
- [ ] Heartbeat runs as separate no-history chat.
- [ ] Heartbeat context includes `HEARTBEAT + TOOLS + AGENTS + SOUL + USER`.
- [ ] `heartbeat ok` suppression rule.
- [ ] Non-`heartbeat ok` output sent to WhatsApp.
- [ ] Heartbeat output stored at `sessions/heartbeat/YYYY-MM-DD/HH-mm.md`.

## Phase 14: Compaction and Long Context

- [ ] Token counting implemented.
- [ ] Compaction trigger at 60k tokens.
- [ ] Compress old history while keeping last user + assistant raw turns.
- [ ] Persist compaction summary to SQLite.
- [ ] Persist compaction summary to markdown history message.

## Phase 15: Vector Memory

- [x] `sqlite-vec` dependency present.
- [x] Vector config scaffold in `config.json`.
- [ ] Real vector index over chat messages.
- [ ] Retrieval path implementation.
- [ ] Retrieval gated by explicit bot/model trigger.

## Phase 16: Workspace Boundary for Tooling

- [x] Workspace guard helper exists.
- [ ] Enforcement wired through tool/file/exec runtime flows.
- [ ] Hard runtime rejection for out-of-workspace operations in tool stack.
- [ ] Skill/tool execution flow that updates `USER.md` via model actions.

## Phase 17: Post-MVP Extensions

- [ ] OAuth auth.
- [ ] Allowlist controls.
- [ ] Additional providers/models.
- [ ] Group chat support.
- [ ] Media input support.
