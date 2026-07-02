import type { GameNotification, NotificationPayload } from './types';

type NotificationListener = (notification: GameNotification) => void;

const listeners = new Set<NotificationListener>();

function defaultIcon(type: NotificationPayload['type']) {
  switch (type) {
    case 'success':
      return '✓';
    case 'reward':
      return '✦';
    case 'level':
      return '★';
    case 'item':
      return '◆';
    case 'story':
      return '✧';
    case 'quest':
      return '!';
    case 'achievement':
      return '◇';
    default:
      return '•';
  }
}

export function createNotification(payload: NotificationPayload): GameNotification {
  const channel = payload.channel ?? (payload.type === 'achievement' ? 'achievement' : 'toast');
  const title = payload.title.trim();
  const message = payload.message?.trim() ?? '';
  const dedupeKey = payload.dedupeKey ?? `${channel}:${payload.type}:${title}:${message}`;

  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    type: payload.type,
    title,
    message,
    icon: payload.icon ?? defaultIcon(payload.type),
    rarity: payload.rarity ?? 'common',
    channel,
    durationMs: payload.durationMs ?? (channel === 'achievement' ? 4600 : 3000),
    dedupeKey,
  };
}

export function emitNotification(payload: NotificationPayload) {
  const notification = createNotification(payload);
  listeners.forEach((listener) => listener(notification));
  return notification.id;
}

export function subscribeNotifications(listener: NotificationListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
