import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
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

  const dismissToast = useCallback(() => {
    setActiveToast(null);
    setToastTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    if (activeToast || activeAchievement) return;

    const nextAchievement = achievementQueue.current.next();
    if (nextAchievement) {
      setActiveAchievement(nextAchievement);
      playAchievementSfx();
      return;
    }

    const nextToast = toastQueue.current.next();
    if (nextToast) setActiveToast(nextToast);
  }, [activeAchievement, activeToast, achievementTick, toastTick]);

  const dismissAchievement = useCallback(() => {
    setActiveAchievement(null);
    setAchievementTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    if (!activeToast) return undefined;
    const timeout = window.setTimeout(dismissToast, Math.min(activeToast.durationMs, 2200));
    return () => window.clearTimeout(timeout);
  }, [activeToast, dismissToast]);

  useEffect(() => {
    if (!activeAchievement) return undefined;
    const timeout = window.setTimeout(dismissAchievement, Math.min(activeAchievement.durationMs, 2600));
    return () => window.clearTimeout(timeout);
  }, [activeAchievement, dismissAchievement]);

  const notify = useCallback((payload: NotificationPayload) => emitNotification(payload), []);
  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationManager
        toast={activeToast}
        achievement={activeAchievement}
        onDismissToast={dismissToast}
        onDismissAchievement={dismissAchievement}
      />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
}

function NotificationManager({
  toast,
  achievement,
  onDismissToast,
  onDismissAchievement,
}: {
  toast: GameNotification | null;
  achievement: GameNotification | null;
  onDismissToast: () => void;
  onDismissAchievement: () => void;
}) {
  return (
    <div className="notification-layer" aria-live="polite" aria-atomic="false">
      <div className="notification-telop-zone">
        {toast && <TelopNotification key={toast.id} notification={toast} onDismiss={onDismissToast} />}
      </div>
      {achievement && (
        <AchievementNotification
          key={achievement.id}
          notification={achievement}
          onDismiss={onDismissAchievement}
        />
      )}
    </div>
  );
}

function telopLabel(notification: GameNotification) {
  if (notification.title.includes('討伐')) return 'VANQUISHED';
  if (notification.type === 'level') return 'LEVEL UP';
  if (notification.type === 'item') return 'ITEM GET';
  if (notification.type === 'reward') return 'REWARD';
  if (notification.type === 'story') return 'STORY PIECE';
  if (notification.type === 'quest') return 'QUEST';
  if (notification.type === 'success') return 'SUCCESS';
  return 'NOTICE';
}

function dismissOnKeyboard(event: KeyboardEvent<HTMLElement>, onDismiss: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onDismiss();
}

function TelopNotification({ notification, onDismiss }: { notification: GameNotification; onDismiss: () => void }) {
  const messageLines = notification.message.split('\n').filter(Boolean);

  return (
    <article
      className={`notification-telop notification-rarity-${notification.rarity} notification-type-${notification.type}`}
      role="button"
      tabIndex={0}
      aria-label={`${notification.title}。タップして閉じる`}
      onClick={onDismiss}
      onKeyDown={(event) => dismissOnKeyboard(event, onDismiss)}
    >
      <i className="notification-telop__flash" />
      <i className="notification-telop__spark notification-telop__spark--one" />
      <i className="notification-telop__spark notification-telop__spark--two" />
      <span className="notification-telop__icon">{notification.icon}</span>
      <div className="notification-telop__copy">
        <small>{telopLabel(notification)}</small>
        <strong>{notification.title}</strong>
        {messageLines.length > 0 && (
          <p>
            {messageLines.map((line) => <span key={line}>{line}</span>)}
          </p>
        )}
      </div>
      <b className="notification-telop__trail" />
      <em className="notification-dismiss-hint">タップで閉じる</em>
    </article>
  );
}

function AchievementNotification({ notification, onDismiss }: { notification: GameNotification; onDismiss: () => void }) {
  return (
    <article
      className={`notification-achievement notification-rarity-${notification.rarity}`}
      role="button"
      tabIndex={0}
      aria-label={`${notification.title}。タップして閉じる`}
      onClick={onDismiss}
      onKeyDown={(event) => dismissOnKeyboard(event, onDismiss)}
    >
      <i className="notification-achievement__spark notification-achievement__spark--one" />
      <i className="notification-achievement__spark notification-achievement__spark--two" />
      <span>{notification.icon}</span>
      <div>
        <small>{notification.title}</small>
        {notification.message && <strong>{notification.message}</strong>}
      </div>
      <b />
      <em className="notification-dismiss-hint">タップで閉じる</em>
    </article>
  );
}
