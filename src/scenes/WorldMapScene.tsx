import { useGameStore } from '@/store/useGameStore';
import { WORLDS, WORLD_ORDER } from '@/data';
import { MenuBar } from '@/components/common/MenuBar';
import { PartyStatusBar } from '@/components/common/PartyStatusBar';

const worldClass: Record<string, string> = {
  beowulf: 'journey-world--beowulf',
  hamlet: 'journey-world--hamlet',
  macbeth: 'journey-world--macbeth',
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
        <main className={`journey-map ${worldClass[activeId] ?? ''}`} aria-label="Lodgeから作品世界への道">
          <div className="journey-map__sky" /><div className="journey-map__hills" />
          <div className="journey-route">
            <button className="journey-stop journey-stop--lodge" onClick={openLodge}><i /><strong>Bibliotheca Lodge</strong><small>帰還の間</small></button>
            <div className="journey-road"><i /><i /><i /><span>古い街道</span></div>
            <button className="journey-stop journey-stop--world" onClick={() => selectWorld(activeId)}><i /><strong>{activeWorld.title}</strong><small>{activeWorld.author}</small></button>
          </div>
          <div className="journey-future">{WORLD_ORDER.filter((id) => id !== activeId).map((id) => <span key={id} className={unlocked.has(id) ? 'is-open' : ''}>{unlocked.has(id) ? WORLDS[id].title : '封印された世界'}</span>)}</div>
        </main>
      </div>
      <MenuBar />
    </>
  );
}
