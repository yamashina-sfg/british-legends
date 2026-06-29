import type { DungeonMap, MapEntity, RewardEntry, TileType } from '@/types';
import { CODEX, EQUIPMENT, getDungeon, getEnemy, getEquipment, getMaterial, getWorld, MATERIALS, STORE_ITEMS } from '@/data';

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

/** ワールドの素材からランダムに1つ */
function randomMaterialId(worldId: string): string {
  const ids = Object.values(MATERIALS)
    .filter((m) => m.worldId === worldId)
    .map((m) => m.id);
  return ids[Math.floor(Math.random() * ids.length)] ?? Object.keys(MATERIALS)[0];
}

const WORLD_STORY: Record<string, string[]> = {
  beowulf: ['heorot-song', 'mere-descent', 'dragon-cup'],
  hamlet: ['ghost-record', 'players-note', 'poisoned-cup'],
  macbeth: ['witch-prophecy', 'duncan-blood', 'birnam-branch'],
};

const RARE_EQUIPMENT: Record<string, string[]> = {
  beowulf: ['grendel_fang_blade', 'dragon_heart_mail'],
  hamlet: ['royal_ring', 'glass_rapier'],
  macbeth: ['cursed_crown', 'witchfire_dagger'],
};

function randomCodexId(worldId: string): string {
  const ids = Object.keys(CODEX).filter((id) => CODEX[id].refId.includes(worldId) || id.endsWith(worldId));
  return ids[Math.floor(Math.random() * ids.length)] ?? `codex_world_${worldId}`;
}

function makeRewards(worldId: string, depth: number, forced?: RewardEntry): RewardEntry[] {
  if (forced) return [forced];
  const roll = Math.random();
  if (roll < 0.28) {
    const id = randomMaterialId(worldId);
    return [{ kind: 'material', id, qty: 1 + (Math.random() < 0.35 ? 1 : 0), label: getMaterial(id).name }];
  }
  if (roll < 0.46) {
    const qty = 10 + depth * 8 + Math.floor(Math.random() * 18);
    return [{ kind: 'gold', id: 'gold', qty, label: `${qty}G` }];
  }
  if (roll < 0.62) {
    const ids = Object.keys(STORE_ITEMS);
    const id = ids[Math.floor(Math.random() * ids.length)];
    return [{ kind: 'item', id, qty: 1, label: STORE_ITEMS[id].name }];
  }
  if (roll < 0.76) {
    const pool = RARE_EQUIPMENT[worldId] ?? Object.keys(EQUIPMENT).filter((id) => EQUIPMENT[id].worldId === worldId);
    const id = pool[Math.floor(Math.random() * pool.length)];
    return [{ kind: 'equipment', id, qty: 1, label: getEquipment(id).name, rarity: 'rare' }];
  }
  if (roll < 0.88) {
    const skillByWorld: Record<string, string[]> = {
      beowulf: ['hero_roar', 'last_stand'],
      hamlet: ['poison_blade', 'to_be_or_not'],
      macbeth: ['prophecy', 'bloody_crown'],
    };
    const pool = skillByWorld[worldId] ?? ['hero_roar'];
    return [{ kind: 'skill', id: pool[Math.floor(Math.random() * pool.length)], qty: 1, label: 'スキルブック' }];
  }
  if (roll < 0.95) return [{ kind: 'codex', id: randomCodexId(worldId), qty: 1, label: '図鑑ページ' }];
  const story = WORLD_STORY[worldId] ?? [`${worldId}-fragment`];
  return [{ kind: 'story', id: story[Math.floor(Math.random() * story.length)], qty: 1, label: 'ストーリー断片', rarity: 'rare' }];
}

/**
 * 指定ワールド・フロアのマップを生成する。
 * フロアのnodes構成から、戦闘グループ数・ボス有無を読み取って敵を配置する。
 */
export function generateDungeonMap(worldId: string, floorIndex: number): DungeonMap {
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

  if (!isBossFloor) {
    const keyTile = take(2);
    const doorTile = take(5);
    if (keyTile && doorTile) {
      const keyId = `${worldId}-f${floorIndex}-iron-key`;
      entities.push({ id: `e${counter++}`, kind: 'key', x: keyTile.x, y: keyTile.y, keyId, label: '古い鍵' });
      entities.push({ id: `e${counter++}`, kind: 'lockedDoor', x: doorTile.x, y: doorTile.y, keyId, locked: true, label: '鍵付き扉' });
    }
  }

  // 宝箱（2〜3個）。素材だけでなく装備・Gold・スキルブック・図鑑・回復薬が出る。
  const chestCount = 2 + (Math.random() < 0.45 ? 1 : 0);
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
      rewards: makeRewards(worldId, floorIndex),
      opened: false,
      label: '宝箱',
    });
  }

  const secretCandidates = shuffle(
    reachable.flatMap((anchor) =>
      ([[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][])
        .map(([dx, dy]) => ({ anchor, x: anchor.x + dx, y: anchor.y + dy }))
        .filter((candidate) => inBounds(candidate.x, candidate.y) && tiles[candidate.y][candidate.x] === 'wall'),
    ),
  );
  const secret = secretCandidates[0];
  if (secret) {
      const equipmentId = RARE_EQUIPMENT[worldId]?.[floorIndex % 2] ?? 'hero_sword';
      entities.push({
        id: `e${counter++}`,
        kind: 'secretDoor',
        x: secret.x,
        y: secret.y,
        hidden: true,
        opened: false,
        rewards: [
          { kind: 'equipment', id: equipmentId, qty: 1, label: getEquipment(equipmentId).name, rarity: 'rare' },
          { kind: 'codex', id: randomCodexId(worldId), qty: 1, label: '図鑑ページ' },
        ],
        label: '秘密部屋',
      });
  }

  // 枝道の報酬：休息碑と、作品を匂わせる一文。
  const restTile = take(4);
  if (restTile) entities.push({ id: `e${counter++}`, kind: 'rest', x: restTile.x, y: restTile.y, label: '休息碑' });
  const eventTexts = [
    floor.nodes.find((node) => node.type === 'event')?.eventText,
    '古い本を読む。余白に攻略のヒントが書かれている。',
    '司書の記録を見つけた。失われた章の位置が少し分かった。',
    '文学資料のページが舞い、図鑑の空白が埋まっていく。',
  ].filter(Boolean) as string[];
  const memory = eventTexts.length ? eventTexts[Math.floor(Math.random() * eventTexts.length)] : null;
  const memoryTile = memory ? take(4) : null;
  if (memoryTile && memory) {
    entities.push({ id: `e${counter++}`, kind: 'memory', x: memoryTile.x, y: memoryTile.y, label: '記憶の断片', eventText: memory });
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
