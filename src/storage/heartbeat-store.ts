import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";

export class HeartbeatStore {
  constructor(private readonly baseDir: string) {}

  buildPath(date = new Date()): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    const h = String(date.getUTCHours()).padStart(2, "0");
    const min = String(date.getUTCMinutes()).padStart(2, "0");
    return path.join(this.baseDir, "heartbeat", `${y}-${m}-${d}`, `${h}-${min}.md`);
  }

  async append(pathname: string, content: string): Promise<void> {
    await mkdir(path.dirname(pathname), { recursive: true });
    await appendFile(pathname, `${content}\n`, "utf8");
  }
}

