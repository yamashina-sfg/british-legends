import { useGameStore, type Overlay } from '@/store/useGameStore';

const ITEMS: { key: 'lodge' | Exclude<Overlay, 'character' | 'evolution' | null>; label: string }[] = [
  { key: 'lodge', label: 'ロビー' },
  { key: 'party', label: 'パーティ' },
  { key: 'store', label: 'ストア' },
  { key: 'materials', label: '素材' },
  { key: 'codex', label: '図鑑' },
  { key: 'settings', label: '設定' },
];

export function MenuBar() {
  const { openOverlay, openLodge } = useGameStore();
  return (
    <div className="menu-bar">
      {ITEMS.map((it) => (
        <button
          key={it.key}
          className="btn btn-center small"
          onClick={() => (it.key === 'lodge' ? openLodge() : openOverlay(it.key))}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
