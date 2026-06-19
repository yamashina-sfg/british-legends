import { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getDungeon, getEnemy, getMaterial, getWorld } from '@/data';
import { explorationRate } from '@/engine/mapgen';
import { Button } from '@/components/ui/Button';
import { DungeonMap } from '@/components/dungeon/DungeonMap';
import { PartyStatusBar } from '@/components/common/PartyStatusBar';
import { MenuBar } from '@/components/common/MenuBar';

export function DungeonScene() {
  const { map, worldId, movePlayer, retreatToMap, lastReward, mapToast, save } = useGameStore();

  // キーボード操作（矢印 / WASD）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const m: Record<string, [number, number]> = {
        ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
        w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
      };
      const dir = m[e.key];
      if (dir) {
        e.preventDefault();
        movePlayer(dir[0], dir[1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [movePlayer]);

  if (!map || !worldId) return null;
  const world = getWorld(worldId);
  const dgn = getDungeon(world.dungeonId);
  const rate = explorationRate(map);

  // 出現する敵（このフロアのエンティティから）
  const enemyIds = [...new Set(map.entities.flatMap((e) => e.enemyIds ?? []))];

  return (
    <>
      <div className="scene dungeon-rpg-scene fade-in" style={{ gap: 10 }}>
        <div className="dungeon-hud rpg-window">
          <div className="dungeon-hud__location"><span>AREA</span><strong>{dgn.name}</strong><small>{map.floorName} {map.floorIndex + 1}/{dgn.floors.length}</small></div>
          <div className="dungeon-hud__objective"><span>QUEST</span><strong>{map.isBossFloor ? '竜の塚の主を討て' : '奥へ進み、文学世界を修復せよ'}</strong></div>
          <div className="dungeon-hud__progress"><span>探索率</span><strong>{rate}%</strong><i><b style={{ width: `${rate}%` }} /></i></div>
        </div>

        <div className="dungeon-stage">
          <DungeonMap map={map} />
          <aside className="dungeon-stage__sidebar rpg-window">
            <span className="dungeon-sidebar__label">PARTY</span>
            <PartyStatusBar />
            <span className="dungeon-sidebar__label">ENCOUNTER</span>
            <div className="dungeon-enemy-list">{enemyIds.length > 0 ? enemyIds.map((id) => <span key={id}>{getEnemy(id).name}</span>) : <span>静寂</span>}</div>
            <span className="dungeon-sidebar__label">TREASURE</span>
            <div className="dungeon-treasure-count">{Object.keys(save?.inventory ?? {}).length} 種類の素材</div>
          </aside>
        </div>

        <div className="map-legend">
          <span><i className="legend-player" /> 主人公</span>
          <span><i className="legend-chest" /> 宝箱</span>
          <span><i className="legend-enemy" /> 敵</span>
          <span><i className="legend-stairs" /> 階段</span>
          <span><i className="legend-boss" /> ボス</span>
          <span><i className="legend-rest" /> 休息碑</span>
        </div>

        {/* トースト / 報酬 */}
        {mapToast && <div className="center accent small fade-in">{mapToast}</div>}
        {lastReward && (
          <div className="center tiny dim">
            前回：EXP {lastReward.exp}・{lastReward.gold}G
            {Object.entries(lastReward.drops).length > 0 &&
              '・' + Object.entries(lastReward.drops).map(([id, q]) => `${getMaterial(id).name}×${q}`).join('・')}
          </div>
        )}

        {/* 方向パッド（タッチ操作用） */}
        <div className="dpad">
          <div className="dpad-empty" />
          <button onClick={() => movePlayer(0, -1)}>↑</button>
          <div className="dpad-empty" />
          <button onClick={() => movePlayer(-1, 0)}>←</button>
          <div className="dpad-empty" />
          <button onClick={() => movePlayer(1, 0)}>→</button>
          <div className="dpad-empty" />
          <button onClick={() => movePlayer(0, 1)}>↓</button>
          <div className="dpad-empty" />
        </div>

        <Button center onClick={retreatToMap}>
          退却する（ワールドマップへ）
        </Button>
      </div>
      <MenuBar />
    </>
  );
}
