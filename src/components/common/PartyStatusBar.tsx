import { useGameStore } from '@/store/useGameStore';
import { getCharacter } from '@/data';
import { statsAtLevel } from '@/engine/leveling';
import { Gauge } from '@/components/ui/Gauge';
import { Sprite } from '@/components/ui/Sprite';

export function PartyStatusBar() {
  const save = useGameStore((s) => s.save);
  if (!save) return null;

  return (
    <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
      {save.party.map((p, i) => {
        const char = getCharacter(p.characterId);
        const stats = statsAtLevel(char, p.level);
        const fainted = p.currentHp <= 0;
        return (
          <div key={i} className="row" style={{ gap: 6, flex: '1 1 140px', minWidth: 140 }}>
            <Sprite label={char.name} side="ally" size="sm" faint={fainted} />
            <div className="col" style={{ flex: 1, gap: 3 }}>
              <div className="tiny">
                {char.name} <span className="dim">Lv{p.level}</span>
              </div>
              <div className="tiny dim">
                HP {p.currentHp}/{stats.hp}
              </div>
              <Gauge value={p.currentHp} max={stats.hp} type="hp" />
              <Gauge value={p.currentMp} max={stats.mp} type="mp" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
