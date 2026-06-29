import { create } from 'zustand';
import type { DungeonMap, OwnedCharacter, RewardEntry, SaveData } from '@/types';
import { CODEX, getCharacter, getDungeon, getEnemy, getEquipment, getMaterial, getSkill, getWorld, STORE_ITEMS, WORLD_ORDER } from '@/data';
import { gainExp } from '@/engine/leveling';
import { evolve as evolveEngine } from '@/engine/evolution';
import { explorationRate, generateDungeonMap } from '@/engine/mapgen';
import { resolveMove, removeEntity } from '@/engine/mapmove';
import { statsWithEquipment } from '@/engine/equipment';
import {
  createNewSave,
  createOwnedCharacter,
  loadSlot,
  saveSlot,
  deleteSlot,
  unlockNextWorld,
} from '@/engine/save';
import { useBattleStore } from './useBattleStore';

export type Scene =
  | 'title'
  | 'saveSelect'
  | 'worldMap'
  | 'worldSelect'
  | 'town'
  | 'dungeon'
  | 'battle'
  | 'gameOver'
  | 'worldClear';

export type Overlay = 'party' | 'character' | 'evolution' | 'materials' | 'codex' | 'settings' | 'store' | null;

interface RewardSummary {
  exp: number;
  gold: number;
  drops: Record<string, number>;
  levelUps: string[];
}

/** 進行中のエンカウント（戦闘勝利時にマップから除去する対象） */
interface Encounter {
  entityId: string;
  enemyIds: string[];
  isBoss: boolean;
}

/** ボス戦の直前に出す「準備を促す」確認 */
interface BossPrompt {
  entityId: string;
  enemyIds: string[];
}

interface GameState {
  scene: Scene;
  overlay: Overlay;
  selectedCharIndex: number;
  save: SaveData | null;
  /** 探索中のタイルマップ（自動生成） */
  map: DungeonMap | null;
  worldId: string | null;
  encounter: Encounter | null;
  /** ボス戦直前の準備確認（nullでない間はモーダル表示） */
  bossPrompt: BossPrompt | null;
  /** 直前のマップイベントの通知（宝箱入手・壁など、UIに一瞬出す） */
  mapToast: string | null;
  lastReward: RewardSummary | null;
  newlyJoinedCharacterId: string | null;
  /** 作品選択画面で表示中のワールド */
  viewingWorldId: string | null;

  // 画面遷移
  goTitle: () => void;
  goSaveSelect: () => void;
  goWorldMap: () => void;
  selectWorld: (worldId: string) => void;
  enterTown: (worldId: string) => void;
  openLodge: () => void;
  openOverlay: (o: Overlay, charIndex?: number) => void;
  closeOverlay: () => void;

  // セーブ管理
  newGame: (slotId: number) => void;
  continueGame: (slotId: number) => void;
  eraseGame: (slotId: number) => void;
  persist: () => void;

  // ダンジョン（タイルマップ）
  enterWorld: (worldId: string) => void;
  movePlayer: (dx: number, dy: number) => void;
  descendFloor: () => void;
  confirmBossBattle: () => void;
  cancelBossPrompt: () => void;
  retreatToLodge: () => void;
  onBattleWon: () => void;
  onBattleLost: () => void;
  completeWorld: (worldId: string) => void;
  retreatToMap: () => void;

  // 成長・進化
  evolveCharacter: (partyIndex: number) => { ok: boolean; message: string };
  healParty: () => void;
  restAtInn: () => void;
  buyEquipment: (partyIndex: number, equipmentId: string) => void;
  buyItem: (itemId: string) => void;
  consumeItem: (itemId: string) => boolean;
}

function discover(save: SaveData, ids: string[]): string[] {
  const set = new Set(save.codex.discoveredIds);
  ids.forEach((id) => set.add(id));
  return [...set];
}

function rewardText(reward: RewardEntry): string {
  if (reward.kind === 'material') return `${reward.label ?? getMaterial(reward.id).name}×${reward.qty}`;
  if (reward.kind === 'gold') return `${reward.qty}G`;
  if (reward.kind === 'equipment') return reward.label ?? getEquipment(reward.id).name;
  if (reward.kind === 'skill') return `${reward.label ?? 'スキルブック'}:${getSkill(reward.id).name}`;
  if (reward.kind === 'item') return `${reward.label ?? STORE_ITEMS[reward.id]?.name ?? reward.id}×${reward.qty}`;
  if (reward.kind === 'codex') return reward.label ?? '図鑑ページ';
  if (reward.kind === 'story') return reward.label ?? 'ストーリー断片';
  return reward.label ?? reward.id;
}

function applyRewards(save: SaveData, rewards: RewardEntry[]): SaveData {
  const inventory = { ...save.inventory };
  const items = { ...save.items };
  const equipmentInventory = [...(save.equipmentInventory ?? [])];
  const learnedSkillBooks = [...(save.learnedSkillBooks ?? [])];
  const storyFragments = [...(save.storyFragments ?? [])];
  let gold = save.gold;
  const codexIds: string[] = [];

  for (const reward of rewards) {
    if (reward.kind === 'material') inventory[reward.id] = (inventory[reward.id] ?? 0) + reward.qty;
    if (reward.kind === 'gold') gold += reward.qty;
    if (reward.kind === 'item') items[reward.id] = (items[reward.id] ?? 0) + reward.qty;
    if (reward.kind === 'equipment' && !equipmentInventory.includes(reward.id)) equipmentInventory.push(reward.id);
    if (reward.kind === 'skill' && !learnedSkillBooks.includes(reward.id)) learnedSkillBooks.push(reward.id);
    if (reward.kind === 'story' && !storyFragments.includes(reward.id)) storyFragments.push(reward.id);
    if (reward.kind === 'codex') codexIds.push(reward.id);
    if (reward.kind === 'material') codexIds.push(`codex_material_${reward.id}`);
  }

  return {
    ...save,
    inventory,
    items,
    equipmentInventory,
    learnedSkillBooks,
    storyFragments,
    gold,
    codex: { discoveredIds: discover(save, codexIds) },
  };
}

const WORLD_CODEX_REFS: Record<string, string[]> = {
  beowulf: ['beowulf', 'grendel', 'dragon', 'monster_fang', 'dragon_scale', 'grendel_claw', 'grendels_fang', 'dragon_heart'],
  hamlet: ['hamlet', 'ghost', 'claudius', 'royal_guard', 'broken_crown', 'ghost_fragment', 'memory_of_revenge', 'royal_ring'],
  macbeth: ['macbeth', 'witch', 'banquos_ghost', 'macbeths_fate', 'soldier', 'witch_scroll', 'blood_relic', 'cursed_crown'],
};

function isWorldCodexEntry(worldId: string, codexId: string): boolean {
  const entry = CODEX[codexId];
  if (!entry) return false;
  return codexId.includes(worldId) || (WORLD_CODEX_REFS[worldId] ?? []).some((ref) => entry.refId.includes(ref));
}

function updateExploration(save: SaveData, worldId: string, map: DungeonMap): SaveData {
  const totalChests = map.entities.filter((e) => e.kind === 'chest').length;
  const openedChests = map.entities.filter((e) => e.kind === 'chest' && e.opened).map((e) => `${map.floorIndex}:${e.id}`);
  const totalSecrets = map.entities.filter((e) => e.kind === 'secretDoor').length;
  const foundSecrets = (map.discoveredSecretIds ?? []).map((id) => `${map.floorIndex}:${id}`);
  const codexWorldTotal = Object.keys(CODEX).filter((id) => isWorldCodexEntry(worldId, id)).length;
  const codexWorldFound = save.codex.discoveredIds.filter((id) => isWorldCodexEntry(worldId, id)).length;
  const previous = save.exploration?.[worldId];
  const bestRate = Math.max(previous?.bestRate ?? 0, explorationRate(map));
  return {
    ...save,
    exploration: {
      ...(save.exploration ?? {}),
      [worldId]: {
        bestRate,
        openedChests: [...new Set([...(previous?.openedChests ?? []), ...openedChests])],
        totalChests: Math.max(previous?.totalChests ?? 0, totalChests),
        foundSecrets: [...new Set([...(previous?.foundSecrets ?? []), ...foundSecrets])],
        totalSecrets: Math.max(previous?.totalSecrets ?? 0, totalSecrets),
        codexFound: codexWorldFound,
        codexTotal: codexWorldTotal,
        shortcutsUnlocked: previous?.shortcutsUnlocked ?? save.progress.clearedWorldIds.includes(worldId),
      },
    },
  };
}

function battleBonusRewards(worldId: string, enemyIds: string[], isBoss: boolean): RewardEntry[] {
  const rewards: RewardEntry[] = [];
  if (Math.random() < (isBoss ? 0.9 : 0.32)) {
    rewards.push({ kind: 'gold', id: 'gold', qty: (isBoss ? 45 : 8) + Math.floor(Math.random() * (isBoss ? 55 : 18)), label: 'Gold' });
  }
  if (Math.random() < (isBoss ? 0.72 : 0.18)) {
    rewards.push({ kind: 'codex', id: `codex_enemy_${enemyIds[0]}`, qty: 1, label: '図鑑ページ' });
  }
  if (isBoss) {
    const bossRewards: Record<string, RewardEntry[]> = {
      dragon: [
        { kind: 'story', id: 'dragon-funeral', qty: 1, label: 'ストーリー断片' },
        { kind: 'skill', id: 'dragon_slash', qty: 1, label: 'スキルブック' },
      ],
      claudius: [
        { kind: 'story', id: 'elsinore-confession', qty: 1, label: 'ストーリー断片' },
        { kind: 'skill', id: 'to_be_or_not', qty: 1, label: 'スキルブック' },
      ],
      macbeths_fate: [
        { kind: 'story', id: 'birnam-comes', qty: 1, label: 'ストーリー断片' },
        { kind: 'skill', id: 'bloody_crown', qty: 1, label: 'スキルブック' },
      ],
    };
    rewards.push(...(bossRewards[enemyIds[0]] ?? []));
  } else if (Math.random() < 0.1) {
    const worldSkill: Record<string, string> = { beowulf: 'hero_roar', hamlet: 'poison_blade', macbeth: 'prophecy' };
    rewards.push({ kind: 'skill', id: worldSkill[worldId] ?? 'hero_roar', qty: 1, label: 'スキルブック', rarity: 'rare' });
  }
  return rewards;
}

/** 同一世界＝同一キャラ（進化段階違い）とみなす */
function sameTree(charIdA: string, charIdB: string): boolean {
  return getCharacter(charIdA).worldId === getCharacter(charIdB).worldId;
}

export const useGameStore = create<GameState>((set, get) => ({
  scene: 'title',
  overlay: null,
  selectedCharIndex: 0,
  save: null,
  map: null,
  worldId: null,
  encounter: null,
  bossPrompt: null,
  mapToast: null,
  lastReward: null,
  newlyJoinedCharacterId: null,
  viewingWorldId: null,

  goTitle: () => set({ scene: 'title', overlay: null }),
  goSaveSelect: () => set({ scene: 'saveSelect', overlay: null }),
  goWorldMap: () => set({ scene: 'worldMap', overlay: null, map: null, encounter: null, bossPrompt: null }),
  selectWorld: (worldId) => set({ viewingWorldId: worldId, scene: 'worldSelect', overlay: null }),
  enterTown: (worldId) => {
    const save = get().save;
    if (!save) return;
    const party = save.party.length > 0 ? save.party : [createOwnedCharacter(getWorld(worldId).rewardCharacterId)];
    const nextSave = { ...save, party, progress: { ...save.progress, currentWorldId: worldId } };
    set({ save: nextSave, worldId, scene: 'town', overlay: null });
    saveSlot(nextSave);
  },
  openLodge: () => {
    const save = get().save;
    if (!save) return;
    const fallbackWorld = save.progress.currentWorldId ?? save.progress.unlockedWorldIds[0];
    if (fallbackWorld) get().enterTown(fallbackWorld);
  },
  openOverlay: (o, charIndex) =>
    set({ overlay: o, selectedCharIndex: charIndex ?? get().selectedCharIndex }),
  closeOverlay: () => set({ overlay: null }),

  newGame: (slotId) => {
    const base = createNewSave(slotId);
    saveSlot(base);
    set({ save: base, map: null, encounter: null, lastReward: null });
    // 拠点（Bibliotheca Lodge）から旅を始め、最初から「帰る場所」を体験させる
    get().enterTown(WORLD_ORDER[0]);
  },

  continueGame: (slotId) => {
    const save = loadSlot(slotId);
    if (!save) return;
    set({ save, scene: 'worldMap', map: null, encounter: null });
  },

  eraseGame: (slotId) => {
    deleteSlot(slotId);
    set({});
  },

  persist: () => {
    const { save } = get();
    if (save) saveSlot(save);
  },

  enterWorld: (worldId) => {
    const save = get().save;
    if (!save) return;
    // 仲間がまだ一人もいない初回は、最初の世界の主人公を開始キャラとして付与
    let party = save.party;
    if (party.length === 0) {
      party = [createOwnedCharacter(getWorld(worldId).rewardCharacterId)];
    }
    // ダンジョン入場時は全回復（街を出る感覚）
    party = party.map((p) => {
      const stats = statsWithEquipment(getCharacter(p.characterId), p);
      return { ...p, currentHp: stats.hp, currentMp: stats.mp };
    });
    const nextSave: SaveData = {
      ...save,
      party,
      progress: { ...save.progress, currentWorldId: worldId },
    };
    set({
      save: nextSave,
      worldId,
      map: generateDungeonMap(worldId, 0),
      encounter: null,
      bossPrompt: null,
      mapToast: null,
      scene: 'dungeon',
    });
    saveSlot(nextSave);
  },

  movePlayer: (dx, dy) => {
    const { map, save } = get();
    if (!map || !save) return;
    const result = resolveMove(map, dx, dy);

    switch (result.type) {
      case 'blocked':
        return;
      case 'moved':
        set({ map: result.map, mapToast: null, save: updateExploration(save, map.worldId, result.map) });
        return;
      case 'stairs':
        set({ map: result.map });
        get().descendFloor();
        return;
      case 'chest': {
        const rewards = result.entity?.rewards ?? (result.entity?.materialId ? [{ kind: 'material' as const, id: result.entity.materialId, qty: 1, label: getMaterial(result.entity.materialId).name }] : []);
        const nextSave = updateExploration(applyRewards(save, rewards), map.worldId, result.map);
        set({
          save: nextSave,
          map: result.map,
          mapToast: `宝箱：${rewards.map(rewardText).join('・')} を手に入れた！`,
        });
        saveSlot(nextSave);
        return;
      }
      case 'key': {
        set({ map: result.map, mapToast: `${result.entity?.label ?? '鍵'}を見つけた。鍵付き扉を開けられる。` });
        return;
      }
      case 'lockedDoor': {
        const nextSave = updateExploration(save, map.worldId, result.map);
        set({ save: nextSave, map: result.map, mapToast: '鍵付き扉が開いた。新しい部屋へ進める！' });
        saveSlot(nextSave);
        return;
      }
      case 'secret': {
        const rewards = result.entity?.rewards ?? [];
        const nextSave = updateExploration(applyRewards(save, rewards), map.worldId, result.map);
        set({
          save: nextSave,
          map: result.map,
          mapToast: `隠し部屋を発見！${rewards.map(rewardText).join('・')} を手に入れた！`,
        });
        saveSlot(nextSave);
        return;
      }
      case 'rest': {
        const party = save.party.map((p) => {
          const stats = statsWithEquipment(getCharacter(p.characterId), p);
          return { ...p, currentHp: Math.min(stats.hp, p.currentHp + Math.ceil(stats.hp * 0.35)), currentMp: Math.min(stats.mp, p.currentMp + Math.ceil(stats.mp * 0.35)) };
        });
        const nextSave = updateExploration({ ...save, party }, map.worldId, result.map);
        set({ save: nextSave, map: result.map, mapToast: '休息碑に触れた。HPとMPが少し回復した。' });
        saveSlot(nextSave);
        return;
      }
      case 'memory':
        set({ map: result.map, mapToast: result.entity?.eventText ?? '古い記憶が、静かに胸へ流れ込んだ。' });
        return;
      case 'encounter': {
        const e = result.entity!;
        // ボスは即戦闘せず、まず「準備を促す」確認モーダルを出す
        if (e.kind === 'boss') {
          set({ map: result.map, bossPrompt: { entityId: e.id, enemyIds: e.enemyIds ?? [] }, mapToast: null });
          return;
        }
        set({
          map: result.map,
          encounter: { entityId: e.id, enemyIds: e.enemyIds ?? [], isBoss: false },
          scene: 'battle',
        });
        useBattleStore.getState().start(save.party, e.enemyIds ?? [], false);
        return;
      }
    }
  },

  descendFloor: () => {
    const { worldId, map } = get();
    if (!worldId || !map) return;
    const dgn = getDungeon(getWorld(worldId).dungeonId);
    const next = map.floorIndex + 1;
    if (next >= dgn.floors.length) {
      // 階段の先がもう無い（通常はボスフロアに階段は無いので来ない）
      set({ scene: 'worldMap', map: null });
      return;
    }
    const nextMap = generateDungeonMap(worldId, next);
    set({
      map: nextMap,
      bossPrompt: null,
      mapToast: nextMap.isBossFloor
        ? `最深部「${dgn.floors[next].name}」。ボスの気配がする……備えるならLodgeへ退くのは今のうちだ。`
        : `${dgn.floors[next].name} へ降りた。`,
    });
  },

  confirmBossBattle: () => {
    const { bossPrompt, save } = get();
    if (!bossPrompt || !save) return;
    set({
      encounter: { entityId: bossPrompt.entityId, enemyIds: bossPrompt.enemyIds, isBoss: true },
      bossPrompt: null,
      scene: 'battle',
    });
    useBattleStore.getState().start(save.party, bossPrompt.enemyIds, true);
  },

  cancelBossPrompt: () => set({ bossPrompt: null }),

  retreatToLodge: () => {
    const worldId = get().worldId;
    set({ bossPrompt: null });
    if (worldId) get().enterTown(worldId);
    else get().goWorldMap();
  },

  onBattleWon: () => {
    const { encounter, worldId, save, map } = get();
    const battle = useBattleStore.getState();
    if (!encounter || !worldId || !save) return;
    const enemyIds = encounter.enemyIds;

    const totalExp = enemyIds.reduce((sum, id) => sum + getEnemy(id).exp, 0);
    const totalGold = enemyIds.reduce((sum, id) => sum + Math.max(4, Math.floor(getEnemy(id).exp / 3)), 0);

    const drops: Record<string, number> = {};
    for (const id of enemyIds) {
      for (const d of getEnemy(id).dropTable) {
        if (Math.random() < d.rate) drops[d.materialId] = (drops[d.materialId] ?? 0) + 1;
      }
    }

    const allCombatants = battle.combatants;
    const levelUps: string[] = [];
    const newParty: OwnedCharacter[] = save.party.map((p) => {
      const c = allCombatants.find((cb) => cb.side === 'ally' && cb.sourceId === p.characterId);
      let owned: OwnedCharacter = c ? { ...p, currentHp: c.hp, currentMp: c.mp } : { ...p, currentHp: 0 };
      if (owned.currentHp > 0) {
        const res = gainExp(owned, getCharacter(owned.characterId), totalExp);
        owned = res.owned;
        if (res.leveledUp) {
          levelUps.push(`${getCharacter(owned.characterId).name} は Lv${res.toLevel} になった！`);
        }
      }
      return owned;
    });

    const inventory = { ...save.inventory };
    for (const [id, qty] of Object.entries(drops)) inventory[id] = (inventory[id] ?? 0) + qty;
    const codexIds = [
      ...enemyIds.map((id) => `codex_enemy_${id}`),
      ...Object.keys(drops).map((id) => `codex_material_${id}`),
    ];

    const bonusRewards = battleBonusRewards(worldId, enemyIds, encounter.isBoss);
    const nextSaveBase: SaveData = {
      ...save,
      party: newParty,
      inventory,
      gold: save.gold + totalGold,
      codex: { discoveredIds: discover(save, codexIds) },
    };
    // 倒した敵をマップから除去
    const nextMap = map ? removeEntity(map, encounter.entityId) : null;
    const nextSave = nextMap ? updateExploration(applyRewards(nextSaveBase, bonusRewards), worldId, nextMap) : applyRewards(nextSaveBase, bonusRewards);

    set({
      save: nextSave,
      map: nextMap,
      encounter: null,
      lastReward: { exp: totalExp, gold: totalGold, drops, levelUps },
      mapToast: bonusRewards.length ? `追加報酬：${bonusRewards.map(rewardText).join('・')}` : null,
    });
    saveSlot(nextSave);
    battle.reset();

    if (encounter.isBoss) {
      get().completeWorld(worldId);
    } else {
      set({ scene: 'dungeon' });
    }
  },

  onBattleLost: () => {
    useBattleStore.getState().reset();
    set({ scene: 'gameOver' });
  },

  completeWorld: (worldId) => {
    const save = get().save;
    if (!save) return;
    const world = getWorld(worldId);

    let party = save.party;
    const alreadyHas = party.some((p) => sameTree(p.characterId, world.rewardCharacterId));
    if (!alreadyHas) party = [...party, createOwnedCharacter(world.rewardCharacterId)];

    let nextSave: SaveData = { ...save, party };
    nextSave = unlockNextWorld(nextSave, worldId);
    nextSave = {
      ...nextSave,
      exploration: {
        ...(nextSave.exploration ?? {}),
        [worldId]: {
          ...(nextSave.exploration?.[worldId] ?? {
            bestRate: 0,
            openedChests: [],
            totalChests: 0,
            foundSecrets: [],
            totalSecrets: 0,
            codexFound: 0,
            codexTotal: 0,
          }),
          shortcutsUnlocked: true,
        },
      },
      codex: {
        discoveredIds: discover(nextSave, [
          `codex_world_${worldId}`,
          `codex_char_${world.rewardCharacterId}`,
        ]),
      },
    };

    set({
      save: nextSave,
      scene: 'worldClear',
      map: null,
      encounter: null,
      bossPrompt: null,
      newlyJoinedCharacterId: alreadyHas ? null : world.rewardCharacterId,
    });
    saveSlot(nextSave);
  },

  retreatToMap: () => {
    useBattleStore.getState().reset();
    set({ scene: 'worldMap', map: null, encounter: null, bossPrompt: null });
  },

  evolveCharacter: (partyIndex) => {
    const save = get().save;
    if (!save) return { ok: false, message: 'セーブがありません。' };
    const owned = save.party[partyIndex];
    if (!owned) return { ok: false, message: '対象がいません。' };
    const result = evolveEngine(owned, save.inventory);
    if (!result) return { ok: false, message: '進化条件を満たしていません。' };

    const newParty = save.party.map((p, i) => (i === partyIndex ? result.owned : p));
    const nextSave: SaveData = {
      ...save,
      party: newParty,
      inventory: result.inventory,
      codex: { discoveredIds: discover(save, [`codex_char_${result.owned.characterId}`]) },
    };
    set({ save: nextSave });
    saveSlot(nextSave);
    return { ok: true, message: `${result.fromStageName} は ${result.toStageName} に進化した！` };
  },

  healParty: () => {
    const save = get().save;
    if (!save) return;
    const party = save.party.map((p) => {
      const stats = statsWithEquipment(getCharacter(p.characterId), p);
      return { ...p, currentHp: stats.hp, currentMp: stats.mp };
    });
    const nextSave = { ...save, party };
    set({ save: nextSave });
    saveSlot(nextSave);
  },

  restAtInn: () => {
    const save = get().save;
    if (!save || save.gold < 8) return;
    const party = save.party.map((p) => {
      const stats = statsWithEquipment(getCharacter(p.characterId), p);
      return { ...p, currentHp: stats.hp, currentMp: stats.mp };
    });
    const nextSave = { ...save, gold: save.gold - 8, party };
    set({ save: nextSave, mapToast: '蜜酒の火で、HPとMPが全回復した。' });
    saveSlot(nextSave);
  },

  buyEquipment: (partyIndex, equipmentId) => {
    const save = get().save;
    const owned = save?.party[partyIndex];
    if (!save || !owned) return;
    const item = getEquipment(equipmentId);
    const equippedId = item.slot === 'weapon'
      ? owned.equippedWeaponId
      : item.slot === 'armor'
        ? owned.equippedArmorId
        : owned.equippedAccessoryId;
    const equippedAlready = equippedId === item.id;
    const ownedLoot = (save.equipmentInventory ?? []).includes(item.id);
    if (equippedAlready || (!ownedLoot && save.gold < item.price)) return;
    const nextOwned = item.slot === 'weapon'
      ? { ...owned, equippedWeaponId: item.id }
      : item.slot === 'armor'
        ? { ...owned, equippedArmorId: item.id }
        : { ...owned, equippedAccessoryId: item.id };
    const party = save.party.map((p, index) => index === partyIndex ? nextOwned : p);
    const nextSave = { ...save, party, gold: ownedLoot ? save.gold : save.gold - item.price };
    set({ save: nextSave, mapToast: `${item.name} を装備した！` });
    saveSlot(nextSave);
  },

  buyItem: (itemId) => {
    const save = get().save;
    const item = STORE_ITEMS[itemId];
    if (!save || !item || save.gold < item.price) return;
    const items = { ...save.items, [itemId]: (save.items[itemId] ?? 0) + 1 };
    const nextSave = { ...save, items, gold: save.gold - item.price };
    set({ save: nextSave, mapToast: `${item.name} を購入した。` });
    saveSlot(nextSave);
  },

  consumeItem: (itemId) => {
    const save = get().save;
    if (!save || (save.items[itemId] ?? 0) <= 0) return false;
    const items = { ...save.items, [itemId]: save.items[itemId] - 1 };
    const nextSave = { ...save, items };
    set({ save: nextSave });
    saveSlot(nextSave);
    return true;
  },
}));
