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
