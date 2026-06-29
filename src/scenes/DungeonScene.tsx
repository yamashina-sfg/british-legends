import { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { CODEX, getDungeon, getEnemy, getMaterial, getWorld } from '@/data';
import { explorationRate } from '@/engine/mapgen';
import { Button } from '@/components/ui/Button';
import { DungeonMap } from '@/components/dungeon/DungeonMap';
import { BossPrompt } from '@/components/dungeon/BossPrompt';
import { PartyStatusBar } from '@/components/common/PartyStatusBar';
import { MenuBar } from '@/components/common/MenuBar';

const FLOOR_ATMOSPHERE: Record<string, string[]> = {
  beowulf: ['ヘオロットの酒宴場', 'グレンデル母の沼', '竜の塚・灼熱の回廊'],
  hamlet: ['エルシノア城・大広間', '王家の地下墓所', '玉座の間・決闘の広間'],
  macbeth: ['荒野の魔女道', 'ダンシネイン城・回廊', '血の王座・終幕の間'],
};

const WORLD_CODEX_REFS: Record<string, string[]> = {
  beowulf: ['beowulf', 'grendel', 'dragon'],
  hamlet: ['hamlet', 'ghost', 'claudius', 'royal_guard'],
  macbeth: ['macbeth', 'witch', 'banquos_ghost', 'macbeths_fate', 'soldier'],
};

function codexTotalForWorld(worldId: string) {
  return Object.values(CODEX).filter((entry) =>
    entry.id.includes(worldId) || (WORLD_CODEX_REFS[worldId] ?? []).some((ref) => entry.refId.includes(ref)),
  ).length;
}

function codexFoundForWorld(worldId: string, discoveredIds: string[] = []) {
  return discoveredIds.filter((id) => {
    const entry = CODEX[id];
    return entry && (entry.id.includes(worldId) || (WORLD_CODEX_REFS[worldId] ?? []).some((ref) => entry.refId.includes(ref)));
  }).length;
}

export function DungeonScene() {
  const { map, worldId, movePlayer, retreatToMap, lastReward, mapToast, save, bossPrompt } = useGameStore();

  // キーボード操作（矢印 / WASD）。ボス確認中は移動を止める。
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useGameStore.getState().bossPrompt) return;
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
  const progress = save?.exploration?.[worldId];
  const openedChests = map.entities.filter((e) => e.kind === 'chest' && e.opened).length;
  const totalChests = map.entities.filter((e) => e.kind === 'chest').length;
  const foundSecrets = map.discoveredSecretIds?.length ?? 0;
  const totalSecrets = map.entities.filter((e) => e.kind === 'secretDoor').length;
  const codexFound = progress?.codexFound ?? codexFoundForWorld(worldId, save?.codex.discoveredIds);
  const codexTotal = progress?.codexTotal || codexTotalForWorld(worldId);
  const atmosphere = FLOOR_ATMOSPHERE[worldId]?.[map.floorIndex] ?? map.floorName;

  // 出現する敵（このフロアのエンティティから）
  const enemyIds = [...new Set(map.entities.flatMap((e) => e.enemyIds ?? []))];

  return (
    <>
      <div className={`scene dungeon-rpg-scene dungeon-world-${worldId} fade-in`} style={{ gap: 10 }}>
        <div className="dungeon-hud rpg-window">
          <div className="dungeon-hud__location"><span>AREA</span><strong>{atmosphere}</strong><small>{dgn.name} / 第{map.floorIndex + 1}層</small></div>
          <div className="dungeon-hud__objective"><span>QUEST</span><strong>{map.isBossFloor ? 'ボスの攻略法を見極めて討て' : '鍵・隠し壁・記録を探し、文学世界を修復せよ'}</strong></div>
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
            <div className="dungeon-treasure-count">
              宝箱 {openedChests}/{totalChests}<br />
              秘密部屋 {foundSecrets}/{totalSecrets}<br />
              図鑑 {codexFound}/{codexTotal}<br />
              最高探索率 {Math.max(progress?.bestRate ?? 0, rate)}%
              {progress?.shortcutsUnlocked && <><br />ショートカット解放済み</>}
            </div>
          </aside>
        </div>

        <div className="map-legend">
          <span><i className="legend-player" /> 主人公</span>
          <span><i className="legend-chest" /> 宝箱</span>
          <span><i className="legend-enemy" /> 敵</span>
          <span><i className="legend-stairs" /> 階段</span>
          <span><i className="legend-boss" /> ボス</span>
          <span><i className="legend-rest" /> 休息碑</span>
          <span><i className="legend-key" /> 鍵</span>
          <span><i className="legend-door" /> 扉</span>
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
      {bossPrompt && <BossPrompt />}
    </>
  );
}
