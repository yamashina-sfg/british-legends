import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';

type Speaker = 'narration' | 'librarian' | 'censor' | 'hero';
type Motion = 'push' | 'drift' | 'close' | 'rise' | 'still';
type Mood = 'calm' | 'dark' | 'hope';
type Sfx = 'page' | 'boom' | 'chime' | 'whoosh' | null;

interface OpeningBeat {
  /** Background art under /public. Omit for the black cold-open. */
  image?: string;
  kind?: 'prologue' | 'vanish' | 'gift' | 'normal';
  speaker: Speaker;
  /** Chapter label (top-left). */
  title?: string;
  motion: Motion;
  mood: Mood;
  text: string;
  sfx?: Sfx;
}

const SPEAKER_LABEL: Record<Speaker, string | null> = {
  narration: null,
  librarian: '司書',
  censor: 'The Censor',
  hero: '???',
};

const OPENING_BEATS: OpeningBeat[] = [
  {
    kind: 'prologue',
    speaker: 'narration',
    motion: 'still',
    mood: 'dark',
    sfx: 'page',
    text: '——ページをめくる音だけが、闇の底に響いていた。',
  },
  {
    image: '/assets/opening/opening-bibliotheca.png',
    title: 'Scene 1 / Bibliotheca',
    speaker: 'librarian',
    motion: 'push',
    mood: 'calm',
    text: 'ここは Bibliotheca。イギリス文学史に刻まれた物語が眠る図書館。',
  },
  {
    image: '/assets/opening/opening-bibliotheca.png',
    title: 'Scene 2 / The Living Shelves',
    speaker: 'librarian',
    motion: 'drift',
    mood: 'calm',
    text: '人々は何百年もの間、物語を語り継いできた。Beowulf。Hamlet。Macbeth。Frankenstein。Sherlock Holmes。1984。',
  },
  {
    image: '/assets/opening/opening-censor.png',
    title: 'Scene 3 / The Censor',
    speaker: 'censor',
    motion: 'close',
    mood: 'dark',
    sfx: 'boom',
    text: '忘れられた物語に価値はない。',
  },
  {
    image: '/assets/opening/opening-erased-books.png',
    title: 'Scene 3 / Erasure',
    kind: 'vanish',
    speaker: 'narration',
    motion: 'still',
    mood: 'dark',
    sfx: 'whoosh',
    text: '本のページから文字が消えていく。Beowulf も、Hamlet も、Macbeth も、白紙の沈黙へ沈んでいく。',
  },
  {
    image: '/assets/opening/opening-reading-gift.png',
    title: 'Scene 4 / Reading Gift',
    kind: 'gift',
    speaker: 'narration',
    motion: 'rise',
    mood: 'hope',
    sfx: 'chime',
    text: '床には一冊だけ本が落ちていた。君が拾う。しかし本は真っ白だ。その瞬間、文字が浮かび上がる——Beowulf。',
  },
  {
    image: '/assets/opening/opening-reading-gift.png',
    speaker: 'librarian',
    motion: 'rise',
    mood: 'hope',
    text: '……見えるのか。その本はもう、この世界の誰にも読めないはずだ。',
  },
  {
    image: '/assets/opening/opening-librarian.png',
    title: 'Scene 5 / The Vow',
    speaker: 'librarian',
    motion: 'rise',
    mood: 'hope',
    text: '物語が消えれば、歴史も消える。歴史が消えれば、人々は、自分たちが何者だったのかさえ忘れてしまう。',
  },
  {
    image: '/assets/opening/opening-librarian.png',
    title: 'Scene 5 / British Legends',
    speaker: 'librarian',
    motion: 'push',
    mood: 'hope',
    text: '君だけが、この物語を読むことができる。君だけが、Bibliotheca を救える。',
  },
  {
    image: '/assets/opening/opening-lodge.png',
    title: 'Scene 6 / Into the Book',
    speaker: 'narration',
    motion: 'push',
    mood: 'hope',
    sfx: 'whoosh',
    text: '司書は一冊の本を君へ渡す。表紙には British Legends。ページが光り、君は物語の中へ吸い込まれていく。',
  },
];

/** Lightweight self-contained SFX so the cinematic beats land. Fires on user clicks (autoplay-safe). */
let sfxCtx: AudioContext | null = null;
function playSfx(kind: Sfx) {
  if (!kind || typeof window === 'undefined') return;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    sfxCtx = sfxCtx ?? new Ctor();
    const ctx = sfxCtx;
    if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);

    if (kind === 'boom') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + 0.7);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.5, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 1.2);
    } else if (kind === 'chime') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.11;
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.22, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        osc.connect(gain);
        gain.connect(master);
        osc.start(t);
        osc.stop(t + 1);
      });
    } else if (kind === 'page' || kind === 'whoosh') {
      const dur = kind === 'page' ? 0.22 : 0.5;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      src.buffer = buffer;
      filter.type = 'bandpass';
      filter.frequency.value = kind === 'page' ? 1800 : 600;
      filter.Q.value = kind === 'page' ? 0.8 : 0.5;
      gain.gain.value = kind === 'page' ? 0.28 : 0.34;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start(now);
    }
  } catch {
    // Audio is a nicety; never let it break the scene.
  }
}

export function OpeningScene() {
  const openLodge = useGameStore((state) => state.openLodge);
  const [beatIndex, setBeatIndex] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const finishedRef = useRef(false);
  const beat = OPENING_BEATS[beatIndex];
  const visibleText = useMemo(() => beat.text.slice(0, visibleChars), [beat.text, visibleChars]);
  const completedText = visibleChars >= beat.text.length;
  const speakerLabel = SPEAKER_LABEL[beat.speaker];

  // Reset the typewriter and trigger this beat's SFX on entry.
  useEffect(() => {
    setVisibleChars(0);
    playSfx(beat.sfx ?? null);
  }, [beatIndex, beat.sfx]);

  useEffect(() => {
    if (showLogo || completedText) return undefined;
    const timer = window.setInterval(() => {
      setVisibleChars((value) => Math.min(beat.text.length, value + 2));
    }, 36);
    return () => window.clearInterval(timer);
  }, [beat.text.length, completedText, showLogo]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    playSfx('whoosh');
    setShowLogo(true);
    window.setTimeout(() => openLodge(), 2400);
  }, [openLodge]);

  const advance = useCallback(() => {
    if (showLogo) return;
    if (!completedText) {
      setVisibleChars(beat.text.length);
      return;
    }
    if (beatIndex < OPENING_BEATS.length - 1) {
      setBeatIndex((value) => value + 1);
      return;
    }
    finish();
  }, [showLogo, completedText, beat.text.length, beatIndex, finish]);

  // Keyboard: Space / Enter / → advance, Esc skips.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        finish();
        return;
      }
      if (event.key === ' ' || event.key === 'Enter' || event.key === 'ArrowRight') {
        event.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, finish]);

  const sceneClass = [
    'opening-scene',
    `opening-scene--${beat.mood}`,
    beat.kind ? `opening-scene--${beat.kind}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={sceneClass} onClick={advance}>
      {beat.image ? (
        <img
          key={beat.image + beatIndex}
          className={`opening-scene__art opening-scene__art--${beat.motion}`}
          src={beat.image}
          alt=""
        />
      ) : (
        <div className="opening-scene__void" key={`void-${beatIndex}`} />
      )}

      <div className="opening-scene__veil" />
      <div className="opening-scene__dust" aria-hidden="true" />
      {beat.title && (
        <div className="opening-scene__chapter">
          <span>{beat.title}</span>
          <strong>Lost stories are being restored</strong>
        </div>
      )}

      {beat.kind === 'vanish' && <div className="opening-scene__blackout" aria-hidden="true" />}
      {beat.kind === 'gift' && (
        <div className="opening-scene__gift" aria-hidden="true">
          <span>Beowulf</span>
        </div>
      )}

      <div className="opening-scene__bar opening-scene__bar--top" aria-hidden="true" />
      <div className="opening-scene__bar opening-scene__bar--bottom" aria-hidden="true" />

      {showLogo ? (
        <div className="opening-scene__logo" aria-live="polite">
          <i className="opening-scene__flash" aria-hidden="true" />
          <span>British Legends</span>
          <small>失われた物語を、未来へ取り戻せ</small>
        </div>
      ) : (
        <>
          <div
            className={`opening-scene__dialogue opening-scene__dialogue--${beat.speaker}`}
            key={`d-${beatIndex}`}
          >
            {speakerLabel && <b className="opening-scene__name">{speakerLabel}</b>}
            <p>{visibleText}</p>
            <small>{completedText ? '▼ クリック / Space で進む' : ' '}</small>
          </div>

          <button
            type="button"
            className="opening-scene__skip"
            onClick={(event) => {
              event.stopPropagation();
              finish();
            }}
          >
            Skip ▶▶
          </button>
        </>
      )}
    </div>
  );
}
