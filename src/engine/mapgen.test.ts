import { describe, expect, it } from 'vitest';
import { generateDungeonMap } from './mapgen';
import { resolveMove } from './mapmove';
import type { DungeonMap } from '@/types';

function canReach(map: DungeonMap, target: { x: number; y: number }) {
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
      visited: Array.from({ length: 3 }, () => Array(5).fill(false)),
      isBossFloor: false,
    };

    const result = resolveMove(map, 1, 0);
    expect(result.type).toBe('rest');
    expect(result.map.player).toEqual({ x: 2, y: 1 });
  });
});
