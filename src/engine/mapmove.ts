import type { DungeonMap, MapEntity } from '@/types';
import { revealAround } from './mapgen';

// ============================================================
// マップ上の移動・敵AI（純粋ロジック）
// ============================================================

export type MoveEventType = 'blocked' | 'moved' | 'encounter' | 'stairs' | 'chest';

export interface MoveResult {
  map: DungeonMap;
  type: MoveEventType;
  /** encounter/chest のとき対象エンティティ */
  entity?: MapEntity;
}

const isWalkable = (map: DungeonMap, x: number, y: number) =>
  x >= 0 && y >= 0 && x < map.width && y < map.height && map.tiles[y][x] === 'floor';

const entityAt = (map: DungeonMap, x: number, y: number) =>
  map.entities.find((e) => e.x === x && e.y === y && !(e.kind === 'chest' && e.opened));

function cloneMap(map: DungeonMap): DungeonMap {
  return {
    ...map,
    player: { ...map.player },
    entities: map.entities.map((e) => ({ ...e })),
    visited: map.visited.map((row) => [...row]),
  };
}

/** 敵（kind==='enemy'）を1歩動かす。boss は動かない（最深部で待つ）。 */
function stepEnemies(map: DungeonMap): MapEntity | null {
  let collided: MapEntity | null = null;
  const blocked = (x: number, y: number) =>
    !isWalkable(map, x, y) ||
    map.entities.some((o) => o.x === x && o.y === y && !(o.kind === 'chest' && o.opened));

  for (const e of map.entities) {
    if (e.kind !== 'enemy') continue;
    const px = map.player.x;
    const py = map.player.y;
    const manhattan = Math.abs(px - e.x) + Math.abs(py - e.y);

    let dirs: [number, number][] = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    // 近ければ追跡、遠ければ徘徊
    if (manhattan <= 6 && Math.random() < 0.6) {
      dirs.sort((a, b) => {
        const da = Math.abs(px - (e.x + a[0])) + Math.abs(py - (e.y + a[1]));
        const db = Math.abs(px - (e.x + b[0])) + Math.abs(py - (e.y + b[1]));
        return da - db;
      });
    } else {
      dirs = dirs.sort(() => Math.random() - 0.5);
    }

    for (const [dx, dy] of dirs) {
      const nx = e.x + dx;
      const ny = e.y + dy;
      // プレイヤーに突っ込む＝戦闘開始
      if (nx === px && ny === py) {
        collided = e;
        break;
      }
      if (!blocked(nx, ny)) {
        e.x = nx;
        e.y = ny;
        break;
      }
    }
    if (collided) break;
  }
  return collided;
}

/** プレイヤーの1マス移動を解決する */
export function resolveMove(prev: DungeonMap, dx: number, dy: number): MoveResult {
  const map = cloneMap(prev);
  const tx = map.player.x + dx;
  const ty = map.player.y + dy;

  // 壁・水・範囲外
  if (!isWalkable(map, tx, ty)) {
    return { map: prev, type: 'blocked' };
  }

  const target = entityAt(map, tx, ty);
  if (target) {
    if (target.kind === 'stairs') return { map, type: 'stairs', entity: target };
    if (target.kind === 'enemy' || target.kind === 'boss') return { map, type: 'encounter', entity: target };
    if (target.kind === 'chest') {
      // 宝箱はその場で開ける（プレイヤーは進入しない）
      const chest = map.entities.find((e) => e.id === target.id)!;
      chest.opened = true;
      return { map, type: 'chest', entity: { ...chest } };
    }
  }

  // 通常移動
  map.player.x = tx;
  map.player.y = ty;
  revealAround(map.visited, tx, ty);

  // 敵が動く → プレイヤーに接触したら戦闘
  const collided = stepEnemies(map);
  if (collided) return { map, type: 'encounter', entity: collided };

  return { map, type: 'moved' };
}

/** 戦闘勝利後、倒した敵エンティティをマップから取り除く */
export function removeEntity(map: DungeonMap, entityId: string): DungeonMap {
  return { ...map, entities: map.entities.filter((e) => e.id !== entityId) };
}
