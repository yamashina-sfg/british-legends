import { create } from 'zustand';
import type { DungeonMap, OwnedCharacter, RewardEntry, SaveData } from '@/types';
import { CODEX, getCharacter, getDungeon, getEnemy, getEquipment, getMaterial, getSkill, getWorld, STORE_ITEMS } from '@/data';
import { explorationRate } from '@/engine/mapgen';
import { gainExp } from '@/engine/leveling';
import { evolve as evolveEngine } from '@/engine/evolution';
import { generateDungeonMap } from '@/engine/mapgen';
import { resolveMove, removeEntity } from '@/engine/mapmove';
import { statsWithEquipment } from '@/engine/equipment';
import { getActiveParty, getActivePartyIds, normalizeActiveParty, toggleActivePartyMember } from '@/engine/party';
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
  | 'opening'
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
  bonusItems: Record<string, number>;
  bonusRewards: RewardEntry[];
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
  replayOpening: (slotId?: number) => void;
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
  toggleActiveParty: (partyIndex: number) => void;
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
  if (reward.kind === 'key') return reward.label ?? '鍵';
  return reward.label ?? reward.id;
}

const WORLD_CODEX_REFS: Record<string, string[]> = {
  beowulf: ['beowulf', 'grendel', 'dragon'],
  hamlet: ['hamlet', 'ghost', 'claudius', 'royal_guard'],
  macbeth: ['macbeth', 'witch', 'banquos_ghost', 'macbeths_fate', 'soldier'],
};

function isWorldCodexEntry(worldId: string, codexId: string): boolean {
  const entry = CODEX[codexId];
  if (!entry) return false;
  return codexId.includes(worldId) || (WORLD_CODEX_REFS[worldId] ?? []).some((ref) => entry.refId.includes(ref));
}

function applyRewards(save: SaveData, rewards: RewardEntry[]): SaveData {
  const inventory = { ...save.inventory };
  const items = { ...save.items };
  const equipmentInventory = [...(save.equipmentInventory ?? [])];
  const learnedSkillBooks = [...(save.learnedSkillBooks ?? [])];
  const storyFragments = [...(save.storyFragments ?? [])];
  let party = save.party;
  let gold = save.gold;
  const codexIds: string[] = [];

  for (const reward of rewards) {
    if (reward.kind === 'material') {
      inventory[reward.id] = (inventory[reward.id] ?? 0) + reward.qty;
      codexIds.push(`codex_material_${reward.id}`);
    }
    if (reward.kind === 'gold') gold += reward.qty;
    if (reward.kind === 'item') items[reward.id] = (items[reward.id] ?? 0) + reward.qty;
    if (reward.kind === 'equipment' && !equipmentInventory.includes(reward.id)) equipmentInventory.push(reward.id);
    if (reward.kind === 'skill') {
      if (!learnedSkillBooks.includes(reward.id)) learnedSkillBooks.push(reward.id);
      party = party.map((member) =>
        member.learnedSkillIds.includes(reward.id)
          ? member
          : { ...member, learnedSkillIds: [...member.learnedSkillIds, reward.id] },
      );
    }
    if (reward.kind === 'story' && !storyFragments.includes(reward.id)) {
      storyFragments.push(reward.id);
      const worldId = save.progress.currentWorldId;
      if (worldId) codexIds.push(`codex_story_${worldId}`);
    }
    if (reward.kind === 'codex') codexIds.push(reward.id);
  }

  return {
    ...save,
    party,
    inventory,
    items,
    equipmentInventory,
    learnedSkillBooks,
    storyFragments,
    gold,
    codex: { discoveredIds: discover(save, codexIds) },
  };
}

function updateExploration(save: SaveData, worldId: string, map: DungeonMap): SaveData {
  const totalChests = map.entities.filter((e) => e.kind === 'chest').length;
  const openedChests = map.entities.filter((e) => e.kind === 'chest' && e.opened).map((e) => `${map.floorIndex}:${e.id}`);
  const totalSecrets = map.entities.filter((e) => e.kind === 'secretDoor').length;
  const foundSecrets = (map.discoveredSecretIds ?? []).map((id) => `${map.floorIndex}:${id}`);
  const codexWorldTotal = Object.keys(CODEX).filter((id) => isWorldCodexEntry(worldId, id)).length;
  const codexWorldFound = save.codex.discoveredIds.filter((id) => isWorldCodexEntry(worldId, id)).length;
  const previous = save.exploration?.[worldId];
  return {
    ...save,
    exploration: {
      ...(save.exploration ?? {}),
      [worldId]: {
        bestRate: Math.max(previous?.bestRate ?? 0, explorationRate(map)),
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
    const qty = (isBoss ? 45 : 8) + Math.floor(Math.random() * (isBoss ? 55 : 18));
    rewards.push({ kind: 'gold', id: 'gold', qty, label: 'Gold' });
  }
  if (Math.random() < (isBoss ? 0.72 : 0.18)) rewards.push({ kind: 'codex', id: `codex_enemy_${enemyIds[0]}`, qty: 1, label: '図鑑ページ' });
  if (isBoss) {
    const bossRewards: Record<string, RewardEntry[]> = {
      dragon: [
        { kind: 'story', id: 'dragon-funeral', qty: 1, label: 'ストーリー断片' },
        { kind: 'skill', id: 'dragon_slash', qty: 1, label: 'スキルブック', rarity: 'rare' },
      ],
      claudius: [
        { kind: 'story', id: 'elsinore-confession', qty: 1, label: 'ストーリー断片' },
        { kind: 'skill', id: 'to_be_or_not', qty: 1, label: 'スキルブック', rarity: 'rare' },
      ],
      macbeths_fate: [
        { kind: 'story', id: 'birnam-comes', qty: 1, label: 'ストーリー断片' },
        { kind: 'skill', id: 'bloody_ambition', qty: 1, label: 'スキルブック', rarity: 'rare' },
      ],
    };
    rewards.push(...(bossRewards[enemyIds[0]] ?? []));
  } else if (Math.random() < 0.1) {
    const skillByWorld: Record<string, string> = { beowulf: 'shield_oath', hamlet: 'hesitation', macbeth: 'prophecy' };
    rewards.push({ kind: 'skill', id: skillByWorld[worldId] ?? 'hero_roar', qty: 1, label: 'スキルブック', rarity: 'rare' });
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
    const nextSave = normalizeActiveParty({ ...save, party, progress: { ...save.progress, currentWorldId: worldId } });
    set({ save: nextSave, worldId, scene: 'town', overlay: null });
    saveSlot(nextSave);
  },
  openLodge: () => {
    const save = get().save;
    if (!save) return;
    const nextSave = save.openingWatched ? save : { ...save, openingWatched: true };
    if (!save.openingWatched) {
      set({ save: nextSave });
      saveSlot(nextSave);
    }
    const fallbackWorld = nextSave.progress.currentWorldId ?? nextSave.progress.unlockedWorldIds[0];
    if (fallbackWorld) get().enterTown(fallbackWorld);
  },
  replayOpening: (slotId) => {
    const save = slotId ? loadSlot(slotId) : get().save;
    if (save) {
      set({ save, scene: 'opening', overlay: null, map: null, encounter: null });
    }
  },
  openOverlay: (o, charIndex) =>
    set({ overlay: o, selectedCharIndex: charIndex ?? get().selectedCharIndex }),
  closeOverlay: () => set({ overlay: null }),

  newGame: (slotId) => {
    const save = createNewSave(slotId);
    saveSlot(save);
    set({ save, scene: 'opening', map: null, encounter: null, lastReward: null });
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
    const nextSave: SaveData = normalizeActiveParty({
      ...save,
      party,
      progress: { ...save.progress, currentWorldId: worldId },
    });
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
        set({ map: result.map, mapToast: null, save: updateExploration(save, map.worldId, result.map) });
        return;
      case 'stairs':
        set({ map: result.map });
        get().descendFloor();
        return;
      case 'chest': {
        const rewards = result.entity?.rewards ??
          (result.entity?.materialId ? [{ kind: 'material' as const, id: result.entity.materialId, qty: 1, label: getMaterial(result.entity.materialId).name }] : []);
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
        const rewards = result.entity?.rewards ?? [];
        const nextSave = updateExploration(applyRewards(save, rewards), map.worldId, result.map);
        set({
          save: nextSave,
          map: result.map,
          mapToast: rewards.length
            ? `鍵付き扉が開いた。${rewards.map(rewardText).join('・')} を手に入れた！`
            : '鍵付き扉が開いた。新しい部屋へ進める！',
        });
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
      case 'memory': {
        const rewards = result.entity?.rewards ?? [];
        const nextSave = updateExploration(applyRewards(save, rewards), map.worldId, result.map);
        const rewardLine = rewards.length ? ` ${rewards.map(rewardText).join('・')} を見つけた。` : '';
        set({
          save: nextSave,
          map: result.map,
          mapToast: `${result.entity?.eventText ?? '古い記憶が、静かに胸へ流れ込んだ。'}${rewardLine}`,
        });
        saveSlot(nextSave);
        return;
      }
      case 'encounter': {
        const e = result.entity!;
        set({
          map: result.map,
          encounter: { entityId: e.id, enemyIds: e.enemyIds ?? [], isBoss: e.kind === 'boss' },
          scene: 'battle',
        });
        useBattleStore.getState().start(getActiveParty(save), e.enemyIds ?? [], e.kind === 'boss');
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
    const totalGold = enemyIds.reduce((sum, id) => {
      const enemy = getEnemy(id);
      return sum + (enemy.gold ?? Math.max(4, Math.floor(enemy.exp / 3)));
    }, 0);

    const drops: Record<string, number> = {};
    for (const id of enemyIds) {
      for (const d of getEnemy(id).dropTable) {
        if (Math.random() < d.rate) drops[d.materialId] = (drops[d.materialId] ?? 0) + 1;
      }
    }
    const bonusItems: Record<string, number> = {};
    const awardItem = (id: string, chance: number) => {
      if (Math.random() < chance) bonusItems[id] = (bonusItems[id] ?? 0) + 1;
    };
    if (encounter.isBoss) {
      awardItem('phoenix_page', 1);
      awardItem('elixir', 0.6);
    } else {
      awardItem('recovery_potion', 0.28);
      awardItem('field_ration', 0.18);
      if (enemyIds.length >= 2) awardItem('high_recovery_potion', 0.14);
    }

    const allCombatants = battle.combatants;
    const levelUps: string[] = [];
    const newParty: OwnedCharacter[] = save.party.map((p) => {
      const c = allCombatants.find((cb) => cb.side === 'ally' && cb.sourceId === p.characterId);
      if (!c) return p;
      let owned: OwnedCharacter = { ...p, currentHp: c.hp, currentMp: c.mp };
      if (c.alive && owned.currentHp > 0) {
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
    const items = { ...save.items };
    for (const [id, qty] of Object.entries(bonusItems)) items[id] = (items[id] ?? 0) + qty;
    const codexIds = [
      ...enemyIds.map((id) => `codex_enemy_${id}`),
      ...Object.keys(drops).map((id) => `codex_material_${id}`),
    ];
    const bonusRewards = battleBonusRewards(worldId, enemyIds, encounter.isBoss);

    const nextSaveBase: SaveData = {
      ...save,
      party: newParty,
      inventory,
      items,
      gold: save.gold + totalGold,
      codex: { discoveredIds: discover(save, codexIds) },
    };

    // 倒した敵をマップから除去
    const nextMap = map ? removeEntity(map, encounter.entityId) : null;
    const nextSave = nextMap
      ? updateExploration(applyRewards(nextSaveBase, bonusRewards), worldId, nextMap)
      : applyRewards(nextSaveBase, bonusRewards);

    set({
      save: nextSave,
      map: nextMap,
      encounter: null,
      lastReward: { exp: totalExp, gold: totalGold, drops, bonusItems, bonusRewards, levelUps },
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
    const save = get().save;
    const worldId = get().worldId ?? save?.progress.currentWorldId ?? save?.progress.unlockedWorldIds[0] ?? null;
    useBattleStore.getState().reset();
    if (!save) {
      set({ scene: 'gameOver' });
      return;
    }

    const lossRate = 0.1 + Math.random() * 0.1;
    const lostGold = Math.min(save.gold, Math.ceil(save.gold * lossRate));
    const party = save.party.map((p) => {
      const stats = statsWithEquipment(getCharacter(p.characterId), p);
      return {
        ...p,
        currentHp: Math.max(1, Math.ceil(stats.hp * 0.5)),
        currentMp: Math.ceil(stats.mp * 0.5),
      };
    });
    const nextSave: SaveData = {
      ...save,
      party,
      gold: save.gold - lostGold,
      progress: { ...save.progress, currentWorldId: worldId },
    };
    set({
      save: nextSave,
      scene: 'town',
      worldId,
      map: null,
      encounter: null,
      mapToast: `敗北した。拠点へ戻された。${lostGold}Gを失った。`,
      lastReward: null,
    });
    saveSlot(nextSave);
  },

  completeWorld: (worldId) => {
    const save = get().save;
    if (!save) return;
    const world = getWorld(worldId);

    let party = save.party;
    const alreadyHas = party.some((p) => sameTree(p.characterId, world.rewardCharacterId));
    if (!alreadyHas) party = [...party, createOwnedCharacter(world.rewardCharacterId)];

    const activePartyIds = getActivePartyIds(save);
    const shouldJoinActive = !alreadyHas && activePartyIds.length < 3;
    let nextSave: SaveData = normalizeActiveParty({
      ...save,
      party,
      activePartyIds: shouldJoinActive ? [...activePartyIds, world.rewardCharacterId] : activePartyIds,
    });
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
          `codex_story_${worldId}`,
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
    const activePartyIds = getActivePartyIds(save).map((id) => (id === owned.characterId ? result.owned.characterId : id));
    const nextSave: SaveData = {
      ...save,
      party: newParty,
      activePartyIds,
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

  toggleActiveParty: (partyIndex) => {
    const save = get().save;
    const member = save?.party[partyIndex];
    if (!save || !member) return;
    const nextSave = toggleActivePartyMember(save, member.characterId);
    set({ save: nextSave });
    saveSlot(nextSave);
  },
}));
