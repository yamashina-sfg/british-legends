import { useGameStore } from '@/store/useGameStore';
import { getObjective } from '@/engine/objective';

interface Props {
  /** コンパクト表示（サイドバー用） */
  compact?: boolean;
}

/** 全画面共通の「現在の目的」表示。セーブ状態から自動導出する。 */
export function ObjectiveBanner({ compact }: Props) {
  const save = useGameStore((s) => s.save);
  if (!save) return null;
  const obj = getObjective(save);

  return (
    <div className={`objective-banner ${compact ? 'objective-banner--compact' : 'rpg-window'} ${obj.underleveled ? 'is-warning' : ''}`}>
      <span className="objective-banner__tag">現在の目的</span>
      <strong className="objective-banner__label">{obj.label}</strong>
      <small className="objective-banner__detail">{obj.detail}</small>
    </div>
  );
}
