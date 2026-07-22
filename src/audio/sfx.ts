export type BattleSfx = 'attack' | 'skill' | 'defend' | 'item';
export type GameSfx='click'|'confirm'|'cancel'|'item_buy'|'item_get'|'attachment'|'reinforce'|'craft'|'pet_summon'|'pet_return'|'portal'|'levelup'|'chest'|'unique_get'|'blessing'|'barrier'|'before_explosion'|'after_explosion'|'recovery';

const SFX_PATHS: Record<BattleSfx | 'hit', string> = {
  attack: '/audio/sfx/attack-slash.wav',
  hit: '/audio/sfx/impact-hit.wav',
  skill: '/audio/sfx/skill-flare.wav',
  defend: '/audio/sfx/guard-block.wav',
  item: '/audio/sfx/item-chime.wav',
};

const VOLUME: Record<BattleSfx | 'hit', number> = {
  attack: 0.52,
  hit: 0.38,
  skill: 0.44,
  defend: 0.4,
  item: 0.42,
};

const pool = new Map<string, HTMLAudioElement[]>();

function cloneFor(path: string) {
  const existing = pool.get(path) ?? [];
  const free = existing.find((audio) => audio.paused || audio.ended);
  if (free) return free;
  const next = new Audio(path);
  next.preload = 'auto';
  existing.push(next);
  pool.set(path, existing);
  return next;
}

function play(path: string, volume: number) {
  const audio = cloneFor(path);
  audio.pause();
  audio.currentTime = 0;
  const setting=Number(localStorage.getItem('british-legends:se-volume')??'.8');
  audio.volume = Math.max(0,Math.min(1,volume*setting));
  void audio.play().catch(() => {
    // Browser autoplay policy can reject sound before the first player gesture.
  });
}

export function preloadBattleSfx() {
  Object.values(SFX_PATHS).forEach((path) => cloneFor(path).load());
}

export function playBattleSfx(type: BattleSfx) {
  play(SFX_PATHS[type], VOLUME[type]);
  if (type === 'attack') {
    window.setTimeout(() => play(SFX_PATHS.hit, VOLUME.hit), 95);
  }
}

const GAME_SFX:Record<GameSfx,{path:string;volume:number}>={click:{path:SFX_PATHS.item,volume:.18},confirm:{path:SFX_PATHS.item,volume:.3},cancel:{path:SFX_PATHS.defend,volume:.2},item_buy:{path:SFX_PATHS.item,volume:.42},item_get:{path:SFX_PATHS.item,volume:.48},attachment:{path:SFX_PATHS.defend,volume:.34},reinforce:{path:SFX_PATHS.skill,volume:.42},craft:{path:SFX_PATHS.skill,volume:.5},pet_summon:{path:SFX_PATHS.skill,volume:.36},pet_return:{path:SFX_PATHS.defend,volume:.3},portal:{path:SFX_PATHS.skill,volume:.45},levelup:{path:SFX_PATHS.skill,volume:.52},chest:{path:SFX_PATHS.item,volume:.5},unique_get:{path:SFX_PATHS.skill,volume:.55},blessing:{path:SFX_PATHS.skill,volume:.55},barrier:{path:SFX_PATHS.defend,volume:.5},before_explosion:{path:SFX_PATHS.skill,volume:.28},after_explosion:{path:SFX_PATHS.hit,volume:.58},recovery:{path:SFX_PATHS.item,volume:.4}};
export function playGameSfx(type:GameSfx){const cue=GAME_SFX[type];play(cue.path,cue.volume)}
