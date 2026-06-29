import type { DungeonMap, MapEntity } from '@/types';
import { revealAround } from './mapgen';

// ============================================================
// マップ上の移動・敵AI（純粋ロジック）
// ============================================================

export type MoveEventType = 'blocked' | 'moved' | 'encounter' | 'stairs' | 'chest' | 'rest' | 'memory' | 'key' | 'lockedDoor' | 'secret';

export interface MoveResult {
  map: DungeonMap;
  type: MoveEventType;
  /** encounter/chest のとき対象エンティティ */
  entity?: MapEntity;
}

const isWalkable = (map: DungeonMap, x: number, y: number) =>
  x >= 0 && y >= 0 && x < map.width && y < map.height && map.tiles[y][x] === 'floor';

const entityAt = (map: DungeonMap, x: number, y: number) =>
  map.entities.find((e) =>
    e.x === x &&
    e.y === y &&
    !(e.kind === 'chest' && e.opened) &&
    !(e.kind === 'lockedDoor' && e.opened),
  );

function shuffle<T>(arr: T[]): T[] {
  const next = [...arr];
  for (let index = next.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

function cloneMap(map: DungeonMap): DungeonMap {
  return {
    ...map,
    player: { ...map.player },
    entities: map.entities.map((e) => ({ ...e, rewards: e.rewards?.map((reward) => ({ ...reward })) })),
    foundKeyIds: [...(map.foundKeyIds ?? [])],
    discoveredSecretIds: [...(map.discoveredSecretIds ?? [])],
    visited: map.visited.map((row) => [...row]),
  };
}

/** ボス以外の敵だけが1歩動く。階段・宝箱・休息碑などのイベント地点は塞がない。 */
function stepEnemies(map: DungeonMap): MapEntity | null {
  let collided: MapEntity | null = null;
  const reserved = (x: number, y: number) =>
    map.entities.some((entity) => {
      if (entity.kind === 'enemy') return false;
      if (entity.kind === 'chest' && entity.opened) return false;
      if (entity.kind === 'lockedDoor' && entity.opened) return false;
      if (entity.kind === 'secretDoor') return false;
      return entity.x === x && entity.y === y;
    });
  const blocked = (x: number, y: number) =>
    !isWalkable(map, x, y) ||
    reserved(x, y) ||
    map.entities.some((entity) => entity.kind === 'enemy' && entity.x === x && entity.y === y);

  for (const enemy of map.entities) {
    if (enemy.kind !== 'enemy') continue;
    const px = map.player.x;
    const py = map.player.y;
    const distance = Math.abs(px - enemy.x) + Math.abs(py - enemy.y);
    let dirs: [number, number][] = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    if (distance <= 5) {
      dirs.sort((a, b) => {
        const da = Math.abs(px - (enemy.x + a[0])) + Math.abs(py - (enemy.y + a[1]));
        const db = Math.abs(px - (enemy.x + b[0])) + Math.abs(py - (enemy.y + b[1]));
        return da - db;
      });
    } else if (Math.random() < 0.55) {
      dirs = shuffle(dirs);
    } else {
      continue;
    }

    for (const [dx, dy] of dirs) {
      const nx = enemy.x + dx;
      const ny = enemy.y + dy;
      if (nx === px && ny === py) {
        collided = enemy;
        break;
      }
      if (!blocked(nx, ny)) {
        enemy.x = nx;
        enemy.y = ny;
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

  const secret = map.entities.find((e) => e.kind === 'secretDoor' && e.x === tx && e.y === ty && !e.opened);
  if (secret) {
    secret.opened = true;
    secret.hidden = false;
    map.tiles[ty][tx] = 'floor';
    map.discoveredSecretIds = [...new Set([...(map.discoveredSecretIds ?? []), secret.id])];
    revealAround(map.visited, tx, ty);
    return { map, type: 'secret', entity: { ...secret } };
  }

  // 壁・水・範囲外
  if (!isWalkable(map, tx, ty)) {
    return { map: prev, type: 'blocked' };
  }

  const target = entityAt(map, tx, ty);
  if (target) {
    if (target.kind === 'stairs') return { map, type: 'stairs', entity: target };
    if (target.kind === 'enemy' || target.kind === 'boss') return { map, type: 'encounter', entity: target };
    if (target.kind === 'key') {
      map.player.x = tx;
      map.player.y = ty;
      map.entities = map.entities.filter((entity) => entity.id !== target.id);
      if (target.keyId) map.foundKeyIds = [...new Set([...(map.foundKeyIds ?? []), target.keyId])];
      revealAround(map.visited, tx, ty);
      return { map, type: 'key', entity: target };
    }
    if (target.kind === 'lockedDoor') {
      if (target.keyId && (map.foundKeyIds ?? []).includes(target.keyId)) {
        const door = map.entities.find((entity) => entity.id === target.id)!;
        door.opened = true;
        door.locked = false;
        map.player.x = tx;
        map.player.y = ty;
        revealAround(map.visited, tx, ty);
        return { map, type: 'lockedDoor', entity: { ...door } };
      }
      return { map, type: 'blocked', entity: target };
    }
    if (target.kind === 'chest') {
      // 宝箱はその場で開ける（プレイヤーは進入しない）
      const chest = map.entities.find((e) => e.id === target.id)!;
      chest.opened = true;
      return { map, type: 'chest', entity: { ...chest } };
    }
    // 休息碑・記憶は通路を塞ぐ障害物ではない。踏んだうえでイベントを発生させる。
    if (target.kind === 'rest' || target.kind === 'memory') {
      map.player.x = tx;
      map.player.y = ty;
      revealAround(map.visited, tx, ty);
      return { map, type: target.kind, entity: target };
    }
  }

  // 通常移動
  map.player.x = tx;
  map.player.y = ty;
  revealAround(map.visited, tx, ty);

  const collided = stepEnemies(map);
  if (collided) return { map, type: 'encounter', entity: collided };

  return { map, type: 'moved' };
}

/** 戦闘勝利後、倒した敵エンティティをマップから取り除く */
export function removeEntity(map: DungeonMap, entityId: string): DungeonMap {
  return { ...map, entities: map.entities.filter((e) => e.id !== entityId) };
}
