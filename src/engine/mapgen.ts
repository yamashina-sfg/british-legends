import type { DungeonMap, MapEntity, RewardEntry, TileType } from '@/types';
import { getDungeon, getEnemy, getEquipment, getMaterial, getWorld, MATERIALS, STORE_ITEMS } from '@/data';

// ============================================================
// ダンジョンマップ自動生成（セルオートマトンで洞窟を生成）
// 出力は純粋なデータ（tiles + entities）。座標を動かせばそのまま移動・アニメ可能。
// ============================================================

const W = 15;
const H = 13;
const WALL_PROB = 0.42;
const CA_STEPS = 5;

type Grid = boolean[][]; // true = wall

const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;

function randomGrid(): Grid {
  const g: Grid = [];
  for (let y = 0; y < H; y++) {
    g[y] = [];
    for (let x = 0; x < W; x++) {
      // 外周は必ず壁
      g[y][x] = x === 0 || y === 0 || x === W - 1 || y === H - 1 ? true : Math.random() < WALL_PROB;
    }
  }
  return g;
}

function countWallNeighbors(g: Grid, x: number, y: number): number {
  let n = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (!inBounds(nx, ny) || g[ny][nx]) n++; // 範囲外は壁扱い
    }
  }
  return n;
}

function caStep(g: Grid): Grid {
  const next: Grid = g.map((row) => [...row]);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const walls = countWallNeighbors(g, x, y);
      next[y][x] = walls >= 5;
    }
  }
  return next;
}

/** 最大の連結床領域だけ残し、それ以外は壁で埋める。残った床マス一覧を返す。 */
function keepLargestRegion(g: Grid): { x: number; y: number }[] {
  const seen: boolean[][] = Array.from({ length: H }, () => Array(W).fill(false));
  let best: { x: number; y: number }[] = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (g[y][x] || seen[y][x]) continue;
      // BFSで床領域を収集
      const region: { x: number; y: number }[] = [];
      const queue = [{ x, y }];
      seen[y][x] = true;
      while (queue.length) {
        const c = queue.shift()!;
        region.push(c);
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = c.x + dx;
          const ny = c.y + dy;
          if (inBounds(nx, ny) && !g[ny][nx] && !seen[ny][nx]) {
            seen[ny][nx] = true;
            queue.push({ x: nx, y: ny });
          }
        }
      }
      if (region.length > best.length) best = region;
    }
  }
  // best 以外の床を壁に
  const keep = new Set(best.map((c) => `${c.x},${c.y}`));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!g[y][x] && !keep.has(`${x},${y}`)) g[y][x] = true;
    }
  }
  return best;
}

/** start から床のみを歩いて到達できるマスの距離マップ（-1=未到達） */
function bfsDistances(tiles: TileType[][], start: { x: number; y: number }): number[][] {
  const dist: number[][] = Array.from({ length: H }, () => Array(W).fill(-1));
  dist[start.y][start.x] = 0;
  const queue = [start];
  while (queue.length) {
    const c = queue.shift()!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = c.x + dx;
      const ny = c.y + dy;
      if (inBounds(nx, ny) && tiles[ny][nx] === 'floor' && dist[ny][nx] === -1) {
        dist[ny][nx] = dist[c.y][c.x] + 1;
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return dist;
}

const isFloor = (tiles: TileType[][], x: number, y: number) => inBounds(x, y) && tiles[y][x] === 'floor';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface FixedEntityTemplate {
  kind: MapEntity['kind'];
  enemyIds?: string[];
  materialId?: string;
  rewards?: RewardEntry[];
  keyId?: string;
  locked?: boolean;
  hidden?: boolean;
  label?: string;
  eventText?: string;
}

const RARE_EQUIPMENT: Record<string, string[]> = {
  beowulf: ['grendel_fang_blade', 'dragon_heart_mail'],
  hamlet: ['glass_rapier', 'royal_ring'],
  macbeth: ['witchfire_dagger', 'cursed_crown'],
};

const STORY_FRAGMENTS: Record<string, string[]> = {
  beowulf: ['heorot-song', 'mere-descent', 'dragon-cup'],
  hamlet: ['ghost-record', 'players-note', 'poisoned-cup'],
  macbeth: ['witch-prophecy', 'duncan-blood', 'birnam-branch'],
};

function chestRewards(worldId: string, floorIndex: number, materialId?: string): RewardEntry[] {
  const rewards: RewardEntry[] = [];
  if (materialId) rewards.push({ kind: 'material', id: materialId, qty: 1, label: getMaterial(materialId).name });
  const roll = Math.random();
  if (roll < 0.2) {
    const gold = 18 + floorIndex * 12 + Math.floor(Math.random() * 18);
    rewards.push({ kind: 'gold', id: 'gold', qty: gold, label: `${gold}G` });
  } else if (roll < 0.38) {
    const itemIds = Object.keys(STORE_ITEMS);
    const id = itemIds[Math.floor(Math.random() * itemIds.length)];
    rewards.push({ kind: 'item', id, qty: 1, label: STORE_ITEMS[id].name });
  } else if (roll < 0.58) {
    const pool = RARE_EQUIPMENT[worldId] ?? [];
    const id = pool[floorIndex % Math.max(1, pool.length)];
    if (id) rewards.push({ kind: 'equipment', id, qty: 1, label: getEquipment(id).name, rarity: 'rare' });
  } else if (roll < 0.74) {
    const skillByWorld: Record<string, string[]> = {
      beowulf: ['hero_roar', 'shield_oath'],
      hamlet: ['hesitation', 'poison_blade'],
      macbeth: ['prophecy', 'bloody_ambition'],
    };
    const pool = skillByWorld[worldId] ?? ['hero_roar'];
    rewards.push({ kind: 'skill', id: pool[floorIndex % pool.length], qty: 1, label: 'スキルブック', rarity: 'rare' });
  } else if (roll < 0.88) {
    rewards.push({ kind: 'codex', id: `codex_story_${worldId}`, qty: 1, label: '図鑑ページ' });
  } else {
    const pool = STORY_FRAGMENTS[worldId] ?? [`${worldId}-fragment`];
    rewards.push({ kind: 'story', id: pool[floorIndex % pool.length], qty: 1, label: 'ストーリー断片', rarity: 'rare' });
  }
  return rewards;
}

function secretRewards(worldId: string, floorIndex: number): RewardEntry[] {
  const equipmentId = RARE_EQUIPMENT[worldId]?.[(floorIndex + 1) % 2];
  return [
    ...(equipmentId ? [{ kind: 'equipment' as const, id: equipmentId, qty: 1, label: getEquipment(equipmentId).name, rarity: 'rare' as const }] : []),
    { kind: 'codex', id: `codex_story_${worldId}`, qty: 1, label: '図鑑ページ' },
    { kind: 'gold', id: 'gold', qty: 30 + floorIndex * 15, label: 'Gold' },
  ];
}

const BEOWULF_FIXED_FLOORS: Array<{
  name: string;
  rows: string[];
  markers: Record<string, FixedEntityTemplate>;
}> = [
  {
    name: 'ヘオロットの酒宴場',
    rows: [
      '###############',
      '#.............#',
      '#.###.....###.#',
      '#...#..C..#...#',
      '#...#.....#...#',
      '#...###.###...#',
      '#......P......#',
      '#..G......C...#',
      '#.....R.......#',
      '#...#####.....#',
      '#.........G.S.#',
      '#.............#',
      '###############',
    ],
    markers: {
      G: { kind: 'enemy', enemyIds: ['grendel'], label: 'Grendel' },
      C: { kind: 'chest', materialId: 'grendel_claw', label: 'Grendel Claw' },
      R: { kind: 'rest', label: '休息碑' },
      S: { kind: 'stairs', label: '階段' },
    },
  },
  {
    name: 'グレンデル母の沼',
    rows: [
      '###############',
      '#P............#',
      '#.##..#..###..#',
      '#..#.....#....#',
      '#..#.~~~.#.##.#',
      '#.....~.....#.#',
      '#.##..G..C..#.#',
      '#..#.....#....#',
      '#..###.###.##.#',
      '#..M...G....S.#',
      '#.............#',
      '#.............#',
      '###############',
    ],
    markers: {
      G: { kind: 'enemy', enemyIds: ['grendels_mother'], label: "Grendel's Mother" },
      C: { kind: 'chest', materialId: 'monster_fang', label: 'Monster Fang' },
      M: { kind: 'memory', label: '記憶の断片', eventText: '水辺に、怪物の母が子を悼む声だけが残っている。' },
      S: { kind: 'stairs', label: '階段' },
    },
  },
  {
    name: '竜の塚・灼熱の回廊',
    rows: [
      '###############',
      '#P............#',
      '#.#####.#####.#',
      '#.....#.....#.#',
      '###.#.#.###.#.#',
      '#...#...#...#.#',
      '#.###.###.###.#',
      '#...#.....#...#',
      '#.#.#####.#.#.#',
      '#.#...C...#.#.#',
      '#...R...M...B.#',
      '#.............#',
      '###############',
    ],
    markers: {
      C: { kind: 'chest', materialId: 'dragon_scale', label: 'Dragon Scale' },
      R: { kind: 'rest', label: '休息碑' },
      M: { kind: 'memory', label: '記憶の断片', eventText: '黄金の杯が、眠れる竜の怒りを呼び覚ました。' },
      B: { kind: 'boss', enemyIds: ['dragon'], label: 'Dragon' },
    },
  },
];

const HAMLET_FIXED_FLOORS: typeof BEOWULF_FIXED_FLOORS = [
  {
    name: 'エルシノア城・城壁',
    rows: [
      '###############',
      '#P....M.......#',
      '#.#####.#####.#',
      '#.....#.....#.#',
      '#..G..#..C..#.#',
      '#.....#.....#.#',
      '###.###.###.#.#',
      '#...#.....#...#',
      '#.R.#..H..###.#',
      '#...#.....#...#',
      '#...#####...S.#',
      '#.............#',
      '###############',
    ],
    markers: {
      G: { kind: 'enemy', enemyIds: ['ghost'], label: 'Ghost' },
      H: { kind: 'enemy', enemyIds: ['ghost', 'royal_guard'], label: 'Ambush' },
      C: { kind: 'chest', materialId: 'ghost_fragment', label: 'Ghost Fragment' },
      R: { kind: 'rest', label: '祈りの間' },
      M: { kind: 'memory', label: '亡霊の囁き', eventText: '「覚えていろ。毒は眠りの姿をして王座へ忍び込む。」' },
      S: { kind: 'stairs', label: '階段' },
    },
  },
  {
    name: 'エルシノア城・謁見の間',
    rows: [
      '###############',
      '#P............#',
      '#.###.###.###.#',
      '#...#..C..#...#',
      '#...#.....#...#',
      '#...###.###...#',
      '#..R...G......#',
      '#.#####.#####.#',
      '#.....#.....#.#',
      '#..H..#..G..S.#',
      '#.............#',
      '#.............#',
      '###############',
    ],
    markers: {
      G: { kind: 'enemy', enemyIds: ['royal_guard'], label: 'Royal Guard' },
      H: { kind: 'enemy', enemyIds: ['ghost', 'ghost'], label: 'Ghosts' },
      C: { kind: 'chest', materialId: 'broken_crown', label: 'Broken Crown' },
      R: { kind: 'memory', label: '芝居の罠', eventText: '上演された罪は、王の顔から血の気を奪った。' },
      S: { kind: 'stairs', label: '階段' },
    },
  },
  {
    name: '玉座の間・毒杯の決闘',
    rows: [
      '###############',
      '#P............#',
      '#.#####.#####.#',
      '#.....#.....#.#',
      '#.M...#...C.#.#',
      '#.....#.....#.#',
      '###.###.###.#.#',
      '#...#..R..#...#',
      '#...#.....###.#',
      '#...#####...B.#',
      '#.............#',
      '#.............#',
      '###############',
    ],
    markers: {
      C: { kind: 'chest', materialId: 'memory_of_revenge', label: 'Memory of Revenge' },
      R: { kind: 'rest', label: '祈りの間' },
      M: { kind: 'memory', label: '毒杯', eventText: '銀の杯に、祈りでは消せない濁りが沈んでいる。' },
      B: { kind: 'boss', enemyIds: ['claudius'], label: 'Claudius' },
    },
  },
];

const MACBETH_FIXED_FLOORS: typeof BEOWULF_FIXED_FLOORS = [
  {
    name: '荒野の魔女道',
    rows: [
      '###############',
      '#P....M.......#',
      '#.~~~.###.~~~.#',
      '#.....#...W...#',
      '#.###.#.###.#.#',
      '#...#...#...#.#',
      '#.W.###.#.C.#.#',
      '#.......#.....#',
      '#.###.###.###.#',
      '#...R.....W.S.#',
      '#.............#',
      '#.............#',
      '###############',
    ],
    markers: {
      W: { kind: 'enemy', enemyIds: ['witch'], label: 'Witch' },
      C: { kind: 'chest', materialId: 'witch_scroll', label: 'Witch Scroll' },
      R: { kind: 'rest', label: '焚火跡' },
      M: { kind: 'memory', label: '予言', eventText: '「いずれ王となるお方」その一言が、剣より深く胸へ刺さる。' },
      S: { kind: 'stairs', label: '階段' },
    },
  },
  {
    name: 'ダンシネイン城・血の回廊',
    rows: [
      '###############',
      '#P............#',
      '#.###.###.###.#',
      '#...#..S..#...#',
      '#.B.#.....#..C#',
      '#...###.###...#',
      '#.......R.....#',
      '#.###.#####.#.#',
      '#...#..G..#...#',
      '#...#.....#...#',
      '#.M.......#...#',
      '#.............#',
      '###############',
    ],
    markers: {
      S: { kind: 'stairs', label: '階段' },
      B: { kind: 'enemy', enemyIds: ['banquos_ghost'], label: "Banquo's Ghost" },
      G: { kind: 'enemy', enemyIds: ['soldier', 'soldier'], label: 'Guards' },
      C: { kind: 'chest', materialId: 'blood_relic', label: 'Blood Relic' },
      R: { kind: 'rest', label: '古い礼拝堂' },
      M: { kind: 'memory', label: '血の染み', eventText: '洗っても、洗っても、血の匂いだけが落ちない。' },
    },
  },
  {
    name: '運命の間・動く森',
    rows: [
      '###############',
      '#P............#',
      '#.#####.#####.#',
      '#.....#.....#.#',
      '#.M...#..C..#.#',
      '#.....#.....#.#',
      '#.###.###.###.#',
      '#...#..R..#...#',
      '#...#.....###.#',
      '#...#####...B.#',
      '#.............#',
      '#.............#',
      '###############',
    ],
    markers: {
      C: { kind: 'chest', materialId: 'cursed_crown', label: 'Cursed Crown' },
      R: { kind: 'rest', label: '崩れた王座' },
      M: { kind: 'memory', label: '動く森', eventText: '森が動くはずはない。だが足音は、確かに近づいている。' },
      B: { kind: 'boss', enemyIds: ['macbeths_fate'], label: "Macbeth's Fate" },
    },
  },
];

function fixedMapFromTemplates(worldId: string, floorIndex: number, templates: typeof BEOWULF_FIXED_FLOORS): DungeonMap {
  const template = templates[Math.min(floorIndex, templates.length - 1)];
  const entities: MapEntity[] = [];
  let player = { x: 1, y: 1 };
  let counter = 0;
  const tiles: TileType[][] = template.rows.map((row, y) => {
    if (row.length !== W) throw new Error(`Invalid fixed Beowulf map row width: ${row}`);
    return [...row].map((cell, x) => {
      if (cell === '#') return 'wall';
      if (cell === '~') return 'water';
      if (cell === 'P') player = { x, y };
      const marker = template.markers[cell];
      if (marker) {
        entities.push({
          id: `fixed_${floorIndex}_${counter++}`,
          kind: marker.kind,
          x,
          y,
          enemyIds: marker.enemyIds,
          materialId: marker.materialId,
          rewards: marker.kind === 'chest' ? (marker.rewards ?? chestRewards(worldId, floorIndex, marker.materialId)) : marker.rewards,
          keyId: marker.keyId,
          locked: marker.locked,
          hidden: marker.hidden,
          opened: marker.kind === 'chest' ? false : undefined,
          label: marker.label,
          eventText: marker.eventText,
        });
      }
      return 'floor';
    });
  });
  const visited = Array.from({ length: H }, () => Array(W).fill(false));
  revealAround(visited, player.x, player.y);
  const isBossFloor = entities.some((entity) => entity.kind === 'boss');
  enrichFixedExploration(worldId, floorIndex, tiles, player, entities, isBossFloor, counter);
  return {
    worldId,
    floorIndex,
    floorName: template.name,
    width: W,
    height: H,
    tiles,
    player,
    entities,
    foundKeyIds: [],
    discoveredSecretIds: [],
    visited,
    isBossFloor,
  };
}

function enrichFixedExploration(
  worldId: string,
  floorIndex: number,
  tiles: TileType[][],
  player: { x: number; y: number },
  entities: MapEntity[],
  isBossFloor: boolean,
  startCounter: number,
) {
  let counter = startCounter;
  const occupied = (x: number, y: number) => entities.some((entity) => entity.x === x && entity.y === y);
  const floorCells: { x: number; y: number; dist: number }[] = [];
  for (let y = 1; y < H - 1; y += 1) {
    for (let x = 1; x < W - 1; x += 1) {
      if (tiles[y][x] !== 'floor' || occupied(x, y) || (x === player.x && y === player.y)) continue;
      floorCells.push({ x, y, dist: Math.abs(player.x - x) + Math.abs(player.y - y) });
    }
  }
  floorCells.sort((a, b) => b.dist - a.dist);

  if (!isBossFloor) {
    const key = floorCells[Math.floor(floorCells.length * 0.45)] ?? floorCells[0];
    const door = floorCells[0];
    if (key && door) {
      const keyId = `${worldId}-f${floorIndex}-archive-key`;
      entities.push({ id: `fixed_${floorIndex}_${counter++}`, kind: 'key', x: key.x, y: key.y, keyId, label: '書庫の鍵' });
      entities.push({ id: `fixed_${floorIndex}_${counter++}`, kind: 'lockedDoor', x: door.x, y: door.y, keyId, locked: true, label: '鍵付き扉' });
      const sideChest = floorCells.find((cell) => Math.abs(cell.x - door.x) + Math.abs(cell.y - door.y) <= 3 && !occupied(cell.x, cell.y));
      if (sideChest) {
        entities.push({
          id: `fixed_${floorIndex}_${counter++}`,
          kind: 'chest',
          x: sideChest.x,
          y: sideChest.y,
          rewards: chestRewards(worldId, floorIndex),
          opened: false,
          label: '封印宝箱',
        });
      }
    }
  }

  const candidates = floorCells.flatMap((anchor) =>
    ([[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][])
      .map(([dx, dy]) => ({ x: anchor.x + dx, y: anchor.y + dy }))
      .filter((cell) => cell.x > 0 && cell.y > 0 && cell.x < W - 1 && cell.y < H - 1 && tiles[cell.y][cell.x] === 'wall' && !occupied(cell.x, cell.y)),
  );
  const secret = candidates[Math.floor(candidates.length * 0.35)] ?? candidates[0];
  if (secret) {
    entities.push({
      id: `fixed_${floorIndex}_${counter++}`,
      kind: 'secretDoor',
      x: secret.x,
      y: secret.y,
      hidden: true,
      opened: false,
      rewards: secretRewards(worldId, floorIndex),
      label: '秘密部屋',
    });
  }
}

/** ワールドの素材からランダムに1つ */
function randomMaterialId(worldId: string): string {
  const ids = Object.values(MATERIALS)
    .filter((m) => m.worldId === worldId)
    .map((m) => m.id);
  return ids[Math.floor(Math.random() * ids.length)] ?? Object.keys(MATERIALS)[0];
}

/**
 * 指定ワールド・フロアのマップを生成する。
 * フロアのnodes構成から、戦闘グループ数・ボス有無を読み取って敵を配置する。
 */
export function generateDungeonMap(worldId: string, floorIndex: number): DungeonMap {
  if (worldId === 'beowulf') return fixedMapFromTemplates('beowulf', floorIndex, BEOWULF_FIXED_FLOORS);
  if (worldId === 'hamlet') return fixedMapFromTemplates('hamlet', floorIndex, HAMLET_FIXED_FLOORS);
  if (worldId === 'macbeth') return fixedMapFromTemplates('macbeth', floorIndex, MACBETH_FIXED_FLOORS);

  const dungeon = getDungeon(getWorld(worldId).dungeonId);
  const floor = dungeon.floors[floorIndex];
  const battleGroups = floor.nodes.filter((n) => n.type === 'battle').map((n) => n.enemyIds ?? []);
  const bossNode = floor.nodes.find((n) => n.type === 'boss');
  const isBossFloor = !!bossNode;

  // --- 連結床が十分取れるまで生成リトライ ---
  let tiles: TileType[][] = [];
  let floors: { x: number; y: number }[] = [];
  for (let attempt = 0; attempt < 30; attempt++) {
    let g = randomGrid();
    for (let i = 0; i < CA_STEPS; i++) g = caStep(g);
    const region = keepLargestRegion(g);
    if (region.length >= 50) {
      tiles = g.map((row) => row.map((w) => (w ? 'wall' : 'floor') as TileType));
      floors = region;
      break;
    }
  }
  if (floors.length === 0) {
    // フォールバック：全面床の部屋
    tiles = Array.from({ length: H }, (_, y) =>
      Array.from({ length: W }, (_, x) => (x === 0 || y === 0 || x === W - 1 || y === H - 1 ? 'wall' : 'floor')),
    );
    floors = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) floors.push({ x, y });
  }

  // --- プレイヤー開始位置 ---
  const player = floors[Math.floor(Math.random() * floors.length)];
  const dist = bfsDistances(tiles, player);

  // --- 配置候補：プレイヤーから一定距離離れた床（到達可能） ---
  const reachable = floors.filter((c) => dist[c.y][c.x] >= 0);
  const occupied = new Set<string>([`${player.x},${player.y}`]);
  const take = (minDist: number): { x: number; y: number } | null => {
    const pool = shuffle(reachable.filter((c) => dist[c.y][c.x] >= minDist && !occupied.has(`${c.x},${c.y}`)));
    const pick = pool[0] ?? null;
    if (pick) occupied.add(`${pick.x},${pick.y}`);
    return pick;
  };

  const entities: MapEntity[] = [];
  let counter = 0;

  // 階段 or ボス（最遠地点付近）
  const farTile = reachable.reduce((a, b) => (dist[b.y][b.x] > dist[a.y][a.x] ? b : a), player);
  occupied.add(`${farTile.x},${farTile.y}`);
  if (isBossFloor) {
    const bossEnemy = (bossNode?.enemyIds ?? [])[0];
    entities.push({
      id: `e${counter++}`,
      kind: 'boss',
      x: farTile.x,
      y: farTile.y,
      enemyIds: bossNode?.enemyIds ?? [],
      label: bossEnemy ? getEnemy(bossEnemy).name : 'Boss',
    });
  } else {
    entities.push({ id: `e${counter++}`, kind: 'stairs', x: farTile.x, y: farTile.y, label: '階段' });
  }

  // 敵グループ
  for (const group of battleGroups) {
    const tile = take(3);
    if (!tile) break;
    const lead = group[0];
    entities.push({
      id: `e${counter++}`,
      kind: 'enemy',
      x: tile.x,
      y: tile.y,
      enemyIds: group,
      label: lead ? getEnemy(lead).name : '敵',
    });
  }

  // 宝箱（1〜2個）
  const chestCount = 1 + (Math.random() < 0.5 ? 1 : 0);
  for (let i = 0; i < chestCount; i++) {
    const tile = take(2);
    if (!tile) break;
    const matId = randomMaterialId(worldId);
    entities.push({
      id: `e${counter++}`,
      kind: 'chest',
      x: tile.x,
      y: tile.y,
      materialId: matId,
      rewards: chestRewards(worldId, floorIndex, matId),
      opened: false,
      label: getMaterial(matId).name,
    });
  }

  // 枝道の報酬：休息碑と、作品を匂わせる一文。
  const restTile = take(4);
  if (restTile) entities.push({ id: `e${counter++}`, kind: 'rest', x: restTile.x, y: restTile.y, label: '休息碑' });
  const memory = floor.nodes.find((node) => node.type === 'event');
  const memoryTile = memory ? take(4) : null;
  if (memoryTile && memory?.eventText) {
    entities.push({ id: `e${counter++}`, kind: 'memory', x: memoryTile.x, y: memoryTile.y, label: '記憶の断片', eventText: memory.eventText });
  }

  // --- 水たまり（装飾。連結性を壊さない範囲で） ---
  addWaterPools(tiles, player, entities);

  // --- 探索済みフラグ（開始地点周辺を可視化） ---
  const visited = Array.from({ length: H }, () => Array(W).fill(false));
  revealAround(visited, player.x, player.y);

  return {
    worldId,
    floorIndex,
    floorName: floor.name,
    width: W,
    height: H,
    tiles,
    player: { x: player.x, y: player.y },
    entities,
    foundKeyIds: [],
    discoveredSecretIds: [],
    visited,
    isBossFloor,
  };
}

/** プレイヤー・全エンティティの到達性を壊さないように水たまりを足す */
function addWaterPools(tiles: TileType[][], player: { x: number; y: number }, entities: MapEntity[]) {
  const required = [player, ...entities.map((e) => ({ x: e.x, y: e.y }))];
  const pools = 1 + Math.floor(Math.random() * 2);
  for (let p = 0; p < pools; p++) {
    // 種を選ぶ（エンティティ・プレイヤーから離れた床）
    const candidates: { x: number; y: number }[] = [];
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++)
        if (tiles[y][x] === 'floor' && !required.some((r) => Math.abs(r.x - x) + Math.abs(r.y - y) <= 1))
          candidates.push({ x, y });
    if (candidates.length === 0) continue;
    const seed = candidates[Math.floor(Math.random() * candidates.length)];

    // 種から小さなブロブを成長
    const blob: { x: number; y: number }[] = [seed];
    const size = 2 + Math.floor(Math.random() * 4);
    while (blob.length < size) {
      const base = blob[Math.floor(Math.random() * blob.length)];
      const dirs = shuffle([
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]);
      let grew = false;
      for (const [dx, dy] of dirs) {
        const nx = base.x + dx;
        const ny = base.y + dy;
        if (
          isFloor(tiles, nx, ny) &&
          !blob.some((b) => b.x === nx && b.y === ny) &&
          !required.some((r) => r.x === nx && r.y === ny)
        ) {
          blob.push({ x: nx, y: ny });
          grew = true;
          break;
        }
      }
      if (!grew) break;
    }

    // 暫定的に水にして到達性チェック
    for (const c of blob) tiles[c.y][c.x] = 'water';
    const dist = bfsDistances(tiles, player);
    const ok = required.every((r) => (r.x === player.x && r.y === player.y) || dist[r.y][r.x] >= 0);
    if (!ok) for (const c of blob) tiles[c.y][c.x] = 'floor'; // 巻き戻し
  }
}

/** 半径1を探索済みに */
export function revealAround(visited: boolean[][], cx: number, cy: number) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      if (inBounds(x, y)) visited[y][x] = true;
    }
  }
}

/** 探索率（%）：探索済み床マス / 全床マス */
export function explorationRate(map: DungeonMap): number {
  let total = 0;
  let seen = 0;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.tiles[y][x] === 'floor') {
        total++;
        if (map.visited[y][x]) seen++;
      }
    }
  }
  return total === 0 ? 0 : Math.round((seen / total) * 100);
}
