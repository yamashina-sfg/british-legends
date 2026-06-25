import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { MenuBar } from '@/components/common/MenuBar';
import { ObjectiveBanner } from '@/components/common/ObjectiveBanner';
import { getCharacter } from '@/data';
import { getObjective } from '@/engine/objective';
import { checkEvolution } from '@/engine/evolution';
import bibliothecaCabinInterior from '@/assets/lodge/bibliotheca-cabin-portal-v2.png';
import { Sprite } from '@/components/ui/Sprite';

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
        <div className="lodge-party-figures" aria-label="滞在中の仲間">
          {save.party.slice(0, 3).map((member) => {
            const character = getCharacter(member.characterId);
            return <Sprite key={member.characterId} label={character.name} side="ally" size="md" pose="map" faint={member.currentHp <= 0} />;
          })}
        </div>

        <button className="lodge-hotspot lodge-hotspot--bed" aria-label="休息のベッド" onClick={() => { healParty(); setMessage(`ベッドで休んだ。${save.party.map((p) => getCharacter(p.characterId).name).join('・') || '仲間'} のHPとMPが全回復した。`); }}><span>休息のベッド</span></button>
        <button className="lodge-hotspot lodge-hotspot--bookshelf" aria-label="図鑑の本棚" onClick={() => openOverlay('codex')}><span>図鑑の本棚</span></button>
        <button className="lodge-hotspot lodge-hotspot--desk" aria-label="進化の作業台" onClick={() => (evolvableIndex >= 0 ? openOverlay('evolution', evolvableIndex) : openOverlay('party'))}><span>進化の作業台</span></button>
        <button className="lodge-object lodge-object--shop" onClick={() => openOverlay('store')}>
          <i /><span className="lodge-object__label"><b>武具商の棚</b><small>所持 {save.gold} G</small></span>
        </button>
        <button className="lodge-hotspot lodge-hotspot--librarian" aria-label="司書の助言" onClick={() => setMessage(HINTS[(rank + 1) % HINTS.length])} />
        <button className="lodge-hotspot lodge-hotspot--portal" aria-label="ワールドポータル" onClick={goWorldMap}><span>ワールドポータル</span></button>

        <div className="lodge-room__objective"><ObjectiveBanner compact /></div>
        <div className="lodge-room__message rpg-window">{message}</div>
      </div>
      <MenuBar />
    </>
  );
}
