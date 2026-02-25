# Claw Gateway - Exhaustive Codebase Manifest

## 1. Deep Reasoning Chain

This architecture is governed by strict dependency inversion and isolation. The `Gateway` (core) never directly touches network sockets or HTTP clients; it operates entirely against abstract contracts (`AIClient`, `WhatsAppClient`). Storage is bifurcated: Markdown files serve as the immutable, human-readable source of truth for chat sessions, while SQLite acts purely as a fast relational indexer. This ensures data resilience. Configuration is dynamically hot-reloaded, and fallbacks are aggressively managed via `retry-policy.ts` to guarantee high availability in a headless Dockerized environment.

## 2. Project Directory Tree

```text
.
├── .agents/
│   └── King-Mode/Skill.md
├── .github/
│   ├── copilot-instructions.md
│   └── workflows/
│       ├── ci.yml
│       ├── deploy.yml
│       └── live-smoke.yml
├── docs/
│   ├── Checklist.md
│   ├── Features.md
│   ├── phases.md
│   └── summarization.md
├── scripts/
│   ├── count-lines.ps1
│   └── count-lines.sh
│
├── src/
│   ├── commands/
│   │   ├── handlers.ts
│   │   └── router.ts
│   ├── config/
│   │   ├── loader.ts
│   │   └── types.ts
│   ├── core/
│   │   ├── gateway.ts
│   │   ├── logger.ts
│   │   └── retry-policy.ts
│   ├── heartbeat/
│   │   └── scheduler.ts
│   ├── integrations/
│   │   ├── ai/
│   │   │   ├── client.ts
│   │   │   └── google-client.ts
│   │   └── whatsapp/
│   │       ├── baileys-client.ts
│   │       └── client.ts
│   ├── prompts/
│   │   └── context-builder.ts
│   ├── storage/
│   │   ├── heartbeat-store.ts
│   │   ├── session-store.ts
│   │   ├── sqlite-store.ts
│   │   └── vector-store.ts
│   ├── tools/
│   │   ├── errors.ts
│   │   └── workspace-guard.ts
│   ├── types/
│   │   └── chat.ts
│   └── index.ts
├── tests/
│   ├── contract/
│   │   └── baileys-parser.test.ts
│   ├── helpers/
│   │   └── temp-dir.ts
│   ├── integration/
│   │   └── gateway.test.ts
│   ├── live/
│   │   └── google-live.test.ts
│   └── unit/
│       ├── config-loader.test.ts
│       ├── context-builder.test.ts
│       ├── handlers.test.ts
│       ├── heartbeat-scheduler.test.ts
│       ├── heartbeat-store.test.ts
│       ├── logger.test.ts
│       ├── retry-policy.test.ts
│       ├── router.test.ts
│       ├── session-store.test.ts
│       ├── sqlite-store.test.ts
│       ├── vector-store.test.ts
│       └── workspace-guard.test.ts
├── workspace/
│   ├── Memory/.gitkeep
│   ├── AGENTS.md
│   ├── HEARTBEAT.md
│   ├── SOUL.md
│   ├── TOOLS.md
│   └── USER.md
├── .dockerignore
├── .gitignore
├── AGENTS.md
├── Dockerfile
├── README.md
├── config.json
├── docker-compose.yml
├── package-lock.json
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── vitest.live.config.ts
```

## 3. Comprehensive File Manifest

### Root Configuration & Infrastructure
*   **.dockerignore**: Optimizes Docker build context by excluding local node_modules, logs, and state directories.
*   **.gitignore**: Prevents git from tracking local runtime state, secrets, and build artifacts.
*   **Dockerfile**: Multi-stage build instructions for the Node 22 Alpine production container.
*   **docker-compose.yml**: Orchestrates the local/VPS gateway service, handling volume mounts and environment variables.
*   **package.json / package-lock.json**: Defines NPM dependencies, versions, and execution scripts (`dev`, `build`, `test`, `typecheck`).
*   **tsconfig.json**: TypeScript compiler configuration enforcing strict mode, ES2022 targets, and NodeNext resolution.
*   **vitest.config.ts**: Test runner configuration defining coverage thresholds and excluding live tests.
*   **vitest.live.config.ts**: Isolated test runner configuration exclusively for live API smoke tests.
*   **config.json**: The central, hot-reloadable runtime configuration (API keys, models, system flags).
*   **README.md**: Developer onboarding documentation, Docker run commands, and CLI documentation.
*   **AGENTS.md**: Top-level guidelines for AI coding agents regarding project architecture and build commands.

### .github/ (CI/CD)
*   **copilot-instructions.md**: Custom prompts to guide GitHub Copilot's inline generation logic.
*   **workflows/ci.yml**: CI pipeline enforcing typechecks, unit tests, and coverage thresholds on PRs/main.
*   **workflows/deploy.yml**: CD pipeline executing SSH-based deployment and Docker rebuilds on the remote VPS.
*   **workflows/live-smoke.yml**: Nightly scheduled workflow running live API connectivity checks.

### docs/ (Documentation)
*   **Checklist.md**: Tracks implementation status across defined project phases.
*   **Features.md**: Exhaustive functional specification of the Gateway, mapping both MVP and future capabilities.
*   **phases.md**: Strategic rollout plan defining chronological development goals.

### scripts/ (Automation)
*   **count-lines.sh**: Bash utility to calculate lines of source code, ignoring build artifacts.
*   **count-lines.ps1**: PowerShell equivalent for source code line counting.
### workspace/ (AI Context Prompts)
*   **AGENTS.md**: Defines the system prompt persona and core AI capabilities.
*   **HEARTBEAT.md**: Context instructions specifically injected during automated background heartbeat triggers.
*   **SOUL.md**: Dictates the personality, tone, and long-term behavioral constraints of the bot.
*   **TOOLS.md**: Explains available tools and constraints to the AI model.
*   **USER.md**: A durable state file maintaining user profiles, preferences, and long-term facts.
*   **Memory/.gitkeep**: Retains the empty user memory directory in version control.

### src/ (Application Core)
*   **index.ts**: Application bootstrapper. Instantiates all classes, starts the gateway, config watchers, and heartbeat.
*   **core/gateway.ts**: Central orchestrator. Manages message routing, AI generation, retries, and coordinates storage calls.
*   **core/logger.ts**: Session-aware logging utility writing formatted output to files and stdout.
*   **core/retry-policy.ts**: Pure logic utility translating config.json retry delays into an ordered fallback execution plan.
*   **config/loader.ts**: Reads and parses `config.json`, wrapping `fs.watch` to support live hot-reloads without restart.
*   **config/types.ts**: TypeScript interfaces mapping exactly to the JSON configuration schema.
*   **integrations/ai/client.ts**: Interface defining the required contract for any LLM provider (`complete` method).
*   **integrations/ai/google-client.ts**: Concrete Google Gemini API implementation of the `AIClient` contract.
*   **integrations/whatsapp/client.ts**: Interface defining the required contract for a WhatsApp transport.
*   **integrations/whatsapp/baileys-client.ts**: Concrete implementation handling QR pairing, socket reconnections, and DM filtering via `@whiskeysockets/baileys`.
*   **storage/heartbeat-store.ts**: Writes isolated heartbeat output to dedicated Markdown logs.
*   **storage/session-store.ts**: Manages the core Markdown file database, appending chat turns and rotating active sessions to memory.
*   **storage/sqlite-store.ts**: Maintains the relational index. Maps chat IDs to session paths and stores message metadata for fast search.
*   **storage/vector-store.ts**: Architectural scaffold reserved for future `sqlite-vec` driven similarity search.
*   **commands/router.ts**: Parses inbound message text to identify registered slash commands.
*   **commands/handlers.ts**: Pure formatters returning text responses for system commands (e.g., `/ping`, `/status`).
*   **heartbeat/scheduler.ts**: Manages the `setInterval` loop that triggers periodic background tasks.
*   **prompts/context-builder.ts**: Ingests and concatenates the `workspace/*.md` files to form the final AI system prompt.
*   **tools/errors.ts**: Type-guard utilities for identifying specific Node.js operational errors (e.g., `ENOENT`).
*   **tools/workspace-guard.ts**: Path traversal protection module ensuring file operations cannot escape the workspace root.
*   **types/chat.ts**: Domain data structures (`ChatMessage`, `IncomingWhatsAppMessage`, `ChatRole`).

### tests/ (Test Suite)
*   **helpers/temp-dir.ts**: Utility for spinning up and tearing down isolated file structures during test runs.
*   **contract/baileys-parser.test.ts**: Verifies the adapter correctly extracts text from complex WhatsApp message payloads.
*   **integration/gateway.test.ts**: Validates the core message loop, routing, and fallbacks using mocked clients.
*   **live/google-live.test.ts**: Smoke test asserting actual network connectivity to Google's API.
*   **unit/*.test.ts**: 12 isolated test files covering every core utility, config loader, pure command handler, and local storage adapter to ensure perfect unit integrity.
