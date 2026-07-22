import { create } from 'zustand';
import type { AllocatedStats, DungeonMap, OwnedCharacter, PlayerAvatar, RewardEntry, SaveData } from '@/types';
import { CODEX, getCharacter, getDungeon, getEnemy, getEquipment, getMaterial, getSkill, getWorld, STORE_ITEMS } from '@/data';
import { explorationRate } from '@/engine/mapgen';
import { gainExp } from '@/engine/leveling';
import { evolve as evolveEngine } from '@/engine/evolution';
import { generateDungeonMap } from '@/engine/mapgen';
import { resolveMove, removeEntity } from '@/engine/mapmove';
import { equipItem, statsWithEquipment } from '@/engine/equipment';
import { addDefeats, crossedResearchLevels, enemyResearchBenefit } from '@/engine/research';
import { forgeCost, MAX_EQUIPMENT_LEVEL } from '@/engine/forging';
import { assignQuickSlot } from '@/engine/quickSlots';
import { blessCharacter as blessCharacterEngine, commitStatusAllocation as commitStatusAllocationEngine } from '@/engine/characterGrowth';
import { craftEquipment as craftEquipmentEngine, EQUIPMENT_RECIPES } from '@/engine/equipmentCrafting';
import { resolveFishing, type FishingReward } from '@/engine/fishing';
import { permanentStats } from '@/engine/permanentStats';
import { getPet } from '@/data/pets';
import { applyArenaReward, ARENA_ENTRY_FEE, ARENA_MAX_WAVE, ARENA_WAVE_LIMIT_MS, ARENA_WAVES } from '@/engine/arena';
import { awakenConstellation, restoreConstellationStatue, unlockedConstellationIds } from '@/engine/constellations';
import { awardSummonedPetExp, evolvePet as evolvePetEngine, petStats, setPetSlot as setPetSlotEngine, trainPet as trainPetEngine, tryCapturePet } from '@/engine/pets';
import { getActiveParty, getActivePartyIds, normalizeActiveParty, toggleActivePartyMember } from '@/engine/party';
import {
  createNewSave,
  createOwnedCharacter,
  loadSlot,
  saveSlot,
  deleteSlot,
  unlockNextWorld,
} from '@/engine/save';
import { emitNotification } from '@/notifications/notificationBus';
import { activatePortal, applyBossSoulFlags, claimOneTimeEvent, tradeAdventureItem } from '@/engine/adventure';
import { useBattleStore } from './useBattleStore';
import { fragmentsForWorld } from '@/data/manuscripts';
import { grantSandboxDiamonds as grantSandboxDiamondsEngine, normalizeCommerce, purchaseProduct, useTimedBoost } from '@/engine/commerce';

export type Scene =
  | 'title'
  | 'opening'
  | 'characterCreate'
  | 'saveSelect'
  | 'worldMap'
  | 'worldSelect'
  | 'town'
  | 'dungeon'
  | 'arena'
  | 'battle'
  | 'gameOver'
  | 'worldClear';

export type Overlay = 'party' | 'character' | 'evolution' | 'blessing' | 'materials' | 'codex' | 'settings' | 'store' | 'fishing' | 'pets' | 'arenaReception' | 'constellations' | 'skins' | 'skillLoadout' | 'adventure' | null;

interface ArenaRun { currentWave:number; startWave:number; runStartedAt:number; waveStartedAt:number; deadline:number; lastRewardLabel?:string; lastWaveTime?:number }

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
  arenaRun: ArenaRun | null;

  // 画面遷移
  goTitle: () => void;
  goSaveSelect: () => void;
  goWorldMap: () => void;
  selectWorld: (worldId: string) => void;
  enterTown: (worldId: string) => void;
  openLodge: () => void;
  replayOpening: (slotId?: number) => void;
  createPlayerAvatar: (avatar: Pick<PlayerAvatar, 'name' | 'headStyle'>) => void;
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
  commitStatusAllocation: (partyIndex: number, allocation: AllocatedStats) => boolean;
  blessCharacter: (partyIndex: number, patronWorldId: string) => boolean;
  healParty: () => void;
  restAtInn: () => void;
  buyEquipment: (partyIndex: number, equipmentId: string) => void;
  forgeEquipment: (equipmentId: string) => void;
  craftEquipment: (recipeId: string) => void;
  completeFishing: () => FishingReward | null;
  setPetSlot: (slot: number, uid: string | null) => void;
  trainPet: (uid: string) => boolean;
  evolvePet: (uid: string) => boolean;
  enterArena: (startWave:number) => boolean;
  startArenaWave: () => void;
  exitArena: () => void;
  restoreConstellation: (worldId:string) => boolean;
  setCharacterSkin: (partyIndex:number, bodyWorldId:string|undefined, locked:boolean) => void;
  setSkillSlot: (partyIndex:number, slot:number, skillId:string|null) => void;
  setSkipBlessingCinematics: (enabled:boolean) => void;
  setGameSettings:(settings:Partial<NonNullable<SaveData['settings']>>)=>void;
  travelPortal: (portalId:string) => boolean;
  claimAdventureEvent: (eventId:string) => boolean;
  tradeAdventure: (tradeId:string,giveId:string,giveQty:number,getId:string,getQty:number) => boolean;
  buyItem: (itemId: string) => void;
  consumeItem: (itemId: string) => boolean;
  setQuickSlot: (slotIndex: number, itemId: string | null) => void;
  toggleActiveParty: (partyIndex: number) => void;
  purchaseCashProduct: (productId:string,partyIndex?:number) => {ok:boolean;message:string};
  grantSandboxDiamonds: () => void;
  activateBoost: (itemId:'exp_boost'|'drop_boost') => boolean;
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

function rewardRarity(rewards: RewardEntry[], fallback: 'common' | 'rare' | 'epic' | 'legendary' = 'common') {
  const rank = { common: 0, rare: 1, epic: 2, legendary: 3 } as const;
  return rewards.reduce((best, reward) => {
    const rarity = reward.rarity ?? 'common';
    return rank[rarity] > rank[best] ? rarity : best;
  }, fallback);
}

function rewardIcon(rewards: RewardEntry[]) {
  if (rewards.some((reward) => reward.kind === 'equipment')) return '⚔';
  if (rewards.some((reward) => reward.kind === 'skill' || reward.kind === 'story' || reward.kind === 'codex')) return '✦';
  if (rewards.some((reward) => reward.kind === 'item')) return '✚';
  if (rewards.some((reward) => reward.kind === 'gold')) return 'G';
  return '◆';
}

function notifyRewards(rewards: RewardEntry[]) {
  if (rewards.length === 0) return;
  const primary = rewards[0];
  const hasStoryReward = rewards.some((reward) => reward.kind === 'skill' || reward.kind === 'codex' || reward.kind === 'story');
  const hasItemReward = rewards.some((reward) => reward.kind === 'item' || reward.kind === 'equipment');
  const title = rewards.length === 1
    ? `${rewardText(primary)} を獲得！`
    : `報酬 ${rewards.length}件を獲得！`;

  emitNotification({
    type: hasStoryReward ? 'story' : hasItemReward ? 'item' : 'reward',
    title,
    message: rewards.map(rewardText).join('\n'),
    icon: rewardIcon(rewards),
    rarity: rewardRarity(rewards),
    durationMs: rewards.length >= 3 ? 4200 : 3400,
    dedupeKey: `rewards:${rewards.map((reward) => `${reward.kind}:${reward.id}:${reward.qty}`).join('|')}:${Date.now()}`,
  });
}

function notifyBattleResult(
  enemyIds: string[],
  totalExp: number,
  totalGold: number,
  drops: Record<string, number>,
  bonusItems: Record<string, number>,
  bonusRewards: RewardEntry[],
  levelUps: string[],
  isBoss: boolean,
) {
  const defeated = enemyIds.map((id) => getEnemy(id).name).join(' / ');
  const battleRewards: RewardEntry[] = [
    ...Object.entries(drops).map(([id, qty]) => ({ kind: 'material' as const, id, qty, label: getMaterial(id).name })),
    ...Object.entries(bonusItems).map(([id, qty]) => ({ kind: 'item' as const, id, qty, label: STORE_ITEMS[id]?.name ?? id })),
    ...bonusRewards,
  ];
  const summaryLines = [
    totalExp > 0 ? `EXP +${totalExp}` : null,
    totalGold > 0 ? `Gold +${totalGold}` : null,
    ...battleRewards.map(rewardText),
    ...levelUps,
  ].filter((line): line is string => Boolean(line));

  emitNotification({
    type: 'success',
    title: `${defeated} を討伐！`,
    message: summaryLines.join('\n'),
    icon: '✓',
    rarity: rewardRarity(battleRewards, isBoss || levelUps.length > 0 ? 'rare' : 'common'),
    durationMs: summaryLines.length >= 4 ? 5200 : 3800,
    dedupeKey: `defeat:${enemyIds.join(',')}:${Date.now()}`,
  });
  if (isBoss) {
    emitNotification({
      type: 'achievement',
      channel: 'achievement',
      title: 'BOSS DEFEATED',
      message: defeated,
      icon: '✦',
      rarity: 'rare',
      dedupeKey: `boss:${enemyIds.join(',')}`,
    });
  }
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

function battleBonusRewards(save:SaveData,worldId: string, enemyIds: string[], isBoss: boolean): RewardEntry[] {
  const rewards: RewardEntry[] = [];
  if (Math.random() < (isBoss ? 0.9 : 0.32)) {
    const qty = (isBoss ? 45 : 8) + Math.floor(Math.random() * (isBoss ? 55 : 18));
    rewards.push({ kind: 'gold', id: 'gold', qty, label: 'Gold' });
  }
  if (Math.random() < (isBoss ? 0.72 : 0.18)) rewards.push({ kind: 'codex', id: `codex_enemy_${enemyIds[0]}`, qty: 1, label: '図鑑ページ' });
  const missingPieces=fragmentsForWorld(worldId).filter((fragment)=>!save.storyFragments.includes(fragment.id));
  if(missingPieces.length&&Math.random()<(isBoss?1:0.12)){const index=(save.defeatCounts?.[enemyIds[0]]??0)%missingPieces.length;rewards.push({kind:'story',id:missingPieces[index].id,qty:1,label:`アルバムピース ${missingPieces[index].pieceNumber}`,rarity:'rare'});}
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
  arenaRun: null,

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
    if (!nextSave.playerAvatar) {
      set({ save: nextSave, scene: 'characterCreate' });
      return;
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
  createPlayerAvatar: ({ name, headStyle }) => {
    const save = get().save;
    if (!save) return;
    const bodies: PlayerAvatar['bodyType'][] = ['guardian', 'scholar', 'wanderer'];
    const playerAvatar: PlayerAvatar = {
      name: name.trim().slice(0, 12) || 'Reader',
      headStyle,
      bodyType: bodies[Math.floor(Math.random() * bodies.length)],
    };
    const nextSave = { ...save, playerAvatar };
    saveSlot(nextSave);
    const fallbackWorld = nextSave.progress.currentWorldId ?? nextSave.progress.unlockedWorldIds[0];
    set({ save: nextSave });
    if (fallbackWorld) get().enterTown(fallbackWorld);
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
    const nextSave: SaveData = activatePortal(normalizeActiveParty({
      ...save,
      party,
      progress: { ...save.progress, currentWorldId: worldId },
    }),worldId,0);
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
        notifyRewards(rewards);
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
        emitNotification({ type: 'success', title: '隠し部屋を発見！', icon: '!', rarity: 'rare', dedupeKey: `secret:${result.entity?.id ?? map.floorIndex}` });
        notifyRewards(rewards);
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
        emitNotification({ type: 'success', title: 'HP 回復', message: '休息碑に触れた', icon: '♥', dedupeKey: `rest:${map.floorIndex}:${result.map.player.x}:${result.map.player.y}` });
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
        useBattleStore.getState().start(
          getActiveParty(save),
          e.enemyIds ?? [],
          e.kind === 'boss',
          permanentStats(save),
          save.equipmentLevels ?? {},
          (save.pets ?? []).filter((pet) => save.petSlots?.includes(pet.uid)),
          save.inventory,
        );
        return;
      }
    }
  },

  descendFloor: () => {
    const { worldId, map, save } = get();
    if (!worldId || !map || !save) return;
    const dgn = getDungeon(getWorld(worldId).dungeonId);
    const next = map.floorIndex + 1;
    if (next >= dgn.floors.length) {
      // 階段の先がもう無い（通常はボスフロアに階段は無いので来ない）
      set({ scene: 'worldMap', map: null });
      return;
    }
    const nextSave=activatePortal(save,worldId,next);saveSlot(nextSave);set({ save:nextSave,map: generateDungeonMap(worldId, next), mapToast: `${dgn.floors[next].name} へ降りた。ポータルを解放した。` });
  },

  onBattleWon: () => {
    const { encounter, worldId, save, map, arenaRun } = get();
    const battle = useBattleStore.getState();
    if(save&&arenaRun){
      const elapsed=Math.max(0,Date.now()-arenaRun.waveStartedAt);const wave=arenaRun.currentWave;const awarded=applyArenaReward(save,wave);
      const arena=awarded.save.arena!;const previous=arena.bestTimes[wave];const party=awarded.save.party.map((owned)=>{const combatant=battle.combatants.find((entry)=>entry.side==='ally'&&!entry.isPet&&entry.sourceId===owned.characterId);return combatant?{...owned,currentHp:combatant.hp,currentMp:combatant.mp}:owned;});
      const pets=(awarded.save.pets??[]).map((pet)=>{const combatant=battle.combatants.find((entry)=>entry.uid===pet.uid);return combatant?{...pet,currentHp:combatant.hp}:pet;});
      const nextSave={...awarded.save,party,pets,arena:{...arena,bestTimes:{...arena.bestTimes,[wave]:previous?Math.min(previous,elapsed):elapsed}}};
      saveSlot(nextSave);battle.reset();set({save:nextSave,scene:'arena',arenaRun:{...arenaRun,currentWave:wave+1,lastRewardLabel:awarded.reward.label,lastWaveTime:elapsed},mapToast:`${awarded.reward.label} / ${awarded.reward.gold}G`});return;
    }
    if (!encounter || !worldId || !save) return;
    const enemyIds = encounter.enemyIds;

    const commerce=normalizeCommerce(save.commerce);const expMultiplier=commerce.activeBoosts.expUntil>Date.now()?10:1;const dropMultiplier=commerce.activeBoosts.dropUntil>Date.now()?10:1;
    const totalExp = enemyIds.reduce((sum, id) => {
      const enemy = getEnemy(id);
      const research = enemyResearchBenefit(save.defeatCounts?.[id] ?? 0);
      return sum + Math.ceil(enemy.exp * (1 + research.expRate));
    }, 0)*expMultiplier;
    const totalGold = enemyIds.reduce((sum, id) => {
      const enemy = getEnemy(id);
      const baseGold = enemy.gold ?? Math.max(4, Math.floor(enemy.exp / 3));
      const research = enemyResearchBenefit(save.defeatCounts?.[id] ?? 0);
      return sum + Math.ceil(baseGold * (1 + research.goldRate));
    }, 0);

    const drops: Record<string, number> = {};
    for (const id of enemyIds) {
      const research = enemyResearchBenefit(save.defeatCounts?.[id] ?? 0);
      for (const d of getEnemy(id).dropTable) {
        if (Math.random() < Math.min(1, (d.rate + research.dropRateBonus)*dropMultiplier)) {
          drops[d.materialId] = (drops[d.materialId] ?? 0) + 1;
        }
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
    const bonusRewards = battleBonusRewards(save,worldId, enemyIds, encounter.isBoss);
    const defeatCounts = addDefeats(save.defeatCounts ?? {}, enemyIds);

    const nextSaveBase: SaveData = {
      ...save,
      party: newParty,
      inventory,
      items,
      gold: save.gold + totalGold,
      codex: { discoveredIds: discover(save, codexIds) },
      defeatCounts,
      pets: (save.pets ?? []).map((pet) => {
        const combatant=allCombatants.find((entry)=>entry.uid===pet.uid);
        return combatant?{...pet,currentHp:combatant.hp}:pet;
      }),
    };

    // 倒した敵をマップから除去
    const nextMap = map ? removeEntity(map, encounter.entityId) : null;
    let nextSave = nextMap
      ? updateExploration(applyRewards(nextSaveBase, bonusRewards), worldId, nextMap)
      : applyRewards(nextSaveBase, bonusRewards);
    nextSave = awardSummonedPetExp(nextSave, totalExp);
    if(encounter.isBoss){nextSave=awakenConstellation(nextSave,worldId);const soul=applyBossSoulFlags(nextSave,enemyIds);nextSave=soul.save;if(soul.raised.length)levelUps.push(`SOUL LEVEL +1：${soul.raised.map((id)=>getCharacter(id).name).join('・')}`);}
    const capture = tryCapturePet(nextSave, enemyIds);
    nextSave = capture.save;
    if (capture.captured) emitNotification({ type:'achievement', title:'NEW FAMILIAR', message:`${getPet(capture.captured.petId).name} が仲間になった`, icon:'◉', rarity:'epic', dedupeKey:`pet-capture:${capture.captured.petId}` });

    notifyBattleResult(enemyIds, totalExp, totalGold, drops, bonusItems, bonusRewards, levelUps, encounter.isBoss);
    for (const id of new Set(enemyIds)) {
      const before = save.defeatCounts?.[id] ?? 0;
      const after = defeatCounts[id] ?? before;
      for (const level of crossedResearchLevels(before, after)) {
        emitNotification({
          type: 'achievement',
          channel: 'achievement',
          title: '伝承研究が進展',
          message: `${getEnemy(id).name} 研究 Rank ${level} を解放`,
          icon: '§',
          rarity: level === 3 ? 'epic' : 'rare',
          dedupeKey: `research:${id}:${level}`,
        });
      }
    }

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
    if(save&&get().arenaRun){useBattleStore.getState().reset();const party=save.party.map((owned)=>{const stats=statsWithEquipment(getCharacter(owned.characterId),owned,permanentStats(save),save.equipmentLevels);return{...owned,currentHp:stats.hp,currentMp:stats.mp};});const pets=(save.pets??[]).map((pet)=>({...pet,currentHp:petStats(pet).hp}));const next={...save,party,pets};saveSlot(next);set({save:next,scene:'town',arenaRun:null,mapToast:'闘技場から帰還した。所持金の敗北ペナルティはありません。'});return;}
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
      pets: (save.pets ?? []).map((pet)=>({...pet,currentHp:petStats(pet).hp})),
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
    const previouslyUnlocked = new Set(save.progress.unlockedWorldIds);

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
    const unlockedWorlds = nextSave.progress.unlockedWorldIds
      .filter((id) => !previouslyUnlocked.has(id) && id !== worldId)
      .map((id) => getWorld(id));

    set({
      save: nextSave,
      scene: 'worldClear',
      map: null,
      encounter: null,
      newlyJoinedCharacterId: alreadyHas ? null : world.rewardCharacterId,
    });
    saveSlot(nextSave);
    emitNotification({
      type: 'achievement',
      channel: 'achievement',
      title: 'STORY RESTORED',
      message: world.title,
      icon: '✧',
      rarity: 'legendary',
      dedupeKey: `story-restored:${worldId}`,
    });
    emitNotification({
      type: 'story',
      title: 'Bibliotheca更新',
      message: `${world.title} の記録が戻った`,
      icon: '✧',
      rarity: 'rare',
      dedupeKey: `bibliotheca:${worldId}`,
    });
    if (!alreadyHas) {
      const joined = getCharacter(world.rewardCharacterId);
      emitNotification({
        type: 'achievement',
        channel: 'achievement',
        title: 'NEW ALLY',
        message: `${joined.name} Joined`,
        icon: '★',
        rarity: 'rare',
        dedupeKey: `ally:${world.rewardCharacterId}`,
      });
    }
    unlockedWorlds.forEach((unlocked) => emitNotification({
      type: 'achievement',
      channel: 'achievement',
      title: 'NEW WORLD',
      message: `${unlocked.title} Unlocked`,
      icon: '◇',
      rarity: 'legendary',
      dedupeKey: `world-unlocked:${unlocked.id}`,
    }));
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
    emitNotification({
      type: 'achievement',
      channel: 'achievement',
      title: 'LITERARY ESSENCE',
      message: `${result.toStageName} Awakened`,
      icon: '✦',
      rarity: 'rare',
      dedupeKey: `evolve:${result.owned.characterId}`,
    });
    return { ok: true, message: `${result.fromStageName} は ${result.toStageName} に進化した！` };
  },

  commitStatusAllocation: (partyIndex, allocation) => {
    const save = get().save;
    const owned = save?.party[partyIndex];
    if (!save || !owned) return false;
    const allocated = commitStatusAllocationEngine(owned, allocation);
    if (!allocated) return false;
    const party = save.party.map((member, index) => (index === partyIndex ? allocated : member));
    const nextSave = { ...save, party };
    set({ save: nextSave });
    saveSlot(nextSave);
    return true;
  },

  blessCharacter: (partyIndex, patronWorldId) => {
    const save = get().save;
    const owned = save?.party[partyIndex];
    const patrons = save ? unlockedConstellationIds(save) : [];
    if (!save || !owned || !patrons.includes(patronWorldId)) return false;
    const blessed = blessCharacterEngine(owned, patronWorldId, patrons.length);
    if (!blessed) return false;
    const stats = statsWithEquipment(getCharacter(blessed.characterId), blessed);
    blessed.currentHp = stats.hp;
    blessed.currentMp = stats.mp;
    const nextSave = { ...save, party: save.party.map((member, index) => index === partyIndex ? blessed : member), settings:{...save.settings,skipBlessingCinematics:save.settings?.skipBlessingCinematics??false,blessingCinematicsSeen:true} };
    set({ save: nextSave, overlay: 'character' });
    saveSlot(nextSave);
    emitNotification({ type: 'achievement', channel: 'achievement', title: 'CONSTELLATION BLESSING', message: `${getCharacter(blessed.characterId).name} 祝福 ${blessed.blessingCount}回`, icon: '✦', rarity: 'legendary' });
    return true;
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
    emitNotification({ type: 'success', title: 'HP 回復', message: 'Lodgeで全回復', icon: '♥', dedupeKey: 'heal:lodge' });
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
    emitNotification({ type: 'success', title: 'HP 回復', message: 'HPとMPが全回復', icon: '♥', dedupeKey: 'heal:inn' });
  },

  buyEquipment: (partyIndex, equipmentId) => {
    const save = get().save;
    const owned = save?.party[partyIndex];
    if (!save || !owned) return;
    const item = getEquipment(equipmentId);
    if (owned.level < (item.requiredLevel ?? 1)) return;
    const equippedId = item.slot === 'weapon'
      ? owned.equippedWeaponId
      : item.slot === 'head' ? owned.equippedHeadId
        : item.slot === 'armor' ? owned.equippedArmorId
          : item.slot === 'arms' ? owned.equippedArmsId
            : item.slot === 'shield' ? owned.equippedShieldId : owned.equippedLegsId;
    const equippedAlready = equippedId === item.id;
    const ownedLoot = (save.equipmentInventory ?? []).includes(item.id);
    if (equippedAlready || (!ownedLoot && save.gold < item.price)) return;
    const nextOwned = equipItem(owned, item.slot, item.id);
    const party = save.party.map((p, index) => index === partyIndex ? nextOwned : p);
    const equipmentInventory = ownedLoot ? save.equipmentInventory : [...new Set([...(save.equipmentInventory ?? []), item.id])];
    const nextSave = { ...save, party, equipmentInventory, gold: ownedLoot ? save.gold : save.gold - item.price };
    set({ save: nextSave, mapToast: `${item.name} を装備した！` });
    saveSlot(nextSave);
    emitNotification({
      type: 'item',
      title: ownedLoot ? `${item.name} を装備` : `${item.name} を購入！`,
      message: ownedLoot ? '装備を変更' : `Gold -${item.price}`,
      icon: '⚔',
      rarity: item.price >= 100 ? 'rare' : 'common',
      dedupeKey: `buy-equipment:${item.id}:${Date.now()}`,
    });
  },

  forgeEquipment: (equipmentId) => {
    const save = get().save;
    if (!save || !(save.equipmentInventory ?? []).includes(equipmentId)) return;
    const item = getEquipment(equipmentId);
    const currentLevel = save.equipmentLevels?.[equipmentId] ?? 0;
    const cost = forgeCost(item, currentLevel);
    if (!cost || currentLevel >= MAX_EQUIPMENT_LEVEL) return;
    if (save.gold < cost.gold || (save.inventory[cost.materialId] ?? 0) < cost.materialQty) return;
    const inventory = { ...save.inventory, [cost.materialId]: (save.inventory[cost.materialId] ?? 0) - cost.materialQty };
    const equipmentLevels = { ...(save.equipmentLevels ?? {}), [equipmentId]: currentLevel + 1 };
    const nextSave = { ...save, inventory, equipmentLevels, gold: save.gold - cost.gold };
    set({ save: nextSave, mapToast: `${item.name} を +${currentLevel + 1} に強化した！` });
    saveSlot(nextSave);
    emitNotification({ type: 'item', title: 'FORGE SUCCESS', message: `${item.name} +${currentLevel + 1}`, icon: '⚒', rarity: currentLevel + 1 >= MAX_EQUIPMENT_LEVEL ? 'epic' : 'rare', dedupeKey: `forge:${equipmentId}:${currentLevel + 1}` });
  },

  craftEquipment: (recipeId) => {
    const save = get().save;
    const recipe = EQUIPMENT_RECIPES.find((entry) => entry.id === recipeId);
    if (!save || !recipe) return;
    const nextSave = craftEquipmentEngine(save, recipe);
    if (!nextSave) return;
    const item = getEquipment(recipe.resultEquipmentId);
    set({ save: nextSave, mapToast: `${item.name} の制作に成功した！` });
    saveSlot(nextSave);
    emitNotification({ type: 'item', title: 'CRAFT SUCCESS', message: item.name, icon: '⚒', rarity: 'epic', dedupeKey: `craft:${recipe.id}` });
  },

  completeFishing: () => {
    const save = get().save;
    if (!save) return null;
    const result = resolveFishing(save);
    set({ save: result.save, mapToast: `${result.reward.label} を釣り上げた！` });
    saveSlot(result.save);
    emitNotification({ type: 'item', title: result.milestone ? 'FISHING MILESTONE' : 'FISHING', message: `${result.reward.label} ×${result.reward.qty}`, icon: '♒', rarity: result.milestone ? 'epic' : 'common', dedupeKey: `fishing:${result.save.fishing?.count}` });
    return result.reward;
  },

  setPetSlot: (slot, uid) => { const save=get().save;if(!save)return;const next=setPetSlotEngine(save,slot,uid);set({save:next});saveSlot(next); },
  trainPet: (uid) => { const save=get().save;if(!save)return false;const next=trainPetEngine(save,uid);if(!next)return false;set({save:next});saveSlot(next);return true; },
  evolvePet: (uid) => { const save=get().save;if(!save)return false;const next=evolvePetEngine(save,uid);if(!next)return false;set({save:next});saveSlot(next);return true; },

  enterArena:(startWave)=>{const save=get().save;if(!save||save.gold<ARENA_ENTRY_FEE)return false;const maxStart=Math.min(5,Math.max(1,(save.arena?.bestWave??0)+1));const selected=Math.max(1,Math.min(maxStart,startWave));const arena={...(save.arena??{bestWave:0,selectedStartWave:1,bestTimes:{},claimedFirstWaves:[],attempts:0}),selectedStartWave:selected,attempts:(save.arena?.attempts??0)+1};const next={...save,gold:save.gold-ARENA_ENTRY_FEE,arena};const now=Date.now();saveSlot(next);set({save:next,overlay:null,arenaRun:{currentWave:selected,startWave:selected,runStartedAt:now,waveStartedAt:now,deadline:now+ARENA_WAVE_LIMIT_MS},scene:'arena'});return true;},
  startArenaWave:()=>{const {save,arenaRun}=get();if(!save||!arenaRun||arenaRun.currentWave>ARENA_MAX_WAVE)return;const enemyIds=ARENA_WAVES[arenaRun.currentWave];const now=Date.now();set({scene:'battle',arenaRun:{...arenaRun,waveStartedAt:now,deadline:now+ARENA_WAVE_LIMIT_MS}});useBattleStore.getState().start(getActiveParty(save),enemyIds,false,permanentStats(save),save.equipmentLevels,(save.pets??[]).filter((pet)=>save.petSlots?.includes(pet.uid)),save.inventory);},
  exitArena:()=>{const save=get().save;if(!save)return;useBattleStore.getState().reset();const party=save.party.map((owned)=>{const stats=statsWithEquipment(getCharacter(owned.characterId),owned,permanentStats(save),save.equipmentLevels);return{...owned,currentHp:stats.hp,currentMp:stats.mp};});const pets=(save.pets??[]).map((pet)=>({...pet,currentHp:petStats(pet).hp}));const next={...save,party,pets};saveSlot(next);set({save:next,arenaRun:null,scene:'town',overlay:null,mapToast:'闘技場を退出した。'});},
  restoreConstellation:(worldId)=>{const save=get().save;if(!save)return false;const next=restoreConstellationStatue(save,worldId);if(!next)return false;saveSlot(next);set({save:next});emitNotification({type:'achievement',title:'CONSTELLATION RESTORED',message:`${getWorld(worldId).title} の文学星座と身体スキンを解放`,icon:'✦',rarity:'legendary',dedupeKey:`constellation:${worldId}`});return true;},
  setCharacterSkin:(partyIndex,bodyWorldId,locked)=>{const save=get().save;if(!save||bodyWorldId&&!save.ownedBodySkins?.includes(bodyWorldId))return;const party=save.party.map((owned,index)=>index===partyIndex?{...owned,bodySkinWorldId:bodyWorldId,skinLocked:locked}:owned);const next={...save,party};saveSlot(next);set({save:next});},
  setSkillSlot:(partyIndex,slot,skillId)=>{const save=get().save,owned=save?.party[partyIndex];if(!save||!owned||slot<0||slot>=3||skillId&&!owned.learnedSkillIds.includes(skillId))return;const slots=Array.from({length:3},(_,index)=>owned.equippedSkillIds?.[index]??null);if(skillId){const previous=slots.indexOf(skillId);if(previous>=0)slots[previous]=slots[slot];}slots[slot]=skillId;const party=save.party.map((member,index)=>index===partyIndex?{...member,equippedSkillIds:slots}:member);const next={...save,party};saveSlot(next);set({save:next});},
  setSkipBlessingCinematics:(enabled)=>{const save=get().save;if(!save)return;const next={...save,settings:{...save.settings,skipBlessingCinematics:enabled,blessingCinematicsSeen:save.settings?.blessingCinematicsSeen??false}};saveSlot(next);set({save:next});},
  setGameSettings:(settings)=>{const save=get().save;if(!save)return;const next={...save,settings:{skipBlessingCinematics:false,blessingCinematicsSeen:false,...save.settings,...settings}};saveSlot(next);set({save:next});localStorage.setItem('british-legends:se-volume',String(next.settings.seVolume??.8));},
  travelPortal:(id)=>{const save=get().save;if(!save||!save.adventure?.openPortals.includes(id))return false;const [worldId,floorText]=id.split(':');const floorIndex=Number(floorText);const soul=Math.max(0,...save.party.map((member)=>member.soulLevel??0));if(!save.progress.unlockedWorldIds.includes(worldId)||!Number.isInteger(floorIndex)||soul<floorIndex)return false;const next={...save,progress:{...save.progress,currentWorldId:worldId}};saveSlot(next);set({save:next,worldId,map:generateDungeonMap(worldId,floorIndex),scene:'dungeon',overlay:null,mapToast:`ポータルから第${floorIndex+1}層へ転移した。`});return true;},
  claimAdventureEvent:(eventId)=>{const save=get().save;if(!save)return false;const result=claimOneTimeEvent(save,eventId);if(!result.first)return false;saveSlot(result.save);set({save:result.save,mapToast:'司書から回復薬を受け取った。'});return true;},
  tradeAdventure:(tradeId,giveId,giveQty,getId,getQty)=>{const save=get().save;if(!save)return false;const next=tradeAdventureItem(save,tradeId,giveId,giveQty,getId,getQty);if(!next)return false;saveSlot(next);set({save:next,mapToast:'交換が成立した。'});return true;},

  buyItem: (itemId) => {
    const save = get().save;
    const item = STORE_ITEMS[itemId];
    if (!save || !item || save.gold < item.price) return;
    const items = { ...save.items, [itemId]: (save.items[itemId] ?? 0) + 1 };
    const nextSave = { ...save, items, gold: save.gold - item.price };
    set({ save: nextSave, mapToast: `${item.name} を購入した。` });
    saveSlot(nextSave);
    emitNotification({
      type: 'item',
      title: `${item.name} を購入！`,
      message: `Gold -${item.price}`,
      icon: '✚',
      dedupeKey: `buy-item:${item.id}:${Date.now()}`,
    });
  },

  consumeItem: (itemId) => {
    const save = get().save;
    if (!save || (save.items[itemId] ?? 0) <= 0) return false;
    const items = { ...save.items, [itemId]: save.items[itemId] - 1 };
    const nextSave = { ...save, items };
    set({ save: nextSave });
    saveSlot(nextSave);
    emitNotification({
      type: 'success',
      title: STORE_ITEMS[itemId]?.name ?? 'アイテム使用',
      message: 'どうぐを使用',
      icon: itemId.includes('potion') || itemId === 'elixir' ? '♥' : '✚',
      dedupeKey: `consume:${itemId}:${Date.now()}`,
    });
    return true;
  },

  setQuickSlot: (slotIndex, itemId) => {
    const save = get().save;
    if (!save || (itemId && !STORE_ITEMS[itemId])) return;
    const quickSlots = assignQuickSlot(save.quickSlots ?? [], slotIndex, itemId);
    const nextSave = { ...save, quickSlots };
    set({ save: nextSave });
    saveSlot(nextSave);
    emitNotification({
      type: 'item',
      title: `QUICK SLOT ${slotIndex + 1}`,
      message: itemId ? `${STORE_ITEMS[itemId].name} を登録` : '登録を解除',
      icon: '◇',
      dedupeKey: `quick-slot:${slotIndex}:${itemId ?? 'empty'}:${Date.now()}`,
    });
  },

  toggleActiveParty: (partyIndex) => {
    const save = get().save;
    const member = save?.party[partyIndex];
    if (!save || !member) return;
    const nextSave = toggleActivePartyMember(save, member.characterId);
    set({ save: nextSave });
    saveSlot(nextSave);
  },
  purchaseCashProduct:(productId,partyIndex=0)=>{const save=get().save;if(!save)return {ok:false,message:'セーブデータがありません'};const result=purchaseProduct(save,productId,partyIndex);if(result.ok){saveSlot(result.save);set({save:result.save,mapToast:result.message});emitNotification({type:'item',title:'SHOP PURCHASE',message:result.message,icon:'♦',rarity:'rare',dedupeKey:`cash:${productId}:${Date.now()}`});}return {ok:result.ok,message:result.message};},
  grantSandboxDiamonds:()=>{const save=get().save;if(!save)return;const next=grantSandboxDiamondsEngine(save);saveSlot(next);set({save:next,mapToast:next===save?'テストダイヤは受取済みです':'テストダイヤ500個を受け取りました'});},
  activateBoost:(itemId)=>{const save=get().save;if(!save)return false;const next=useTimedBoost(save,itemId);if(!next)return false;saveSlot(next);set({save:next,mapToast:'30分ブーストを開始しました'});return true;},
}));
