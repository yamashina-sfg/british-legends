import type { CSSProperties } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';
import beowulfWorldArt from '@/assets/world/beowulf-overworld-v1.png';
import { listSlots } from '@/engine/save';
import { guestAccountId } from '@/engine/account';
import { APP_VERSION } from '@/engine/versioning';
import { useI18n } from '@/i18n';

export function TitleScene() {
  const goSaveSelect = useGameStore((s) => s.goSaveSelect);
  const replayOpening = useGameStore((s) => s.replayOpening);
  const replaySlot = listSlots().find((slot) => slot?.openingWatched)?.slotId;
  const guestId=guestAccountId();
  const {t}=useI18n();

  return (
    <div className="title-scene fade-in" style={{ '--title-art': `url(${beowulfWorldArt})` } as CSSProperties}>
      <div className="title-scene__veil" />
      <div className="title-scene__content">
        <div className="title-scene__kicker">BIBLIOTHECA IS BEING ERASED</div>
        <h1>
          British Legends
          <span>ブリティッシュ・レジェンズ</span>
        </h1>
        <p className="title-scene__tagline">Restore the Lost Stories.</p>
        <p>The Journey Through British Literature Begins.</p>
      </div>

      <div className="title-scene__menu menu-list">
        <Button primary center onClick={goSaveSelect}>
          {t('restore')}
        </Button>
        <Button center disabled={!replaySlot} onClick={() => replaySlot && replayOpening(replaySlot)}>
          Replay Opening
        </Button>
      </div>

      <div className="title-scene__loadline"><span /></div>
      <div className="title-scene__footer">
        <span>ID {guestId} / v{APP_VERSION}</span>
        <span>© 2026 British Legends Project</span>
        <a href="/privacy.html" target="_blank" rel="noreferrer">{t('privacy')}</a>
      </div>
    </div>
  );
}
