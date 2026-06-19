// ============================================================
// British Legends - 型定義
// マスターデータ（静的・読み取り専用）とセーブデータ（動的）を分離
// ============================================================

// --- 基本ステータス -----------------------------------------
export interface Stats {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  spd: number;
}

// --- スキル -------------------------------------------------
export type SkillType = 'attack' | 'heal' | 'buff' | 'debuff';
export type SkillTarget = 'single' | 'all' | 'self';

export interface Skill {
  id: string;
  name: string;
  type: SkillType;
  target: SkillTarget;
  mpCost: number;
  /** attack: ダメージ倍率, heal: 回復量, buff/debuff: 効果量 */
  power: number;
  description: string;
}

// --- 素材 ---------------------------------------------------
export interface Material {
  id: string;
  name: string;
  worldId: string;
  description: string;
  iconId: string;
}

// --- 敵 -----------------------------------------------------
export interface DropEntry {
  materialId: string;
  /** 0..1 のドロップ確率 */
  rate: number;
}

export interface Enemy {
  id: string;
  name: string;
  worldId: string;
  spriteId: string;
  stats: Stats;
  exp: number;
  skillIds: string[];
  dropTable: DropEntry[];
  isBoss?: boolean;
}

// --- 進化段階 -----------------------------------------------
export interface MaterialReq {
  materialId: string;
  qty: number;
}

export interface EvolutionStep {
  /** この進化に必要なレベル */
  requiredLevel: number;
  /** 必要素材 */
  requiredMaterials: MaterialReq[];
  /** 進化後のキャラID */
  nextCharacterId: string;
}

// --- 仲間キャラ（進化段階ごとに1レコード） ------------------
export interface Character {
  id: string;
  name: string;
  worldId: string;
  spriteId: string;
  /** 進化段階の表示名（例: Young / Hero / Dragon Slayer） */
  stageName: string;
  /** Lv1時点の基礎ステータス */
  baseStats: Stats;
  /** レベルごとの伸び */
  growthRate: Stats;
  skillIds: string[];
  /** 次段階への進化条件（最終段階は null） */
  evolution: EvolutionStep | null;
}

// --- ダンジョン ---------------------------------------------
export interface DungeonNode {
  /** ノード種別 */
  type: 'battle' | 'boss' | 'event';
  /** battle/boss の場合に出現する敵ID配列 */
  enemyIds?: string[];
  /** event の場合の説明 */
  eventText?: string;
}

export interface DungeonFloor {
  name: string;
  nodes: DungeonNode[];
}

export interface Dungeon {
  id: string;
  worldId: string;
  name: string;
  floors: DungeonFloor[];
}

// --- タイルマップ（自動生成・移動可能） ----------------------
export type TileType = 'floor' | 'wall' | 'water';

export type MapEntityKind = 'enemy' | 'boss' | 'chest' | 'stairs' | 'rest' | 'memory';

export interface MapEntity {
  id: string;
  kind: MapEntityKind;
  x: number;
  y: number;
  /** enemy/boss が連れている敵IDの群れ */
  enemyIds?: string[];
  /** chest の中身 */
  materialId?: string;
  opened?: boolean;
  /** 表示用ラベル（スプライト未実装のため頭文字を使う） */
  label?: string;
  eventText?: string;
}

/** 1フロア分の生成済みマップ。tiles と entities は純粋データなので動かせる。 */
export interface DungeonMap {
  worldId: string;
  floorIndex: number;
  floorName: string;
  width: number;
  height: number;
  /** tiles[y][x] */
  tiles: TileType[][];
  player: { x: number; y: number };
  entities: MapEntity[];
  /** visited[y][x] = 探索済み（探索率の算出に使う） */
  visited: boolean[][];
  isBossFloor: boolean;
}

// --- 世界（文学作品） ---------------------------------------
export interface World {
  id: string;
  title: string;
  author: string;
  era: string;
  /** 解放順 */
  order: number;
  description: string;
  dungeonId: string;
  /** クリアで加入する仲間（初期段階のCharacter id） */
  rewardCharacterId: string;
  /** 推奨レベル（UI表示用） */
  recommendedLevel: number;
}

// --- 図鑑 ---------------------------------------------------
export type CodexType = 'character' | 'enemy' | 'material' | 'world';

export interface CodexEntry {
  id: string;
  type: CodexType;
  /** 参照先ID（character/enemy/material/world のid） */
  refId: string;
  /** 文学的フレーバーテキスト */
  loreText: string;
}

// ============================================================
// セーブデータ（localStorage）
// ============================================================

export interface OwnedCharacter {
  /** 現在の進化段階を指すCharacter id */
  characterId: string;
  level: number;
  exp: number;
  currentHp: number;
  currentMp: number;
  learnedSkillIds: string[];
  equippedWeaponId?: string;
  equippedArmorId?: string;
}

export interface SaveProgress {
  unlockedWorldIds: string[];
  clearedWorldIds: string[];
  currentWorldId: string | null;
}

export interface SaveData {
  slotId: number;
  lastSavedAt: number;
  playTimeSec: number;
  progress: SaveProgress;
  party: OwnedCharacter[];
  /** materialId -> 所持数 */
  inventory: Record<string, number>;
  gold: number;
  codex: { discoveredIds: string[] };
}
