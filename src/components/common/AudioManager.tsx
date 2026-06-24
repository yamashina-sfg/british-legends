import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useBattleStore } from '@/store/useBattleStore';

const TRACKS = {
  lodge: '/audio/town-theme-rpg.mp3',
  dungeon: '/audio/dungeon-theme.mp3',
  battle: '/audio/medieval-battle.mp3',
  boss: '/audio/boss-battle-theme.mp3',
} as const;

function trackForScene(scene: string, isBoss: boolean) {
  if (scene === 'battle') return isBoss ? 'boss' : 'battle';
  if (scene === 'dungeon') return 'dungeon';
  return 'lodge';
}

/** BGM is activated by the player's first interaction to satisfy browser autoplay policies. */
export function AudioManager() {
  const scene = useGameStore((state) => state.scene);
  const isBoss = useBattleStore((state) => state.isBoss);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const track = useMemo(() => trackForScene(scene, isBoss), [scene, isBoss]);

  useEffect(() => {
    const audio = new Audio(TRACKS[track]);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = track === 'boss' ? 0.18 : 0.22;
    const previous = audioRef.current;
    audioRef.current = audio;
    previous?.pause();
    previous && (previous.currentTime = 0);
    if (enabled) void audio.play().catch(() => setEnabled(false));
    return () => audio.pause();
  }, [enabled, track]);

  useEffect(() => {
    const startAudio = () => {
      if (enabled) return;
      setEnabled(true);
      void audioRef.current?.play().catch(() => setEnabled(false));
    };
    window.addEventListener('pointerdown', startAudio, { once: true });
    return () => window.removeEventListener('pointerdown', startAudio);
  }, [enabled]);

  const toggle = () => {
    if (enabled) {
      audioRef.current?.pause();
      setEnabled(false);
    } else {
      setEnabled(true);
      void audioRef.current?.play().catch(() => setEnabled(false));
    }
  };

  return (
    <button
      type="button"
      className={`audio-toggle ${enabled ? 'is-on' : ''}`}
      onClick={toggle}
      aria-label={enabled ? 'BGMを止める' : 'BGMを再生する'}
      title={enabled ? 'BGMを止める' : 'BGMを再生する'}
    >
      {enabled ? '♪' : '×'}
    </button>
  );
}
