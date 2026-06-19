import { useGameStore } from '@/store/useGameStore';
import { getCharacter, getWorld, WORLDS } from '@/data';
import { Button } from '@/components/ui/Button';
import { Window } from '@/components/ui/Window';
import { Sprite } from '@/components/ui/Sprite';

export function WorldClearScene() {
  const { save, newlyJoinedCharacterId, goWorldMap } = useGameStore();
  if (!save) return null;

  const clearedId = save.progress.currentWorldId;
  const world = clearedId ? WORLDS[clearedId] : null;
  const joined = newlyJoinedCharacterId ? getCharacter(newlyJoinedCharacterId) : null;

  // 新たに解放された世界
  const newlyUnlocked = save.progress.unlockedWorldIds
    .filter((id) => !save.progress.clearedWorldIds.includes(id) && id !== clearedId)
    .map((id) => getWorld(id));

  return (
    <div className="scene fade-in center" style={{ justifyContent: 'center', alignItems: 'center', gap: 18 }}>
      <h1 style={{ fontSize: 24, color: 'var(--accent)', letterSpacing: 2 }}>WORLD RESTORED</h1>
      {world && <div className="small dim">『{world.title}』の世界を修復した！</div>}

      {joined && (
        <Window title="仲間が加わった！" className="center col" >
          <div className="row" style={{ justifyContent: 'center' }}>
            <Sprite label={joined.name} side="ally" size="lg" />
          </div>
          <div className="accent" style={{ marginTop: 8 }}>
            {joined.name}（{joined.stageName}）
          </div>
        </Window>
      )}

      {newlyUnlocked.length > 0 && (
        <div className="small">
          新たな世界が解放された：
          <span className="accent"> {newlyUnlocked.map((w) => w.title).join('、')}</span>
        </div>
      )}

      <div style={{ width: '70%', marginTop: 10 }}>
        <Button primary center onClick={goWorldMap}>
          ワールドマップへ
        </Button>
      </div>
    </div>
  );
}
