import { useGameStore } from '@/store/useGameStore';
import { WORLDS, WORLD_ORDER } from '@/data';
import { MenuBar } from '@/components/common/MenuBar';
import { PartyStatusBar } from '@/components/common/PartyStatusBar';

const worldClass: Record<string, string> = {
  beowulf: 'journey-world--beowulf',
  hamlet: 'journey-world--hamlet',
  macbeth: 'journey-world--macbeth',
};

const journeyLabels: Record<string, string> = {
  beowulf: '古英語世界・海辺の街道',
  hamlet: 'ルネサンス世界・エルシノア街道',
  macbeth: 'スコットランド・雷鳴の荒野',
};

const MAP_COLUMNS = 18;
const MAP_ROWS = 13;
const ROAD_TILES = new Set(['2:9', '3:9', '4:9', '5:9', '6:9', '7:9', '8:9', '8:10', '9:10', '10:10', '11:10']);

function terrainAt(row: number, column: number) {
  const key = `${row}:${column}`;
  if (ROAD_TILES.has(key)) return 'road';
  if ((column < 2 && row > 1) || (column === 2 && row > 7)) return 'water';
  if ((column === 2 && row > 1 && row <= 7) || (column === 3 && row > 7)) return 'shore';
  if ((column >= 14 && row > 1) || (row >= 10 && column > 3) || (row < 2 && column > 2 && column < 7)) return 'forest';
  if ((row === 7 && column === 2) || (row === 8 && column === 3)) return 'rock';
  if (row === 6 && column === 2) return 'bridge';
  if (row === 8 && column === 7) return 'pond';
  return 'grass';
}

export function WorldMapScene() {
  const { save, selectWorld, openLodge } = useGameStore();
  if (!save) return null;
  const unlocked = new Set(save.progress.unlockedWorldIds);
  const cleared = new Set(save.progress.clearedWorldIds);
  const lastUnlockedId = save.progress.unlockedWorldIds[save.progress.unlockedWorldIds.length - 1];
  const activeId = WORLD_ORDER.find((id) => unlocked.has(id) && !cleared.has(id)) ?? lastUnlockedId ?? WORLD_ORDER[0];
  const activeWorld = WORLDS[activeId];
  const terrain = Array.from({ length: MAP_COLUMNS * MAP_ROWS }, (_, index) => {
    const row = Math.floor(index / MAP_COLUMNS);
    const column = index % MAP_COLUMNS;
    return terrainAt(row, column);
  });

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
        <main className={`journey-map ${worldClass[activeId] ?? ''}`} aria-label="Lodgeから作品世界への道">
          <div className="terrain-map" aria-hidden="true">{terrain.map((type, index) => <i key={index} className={`terrain-tile terrain-tile--${type}`} />)}</div>
          <div className="journey-map__label">{journeyLabels[activeId] ?? activeWorld.title}</div>
          <i className="journey-map__sign" aria-hidden="true" />
          <i className="journey-map__traveler journey-map__traveler--one" aria-hidden="true" />
          <i className="journey-map__traveler journey-map__traveler--two" aria-hidden="true" />
          <button className="journey-stop journey-stop--lodge" onClick={openLodge}><i /><strong>Bibliotheca Lodge</strong><small>帰還の間</small></button>
          <button className="journey-stop journey-stop--world" onClick={() => selectWorld(activeId)}><i /><strong>{activeWorld.title}</strong><small>{activeWorld.author}</small></button>
          <div className="journey-future">{WORLD_ORDER.filter((id) => id !== activeId).map((id) => <span key={id} className={unlocked.has(id) ? 'is-open' : ''}>{unlocked.has(id) ? WORLDS[id].title : '封印された世界'}</span>)}</div>
        </main>
      </div>
      <MenuBar />
    </>
  );
}
