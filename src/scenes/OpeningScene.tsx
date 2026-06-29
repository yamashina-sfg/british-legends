import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';

interface OpeningBeat {
  image: string;
  title: string;
  text: string;
  motion: 'push' | 'drift' | 'close' | 'rise';
}

const OPENING_BEATS: OpeningBeat[] = [
  {
    image: '/opening/opening-bibliotheca.png',
    title: 'Bibliotheca',
    motion: 'push',
    text:
      'ここは Bibliotheca。イギリス文学史に刻まれた物語が眠る、巨大な図書館。',
  },
  {
    image: '/opening/opening-legacy-shelf.png',
    title: 'Stories Inheritance',
    motion: 'drift',
    text:
      '人々は何百年もの間、物語を語り継いできた。Beowulf、Hamlet、Macbeth。名を呼ばれるたび、本は光を保っていた。',
  },
  {
    image: '/opening/opening-censor.png',
    title: 'The Censor',
    motion: 'close',
    text:
      'The Censor「忘れられた物語に価値はない。」黒い霧が棚を覆い、ページの文字が一行ずつ消えていく。',
  },
  {
    image: '/opening/opening-reading-gift.png',
    title: 'Reading Gift',
    motion: 'rise',
    text:
      '床に落ちた白紙の本。君が触れた瞬間、消えたはずの名が浮かび上がる。Beowulf。司書は息を呑んだ。「……見えるのか？」',
  },
  {
    image: '/opening/opening-librarian-vow.png',
    title: 'The Librarian',
    motion: 'rise',
    text:
      '「物語が消えれば、歴史も消える。歴史が消えれば、人々は自分たちが何者だったのかさえ忘れる。君だけが、この物語を読むことができる。」',
  },
  {
    image: '/opening/opening-title-book.png',
    title: 'British Legends',
    motion: 'push',
    text:
      '司書は一冊の本を託した。表紙には British Legends。失われた物語を、未来へ取り戻す旅が始まる。',
  },
];

export function OpeningScene() {
  const openLodge = useGameStore((state) => state.openLodge);
  const [beatIndex, setBeatIndex] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const beat = OPENING_BEATS[beatIndex];
  const visibleText = useMemo(() => beat.text.slice(0, visibleChars), [beat.text, visibleChars]);
  const completedText = visibleChars >= beat.text.length;

  useEffect(() => {
    setVisibleChars(0);
  }, [beatIndex]);

  useEffect(() => {
    if (showLogo || completedText) return undefined;
    const timer = window.setInterval(() => {
      setVisibleChars((value) => Math.min(beat.text.length, value + 2));
    }, 34);
    return () => window.clearInterval(timer);
  }, [beat.text.length, completedText, showLogo]);

  const finish = () => {
    setShowLogo(true);
    window.setTimeout(() => openLodge(), 1700);
  };

  const advance = () => {
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
  };

  return (
    <div className="opening-scene" onClick={advance}>
      <img
        key={beat.image}
        className={`opening-scene__art opening-scene__art--${beat.motion}`}
        src={beat.image}
        alt=""
      />
      <div className="opening-scene__veil" />

      {showLogo ? (
        <div className="opening-scene__logo" aria-live="polite">
          <span>British Legends</span>
          <small>失われた物語を、未来へ</small>
        </div>
      ) : (
        <>
          <div className="opening-scene__chapter">
            <span>{String(beatIndex + 1).padStart(2, '0')}</span>
            <strong>{beat.title}</strong>
          </div>
          <div className="opening-scene__dialogue">
            <p>{visibleText}</p>
            <small>{completedText ? 'クリックで進む' : ' '}</small>
          </div>
          <button
            type="button"
            className="opening-scene__skip"
            onClick={(event) => {
              event.stopPropagation();
              finish();
            }}
          >
            Skip
          </button>
        </>
      )}
    </div>
  );
}
