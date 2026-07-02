import { describe, expect, it } from 'vitest';
import { createNotification } from './notificationBus';
import { NotificationQueue } from './notificationQueue';

describe('NotificationQueue', () => {
  it('queues notifications in order', () => {
    const queue = new NotificationQueue();
    const first = createNotification({ type: 'reward', title: 'Gold +120', dedupeKey: 'gold' });
    const second = createNotification({ type: 'level', title: 'Level Up!', dedupeKey: 'level' });

    expect(queue.enqueue(first, 1000)).toBe(true);
    expect(queue.enqueue(second, 1001)).toBe(true);
    expect(queue.next()?.id).toBe(first.id);
    expect(queue.next()?.id).toBe(second.id);
    expect(queue.next()).toBeNull();
  });

  it('prevents duplicates inside the dedupe window', () => {
    const queue = new NotificationQueue({ dedupeWindowMs: 1000 });
    const first = createNotification({ type: 'reward', title: 'Gold +120', dedupeKey: 'gold' });
    const duplicate = createNotification({ type: 'reward', title: 'Gold +120', dedupeKey: 'gold' });
    const later = createNotification({ type: 'reward', title: 'Gold +120', dedupeKey: 'gold' });

    expect(queue.enqueue(first, 1000)).toBe(true);
    expect(queue.enqueue(duplicate, 1200)).toBe(false);
    queue.next();
    expect(queue.enqueue(later, 2100)).toBe(true);
  });

  it('caps queue length to protect performance during notification storms', () => {
    const queue = new NotificationQueue({ maxSize: 2 });
    queue.enqueue(createNotification({ type: 'reward', title: 'One', dedupeKey: 'one' }), 1);
    queue.enqueue(createNotification({ type: 'reward', title: 'Two', dedupeKey: 'two' }), 2);
    queue.enqueue(createNotification({ type: 'reward', title: 'Three', dedupeKey: 'three' }), 3);

    expect(queue.size()).toBe(2);
    expect(queue.next()?.title).toBe('Two');
    expect(queue.next()?.title).toBe('Three');
  });
});
