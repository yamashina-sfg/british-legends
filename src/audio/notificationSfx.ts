type WebAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let context: AudioContext | null = null;

function getContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtor = window.AudioContext ?? (window as WebAudioWindow).webkitAudioContext;
  if (!AudioCtor) return null;
  context = context ?? new AudioCtor();
  return context;
}

function tone(ctx: AudioContext, frequency: number, delay: number, duration: number, volume: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime + delay;

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.05);
}

export function playAchievementSfx() {
  const ctx = getContext();
  if (!ctx) return;
  void ctx.resume().catch(() => undefined);
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    tone(ctx, frequency, index * 0.075, 0.42, 0.045);
  });
}
