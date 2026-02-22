# Memory and Persistence

## Memory Types

- Session memory (active chat)
  - Stored as one markdown file per session
  - Path format: `sessions/YYYY-MM-DD/HH-mm-ss.md` (UTC)
- Persistent memory
  - Session file moved to `memory/` and renamed to `<uuid>.md`
  - Triggered when session ends

## Session End Triggers

- `/new` command
- Context compaction event

## Write and Read Order

- Write order for inbound messages:
  1. Append to session `.md`
  2. Persist to SQLite
- Read preference:
  - Recent/current context from session `.md`
  - Fast search/history from SQLite

## Chat Compaction

- Trigger when full chat reaches `60k` tokens.
- Compaction result:
  - Compress all existing messages.
  - Keep only the latest 2 raw messages:
    - last user message
    - last assistant message
- Persist compaction output to:
  - SQLite
  - new history markdown record

## Vector Retrieval (Scaffold)

- Engine: `sqlite-vec`
- Source: chat messages
- Activation: only when bot/model action explicitly triggers retrieval
- Not active by default in MVP

