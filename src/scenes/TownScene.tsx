import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { MenuBar } from '@/components/common/MenuBar';
import { ObjectiveBanner } from '@/components/common/ObjectiveBanner';
import { getCharacter } from '@/data';
import { getObjective } from '@/engine/objective';
import { checkEvolution } from '@/engine/evolution';
import bibliothecaCabinInterior from '@/assets/lodge/bibliotheca-cabin-interactive.png';

const HINTS = [
  '司書: 旅で見つけた素材は、机の上で進化の力に変えられます。',
  '司書: 世界を修復するたび、この部屋にも失われた物語の光が戻ります。',
  '司書: 不安になったら、ベッドで休んでから再びポータルへ向かいなさい。',
];

export function TownScene() {
  const { save, healParty, goWorldMap, openOverlay } = useGameStore();
  // 司書の初期セリフ＝現在の目的。クリックでフレーバーのヒントへ。
  const [message, setMessage] = useState(() =>
    save ? `司書: ${getObjective(save).detail}` : HINTS[0],
  );
  if (!save) return null;
  // 进化の机：いま進化できる仲間がいればその子を、いなければパーティ一覧を開く
  const evolvableIndex = save.party.findIndex((p) =>
    checkEvolution(p, getCharacter(p.characterId), save.inventory).canEvolve,
  );
  const rank = Math.min(save.progress.clearedWorldIds.length, 3);
  const tiles = Array.from({ length: 120 });

  return (
    <>
      <div className={`lodge-room lodge-room--cabin lodge-rank-${rank} fade-in`} style={{ backgroundImage: `url(${bibliothecaCabinInterior})` }}>
        <div className="lodge-room__wall" />
        <div className="lodge-room__floor">{tiles.map((_, index) => <i key={index} />)}</div>
        <i className="lodge-room__ceiling-beam" />
        <i className="lodge-room__window"><b /><b /></i>
        <i className="lodge-room__curtain lodge-room__curtain--left" />
        <i className="lodge-room__curtain lodge-room__curtain--right" />
        <i className="lodge-room__rug" />
        <header className="lodge-room__title"><span>BIBLIOTHECA LODGE</span><strong>帰還の間</strong><b>修復した世界 {save.progress.clearedWorldIds.length}</b></header>
        <div className="lodge-room__hero"><i /><span>YOU</span></div>

        <button className="lodge-hotspot lodge-hotspot--bed" aria-label="休息のベッド" title="休息のベッド" onClick={() => { healParty(); setMessage(`ベッドで休んだ。${save.party.map((p) => getCharacter(p.characterId).name).join('・') || '仲間'} のHPとMPが全回復した。`); }} />
        <button className="lodge-hotspot lodge-hotspot--bookshelf" aria-label="図鑑の本棚" title="図鑑の本棚" onClick={() => openOverlay('codex')} />
        <button className="lodge-hotspot lodge-hotspot--desk" aria-label="進化の作業台" title="進化の作業台" onClick={() => (evolvableIndex >= 0 ? openOverlay('evolution', evolvableIndex) : openOverlay('party'))} />
        <button className="lodge-object lodge-object--shop" onClick={() => openOverlay('store')}>
          <i /><span className="lodge-object__label"><b>武具商の棚</b><small>所持 {save.gold} G</small></span>
        </button>
        <button className="lodge-object lodge-object--librarian" onClick={() => setMessage(HINTS[(rank + 1) % HINTS.length])}>
          <i /><span>司書</span>
        </button>
        <button className="lodge-object lodge-object--portal" onClick={goWorldMap}>
          <i /><span>ワールドポータル</span>
        </button>

        <div className="lodge-room__objective"><ObjectiveBanner compact /></div>
        <div className="lodge-room__message rpg-window">{message}</div>
      </div>
      <MenuBar />
    </>
  );
}
