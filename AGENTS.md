# AGENTS.md

Guidelines for AI coding agents working on the Claw Gateway codebase.

## Project Overview

Personal 24/7 WhatsApp AI gateway. Single-user, DM-only. Worker process (no HTTP server), Dockerized for VPS.

**Flow:** `WhatsApp DM → BaileysClient → Gateway → GoogleAIClient → WhatsApp DM`

## Build/Lint/Test Commands

```bash
npm run dev          # Development with hot reload (tsx watch)
npm run build        # Compile TypeScript to dist/
npm start            # Run production build from dist/
npm run typecheck    # Type check without emitting files
npm test             # Run all tests
npm run test:unit    # Run unit tests only
npm run test:integration  # Run integration tests only
npm run test:contract     # Run contract tests only
npm run test:coverage     # Run tests with coverage gate
npm run test:live         # Run live smoke tests
npm run ci:check     # Typecheck + coverage + build
# Single test file:
npx vitest run tests/unit/router.test.ts
```

Node ≥ 22 required. First run prints a QR code — scan with WhatsApp to create auth state in `data/whatsapp/`.

## Architecture

```
src/index.ts              # Entry: wires deps, starts gateway + hot-reload + heartbeat
src/core/gateway.ts       # Central coordinator — message routing, AI calls, session lifecycle
src/integrations/ai/      # AIClient interface + GoogleAIClient implementation
src/integrations/whatsapp/# WhatsAppClient interface + BaileysClient implementation
src/commands/             # router.ts (parseSlashCommand) + handlers.ts (pure string formatters)
src/storage/              # SessionStore (markdown files), SqliteStore, VectorStore
src/prompts/context-builder.ts  # Loads workspace/*.md as system-role ChatMessages
src/heartbeat/scheduler.ts      # setInterval wrapper for periodic tasks
src/tools/workspace-guard.ts    # assertWithinWorkspace — path safety for file tools
src/core/logger.ts        # Session-split file logger
src/core/retry-policy.ts  # buildRetryPlan — builds ordered model+delay array from config
```

## Critical Patterns

**Interface/implementation split** — every external integration defines a contract in `client.ts` and a concrete class separately (e.g., `AIClient`/`GoogleAIClient`, `WhatsAppClient`/`BaileysClient`). New providers must implement the interface, not extend the concrete class.

**Command handlers are pure functions** — `handlers.ts` returns plain strings; `Gateway` owns `sendText`. Never call `whatsapp.sendText` inside a handler.

**Session storage format** — chat turns appended to `sessions/YYYY-MM-DD/HH-MM-SS.md`. `/new` command calls `moveSessionToMemory()` which renames to `memory/<uuid>.md`.

**Retry/fallback chain** — `config.retries` drives model cycling in `Gateway.generateAssistantReply`: tries `primaryModel`, then each `fallbackModels[i]`, with `delaysMs[i]` between attempts.

## Code Style Guidelines

### Imports

- Use `import type { ... }` for type-only imports
- Node.js built-ins must use the `node:` prefix: `import { mkdir } from "node:fs/promises"`
- Relative imports must include `.js` extension (required for ESM with NodeNext):
  ```typescript
  import { Logger } from "./logger.js";
  import type { GatewayConfig } from "../config/types.js";
  ```
- External packages are imported without extensions
- Group imports logically: built-ins, external packages, internal modules

### TypeScript Configuration

- Target: ES2022, Module: NodeNext, ModuleResolution: NodeNext
- Strict mode is enabled
- Source files in `src/`, compiled output in `dist/`

### Types and Interfaces

- Use `interface` for object shapes and contracts
- Use `type` for union types, utility types, and simple aliases
- Export all types and interfaces from their defining modules
- Prefer explicit return types on public functions
- Use `readonly` for immutable class properties

### Naming Conventions

- **Classes/Interfaces/Types**: PascalCase (e.g., `Gateway`, `GatewayConfig`)
- **Variables/Functions/Methods**: camelCase (e.g., `sessionPath`, `buildSessionPath`)
- **Files**: kebab-case (e.g., `google-client.ts`, `session-store.ts`)
- **Private class members**: prefix with `private`, use `readonly` for injected dependencies

### Class Structure

```typescript
export class Gateway {
  private readonly bootAt = Date.now();

  constructor(
    private config: GatewayConfig,
    private readonly ai: AIClient,
    private readonly logger: Logger
  ) {}

  async start(): Promise<void> {
    // Implementation
  }
}
```

### Error Handling

- Use try-catch blocks for operations that may fail
- Check `error instanceof Error` before accessing error properties
- Include stack trace when logging errors: `error.stack ?? error.message`
- Throw new Error with descriptive messages for validation failures

```typescript
try {
  await this.ai.complete(input, model, params);
} catch (error) {
  const errorDetails = error instanceof Error
    ? error.stack ?? error.message
    : JSON.stringify(error);
  await this.logger.error(`Failed: ${errorDetails}`);
}
```

### Async Patterns

- Use `async/await` for all asynchronous operations
- Return `Promise<void>` for async functions without return values
- Use `void` keyword to explicitly ignore promise results: `void this.connect()`

### Formatting

- 2-space indentation
- No trailing commas in function parameters or object literals
- Prefer template literals for string interpolation
- No semicolons (project style preference)

### Comments

- Avoid inline comments except for non-obvious logic explanations
- No commented-out code in production files
- JSDoc comments only for public APIs that need documentation

### Testing

- Use Vitest with `describe`, `it`, `expect` pattern
- Test files mirror src structure: `tests/unit/router.test.ts` tests `src/commands/router.ts`
- No semicolons in test files either

### Dependency Injection

Classes receive dependencies through constructor parameters. This enables testing with mock implementations.

### Configuration

- Configuration is loaded from `config.json` via `ConfigLoader`
- Hot-reload is supported via file watching
- Schema validation uses Zod

### Logging

Use the Logger class for all logging. It supports INFO, WARN, and ERROR levels with file and console output.

```typescript
await this.logger.info("Gateway started.");
await this.logger.warn("Connection lost. Reconnecting...");
await this.logger.error(`Failed to process: ${error.message}`);
```
