import { useGameStore, type Overlay } from '@/store/useGameStore';
import { useI18n } from '@/i18n';

const ITEMS: { key: 'lodge' | Exclude<Overlay, 'character' | 'evolution' | null>; label: Parameters<ReturnType<typeof useI18n>['t']>[0] }[] = [
  { key: 'lodge', label: 'lobby' },{ key: 'party', label: 'party' },{ key: 'pets', label: 'pets' },{ key: 'store', label: 'store' },{ key: 'materials', label: 'materials' },{ key: 'codex', label: 'codex' },{ key: 'constellations', label: 'constellations' },{ key: 'fishing', label: 'fishing' },{ key: 'arenaReception', label: 'arena' },{ key: 'settings', label: 'settings' },
];

export function MenuBar() {
  const { openOverlay, openLodge } = useGameStore();
  const {t}=useI18n();
  return (
    <div className="menu-bar">
      {ITEMS.map((it) => (
        <button
          key={it.key}
          className="btn btn-center small"
          onClick={() => (it.key === 'lodge' ? openLodge() : openOverlay(it.key))}
        >
          {t(it.label)}
        </button>
      ))}
    </div>
  );
}
