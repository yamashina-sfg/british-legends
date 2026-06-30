import { useState, type CSSProperties } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { MenuBar } from '@/components/common/MenuBar';
import { ObjectiveBanner } from '@/components/common/ObjectiveBanner';
import { CODEX, getCharacter, getWorld } from '@/data';
import { CORE_WORLD_IDS, CORE_WORLD_META, type CoreWorldId } from '@/data/literaryProgress';
import { getObjective } from '@/engine/objective';
import { checkEvolution } from '@/engine/evolution';
import bibliothecaCabinInterior from '@/assets/lodge/bibliotheca-cabin-portal-v2.png';
import bibliothecaCabinMobile from '@/assets/lodge/bibliotheca-cabin-mobile-landscape-v1.png';
import bibliothecaCabinPortrait from '@/assets/lodge/bibliotheca-cabin-mobile-portrait-v1.png';

const HINTS = [
  '司書: 旅で見つけた素材は、机の上で進化の力に変えられます。',
  '司書: 世界を修復するたび、この部屋にも失われた物語の光が戻ります。',
  '司書: 不安になったら、ベッドで休んでから再びポータルへ向かいなさい。',
  '司書: The Censorは物語の問いを嫌います。問いを持つ仲間ほど、戦闘で強い宿命を持ちます。',
];

function timeTone() {
  const hour = new Date().getHours();
  if (hour >= 18 || hour < 5) return 'night';
  if (hour >= 15) return 'evening';
  return 'morning';
}

function worldUnlockRate(worldId: CoreWorldId, discoveredIds: string[]) {
  const entries = Object.values(CODEX).filter((entry) => entry.refId === worldId || entry.refId.includes(worldId));
  const found = entries.filter((entry) => entry.type === 'world' || discoveredIds.includes(entry.id)).length;
  return Math.round((found / Math.max(entries.length, 1)) * 100);
}

export function TownScene() {
  const { save, healParty, goWorldMap, openOverlay } = useGameStore();
  // 司書の初期セリフ＝現在の目的。クリックでフレーバーのヒントへ。
  const [message, setMessage] = useState(() =>
    save ? `司書: ${getObjective(save).detail}` : HINTS[0],
  );
  if (!save) return null;
  // 進化の机：いま進化できる仲間がいればその子を、いなければパーティ一覧を開く
  const evolvableIndex = save.party.findIndex((p) =>
    checkEvolution(p, getCharacter(p.characterId), save.inventory).canEvolve,
  );
  const rank = Math.min(save.progress.clearedWorldIds.length, 3);
  const restoredCoreIds = CORE_WORLD_IDS.filter((id) => save.progress.clearedWorldIds.includes(id));
  const currentWorldId = (CORE_WORLD_IDS.find((id) => id === save.progress.currentWorldId) ??
    CORE_WORLD_IDS.find((id) => save.progress.unlockedWorldIds.includes(id)) ??
    'beowulf') as CoreWorldId;
  const currentWorld = getWorld(currentWorldId);
  const currentMeta = CORE_WORLD_META[currentWorldId];
  const tiles = Array.from({ length: 120 });

  return (
    <>
      <div
        className={`lodge-room lodge-room--cabin lodge-rank-${rank} lodge-time-${timeTone()} fade-in`}
        style={{
          '--lodge-bg-desktop': `url(${bibliothecaCabinInterior})`,
          '--lodge-bg-mobile': `url(${bibliothecaCabinMobile})`,
          '--lodge-bg-portrait': `url(${bibliothecaCabinPortrait})`,
        } as CSSProperties}
      >
        <div className="lodge-room__wall" />
        <div className="lodge-room__floor">{tiles.map((_, index) => <i key={index} />)}</div>
        <i className="lodge-room__ceiling-beam" />
        <i className="lodge-room__window"><b /><b /></i>
        <i className="lodge-room__curtain lodge-room__curtain--left" />
        <i className="lodge-room__curtain lodge-room__curtain--right" />
        <i className="lodge-room__rug" />
        <header className="lodge-room__title"><span>BIBLIOTHECA LODGE</span><strong>帰還の間</strong><b>修復した世界 {save.progress.clearedWorldIds.length}</b></header>

        <div className="lodge-recovered-books" aria-label="戻った本">
          {CORE_WORLD_IDS.map((id) => {
            const restored = save.progress.clearedWorldIds.includes(id);
            return <b key={id} className={restored ? 'is-restored' : ''} style={{ '--book-color': CORE_WORLD_META[id].bookColor } as CSSProperties} title={getWorld(id).title} />;
          })}
        </div>
        <button className="lodge-reading-desk" aria-label="机の本" onClick={() => setMessage(`机の上: 『${currentWorld.title}』。${currentMeta.shortIntro}`)}>
          <span>{currentWorld.title}</span>
          <small>{currentMeta.theme}</small>
        </button>
        <div className="lodge-trophy-case" aria-label="トロフィー展示">
          {CORE_WORLD_IDS.map((id) => {
            const won = save.progress.clearedWorldIds.includes(id);
            return (
              <button key={id} className={won ? 'is-won' : ''} onClick={() => setMessage(won ? `${getWorld(id).title}: ${CORE_WORLD_META[id].trophy} が棚で静かに光っている。` : `${getWorld(id).title}: 作品を修復すると、ここに証が飾られる。`)}>
                <i />
                <span>{won ? CORE_WORLD_META[id].trophy : '？？？'}</span>
              </button>
            );
          })}
        </div>
        <button className="lodge-memory-panel" aria-label="修復進行" onClick={() => setMessage(`Bibliotheca: 主要3作品の修復 ${restoredCoreIds.length}/3。図鑑解放率 Beowulf ${worldUnlockRate('beowulf', save.codex.discoveredIds)}% / Hamlet ${worldUnlockRate('hamlet', save.codex.discoveredIds)}% / Macbeth ${worldUnlockRate('macbeth', save.codex.discoveredIds)}%。`)}>
          <span>RESTORATION</span>
          <b>{restoredCoreIds.length}/3</b>
        </button>

        <button className="lodge-hotspot lodge-hotspot--bed" aria-label="休息のベッド" onClick={() => { healParty(); setMessage(`ベッドで休んだ。${save.party.map((p) => getCharacter(p.characterId).name).join('・') || '仲間'} のHPとMPが全回復した。`); }}><span>休息のベッド</span></button>
        <button className="lodge-hotspot lodge-hotspot--bookshelf" aria-label="図鑑の本棚" onClick={() => openOverlay('codex')}><span>図鑑の本棚</span></button>
        <button className="lodge-hotspot lodge-hotspot--desk" aria-label="進化の作業台" onClick={() => (evolvableIndex >= 0 ? openOverlay('evolution', evolvableIndex) : openOverlay('party'))}><span>進化の作業台</span></button>
        <button className="lodge-object lodge-object--shop" onClick={() => openOverlay('store')}>
          <i /><span className="lodge-object__label"><b>武具商の棚</b><small>所持 {save.gold} G</small></span>
        </button>
        <button className="lodge-hotspot lodge-hotspot--librarian" aria-label="司書の助言" onClick={() => setMessage(HINTS[(rank + 1) % HINTS.length])} />
        <button className="lodge-hotspot lodge-hotspot--trophy" aria-label="トロフィールーム" onClick={() => setMessage(`トロフィールーム: 修復した世界 ${save.progress.clearedWorldIds.length}。${save.progress.clearedWorldIds.length >= 3 ? '黒幕Oblivionの影が、棚の奥で揺れている。' : '作品を修復すると、この部屋に戦いの証が増える。'}`)}><span>トロフィールーム</span></button>
        <button className="lodge-hotspot lodge-hotspot--quest" aria-label="依頼ボード" onClick={() => setMessage(`依頼ボード: ${getObjective(save).detail}`)}><span>依頼ボード</span></button>
        <button className="lodge-hotspot lodge-hotspot--portal" aria-label="ワールドポータル" onClick={goWorldMap}><span>ワールドポータル</span></button>

        <div className="lodge-room__objective"><ObjectiveBanner compact /></div>
        <div className="lodge-room__message rpg-window">{message}</div>
      </div>
      <MenuBar />
    </>
  );
}
