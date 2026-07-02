import type { GameNotification } from './types';

interface QueueOptions {
  maxSize?: number;
  dedupeWindowMs?: number;
}

export class NotificationQueue {
  private items: GameNotification[] = [];
  private recent = new Map<string, number>();
  private readonly maxSize: number;
  private readonly dedupeWindowMs: number;

  constructor(options: QueueOptions = {}) {
    this.maxSize = options.maxSize ?? 12;
    this.dedupeWindowMs = options.dedupeWindowMs ?? 1400;
  }

  enqueue(notification: GameNotification, now = Date.now()): boolean {
    this.prune(now);
    const recentAt = this.recent.get(notification.dedupeKey);
    if (recentAt && now - recentAt < this.dedupeWindowMs) return false;
    if (this.items.some((item) => item.dedupeKey === notification.dedupeKey)) return false;

    this.items.push(notification);
    this.recent.set(notification.dedupeKey, now);
    if (this.items.length > this.maxSize) {
      this.items = this.items.slice(this.items.length - this.maxSize);
    }
    return true;
  }

  next(): GameNotification | null {
    return this.items.shift() ?? null;
  }

  size(): number {
    return this.items.length;
  }

  clear() {
    this.items = [];
    this.recent.clear();
  }

  private prune(now: number) {
    for (const [key, timestamp] of this.recent.entries()) {
      if (now - timestamp >= this.dedupeWindowMs) this.recent.delete(key);
    }
  }
}
