import { useGameStore } from '@/store/useGameStore';

const ITEMS: { key: 'party' | 'store' | 'materials' | 'codex' | 'settings'; label: string }[] = [
  { key: 'party', label: 'パーティ' },
  { key: 'store', label: 'ストア' },
  { key: 'materials', label: '素材' },
  { key: 'codex', label: '図鑑' },
  { key: 'settings', label: '設定' },
];

export function MenuBar() {
  const openOverlay = useGameStore((s) => s.openOverlay);
  return (
    <div className="row" style={{ gap: 6, padding: '8px 12px', borderTop: '2px solid var(--border)' }}>
      {ITEMS.map((it) => (
        <button key={it.key} className="btn btn-center small" onClick={() => openOverlay(it.key)}>
          {it.label}
        </button>
      ))}
    </div>
  );
}
