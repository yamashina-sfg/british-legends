import type { OwnedCharacter } from '@/types';
import { getCharacter, getMaterial } from '@/data';
import { checkEvolution } from '@/engine/evolution';

interface Props {
  owned: OwnedCharacter;
  inventory: Record<string, number>;
}

/** 「次の進化」と、あと何を集めれば良いかを明示する成長導線。 */
export function EvolutionGuide({ owned, inventory }: Props) {
  const char = getCharacter(owned.characterId);
  const evo = char.evolution;
  const check = checkEvolution(owned, char, inventory);

  if (!evo) {
    return <div className="evo-guide evo-guide--max">最終進化に到達している。</div>;
  }
  const nextChar = getCharacter(evo.nextCharacterId);

  return (
    <div className={`evo-guide ${check.canEvolve ? 'is-ready' : ''}`}>
      <div className="evo-guide__head">
        <span>次の進化</span>
        <strong>{nextChar.stageName}</strong>
        {check.canEvolve && <em>進化可能！</em>}
      </div>
      <ul className="evo-guide__reqs">
        <li className={check.levelOk ? 'is-ok' : ''}>
          Lv{evo.requiredLevel}（現在 Lv{owned.level}）{check.levelOk ? '✓' : ''}
        </li>
        {evo.requiredMaterials.map((req) => {
          const have = inventory[req.materialId] ?? 0;
          const ok = have >= req.qty;
          const short = Math.max(0, req.qty - have);
          return (
            <li key={req.materialId} className={ok ? 'is-ok' : ''}>
              {getMaterial(req.materialId).name} {have}/{req.qty}
              {ok ? ' ✓' : <b className="evo-guide__need"> あと{short}</b>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
