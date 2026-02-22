import type { GatewayConfig } from "../config/types.js";

export interface RetryAttempt {
  model: string;
  delayMs: number;
}

export function buildRetryPlan(config: GatewayConfig): RetryAttempt[] {
  const delays = config.retries.delaysMs;
  const models = [config.provider.primaryModel, ...config.provider.fallbackModels];

  return models.slice(0, config.retries.maxRetries).map((model, idx) => ({
    model,
    delayMs: delays[idx] ?? 0
  }));
}

