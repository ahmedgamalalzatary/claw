import { ConfigLoader } from "./config/loader.js";
import { Logger } from "./core/logger.js";
import { Gateway } from "./core/gateway.js";
import { GoogleAIClient } from "./integrations/ai/google-client.js";
import { BaileysClient } from "./integrations/whatsapp/baileys-client.js";
import { SessionStore } from "./storage/session-store.js";
import { SqliteStore } from "./storage/sqlite-store.js";
import { HeartbeatScheduler } from "./heartbeat/scheduler.js";

async function main(): Promise<void> {
  const configLoader = new ConfigLoader("config.json");
  const config = await configLoader.load();

  const logger = new Logger(
    config.logging.dir,
    config.logging.output.includes("console")
  );

  const gateway = new Gateway(
    config,
    new GoogleAIClient(),
    new BaileysClient(),
    new SessionStore(config.storage.sessionsDir, config.storage.memoryDir),
    new SqliteStore(config.storage.sqlitePath),
    logger
  );

  await gateway.start();

  if (config.hotReload.enabled) {
    configLoader.watch(async (next) => {
      await gateway.updateConfig(next);
    });
  }

  const heartbeat = new HeartbeatScheduler();
  if (config.heartbeat.enabled) {
    heartbeat.start(config.heartbeat.intervalMinutes, async () => {
      await logger.info("Heartbeat tick.");
    });
  }
}

main().catch((error) => {
  const reason = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Fatal: ${reason}\n`);
  process.exit(1);
});

