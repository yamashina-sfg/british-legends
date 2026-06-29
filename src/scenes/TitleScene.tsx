import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';
import bibliothecaArt from '@/assets/opening/bibliotheca.png';
import censorArt from '@/assets/opening/censor-arrival.png';
import erasedShelvesArt from '@/assets/opening/erased-shelves.png';
import fallenBookArt from '@/assets/opening/fallen-book.png';
import librarianVowArt from '@/assets/opening/librarian-vow.png';
import lodgeArt from '@/assets/opening/bibliotheca-lodge.png';

type OpeningBeat = {
  art: string;
  speaker: '司書' | 'The Censor' | '主人公' | '本' | '';
  text: string;
  caption?: string;
  camera: 'fade' | 'pan' | 'push' | 'shock' | 'glow' | 'vow' | 'portal' | 'lodge';
  tone?: 'dark' | 'danger' | 'hope' | 'white';
  books?: string[];
  title?: boolean;
};

const openingBeats: OpeningBeat[] = [
  {
    art: bibliothecaArt,
    speaker: '',
    text: 'ページをめくる音だけが、暗闇に落ちていく。',
    caption: 'Scene 1',
    camera: 'fade',
    tone: 'dark',
  },
  { art: bibliothecaArt, speaker: '司書', text: 'ここは Bibliotheca。', camera: 'push' },
  {
    art: bibliothecaArt,
    speaker: '司書',
    text: 'イギリス文学史に刻まれた物語が眠る、世界の記憶の図書館。',
    camera: 'pan',
  },
  {
    art: bibliothecaArt,
    speaker: '司書',
    text: '人々は何百年もの間、炎のそばで、劇場で、教室で、物語を語り継いできた。',
    camera: 'pan',
    books: ['Beowulf', 'Hamlet', 'Macbeth', 'Frankenstein', 'Sherlock Holmes', '1984'],
  },
  {
    art: censorArt,
    speaker: '',
    text: 'その夜、棚の奥で灯りがひとつ消えた。',
    camera: 'shock',
    tone: 'danger',
  },
  {
    art: censorArt,
    speaker: 'The Censor',
    text: '忘れられた物語に価値はない。',
    camera: 'push',
    tone: 'danger',
  },
  {
    art: erasedShelvesArt,
    speaker: '司書',
    text: '待て。そこにあるのは、ただの文字ではない。人が人であろうとした証だ。',
    camera: 'shock',
    tone: 'danger',
    books: ['Beowulf', 'Hamlet', 'Macbeth', 'Frankenstein', 'Sherlock Holmes'],
  },
  {
    art: erasedShelvesArt,
    speaker: '',
    text: 'ページから名が消える。英雄も、王も、怪物も、探偵も、白紙の沈黙へ沈んでいく。',
    camera: 'glow',
    tone: 'dark',
    books: ['Beowulf -> blank', 'Hamlet -> blank', 'Macbeth -> blank', 'Frankenstein -> blank', 'Sherlock Holmes -> blank'],
  },
  { art: fallenBookArt, speaker: '主人公', text: '……これは？', camera: 'glow', tone: 'hope' },
  { art: fallenBookArt, speaker: '本', text: 'Beowulf', camera: 'glow', tone: 'hope' },
  {
    art: fallenBookArt,
    speaker: '司書',
    text: '……見えるのか？ その本はもう、誰にも読めないはずだ。',
    camera: 'push',
    tone: 'hope',
  },
  {
    art: librarianVowArt,
    speaker: '司書',
    text: '君の目は、消された物語の名を拾い上げる。古い言葉では、それを Reading Gift と呼ぶ。',
    camera: 'vow',
    tone: 'hope',
  },
  {
    art: librarianVowArt,
    speaker: '司書',
    text: '物語が消えれば、歴史も消える。歴史が消えれば、人々は自分たちが何者だったのかさえ忘れてしまう。',
    camera: 'vow',
  },
  {
    art: librarianVowArt,
    speaker: '司書',
    text: '君だけが、この白紙の向こうを読める。君だけが、Bibliotheca を救える。',
    camera: 'push',
    tone: 'hope',
  },
  {
    art: librarianVowArt,
    speaker: '司書',
    text: 'この本を開け。失われた伝説は、君が続きを読まなければ戻らない。',
    camera: 'portal',
    tone: 'hope',
  },
  {
    art: librarianVowArt,
    speaker: '',
    text: '光がページから溢れ、あなたの足元を、そして図書館そのものを飲み込んだ。',
    camera: 'portal',
    tone: 'white',
  },
  {
    art: lodgeArt,
    speaker: '',
    text: 'British Legends',
    caption: '失われた物語を取り戻す冒険が始まる。',
    camera: 'lodge',
    tone: 'hope',
    title: true,
  },
];

function playPageTurn() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const audio = new AudioContextClass();
  const duration = 0.18;
  const bufferSize = audio.sampleRate * duration;
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    const t = i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.5) * 0.2;
  }

  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(900, audio.currentTime);
  filter.frequency.exponentialRampToValueAtTime(2600, audio.currentTime + duration);
  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.1, audio.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  source.start();
  source.stop(audio.currentTime + duration);
}

function OpeningMovie({ onComplete }: { onComplete: () => void }) {
  const [beatIndex, setBeatIndex] = useState(0);
  const beat = openingBeats[beatIndex];
  const progress = useMemo(() => ((beatIndex + 1) / openingBeats.length) * 100, [beatIndex]);

  function next() {
    playPageTurn();
    if (beatIndex >= openingBeats.length - 1) {
      onComplete();
      return;
    }
    setBeatIndex((current) => current + 1);
  }

  return (
    <section
      className={`opening-movie opening-movie--${beat.camera} opening-movie--${beat.tone ?? 'dark'}`}
      onClick={next}
      aria-label="British Legends opening"
    >
      <img key={beat.art} className="opening-movie__art" src={beat.art} alt="" />
      <div className="opening-movie__vignette" />
      <div className="opening-movie__mist" />
      <div className="opening-movie__progress" style={{ transform: `scaleX(${progress / 100})` }} />
      <button
        type="button"
        className="opening-movie__skip"
        onClick={(event) => {
          event.stopPropagation();
          onComplete();
        }}
      >
        Skip
      </button>

      {beat.books && (
        <div className="opening-movie__books" aria-hidden="true">
          {beat.books.map((book) => (
            <span key={book}>{book}</span>
          ))}
        </div>
      )}

      {beat.title ? (
        <div className="opening-movie__title-card">
          <p>{beat.caption}</p>
          <h1>{beat.text}</h1>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              next();
            }}
          >
            Bibliotheca Lodge へ
          </button>
        </div>
      ) : (
        <div className="opening-movie__dialogue" role="button" tabIndex={0}>
          {beat.caption && <span className="opening-movie__caption">{beat.caption}</span>}
          {beat.speaker && <strong className="opening-movie__speaker">{beat.speaker}</strong>}
          <p>{beat.text}</p>
          <span className="opening-movie__prompt">Click</span>
        </div>
      )}
    </section>
  );
}

export function TitleScene() {
  const goSaveSelect = useGameStore((s) => s.goSaveSelect);
  const [showOpening, setShowOpening] = useState(false);

  if (showOpening) {
    return <OpeningMovie onComplete={goSaveSelect} />;
  }

  return (
    <div className="scene title-scene fade-in" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="center" style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 13, letterSpacing: 4 }} className="dim">
          BRITISH LEGENDS
        </div>
        <h1 style={{ fontSize: 34, color: 'var(--accent)', letterSpacing: 2, lineHeight: 1.2 }}>
          ブリティッシュ
          <br />
          レジェンズ
        </h1>
        <div className="small dim" style={{ marginTop: 10 }}>
          失われた文学世界 Bibliotheca を
          <br />
          修復する旅へ
        </div>
      </div>

      <div style={{ width: '70%', marginTop: 30 }} className="menu-list">
        <Button primary center onClick={() => setShowOpening(true)}>
          はじめる
        </Button>
        <Button center onClick={goSaveSelect}>
          セーブを選ぶ
        </Button>
      </div>

      <div className="tiny dim center" style={{ marginTop: 'auto', paddingTop: 24 }}>
        v0.1.0 — MVP
      </div>
    </div>
  );
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
