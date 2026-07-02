import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { playAchievementSfx } from '@/audio/notificationSfx';
import { emitNotification, subscribeNotifications } from './notificationBus';
import { NotificationQueue } from './notificationQueue';
import type { GameNotification, NotificationPayload } from './types';

interface NotificationContextValue {
  notify: (payload: NotificationPayload) => string;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const toastQueue = useRef(new NotificationQueue({ maxSize: 18, dedupeWindowMs: 1200 }));
  const achievementQueue = useRef(new NotificationQueue({ maxSize: 8, dedupeWindowMs: 2200 }));
  const [activeToast, setActiveToast] = useState<GameNotification | null>(null);
  const [activeAchievement, setActiveAchievement] = useState<GameNotification | null>(null);
  const [toastTick, setToastTick] = useState(0);
  const [achievementTick, setAchievementTick] = useState(0);

  useEffect(() => subscribeNotifications((notification) => {
    if (notification.channel === 'achievement') {
      if (achievementQueue.current.enqueue(notification)) setAchievementTick((tick) => tick + 1);
      return;
    }
    if (toastQueue.current.enqueue(notification)) setToastTick((tick) => tick + 1);
  }), []);

  useEffect(() => {
    if (activeToast) return;
    const next = toastQueue.current.next();
    if (!next) return;
    setActiveToast(next);
  }, [activeToast, toastTick]);

  useEffect(() => {
    if (!activeToast) return undefined;
    const timeout = window.setTimeout(() => {
      setActiveToast(null);
      setToastTick((tick) => tick + 1);
    }, activeToast.durationMs);
    return () => window.clearTimeout(timeout);
  }, [activeToast]);

  useEffect(() => {
    if (activeAchievement) return;
    const next = achievementQueue.current.next();
    if (!next) return;
    setActiveAchievement(next);
    playAchievementSfx();
  }, [activeAchievement, achievementTick]);

  useEffect(() => {
    if (!activeAchievement) return undefined;
    const timeout = window.setTimeout(() => {
      setActiveAchievement(null);
      setAchievementTick((tick) => tick + 1);
    }, activeAchievement.durationMs);
    return () => window.clearTimeout(timeout);
  }, [activeAchievement]);

  const notify = useCallback((payload: NotificationPayload) => emitNotification(payload), []);
  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationManager toast={activeToast} achievement={activeAchievement} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
}

function NotificationManager({ toast, achievement }: { toast: GameNotification | null; achievement: GameNotification | null }) {
  return (
    <div className="notification-layer" aria-live="polite" aria-atomic="false">
      <div className="notification-toast-zone">
        {toast && <ToastNotification key={toast.id} notification={toast} />}
      </div>
      {achievement && <AchievementNotification key={achievement.id} notification={achievement} />}
    </div>
  );
}

function ToastNotification({ notification }: { notification: GameNotification }) {
  return (
    <article className={`notification-toast notification-rarity-${notification.rarity} notification-type-${notification.type}`}>
      <span className="notification-toast__icon">{notification.icon}</span>
      <div>
        <strong>{notification.title}</strong>
        {notification.message && <p>{notification.message}</p>}
      </div>
    </article>
  );
}

function AchievementNotification({ notification }: { notification: GameNotification }) {
  return (
    <article className={`notification-achievement notification-rarity-${notification.rarity}`}>
      <i className="notification-achievement__spark notification-achievement__spark--one" />
      <i className="notification-achievement__spark notification-achievement__spark--two" />
      <span>{notification.icon}</span>
      <div>
        <small>{notification.title}</small>
        {notification.message && <strong>{notification.message}</strong>}
      </div>
      <b />
    </article>
  );
}
