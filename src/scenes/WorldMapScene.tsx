import { useGameStore } from '@/store/useGameStore';
import { WORLDS, WORLD_ORDER } from '@/data';
import { MenuBar } from '@/components/common/MenuBar';
import { PartyStatusBar } from '@/components/common/PartyStatusBar';

const landmarkClass: Record<string, string> = {
  beowulf: 'landmark-cave', hamlet: 'landmark-castle', macbeth: 'landmark-tower',
};

export function WorldMapScene() {
  const { save, selectWorld, openLodge } = useGameStore();
  if (!save) return null;
  const unlocked = new Set(save.progress.unlockedWorldIds);
  const cleared = new Set(save.progress.clearedWorldIds);

  return (
    <>
      <div className="world-rpg-screen fade-in">
        <aside className="world-sidebar rpg-window">
          <div className="world-sidebar__title">BIBLIOTHECA</div>
          <div className="small dim">失われた物語を修復せよ</div>
          <div className="world-objective"><span>目的</span><strong>Beowulf の世界へ向かう</strong></div>
          <div className="world-party"><PartyStatusBar /></div>
          <div className="world-sidebar__hint">地図上の拠点を選択</div>
        </aside>
        <main className="world-atlas" aria-label="文学世界地図">
          <div className="atlas-label atlas-label--north">古英語世界</div>
          <div className="atlas-river" />
          <div className="atlas-forest atlas-forest--one" />
          <div className="atlas-forest atlas-forest--two" />
          <div className="atlas-mountains" />
          <div className="atlas-road atlas-road--lodge" />
          <div className="atlas-road atlas-road--beowulf" />
          <div className="atlas-road atlas-road--hamlet" />
          <div className="atlas-road atlas-road--macbeth" />
          <button className="atlas-lodge" onClick={openLodge}>
            <i className="atlas-lodge__sprite" />
            <strong>Bibliotheca Lodge</strong>
            <small>回復・店・仲間</small>
          </button>
          <div className="atlas-boss-gate"><i />竜の塚</div>
          {WORLD_ORDER.map((id, index) => {
            const world = WORLDS[id];
            const isUnlocked = unlocked.has(id);
            return (
              <button
                key={id}
                disabled={!isUnlocked}
                onClick={() => selectWorld(id)}
                className={`world-landmark ${landmarkClass[id] ?? 'landmark-town'} landmark-${index} ${isUnlocked ? '' : 'is-locked'} ${cleared.has(id) ? 'is-cleared' : ''}`}
              >
                <i className="world-landmark__sprite" />
                <span>{isUnlocked ? world.title : 'LOCKED'}</span>
                <small>{isUnlocked ? world.era : '未解放'}</small>
              </button>
            );
          })}
          <div className="atlas-player"><i /><span>YOU</span></div>
        </main>
      </div>
      <MenuBar />
    </>
  );
}
