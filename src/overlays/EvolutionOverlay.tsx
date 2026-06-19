import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getCharacter, getMaterial } from '@/data';
import { checkEvolution } from '@/engine/evolution';
import { statsAtLevel } from '@/engine/leveling';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';
import { Sprite } from '@/components/ui/Sprite';

export function EvolutionOverlay() {
  const { save, selectedCharIndex, evolveCharacter, openOverlay } = useGameStore();
  const [message, setMessage] = useState<string | null>(null);
  if (!save) return null;
  const owned = save.party[selectedCharIndex];
  if (!owned) return null;

  const char = getCharacter(owned.characterId);
  const evo = char.evolution;
  const check = checkEvolution(owned, char, save.inventory);

  if (!evo) {
    return (
      <Window title="進化" className="col">
        <div className="center dim">{char.stageName} はこれ以上進化しない。</div>
        <Button center onClick={() => openOverlay('character', selectedCharIndex)}>
          もどる
        </Button>
      </Window>
    );
  }

  const next = getCharacter(evo.nextCharacterId);
  const currentStats = statsAtLevel(char, owned.level);
  const nextStats = statsAtLevel(next, owned.level);

  const handleEvolve = () => {
    const res = evolveCharacter(selectedCharIndex);
    setMessage(res.message);
  };

  const statRow = (label: string, a: number, b: number) => (
    <div className="row small">
      <span style={{ width: 70 }} className="dim">
        {label}
      </span>
      <span>{a}</span>
      <span className="dim"> → </span>
      <span className="accent">{b}</span>
    </div>
  );

  return (
    <Window title="進化" className="col">
      <div className="row" style={{ justifyContent: 'center', gap: 16, alignItems: 'center' }}>
        <div className="col center">
          <Sprite label={char.name} side="ally" />
          <span className="tiny">{char.stageName}</span>
        </div>
        <span className="accent" style={{ fontSize: 24 }}>
          ▶
        </span>
        <div className="col center">
          <Sprite label={next.name} side="ally" />
          <span className="tiny accent">{next.stageName}</span>
        </div>
      </div>

      <div className="col" style={{ gap: 2 }}>
        {statRow('HP', currentStats.hp, nextStats.hp)}
        {statRow('こうげき', currentStats.atk, nextStats.atk)}
        {statRow('ぼうぎょ', currentStats.def, nextStats.def)}
        {statRow('すばやさ', currentStats.spd, nextStats.spd)}
      </div>

      <div className="window-title" style={{ marginTop: 4 }}>
        進化条件
      </div>
      <div className={check.levelOk ? 'small good-text' : 'small'} style={{ color: check.levelOk ? 'var(--good)' : 'var(--danger)' }}>
        必要レベル {evo.requiredLevel}（現在 Lv{owned.level}）{check.levelOk ? ' ✓' : ' ✗'}
      </div>
      {evo.requiredMaterials.map((req) => {
        const have = save.inventory[req.materialId] ?? 0;
        const ok = have >= req.qty;
        return (
          <div key={req.materialId} className="small" style={{ color: ok ? 'var(--good)' : 'var(--danger)' }}>
            {getMaterial(req.materialId).name} {have}/{req.qty} {ok ? '✓' : '✗'}
          </div>
        );
      })}

      {message && <div className="center accent small" style={{ marginTop: 6 }}>{message}</div>}

      <Button primary center disabled={!check.canEvolve || !!message} onClick={handleEvolve}>
        進化させる
      </Button>
      <Button center onClick={() => openOverlay('character', selectedCharIndex)}>
        もどる
      </Button>
    </Window>
  );
}
