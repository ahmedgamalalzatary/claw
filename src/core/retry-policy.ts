import type { ProviderConfig } from "../config/types.js";

export interface RetryAttempt {
  model: string;
  delayMs: number;
}

export interface RetryPolicyOverrides {
  maxAttempts?: number;
  delaysMs?: number[];
}

export const DEFAULT_MAX_ATTEMPTS = 3
export const DEFAULT_DELAYS_MS = [5000, 10000, 10000] as const

export function buildRetryPlan(
  provider: ProviderConfig,
  overrides: RetryPolicyOverrides = {}
): RetryAttempt[] {
  const maxAttempts = Math.max(1, overrides.maxAttempts ?? DEFAULT_MAX_ATTEMPTS)
  const configuredDelays = overrides.delaysMs ?? [...DEFAULT_DELAYS_MS]
  const delays = configuredDelays.length > 0 ? configuredDelays : [0]
  const modelChain = [provider.primaryModel, ...provider.fallbackModels]

  return Array.from({ length: maxAttempts }, (_, idx) => ({
    model: modelChain[Math.min(idx, modelChain.length - 1)] as string,
    delayMs: Math.max(0, delays[Math.min(idx, delays.length - 1)] ?? 0)
  }))
}
