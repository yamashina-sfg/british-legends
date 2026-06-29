import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore, type Scene } from '@/store/useGameStore';

type WebAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

type TrackName = 'title' | 'opening' | 'lodge' | 'world' | 'dungeon' | 'battle' | 'boss' | 'clear';

const STORAGE_KEY = 'british-legends:bgm-enabled';

const FILE_TRACKS: Partial<Record<TrackName, { src: string; volume: number; loop: boolean }>> = {
  opening: { src: '/audio/opening-suite.wav', volume: 0.72, loop: true },
};

const fileBufferCache = new Map<string, Promise<AudioBuffer>>();

function trackForScene(scene: Scene): TrackName {
  if (scene === 'opening') return 'opening';
  if (scene === 'battle') return useGameStore.getState().encounter?.isBoss ? 'boss' : 'battle';
  if (scene === 'dungeon') return 'dungeon';
  if (scene === 'town') return 'lodge';
  if (scene === 'worldClear') return 'clear';
  if (scene === 'worldMap' || scene === 'worldSelect') return 'world';
  return 'title';
}

function createContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtor = window.AudioContext ?? (window as WebAudioWindow).webkitAudioContext;
  return AudioCtor ? new AudioCtor() : null;
}

function makeGain(ctx: AudioContext, value: number, destination: AudioNode) {
  const gain = ctx.createGain();
  gain.gain.value = value;
  gain.connect(destination);
  return gain;
}

function startOscillator(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  type: OscillatorType,
  volume: number,
) {
  const oscillator = ctx.createOscillator();
  const gain = makeGain(ctx, volume, destination);
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  oscillator.start();

  return () => {
    try {
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
      oscillator.stop(ctx.currentTime + 0.24);
    } catch {
      // Already stopped or context was closed.
    }
  };
}

function playTone(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'triangle',
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const now = ctx.currentTime;

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  filter.type = 'lowpass';
  filter.frequency.value = 760;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.08);
}

function loadFileBuffer(ctx: AudioContext, src: string): Promise<AudioBuffer> {
  const cached = fileBufferCache.get(src);
  if (cached) return cached;
  const promise = fetch(src)
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load BGM: ${src}`);
      return response.arrayBuffer();
    })
    .then((buffer) => ctx.decodeAudioData(buffer));
  fileBufferCache.set(src, promise);
  return promise;
}

async function startFileTrack(ctx: AudioContext, track: { src: string; volume: number; loop: boolean }) {
  const buffer = await loadFileBuffer(ctx, track.src);
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const now = ctx.currentTime;

  source.buffer = buffer;
  source.loop = track.loop;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(track.volume, now + 1.1);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);

  return () => {
    try {
      const stopAt = ctx.currentTime + 0.5;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12);
      source.stop(stopAt);
      window.setTimeout(() => gain.disconnect(), 700);
    } catch {
      // Already stopped or context was closed.
    }
  };
}

function startTrack(ctx: AudioContext, scene: Scene) {
  const track = trackForScene(scene);
  if (FILE_TRACKS[track]) {
    return () => {};
  }
  const master = makeGain(ctx, track === 'battle' || track === 'boss' ? 0.16 : 0.12, ctx.destination);
  const stops: Array<() => void> = [];
  const timers: number[] = [];

  if (track === 'opening') {
    stops.push(startOscillator(ctx, master, 65.41, 'sine', 0.06));
    stops.push(startOscillator(ctx, master, 130.81, 'triangle', 0.025));
    const notes = [261.63, 246.94, 196, 174.61, 220, 293.66, 329.63, 392];
    let step = 0;
    timers.push(window.setInterval(() => {
      const ominous = step > 8 && step < 18;
      const hopeful = step >= 18;
      playTone(ctx, master, notes[step % notes.length] * (hopeful ? 1.5 : 1), hopeful ? 1.3 : 1.05, hopeful ? 0.052 : 0.036, ominous ? 'sine' : 'triangle');
      if (ominous) playTone(ctx, master, 92.5, 1.4, 0.04, 'sine');
      if (hopeful && step % 2 === 0) playTone(ctx, master, 523.25, 1.0, 0.022, 'triangle');
      step += 1;
    }, 1550));
  } else if (track === 'battle' || track === 'boss') {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = track === 'boss' ? 420 : 520;
    filter.Q.value = track === 'boss' ? 0.95 : 0.65;
    filter.connect(master);

    // Dark battle cue: no percussion/noise, just low drones and slow dissonant pulses.
    stops.push(startOscillator(ctx, filter, track === 'boss' ? 36.71 : 49.0, 'sine', track === 'boss' ? 0.28 : 0.22));
    stops.push(startOscillator(ctx, filter, track === 'boss' ? 55.0 : 65.41, 'triangle', track === 'boss' ? 0.1 : 0.08));
    stops.push(startOscillator(ctx, filter, track === 'boss' ? 73.42 : 92.5, 'sine', track === 'boss' ? 0.07 : 0.045));

    const bassLine = track === 'boss'
      ? [36.71, 41.2, 34.65, 43.65, 36.71, 46.25, 41.2, 32.7]
      : [49.0, 46.25, 43.65, 51.91, 49.0, 55.0, 46.25, 41.2];
    const tensionLine = track === 'boss' ? [98.0, 103.83, 92.5, 110] : [130.81, 123.47, 138.59, 116.54];
    let step = 0;

    const tick = () => {
      const bass = bassLine[step % bassLine.length];
      playTone(ctx, filter, bass, track === 'boss' ? 1.35 : 1.15, track === 'boss' ? 0.14 : 0.11, 'triangle');
      if (step % 2 === 1) {
        playTone(ctx, filter, tensionLine[step % tensionLine.length], 0.78, track === 'boss' ? 0.048 : 0.035, 'sine');
      }
      step += 1;
    };

    tick();
    timers.push(window.setInterval(tick, 1180));
  } else if (track === 'dungeon') {
    stops.push(startOscillator(ctx, master, 73.42, 'sine', 0.08));
    stops.push(startOscillator(ctx, master, 110, 'triangle', 0.035));
    const notes = [146.83, 130.81, 123.47, 98.0];
    let step = 0;
    timers.push(window.setInterval(() => {
      playTone(ctx, master, notes[step % notes.length], 0.8, 0.035, 'triangle');
      step += 1;
    }, 1400));
  } else if (track === 'lodge') {
    stops.push(startOscillator(ctx, master, 98.0, 'sine', 0.06));
    stops.push(startOscillator(ctx, master, 146.83, 'triangle', 0.028));
    const notes = [196, 220, 174.61, 196];
    let step = 0;
    timers.push(window.setInterval(() => {
      playTone(ctx, master, notes[step % notes.length], 0.9, 0.03, 'sine');
      step += 1;
    }, 1600));
  } else if (track === 'clear') {
    stops.push(startOscillator(ctx, master, 130.81, 'sine', 0.05));
    const notes = [261.63, 329.63, 392, 523.25];
    notes.forEach((note, index) => {
      timers.push(window.setTimeout(() => playTone(ctx, master, note, 0.9, 0.05, 'triangle'), index * 320));
    });
  } else {
    stops.push(startOscillator(ctx, master, 82.41, 'sine', 0.05));
    stops.push(startOscillator(ctx, master, track === 'world' ? 164.81 : 123.47, 'triangle', 0.03));
  }

  return () => {
    timers.forEach((timer) => window.clearInterval(timer));
    stops.forEach((stop) => stop());
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    window.setTimeout(() => master.disconnect(), 420);
  };
}

export function AudioManager() {
  const scene = useGameStore((state) => state.scene);
  const [enabled, setEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) !== 'off');
  const contextRef = useRef<AudioContext | null>(null);
  const activeTrackRef = useRef<TrackName | null>(null);
  const startIdRef = useRef(0);
  const stopRef = useRef<() => void>(() => {});

  const stopCurrent = useCallback(() => {
    startIdRef.current += 1;
    activeTrackRef.current = null;
    stopRef.current();
    stopRef.current = () => {};
  }, []);

  const startCurrent = useCallback(async (force = false) => {
    if (!enabled) return;
    const track = trackForScene(scene);
    if (!force && activeTrackRef.current === track) return;
    const startId = startIdRef.current + 1;
    startIdRef.current = startId;
    const ctx = contextRef.current ?? createContext();
    if (!ctx) return;
    contextRef.current = ctx;
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => undefined);
    }
    const fileTrack = FILE_TRACKS[trackForScene(scene)];
    if (fileTrack) {
      stopCurrent();
      const stopFile = await startFileTrack(ctx, fileTrack).catch(() => null);
      if (!stopFile) return;
      if (startIdRef.current !== startId + 1 || trackForScene(useGameStore.getState().scene) !== track) {
        stopFile();
        return;
      }
      activeTrackRef.current = track;
      stopRef.current = stopFile;
      return;
    }
    stopCurrent();
    activeTrackRef.current = track;
    stopRef.current = startTrack(ctx, scene);
  }, [enabled, scene, stopCurrent]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    if (enabled) {
      void startCurrent(true);
    } else {
      stopCurrent();
    }

    return stopCurrent;
  }, [enabled, scene, startCurrent, stopCurrent]);

  useEffect(() => {
    if (!enabled) return undefined;
    const unlock = () => {
      void startCurrent();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [enabled, startCurrent]);

  return (
    <button
      type="button"
      className={`audio-toggle ${enabled ? 'is-on' : ''}`}
      aria-label={enabled ? 'BGMを止める' : 'BGMを鳴らす'}
      title={enabled ? 'BGMを止める' : 'BGMを鳴らす'}
      onClick={() => setEnabled((value) => !value)}
    >
      ♪
    </button>
  );
}
