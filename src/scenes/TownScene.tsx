import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { MenuBar } from '@/components/common/MenuBar';
import { CODEX } from '@/data';

const HINTS = [
  '司書: 旅で見つけた素材は、机の上で進化の力に変えられます。',
  '司書: 世界を修復するたび、この部屋にも失われた物語の光が戻ります。',
  '司書: 不安になったら、ベッドで休んでから再びポータルへ向かいなさい。',
];

export function TownScene() {
  const { save, healParty, goWorldMap, openOverlay } = useGameStore();
  const [message, setMessage] = useState(HINTS[0]);
  if (!save) return null;
  const rank = Math.min(save.progress.clearedWorldIds.length, 3);
  const tiles = Array.from({ length: 120 });
  const discoveredEntries = save.codex.discoveredIds
    .map((id) => CODEX[id])
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const totalCodexEntries = Object.keys(CODEX).length;
  const bookshelfSlots = 24;
  const filledBookCount = Math.round((discoveredEntries.length / totalCodexEntries) * bookshelfSlots);

  return (
    <>
      <div className={`lodge-room lodge-rank-${rank} fade-in`}>
        <div className="lodge-room__wall" />
        <div className="lodge-room__floor">{tiles.map((_, index) => <i key={index} />)}</div>
        <i className="lodge-room__ceiling-beam" />
        <i className="lodge-room__window"><b /><b /></i>
        <i className="lodge-room__curtain lodge-room__curtain--left" />
        <i className="lodge-room__curtain lodge-room__curtain--right" />
        <i className="lodge-room__rug" />
        <header className="lodge-room__title"><span>BIBLIOTHECA LODGE</span><strong>帰還の間</strong><b>修復した世界 {save.progress.clearedWorldIds.length}</b></header>
        <div className="lodge-room__hero"><i /><span>YOU</span></div>

        <button className="lodge-object lodge-object--bed" onClick={() => { healParty(); setMessage('ベッドで休んだ。仲間のHPとMPが全回復した。'); }}>
          <i /><span className="lodge-object__label">休息のベッド</span>
        </button>
        <button className="lodge-object lodge-object--bookshelf" onClick={() => openOverlay('codex')}>
          <span className="lodge-bookshelf" aria-hidden="true">
            {Array.from({ length: bookshelfSlots }, (_, index) => {
              const entry = index < filledBookCount ? discoveredEntries[index % Math.max(1, discoveredEntries.length)] : null;
              return <i key={index} className={`lodge-bookshelf__book ${entry ? `is-filled is-${entry.type}` : 'is-empty'}`} />;
            })}
          </span>
          <span className="lodge-object__label"><b>図鑑の本棚</b><small>{discoveredEntries.length} / {totalCodexEntries} 冊</small></span>
        </button>
        <button className="lodge-object lodge-object--desk" onClick={() => openOverlay('evolution', 0)}>
          <i /><span className="lodge-object__label">進化の作業台</span>
        </button>
        <button className="lodge-object lodge-object--librarian" onClick={() => setMessage(HINTS[(rank + 1) % HINTS.length])}>
          <i /><span>司書</span>
        </button>
        <button className="lodge-object lodge-object--portal" onClick={goWorldMap}>
          <i /><span>ワールドポータル</span>
        </button>

        <div className="lodge-room__message rpg-window">{message}</div>
      </div>
      <MenuBar />
    </>
  );
}
