# Project Structure

## Runtime Layout

```text
/
├─ config.json
├─ logs/
│  └─ <session-id>.log
├─ data/
│  └─ whatsapp/
├─ sessions/
│  ├─ YYYY-MM-DD/
│  │  └─ HH-mm-ss.md
│  └─ heartbeat/
│     └─ YYYY-MM-DD/
│        └─ HH-mm.md
├─ memory/
│  └─ <uuid>.md
├─ workspace/
│  ├─ AGENTS.md
│  ├─ SOUL.md
│  ├─ TOOLS.md
│  ├─ USER.md
│  └─ HEARTBEAT.md
└─ db/
   └─ <sqlite file path from config>
```

## Rules

- `workspace/` is the only allowed working directory for tool/file exec access.
- A normal chat session is stored in one `.md` file under `sessions/YYYY-MM-DD/HH-mm-ss.md` (UTC).
- On session end (`/new` or compaction), the session file is moved to `memory/` and renamed to `<uuid>.md`.
- Heartbeat outputs are stored separately under `sessions/heartbeat/YYYY-MM-DD/HH-mm.md`.
- Logs are split per session.
- Persistent Docker volumes must include at least:
  - `data/`
  - `logs/`
  - `sessions/`
  - `memory/`
  - `db/`

