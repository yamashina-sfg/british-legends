import type { CSSProperties } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';
import beowulfWorldArt from '@/assets/world/beowulf-overworld-v1.png';
import { listSlots } from '@/engine/save';

export function TitleScene() {
  const goSaveSelect = useGameStore((s) => s.goSaveSelect);
  const replayOpening = useGameStore((s) => s.replayOpening);
  const replaySlot = listSlots().find((slot) => slot?.openingWatched)?.slotId;

  return (
    <div className="title-scene fade-in" style={{ '--title-art': `url(${beowulfWorldArt})` } as CSSProperties}>
      <div className="title-scene__veil" />
      <div className="title-scene__content">
        <div className="title-scene__kicker">BIBLIOTHECA IS BEING ERASED</div>
        <h1>
          British Legends
          <span>ブリティッシュ・レジェンズ</span>
        </h1>
        <p>文学は教材ではない。剣で守るべき、失われかけた世界だ。</p>
      </div>

      <div className="title-scene__menu menu-list">
        <Button primary center onClick={goSaveSelect}>
          物語を修復する
        </Button>
        <Button center disabled={!replaySlot} onClick={() => replaySlot && replayOpening(replaySlot)}>
          Replay Opening
        </Button>
      </div>

      <div className="title-scene__footer">
        Turn-based dark fantasy RPG / Tragic Flaw System
      </div>
    </div>
  );
}
