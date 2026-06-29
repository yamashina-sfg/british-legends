import { useGameStore } from '@/store/useGameStore';
import { getCharacter } from '@/data';
import { statsWithEquipment } from '@/engine/equipment';
import { checkEvolution } from '@/engine/evolution';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';
import { Gauge } from '@/components/ui/Gauge';
import { Sprite } from '@/components/ui/Sprite';
import { EvolutionGuide } from '@/components/common/EvolutionGuide';

export function PartyOverlay() {
  const { save, openOverlay, closeOverlay } = useGameStore();
  if (!save) return null;

  return (
    <Window title="パーティ" className="col">
      {save.party.length === 0 && <div className="dim small">まだ仲間がいない。</div>}
      <div className="menu-list">
        {save.party.map((p, i) => {
          const char = getCharacter(p.characterId);
          const stats = statsWithEquipment(char, p);
          const evo = checkEvolution(p, char, save.inventory);
          return (
            <div key={i} className="party-card">
              <button className="btn col party-card__head" onClick={() => openOverlay('character', i)} style={{ gap: 4 }}>
                <div className="row" style={{ gap: 8 }}>
                  <Sprite label={char.name} side="ally" size="sm" faint={p.currentHp <= 0} />
                  <div className="col" style={{ flex: 1, gap: 2 }}>
                    <div className="row">
                      <span>
                        {char.name} <span className="dim small">Lv{p.level}</span>
                      </span>
                      <span className="spacer" />
                      {evo.canEvolve && <span className="accent tiny">進化可能！</span>}
                    </div>
                    <div className="tiny dim">{char.stageName}</div>
                    <div className="tragic-flaw-inline">
                      <span>{char.tragicFlaw.icon}</span>
                      <strong>{char.tragicFlaw.theme}</strong>
                      <span>{char.tragicFlaw.battleTrait.name}</span>
                    </div>
                    <div className="tiny dim">HP {p.currentHp}/{stats.hp} ／ MP {p.currentMp}/{stats.mp}</div>
                    <Gauge value={p.currentHp} max={stats.hp} type="hp" />
                  </div>
                </div>
              </button>
              <EvolutionGuide owned={p} inventory={save.inventory} />
              <div className="row" style={{ gap: 6 }}>
                <Button onClick={() => openOverlay('character', i)}>詳細</Button>
                <Button primary disabled={!evo.hasEvolution} onClick={() => openOverlay('evolution', i)}>
                  進化
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <Button center onClick={closeOverlay}>
        とじる
      </Button>
    </Window>
  );
}
