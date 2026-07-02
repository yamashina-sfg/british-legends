export type NotificationChannel = 'toast' | 'achievement';

export type NotificationType =
  | 'success'
  | 'reward'
  | 'level'
  | 'item'
  | 'story'
  | 'quest'
  | 'system'
  | 'achievement';

export type NotificationRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message?: string;
  icon?: string;
  rarity?: NotificationRarity;
  channel?: NotificationChannel;
  durationMs?: number;
  dedupeKey?: string;
}

export interface GameNotification extends Required<Omit<NotificationPayload, 'message' | 'icon' | 'rarity' | 'dedupeKey'>> {
  id: string;
  createdAt: number;
  message: string;
  icon: string;
  rarity: NotificationRarity;
  dedupeKey: string;
}
