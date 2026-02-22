import { readFile } from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import type { GatewayConfig } from "./types.js";

export class ConfigLoader {
  private readonly configPath: string;
  private current: GatewayConfig | null = null;

  constructor(configPath = "config.json") {
    this.configPath = path.resolve(configPath);
  }

  async load(): Promise<GatewayConfig> {
    const raw = await readFile(this.configPath, "utf8");
    const parsed = JSON.parse(raw) as GatewayConfig;
    this.current = parsed;
    return parsed;
  }

  getCurrent(): GatewayConfig {
    if (!this.current) {
      throw new Error("Config has not been loaded yet.");
    }
    return this.current;
  }

  watch(onReload: (next: GatewayConfig) => Promise<void> | void): void {
    watch(this.configPath, async (eventType) => {
      if (eventType !== "change") {
        return;
      }

      try {
        const nextConfig = await this.load();
        await onReload(nextConfig);
      } catch {
        // Keep old config if reload fails.
      }
    });
  }
}

