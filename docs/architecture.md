# Architecture

## Components

- WhatsApp Transport
  - Baileys client
  - DM-only message intake
- Gateway Core
  - Message classifier (slash vs normal text)
  - Prompt/context assembly
  - AI request executor with retries/fallbacks
  - Response sender
  - Session lifecycle manager
- Storage Layer
  - Session markdown files (`sessions/`)
  - Persistent memory markdown files (`memory/`)
  - SQLite (chat records + retrieval support)
  - `sqlite-vec` scaffold for vector retrieval
- Scheduler
  - Heartbeat trigger every `intervalMinutes`
- Logging
  - Session-split logs
  - Console + file output
  - API key redaction

## Prompt Sources

For each new session, context sources are loaded in this order:

1. `workspace/AGENTS.md`
2. `workspace/SOUL.md`
3. `workspace/TOOLS.md`
4. `workspace/USER.md`
5. `workspace/HEARTBEAT.md` (heartbeat flow only) or current user message
6. Chat context

## Access Boundary

- File/exec tool access is restricted to `workspace/` only.
- No unrestricted container-wide file operations for tool execution.

## Runtime Model

- Worker process (no admin HTTP server for MVP).
- Docker container for 24/7 VPS runtime.
- Process should continue running after per-message AI failure.
- WhatsApp disconnect handling should retry forever.

