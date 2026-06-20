import { useGameStore } from '@/store/useGameStore';
import { getDungeon, getEnemy, getWorld } from '@/data';
import { Button } from '@/components/ui/Button';
import { Window } from '@/components/ui/Window';
import { Sprite } from '@/components/ui/Sprite';

export function WorldSelectScene() {
  const { viewingWorldId, enterWorld, goWorldMap, save } = useGameStore();
  if (!viewingWorldId || !save) return null;
  const world = getWorld(viewingWorldId);
  const dungeon = getDungeon(world.dungeonId);

  // この世界に登場する敵（重複排除）
  const enemyIds = [...new Set(dungeon.floors.flatMap((f) => f.nodes.flatMap((n) => n.enemyIds ?? [])))];
  const cleared = save.progress.clearedWorldIds.includes(viewingWorldId);

  return (
    <div className={`scene world-select-scene world-theme-${viewingWorldId} fade-in`}>
      <div className="scene-header">{world.title}</div>
      <Window>
        <div className="small dim">{world.author}・{world.era}</div>
        <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6 }}>{world.description}</p>
      </Window>

      <Window title={`ダンジョン：${dungeon.name}`}>
        <div className="small dim">全 {dungeon.floors.length} 層 ／ 最深部にボスが待つ</div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {enemyIds.map((id) => {
            const e = getEnemy(id);
            return (
              <div key={id} className="col" style={{ alignItems: 'center', width: 56 }}>
                <Sprite label={e.name} side="enemy" size="sm" />
                <span className="tiny dim center" style={{ lineHeight: 1.1 }}>
                  {e.isBoss ? '👑' : ''}
                  {e.name}
                </span>
              </div>
            );
          })}
        </div>
      </Window>

      <div className="spacer" />
      <Button primary center onClick={() => enterWorld(viewingWorldId)}>
        {cleared ? 'もう一度ダンジョンへ' : 'ダンジョンへ出発'}
      </Button>
      <Button center onClick={goWorldMap}>
        ワールドマップへ
      </Button>
    </div>
  );
}
