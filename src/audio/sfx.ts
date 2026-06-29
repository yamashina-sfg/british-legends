export type BattleSfx = 'attack' | 'skill' | 'defend' | 'item';

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
  audio.volume = volume;
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
