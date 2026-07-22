import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getCharacter, getWorld } from '@/data';
import { normalizeOwnedGrowth } from '@/engine/characterGrowth';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';
import { unlockedConstellationIds } from '@/engine/constellations';

export function BlessingOverlay() {
  const { save, selectedCharIndex, blessCharacter, openOverlay } = useGameStore();
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(save ? unlockedConstellationIds(save)[0] ?? null : null);
  if (!save) return null;
  const owned = save.party[selectedCharIndex];
  if (!owned) return null;
  const growth = normalizeOwnedGrowth(owned);
  const hero = getCharacter(owned.characterId);
  const unlocked = unlockedConstellationIds(save);
  const bonus = 9 + unlocked.length;

  return (
    <Window title="CONSTELLATION BLESSING" className="blessing-overlay">
      <div className="blessing-overlay__hero"><span>✦</span><div><small>THE RESTORED SKY</small><strong>{hero.name}へ文学星座の祝福を</strong><p>物語の頂点から新たな第1章へ。固有能力を保ったまま成長上限を広げます。</p></div></div>
      <div className="blessing-effects">
        <div><small>LEVEL</small><b>{owned.level} → 1</b></div>
        <div><small>MAX LEVEL</small><b>{50 + (growth.blessingCount ?? 0)} → {51 + (growth.blessingCount ?? 0)}</b></div>
        <div><small>STATUS CAP</small><b>{99 + (growth.blessingCount ?? 0) * 10} → {109 + (growth.blessingCount ?? 0) * 10}</b></div>
        <div><small>BONUS POINT</small><b>+{bonus}</b></div>
      </div>
      <div className="blessing-overlay__caption">解放済み文学星座を選択</div>
      <div className="blessing-patrons">
        {unlocked.map((worldId) => {
          const world = getWorld(worldId);
          return <button key={worldId} className={selectedWorldId === worldId ? 'is-selected' : ''} onClick={() => setSelectedWorldId(worldId)}><i>✦</i><strong>{world.title}</strong><small>{world.author}</small></button>;
        })}
      </div>
      <div className="tiny dim">祝福すると装備は外れ、レベルポイントは0になります。振分済み能力と祝福ポイントは保持されます。</div>
      <div className="row"><Button onClick={() => openOverlay('character', selectedCharIndex)}>戻る</Button><Button primary disabled={!selectedWorldId} onClick={() => selectedWorldId && blessCharacter(selectedCharIndex, selectedWorldId)}>この星座の祝福を受ける</Button></div>
    </Window>
  );
}
