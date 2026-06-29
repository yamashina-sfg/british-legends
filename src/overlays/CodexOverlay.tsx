import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { CODEX, getCharacter, getEnemy, getWorld } from '@/data';
import { CORE_WORLD_IDS, CORE_WORLD_META, LONG_TERM_FOUNDATIONS, type CoreWorldId } from '@/data/literaryProgress';
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
  const allEntries = Object.values(CODEX);
  const allDiscoveredCount = allEntries.filter(isDiscovered).length;
  const totalRate = Math.round((allDiscoveredCount / Math.max(allEntries.length, 1)) * 100);
  const coreRestored = CORE_WORLD_IDS.filter((id) => save.progress.clearedWorldIds.includes(id)).length;

  const worldRate = (worldId: CoreWorldId) => {
    const related = allEntries.filter((entry) => entry.refId === worldId || getEntryWorldId(entry) === worldId);
    const found = related.filter(isDiscovered).length;
    return Math.round((found / Math.max(related.length, 1)) * 100);
  };

  const pixelClass = (entry: CodexEntry) => {
    if (entry.type === 'world' || entry.type === 'story') return `codex-pixel codex-pixel--${entry.refId}`;
    if (entry.type === 'character') return `codex-pixel codex-pixel--${getCharacter(entry.refId).worldId}`;
    if (entry.type === 'enemy') return `codex-pixel codex-pixel--${getEnemy(entry.refId).worldId}`;
    return 'codex-pixel';
  };

  return (
    <Window title="図鑑 — Bibliotheca" className="codex-collection">
      <div className="codex-summary">
        <div>
          <span>ARCHIVE RESTORED</span>
          <strong>{totalRate}%</strong>
        </div>
        <div>
          <span>CORE STORIES</span>
          <strong>{coreRestored}/3</strong>
        </div>
        <div>
          <span>DISCOVERED</span>
          <strong>{allDiscoveredCount}/{allEntries.length}</strong>
        </div>
      </div>

      <div className="codex-achievements">
        {LONG_TERM_FOUNDATIONS.map((foundation, index) => (
          <span key={foundation.id} className={index < Math.max(1, coreRestored) ? 'is-awake' : ''} title={foundation.description}>
            {foundation.label}
          </span>
        ))}
      </div>

      <div className="codex-tabs">
        {TABS.map((t) => (
          <button
            key={t.type}
            className={tab === t.type ? 'is-active' : ''}
            onClick={() => setTab(t.type)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="codex-count">
        収集 {discoveredCount}/{entries.length}
      </div>

      <div className="codex-collection-grid">
        {entries.map((e) => {
          const found = isDiscovered(e);
          const worldId = getEntryWorldId(e);
          const meta = worldId && CORE_WORLD_IDS.includes(worldId as CoreWorldId)
            ? CORE_WORLD_META[worldId as CoreWorldId]
            : null;
          return (
            <div key={e.id} className={found ? 'codex-card is-found' : 'codex-card'}>
              <i className={found ? pixelClass(e) : 'codex-pixel codex-pixel--locked'} />
              <div>
                <div className="codex-card__title">{found ? titleOf(e) : '？？？'}</div>
                {found && meta && (
                  <div className="codex-card__meta">
                    <span>{meta.theme}</span>
                    <span>{meta.year}</span>
                    <span>{meta.period}</span>
                    {e.type === 'world' && <span>解放率 {worldRate(e.refId as CoreWorldId)}%</span>}
                  </div>
                )}
                <p>{found ? e.loreText : 'まだ発見していない。作品を修復し、仲間と戦い、断片を集めると余白が埋まる。'}</p>
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

function getEntryWorldId(entry: CodexEntry): string | null {
  if (entry.type === 'world' || entry.type === 'story') return entry.refId;
  if (entry.type === 'character') return getCharacter(entry.refId).worldId;
  if (entry.type === 'enemy') return getEnemy(entry.refId).worldId;
  return null;
}
