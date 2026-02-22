export class HeartbeatScheduler {
  private timer: NodeJS.Timeout | null = null;

  start(intervalMinutes: number, run: () => Promise<void> | void): void {
    this.stop();
    const intervalMs = intervalMinutes * 60 * 1000;
    this.timer = setInterval(() => {
      void run();
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

