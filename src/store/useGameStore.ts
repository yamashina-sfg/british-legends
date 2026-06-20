import { create } from 'zustand';
import type { DungeonMap, OwnedCharacter, SaveData } from '@/types';
import { getCharacter, getDungeon, getEnemy, getEquipment, getWorld, STORE_ITEMS } from '@/data';
import { gainExp, statsAtLevel } from '@/engine/leveling';
import { evolve as evolveEngine } from '@/engine/evolution';
import { generateDungeonMap } from '@/engine/mapgen';
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

interface GameState {
  scene: Scene;
  overlay: Overlay;
  selectedCharIndex: number;
  save: SaveData | null;
  /** 探索中のタイルマップ（自動生成） */
  map: DungeonMap | null;
  worldId: string | null;
  encounter: Encounter | null;
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
  mapToast: null,
  lastReward: null,
  newlyJoinedCharacterId: null,
  viewingWorldId: null,

  goTitle: () => set({ scene: 'title', overlay: null }),
  goSaveSelect: () => set({ scene: 'saveSelect', overlay: null }),
  goWorldMap: () => set({ scene: 'worldMap', overlay: null, map: null, encounter: null }),
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
    const save = createNewSave(slotId);
    saveSlot(save);
    set({ save, scene: 'worldMap', map: null, encounter: null, lastReward: null });
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
        set({ map: result.map, mapToast: null });
        return;
      case 'stairs':
        set({ map: result.map });
        get().descendFloor();
        return;
      case 'chest': {
        const matId = result.entity?.materialId;
        if (matId) {
          const inventory = { ...save.inventory };
          inventory[matId] = (inventory[matId] ?? 0) + 1;
          const nextSave: SaveData = {
            ...save,
            inventory,
            codex: { discoveredIds: discover(save, [`codex_material_${matId}`]) },
          };
          set({
            save: nextSave,
            map: result.map,
            mapToast: `宝箱：${result.entity?.label ?? '素材'} を手に入れた！`,
          });
          saveSlot(nextSave);
        } else {
          set({ map: result.map });
        }
        return;
      }
      case 'rest': {
        const party = save.party.map((p) => {
          const stats = statsWithEquipment(getCharacter(p.characterId), p);
          return { ...p, currentHp: Math.min(stats.hp, p.currentHp + Math.ceil(stats.hp * 0.35)), currentMp: Math.min(stats.mp, p.currentMp + Math.ceil(stats.mp * 0.35)) };
        });
        const nextSave = { ...save, party };
        set({ save: nextSave, map: result.map, mapToast: '休息碑に触れた。HPとMPが少し回復した。' });
        saveSlot(nextSave);
        return;
      }
      case 'memory':
        set({ map: result.map, mapToast: result.entity?.eventText ?? '古い記憶が、静かに胸へ流れ込んだ。' });
        return;
      case 'encounter': {
        const e = result.entity!;
        set({
          map: result.map,
          encounter: { entityId: e.id, enemyIds: e.enemyIds ?? [], isBoss: e.kind === 'boss' },
          scene: 'battle',
        });
        useBattleStore.getState().start(save.party, e.enemyIds ?? [], e.kind === 'boss');
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
    set({ map: generateDungeonMap(worldId, next), mapToast: `${dgn.floors[next].name} へ降りた。` });
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

    const nextSave: SaveData = {
      ...save,
      party: newParty,
      inventory,
      gold: save.gold + totalGold,
      codex: { discoveredIds: discover(save, codexIds) },
    };

    // 倒した敵をマップから除去
    const nextMap = map ? removeEntity(map, encounter.entityId) : null;

    set({
      save: nextSave,
      map: nextMap,
      encounter: null,
      lastReward: { exp: totalExp, gold: totalGold, drops, levelUps },
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
      newlyJoinedCharacterId: alreadyHas ? null : world.rewardCharacterId,
    });
    saveSlot(nextSave);
  },

  retreatToMap: () => {
    useBattleStore.getState().reset();
    set({ scene: 'worldMap', map: null, encounter: null });
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
      const stats = statsAtLevel(getCharacter(p.characterId), p.level);
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
      const stats = statsAtLevel(getCharacter(p.characterId), p.level);
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
    const equippedAlready = item.slot === 'weapon' ? owned.equippedWeaponId === item.id : owned.equippedArmorId === item.id;
    if (equippedAlready || save.gold < item.price) return;
    const nextOwned = item.slot === 'weapon'
      ? { ...owned, equippedWeaponId: item.id }
      : item.slot === 'armor'
        ? { ...owned, equippedArmorId: item.id }
        : { ...owned, equippedAccessoryId: item.id };
    const party = save.party.map((p, index) => index === partyIndex ? nextOwned : p);
    const nextSave = { ...save, party, gold: save.gold - item.price };
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
