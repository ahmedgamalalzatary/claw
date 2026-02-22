# Claw Gateway

Personal WhatsApp AI gateway using Baileys (WhatsApp Web) and Google Generative AI.

## What It Does

- Connects to WhatsApp using QR auth
- Receives direct messages (DM only) and replies with AI-generated text
- Supports slash commands: `/status`, `/ping`, `/new`
- Persists runtime data on disk (`data`, `sessions`, `memory`, `db`, `logs`)
- Supports config hot reload from `config.json`

## Requirements

- Node.js `22+` 
- Docker + Docker Compose 
- A Google Generative AI API key or any other provider
- A seperate phone number for WhatsApp for QR pairing

## Quick Start (Docker)

1. Start Docker Desktop (or Docker Engine) and confirm daemon is running.
2. Edit `config.json`:
   - Set `provider.apiKey`
   - Set `provider.primaryModel`
   - Optionally set `provider.fallbackModels`
3. Build and start the gateway:
   - `docker compose up -d --build`
4. Open logs and wait for QR:
   - `docker compose logs -f gateway`
5. Scan the QR code from WhatsApp on your phone.
6. Confirm the bot is connected and test by sending a DM.

Auth credentials are persisted at `data/whatsapp`, so you should not need to scan QR again after normal restarts.

## Docker Runtime Commands

- Start: `docker compose up -d`
- Build + start: `docker compose up -d --build`
- Restart service: `docker compose restart gateway`
- Show status: `docker compose ps`
- Tail logs: `docker compose logs -f gateway`
- Stop: `docker compose stop`
- Remove containers/network: `docker compose down`

## Updating Config While Running (Docker)

1. Edit `config.json` on host.
2. Apply update:
   - `docker compose restart gateway`
3. If code or Dockerfile changed:
   - `docker compose up -d --build`

`config.json` is mounted read-only into container at `/app/config.json`.

## Local Development

1. Install dependencies:
   - `npm install`
2. Edit `config.json` with your key/model values.
3. Run dev mode:
   - `npm run dev`
4. Or run production mode:
   - `npm run build`
   - `npm start`

## NPM Commands

- `npm run dev` - run with hot reload (`tsx watch`)
- `npm run build` - compile TypeScript to `dist/`
- `npm start` - run compiled app from `dist/`
- `npm run typecheck` - type check without emitting

## Configuration Notes

- Main config file: `config.json`
- WhatsApp auth path (default): `data/whatsapp`
- Runtime folders:
  - `data/`
  - `logs/`
  - `sessions/`
  - `memory/`
  - `db/`
  - `workspace/`

## Project Layout

```text
src/
  config/
  core/
  integrations/
    ai/
    whatsapp/
  storage/
  commands/
  prompts/
  heartbeat/
  tools/
  types/
```

## Troubleshooting

- Docker build fails with daemon/pipe error:
  - Start Docker Desktop, then retry `docker compose up -d --build`
- QR not appearing:
  - Check logs: `docker compose logs -f gateway`
  - Ensure you are on first auth or clear old auth data only if you need to re-pair
- Config changes not applied:
  - Restart service: `docker compose restart gateway`
