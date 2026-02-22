# MVP Scope

## Goal

Build a personal 24/7 WhatsApp AI gateway:

`User (WhatsApp DM) -> Gateway -> Google model -> Gateway -> WhatsApp DM`

## Success Criteria

- You send a WhatsApp message.
- Gateway receives it through Baileys.
- Gateway sends context + message to the configured model.
- Gateway replies back to WhatsApp.
- Current chat history is persisted.

## In Scope

- Single user (you), DM only
- Baileys transport
- Text messages only
- Slash commands:
  - `/status`
  - `/ping`
  - `/new`
- Config-driven model selection and fallback chain
- AI retries and fallback routing
- Session file + persistent memory file + SQLite persistence
- Vector module scaffold (disabled until triggered by bot action)
- Hot-reload for `config.json`
- Dockerized deployment on VPS

## Out of Scope (MVP)

- Multi-user and allowlist system
- Group chat support
- Images/audio/doc processing
- OAuth auth flow (future)
- OpenAI API compatibility layer
- Public HTTP admin/API server

