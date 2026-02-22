# AGENTS.md

Guidelines for AI coding agents working on the Claw Gateway codebase.

## Project Overview

Claw Gateway is a personal WhatsApp AI gateway that connects WhatsApp messages to Google's Generative AI. It uses Baileys for WhatsApp integration and supports hot-reloadable configuration.

## Build/Lint/Test Commands

```bash
npm run dev          # Development with hot reload (tsx watch)
npm run build        # Compile TypeScript to dist/
npm start            # Run production build from dist/
npm run typecheck    # Type check without emitting files
```

**No test framework or linter is currently configured.** When adding tests, update this section with test commands including how to run a single test file.

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
- **Constants**: camelCase at module level, UPPER_CASE only for true constants if needed

### Class Structure

```typescript
export class Gateway {
  private readonly bootAt = Date.now();
  private sessionPath = "";

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
- Provide meaningful error messages and log them appropriately
- Throw new Error with descriptive messages for validation failures

```typescript
try {
  await this.ai.complete(input, model, params);
} catch (error) {
  const messageText = error instanceof Error ? error.message : "unknown error";
  await this.logger.error(`Failed: ${messageText}`);
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

### File Organization

```
src/
├── index.ts              # Application entry point
├── config/               # Configuration loading and types
├── core/                 # Core business logic (Gateway, Logger)
├── integrations/         # External service clients (AI, WhatsApp)
│   ├── ai/
│   └── whatsapp/
├── storage/              # Data persistence (SQLite, sessions)
├── commands/             # Slash command handling
├── prompts/              # Context building for AI
├── heartbeat/            # Periodic task scheduling
├── tools/                # Utility functions
└── types/                # Shared type definitions
```

### Dependency Injection

Classes receive dependencies through constructor parameters. This enables testing with mock implementations.

```typescript
const gateway = new Gateway(
  config,
  new GoogleAIClient(config.provider.apiKey),
  new BaileysClient(config.whatsapp.authPath, logger),
  new SessionStore(config.storage.sessionsDir, config.storage.memoryDir),
  logger
);
```

### Configuration

- Configuration is loaded from `config.json` via `ConfigLoader`
- Hot-reload is supported via file watching
- Schema validation should use Zod (available in dependencies)

### Logging

Use the Logger class for all logging. It supports INFO, WARN, and ERROR levels with file and console output.

```typescript
await this.logger.info("Gateway started.");
await this.logger.warn("Connection lost. Reconnecting...");
await this.logger.error(`Failed to process: ${error.message}`);
```

### WhatsApp Integration Notes

- Uses Baileys library for WhatsApp Web protocol
- QR code is printed to terminal on first connection
- Auth state is persisted in `data/whatsapp/`
- Only direct messages are processed for MVP (not groups)
