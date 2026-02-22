import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";

type LogLevel = "INFO" | "WARN" | "ERROR";

export class Logger {
  private readonly logDir: string;
  private readonly toConsole: boolean;
  private sessionId = "bootstrap";

  constructor(logDir: string, toConsole: boolean) {
    this.logDir = logDir;
    this.toConsole = toConsole;
  }

  async setSession(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
    await mkdir(this.logDir, { recursive: true });
  }

  async info(message: string): Promise<void> {
    await this.write("INFO", message);
  }

  async warn(message: string): Promise<void> {
    await this.write("WARN", message);
  }

  async error(message: string): Promise<void> {
    await this.write("ERROR", message);
  }

  private async write(level: LogLevel, message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level}] ${message}\n`;
    const filePath = path.join(this.logDir, `${this.sessionId}.log`);

    await mkdir(this.logDir, { recursive: true });
    await appendFile(filePath, line, "utf8");

    if (this.toConsole) {
      process.stdout.write(line);
    }
  }
}

