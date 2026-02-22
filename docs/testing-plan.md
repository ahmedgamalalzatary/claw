# Testing Plan - Claw Gateway

## 1. Goals
- Add reliable automated testing for core gateway behavior.
- Prevent regressions while features are still being implemented.
- Standardize quality checks in CI before merge and before deployment.

## 2. Testing Layers
1. Unit Tests
- Scope: pure logic and isolated modules.
- Targets:
  - `src/commands/router.ts`
  - `src/commands/handlers.ts`
  - `src/tools/workspace-guard.ts`
  - `src/core/retry-policy.ts`
  - `src/prompts/context-builder.ts`
  - path/date format logic in `src/storage/session-store.ts`
  - timer behavior in `src/heartbeat/scheduler.ts`

2. Integration Tests (mocked external services)
- Scope: `Gateway` flow with fake `AIClient` and fake `WhatsAppClient`.
- Use temp filesystem for session/memory paths.
- Validate:
  - inbound message flow (`user -> gateway -> ai -> gateway -> reply`)
  - command routing (`/ping`, `/status`, `/new`)
  - retry behavior on AI failures
  - session rollover behavior
  - error handling and user notification

3. Adapter Contract Tests
- Scope: WhatsApp message parsing and filtering behavior in Baileys adapter.
- Validate extraction from:
  - `conversation`
  - `extendedTextMessage`
  - `ephemeralMessage`
  - `viewOnceMessageV2`

4. Live Smoke Tests (nightly)
- Scope: minimal real checks using secrets.
- Validate:
  - Google model call succeeds and returns non-empty text
  - WhatsApp connection can start and report healthy state

## 3. Tooling
- Test framework: `vitest`
- Coverage provider: `@vitest/coverage-v8`
- Runtime: Node `22`
- Keep one test framework only (no Jest mix).

## 4. Proposed Test Structure
- `tests/unit/**/*.test.ts`
- `tests/integration/**/*.test.ts`
- `tests/contract/**/*.test.ts`
- `tests/live/**/*.test.ts`
- `tests/helpers/**`
- `vitest.config.ts`

## 5. NPM Scripts to Add
- `test`: run all non-live tests
- `test:unit`: unit tests
- `test:integration`: integration tests
- `test:contract`: adapter contract tests
- `test:coverage`: non-live tests with coverage
- `test:live`: nightly/live smoke tests only
- `ci:check`: typecheck + coverage + build

## 6. Coverage Policy
- Enforce minimum coverage in CI:
  - Lines: `>= 70%`
  - Branches: `>= 70%`
- Raise to 80% later after baseline stability.

## 7. CI Plan (GitHub Actions)
Workflow: `.github/workflows/ci.yml`

Triggers:
- `pull_request`
- `push` to `main`

Jobs:
1. `typecheck`
- Run `npm run typecheck`

2. `test`
- Run `npm run test:coverage`
- Upload coverage artifact

3. `build`
- Run `npm run build`

Rules:
- All jobs required for merge.
- Coverage gate failure blocks merge.

## 8. Live Smoke Workflow
Workflow: `.github/workflows/live-smoke.yml`

Trigger:
- Nightly schedule (cron)

Behavior:
- Run `npm run test:live`
- Use repository/environment secrets for API key and WhatsApp auth setup.
- Alert on failure (does not block PR merges).

## 9. CD Plan
Workflow: `.github/workflows/deploy.yml`

Trigger:
- Manual (`workflow_dispatch`) from `main`

Flow:
1. Confirm CI checks passed for selected commit.
2. Deploy to VPS with Docker Compose.
3. Run post-deploy validation and fail workflow if unhealthy.

Safety:
- Use protected `production` environment with manual approval.

## 10. High-Priority Test Scenarios
1. Slash parsing is strict and case-sensitive (`/ping` valid, `/Ping` invalid).
2. Unknown slash commands are ignored.
3. `/new` rotates session and starts a new one.
4. Inbound message persistence happens before AI call.
5. AI retries follow configured attempts and delays.
6. Final AI failure sends user-facing error text.
7. Workspace guard blocks access outside workspace root.
8. Heartbeat scheduler start/stop behavior is stable.

## 11. Rollout Order
1. Add Vitest + config + baseline unit tests.
2. Add gateway integration tests with fakes.
3. Add adapter contract tests.
4. Add CI workflow and branch protection.
5. Add nightly live smoke workflow.
6. Add manual deployment workflow.
