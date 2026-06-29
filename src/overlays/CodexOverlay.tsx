import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { CODEX, getCharacter, getEnemy, getWorld } from '@/data';
import type { CodexEntry, CodexType } from '@/types';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';

const TABS: { type: CodexType; label: string }[] = [
  { type: 'world', label: '作品' },
  { type: 'story', label: '断片' },
  { type: 'character', label: '仲間' },
  { type: 'enemy', label: '魔物' },
];

export function CodexOverlay() {
  const { save, closeOverlay } = useGameStore();
  const [tab, setTab] = useState<CodexType>('world');
  if (!save) return null;

  const isDiscovered = (entry: CodexEntry): boolean => {
    switch (entry.type) {
      case 'world':
        return save.progress.unlockedWorldIds.includes(entry.refId);
      case 'enemy':
        return save.codex.discoveredIds.includes(entry.id);
      case 'character':
        return save.party.some(
          (p) => getCharacter(p.characterId).worldId === getCharacter(entry.refId).worldId,
        );
      case 'story':
        return save.codex.discoveredIds.includes(entry.id);
      default:
        return false;
    }
  };

  const titleOf = (entry: CodexEntry): string => {
    if (entry.type === 'world') return getWorld(entry.refId).title;
    if (entry.type === 'story') return `物語の断片: ${getWorld(entry.refId).title}`;
    if (entry.type === 'enemy') return getEnemy(entry.refId).name;
    return getCharacter(entry.refId).name;
  };

  const entries = Object.values(CODEX).filter((e) => e.type === tab);
  const discoveredCount = entries.filter(isDiscovered).length;

  return (
    <Window title="図鑑 — Bibliotheca" className="col">
      <div className="row" style={{ gap: 6 }}>
        {TABS.map((t) => (
          <button
            key={t.type}
            className="btn btn-center small"
            style={tab === t.type ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}
            onClick={() => setTab(t.type)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="tiny dim center">
        収集 {discoveredCount}/{entries.length}
      </div>

      <div className="col" style={{ gap: 10 }}>
        {entries.map((e) => {
          const found = isDiscovered(e);
          return (
            <div key={e.id} className="col" style={{ gap: 2 }}>
              <div className={found ? 'accent small' : 'dim small'}>{found ? titleOf(e) : '？？？'}</div>
              <div className="tiny dim" style={{ lineHeight: 1.6 }}>
                {found ? e.loreText : '― まだ発見していない ―'}
              </div>
            </div>
          );
        })}
      </div>

      <Button center onClick={closeOverlay}>
        とじる
      </Button>
    </Window>
  );
}
