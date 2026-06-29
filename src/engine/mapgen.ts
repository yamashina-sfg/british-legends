import type { DungeonMap, MapEntity, TileType } from '@/types';
import { getDungeon, getEnemy, getMaterial, getWorld, MATERIALS } from '@/data';

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
  label?: string;
  eventText?: string;
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
  return {
    worldId,
    floorIndex,
    floorName: template.name,
    width: W,
    height: H,
    tiles,
    player,
    entities,
    visited,
    isBossFloor: entities.some((entity) => entity.kind === 'boss'),
  };
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
