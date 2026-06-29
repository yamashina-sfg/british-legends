import { useGameStore } from '@/store/useGameStore';
import { WORLDS, WORLD_ORDER } from '@/data';
import { MenuBar } from '@/components/common/MenuBar';
import { PartyStatusBar } from '@/components/common/PartyStatusBar';
import beowulfMap from '@/assets/world/beowulf-overworld-v1.png';
import hamletMap from '@/assets/world/hamlet-overworld-v1.png';
import macbethMap from '@/assets/world/macbeth-overworld-v1.png';
import gulliverMap from '@/assets/world/gulliver-overworld-v1.png';
import crusoeMap from '@/assets/world/crusoe-overworld-v1.png';
import marinerMap from '@/assets/world/mariner-overworld-v1.png';
import frankensteinMap from '@/assets/world/frankenstein-overworld-v1.png';
import aliceMap from '@/assets/world/alice-overworld-v1.png';
import holmesMap from '@/assets/world/holmes-overworld-v1.png';
import draculaMap from '@/assets/world/dracula-overworld-v1.png';
import dallowayMap from '@/assets/world/dalloway-overworld-v1.png';
import nineteen84Map from '@/assets/world/nineteen84-overworld-v1.png';
import lobbyCommandIcon from '@/assets/ui/lobby-command-icon.png';
import departCommandIcon from '@/assets/ui/depart-command-icon.png';

const worldClass: Record<string, string> = {
  beowulf: 'journey-world--beowulf',
  hamlet: 'journey-world--hamlet',
  macbeth: 'journey-world--macbeth',
  gulliver: 'journey-world--gulliver',
  crusoe: 'journey-world--crusoe',
  mariner: 'journey-world--mariner',
  frankenstein: 'journey-world--frankenstein',
  alice: 'journey-world--alice',
  holmes: 'journey-world--holmes',
  dracula: 'journey-world--dracula',
  dalloway: 'journey-world--dalloway',
  nineteen84: 'journey-world--nineteen84',
};

const journeyLabels: Record<string, string> = {
  beowulf: '古英語世界・海辺の街道',
  hamlet: 'ルネサンス世界・エルシノア街道',
  macbeth: 'スコットランド・雷鳴の荒野',
  gulliver: '18世紀世界・リリパット街道',
  crusoe: '18世紀世界・無人島への海岸道',
  mariner: 'ロマン派世界・呪われた航路',
  frankenstein: 'ロマン派世界・研究所への雪道',
  alice: 'ヴィクトリア朝世界・不思議の庭',
  holmes: 'ヴィクトリア朝世界・霧のロンドン',
  dracula: 'ヴィクトリア朝世界・ドラキュラ城の峠',
  dalloway: 'モダニズム世界・ロンドンの一日',
  nineteen84: 'モダニズム世界・オセアニア回廊',
};

const overworldArt: Record<string, string> = {
  beowulf: beowulfMap,
  hamlet: hamletMap,
  macbeth: macbethMap,
  gulliver: gulliverMap,
  crusoe: crusoeMap,
  mariner: marinerMap,
  frankenstein: frankensteinMap,
  alice: aliceMap,
  holmes: holmesMap,
  dracula: draculaMap,
  dalloway: dallowayMap,
  nineteen84: nineteen84Map,
};

export function WorldMapScene() {
  const { save, selectWorld, openLodge } = useGameStore();
  if (!save) return null;
  const unlocked = new Set(save.progress.unlockedWorldIds);
  const cleared = new Set(save.progress.clearedWorldIds);
  const lastUnlockedId = save.progress.unlockedWorldIds[save.progress.unlockedWorldIds.length - 1];
  const activeId = WORLD_ORDER.find((id) => unlocked.has(id) && !cleared.has(id)) ?? lastUnlockedId ?? WORLD_ORDER[0];
  const activeWorld = WORLDS[activeId];

  return (
    <>
      <div className="journey-screen fade-in">
        <aside className="journey-sidebar rpg-window">
          <div className="journey-sidebar__title">BIBLIOTHECA</div>
          <div className="small dim">失われた物語を修復せよ</div>
          <div className="journey-objective"><span>次の目的地</span><strong>{activeWorld.title}</strong><small>{activeWorld.era}</small></div>
          <PartyStatusBar />
          <div className="journey-sidebar__note">Lodgeを出発し、道の先の物語世界へ向かう。</div>
        </aside>
        <main className="journey-board">
          <div className="journey-board__header">
            <span>現在の街道</span>
            <strong>{journeyLabels[activeId] ?? activeWorld.title}</strong>
            <small>背景は目的地の雰囲気。操作は下のコマンドから選ぶ。</small>
          </div>
          <section
            className={`journey-map journey-map--art ${worldClass[activeId] ?? ''}`}
            style={{ background: `url(${overworldArt[activeId] ?? beowulfMap}) center / cover no-repeat` }}
            aria-label="現在の作品世界の背景"
          >
            <div className="journey-future">{WORLD_ORDER.filter((id) => id !== activeId).map((id) => <span key={id} className={unlocked.has(id) ? 'is-open' : ''}>{unlocked.has(id) ? WORLDS[id].title : '封印された世界'}</span>)}</div>
          </section>
          <div className="journey-map__actions" aria-label="ワールドマップの行動">
            <button className="journey-action journey-action--lodge" onClick={openLodge}>
              <img className="journey-action__icon" src={lobbyCommandIcon} alt="" aria-hidden="true" />
              <span>ロビーへ戻る</span>
              <small>回復・編成・ショップ・進化</small>
            </button>
            <button className="journey-action journey-action--depart" onClick={() => selectWorld(activeId)}>
              <img className="journey-action__icon" src={departCommandIcon} alt="" aria-hidden="true" />
              <span>{activeWorld.title}へ出発</span>
              <small>ダンジョン選択・戦闘へ進む</small>
            </button>
          </div>
        </main>
      </div>
      <MenuBar />
    </>
  );
}
