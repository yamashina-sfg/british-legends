import { describe, expect, it } from 'vitest';
import { generateDungeonMap } from './mapgen';
import { resolveMove } from './mapmove';
import type { DungeonMap } from '@/types';

function canReach(map: DungeonMap, target: { x: number; y: number }): boolean {
  if (map.tiles[target.y]?.[target.x] !== 'floor') {
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const x = target.x + dx;
      const y = target.y + dy;
      return x >= 0 && y >= 0 && x < map.width && y < map.height && map.tiles[y][x] === 'floor' && canReach(map, { x, y });
    });
  }
  const seen = new Set<string>([`${map.player.x},${map.player.y}`]);
  const queue = [{ ...map.player }];
  while (queue.length) {
    const current = queue.shift()!;
    if (current.x === target.x && current.y === target.y) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = current.x + dx;
      const y = current.y + dy;
      const key = `${x},${y}`;
      if (x < 0 || y < 0 || x >= map.width || y >= map.height || seen.has(key) || map.tiles[y][x] !== 'floor') continue;
      seen.add(key);
      queue.push({ x, y });
    }
  }
  return false;
}

describe('dungeon accessibility', () => {
  it('always places a reachable staircase on non-boss floors', () => {
    for (let index = 0; index < 50; index++) {
      const map = generateDungeonMap('beowulf', 0);
      const stairs = map.entities.find((entity) => entity.kind === 'stairs');
      expect(stairs).toBeDefined();
      expect(canReach(map, stairs!)).toBe(true);
    }
  });

  it('keeps every Beowulf fixed-floor objective reachable', () => {
    for (let floor = 0; floor < 3; floor++) {
      const map = generateDungeonMap('beowulf', floor);
      for (const entity of map.entities) {
        expect(canReach(map, entity)).toBe(true);
      }
    }
  });

  it('keeps curated exploration light: one locked door and one secret room per core work', () => {
    for (const worldId of ['beowulf', 'hamlet', 'macbeth']) {
      const maps = [0, 1, 2].map((floor) => generateDungeonMap(worldId, floor));
      const entities = maps.flatMap((map) => map.entities);
      expect(entities.filter((entity) => entity.kind === 'lockedDoor')).toHaveLength(1);
      expect(entities.filter((entity) => entity.kind === 'secretDoor')).toHaveLength(1);
      expect(entities.filter((entity) => entity.kind === 'memory' && entity.label === 'Lost Page')).toHaveLength(3);
    }
  });

  it('places dungeon keys in local chests or short events instead of save-wide inventory', () => {
    const beowulf = generateDungeonMap('beowulf', 0);
    expect(beowulf.entities.some((entity) => entity.kind === 'chest' && entity.rewards?.some((reward) => reward.kind === 'key'))).toBe(true);

    const hamlet = generateDungeonMap('hamlet', 1);
    expect(hamlet.entities.some((entity) => entity.kind === 'memory' && entity.rewards?.some((reward) => reward.kind === 'key'))).toBe(true);

    const macbeth = generateDungeonMap('macbeth', 0);
    expect(macbeth.entities.some((entity) => entity.kind === 'chest' && entity.rewards?.some((reward) => reward.kind === 'key'))).toBe(true);
  });

  it('allows the player to step through a rest event instead of blocking a corridor', () => {
    const map: DungeonMap = {
      worldId: 'beowulf', floorIndex: 0, floorName: 'test', width: 5, height: 3,
      tiles: [
        ['wall', 'wall', 'wall', 'wall', 'wall'],
        ['wall', 'floor', 'floor', 'floor', 'wall'],
        ['wall', 'wall', 'wall', 'wall', 'wall'],
      ],
      player: { x: 1, y: 1 },
      entities: [{ id: 'rest', kind: 'rest', x: 2, y: 1, label: '休息碑' }],
      foundKeyIds: [],
      discoveredSecretIds: [],
      visited: Array.from({ length: 3 }, () => Array(5).fill(false)),
      isBossFloor: false,
    };

    const result = resolveMove(map, 1, 0);
    expect(result.type).toBe('rest');
    expect(result.map.player).toEqual({ x: 2, y: 1 });
  });

  it('lets a chest key open a local locked door without save-wide key inventory', () => {
    const map: DungeonMap = {
      worldId: 'beowulf', floorIndex: 0, floorName: 'test', width: 6, height: 3,
      tiles: [
        ['wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
        ['wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
        ['wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
      ],
      player: { x: 1, y: 1 },
      entities: [
        { id: 'chest', kind: 'chest', x: 2, y: 1, opened: false, rewards: [{ kind: 'key', id: 'test-key', qty: 1, label: 'Test Key' }] },
        { id: 'door', kind: 'lockedDoor', x: 3, y: 1, keyId: 'test-key', locked: true, rewards: [{ kind: 'gold', id: 'gold', qty: 50 }] },
      ],
      foundKeyIds: [],
      discoveredSecretIds: [],
      visited: Array.from({ length: 3 }, () => Array(6).fill(false)),
      isBossFloor: false,
    };

    const openedChest = resolveMove(map, 1, 0);
    expect(openedChest.type).toBe('chest');
    expect(openedChest.map.foundKeyIds).toContain('test-key');

    const openedDoor = resolveMove({ ...openedChest.map, player: { x: 2, y: 1 } }, 1, 0);
    expect(openedDoor.type).toBe('lockedDoor');
    expect(openedDoor.map.entities.find((entity) => entity.id === 'door')).toMatchObject({ opened: true, locked: false });
  });

  it('reveals a secret room wall when the player investigates it', () => {
    const map: DungeonMap = {
      worldId: 'hamlet', floorIndex: 0, floorName: 'test', width: 5, height: 4,
      tiles: [
        ['wall', 'wall', 'wall', 'wall', 'wall'],
        ['wall', 'floor', 'wall', 'floor', 'wall'],
        ['wall', 'floor', 'floor', 'floor', 'wall'],
        ['wall', 'wall', 'wall', 'wall', 'wall'],
      ],
      player: { x: 1, y: 1 },
      entities: [{ id: 'secret', kind: 'secretDoor', x: 2, y: 1, hidden: true, opened: false, rewards: [{ kind: 'codex', id: 'codex_page_hamlet_elsinore', qty: 1 }] }],
      foundKeyIds: [],
      discoveredSecretIds: [],
      visited: Array.from({ length: 4 }, () => Array(5).fill(false)),
      isBossFloor: false,
    };

    const result = resolveMove(map, 1, 0);
    expect(result.type).toBe('secret');
    expect(result.map.tiles[1][2]).toBe('floor');
    expect(result.map.discoveredSecretIds).toContain('secret');
  });

  it('moves normal enemies into the player but keeps boss encounters stationary', () => {
    const map: DungeonMap = {
      worldId: 'beowulf', floorIndex: 0, floorName: 'test', width: 6, height: 5,
      tiles: [
        ['wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
        ['wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
        ['wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
        ['wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
        ['wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
      ],
      player: { x: 2, y: 2 },
      entities: [
        { id: 'enemy', kind: 'enemy', x: 4, y: 2, enemyIds: ['grendel'], label: 'Grendel' },
        { id: 'boss', kind: 'boss', x: 4, y: 3, enemyIds: ['dragon'], label: 'Dragon' },
      ],
      foundKeyIds: [],
      discoveredSecretIds: [],
      visited: Array.from({ length: 5 }, () => Array(6).fill(false)),
      isBossFloor: true,
    };

    const result = resolveMove(map, 0, -1);
    const enemy = result.map.entities.find((entity) => entity.id === 'enemy');
    const boss = result.map.entities.find((entity) => entity.id === 'boss');
    expect(enemy).toMatchObject({ x: 3, y: 2 });
    expect(boss).toMatchObject({ x: 4, y: 3 });
  });
});
