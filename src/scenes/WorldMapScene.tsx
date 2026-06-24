import { useGameStore } from '@/store/useGameStore';
import { WORLDS, WORLD_ORDER, getCharacter } from '@/data';
import { MenuBar } from '@/components/common/MenuBar';
import { PartyStatusBar } from '@/components/common/PartyStatusBar';
import { Sprite } from '@/components/ui/Sprite';
import beowulfMap from '@/assets/world/beowulf-overworld-v1.png';
import hamletMap from '@/assets/world/hamlet-overworld-v1.png';
import macbethMap from '@/assets/world/macbeth-overworld-v1.png';

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

const overworldArt: Record<string, string> = {
  beowulf: beowulfMap,
  hamlet: hamletMap,
  macbeth: macbethMap,
};

export function WorldMapScene() {
  const { save, selectWorld, openLodge } = useGameStore();
  if (!save) return null;
  const unlocked = new Set(save.progress.unlockedWorldIds);
  const cleared = new Set(save.progress.clearedWorldIds);
  const lastUnlockedId = save.progress.unlockedWorldIds[save.progress.unlockedWorldIds.length - 1];
  const activeId = WORLD_ORDER.find((id) => unlocked.has(id) && !cleared.has(id)) ?? lastUnlockedId ?? WORLD_ORDER[0];
  const activeWorld = WORLDS[activeId];
  const party = save.party.slice(0, 3);

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
        <main
          className={`journey-map journey-map--art ${worldClass[activeId] ?? ''}`}
          style={{ backgroundImage: `url(${overworldArt[activeId] ?? beowulfMap})` }}
          aria-label="Lodgeから作品世界への道"
        >
          <div className="journey-map__label">{journeyLabels[activeId] ?? activeWorld.title}</div>
          <div className="journey-map__party" aria-label="旅をする仲間たち">
            {party.map((member) => <Sprite key={member.characterId} label={getCharacter(member.characterId).name} side="ally" size="sm" pose="map" />)}
          </div>
          <button className="journey-stop journey-stop--lodge" onClick={openLodge}><i /><strong>Bibliotheca Lodge</strong><small>帰還の間</small></button>
          <button className="journey-stop journey-stop--world" onClick={() => selectWorld(activeId)}><i /><strong>{activeWorld.title}</strong><small>{activeWorld.author}</small></button>
          <div className="journey-future">{WORLD_ORDER.filter((id) => id !== activeId).map((id) => <span key={id} className={unlocked.has(id) ? 'is-open' : ''}>{unlocked.has(id) ? WORLDS[id].title : '封印された世界'}</span>)}</div>
        </main>
      </div>
      <MenuBar />
    </>
  );
}
