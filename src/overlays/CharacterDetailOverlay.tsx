import { useGameStore } from '@/store/useGameStore';
import { getCharacter, getSkill } from '@/data';
import { statsAtLevel, expForLevel } from '@/engine/leveling';
import { checkEvolution } from '@/engine/evolution';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';
import { Gauge } from '@/components/ui/Gauge';
import { Sprite } from '@/components/ui/Sprite';

export function CharacterDetailOverlay() {
  const { save, selectedCharIndex, openOverlay } = useGameStore();
  if (!save) return null;
  const owned = save.party[selectedCharIndex];
  if (!owned) return null;

  const char = getCharacter(owned.characterId);
  const stats = statsAtLevel(char, owned.level);
  const evo = checkEvolution(owned, char, save.inventory);
  const nextLvExp = expForLevel(owned.level + 1);

  return (
    <Window title={`${char.name} の詳細`} className="col">
      <div className="row" style={{ gap: 12 }}>
        <Sprite label={char.name} side="ally" size="lg" />
        <div className="col" style={{ flex: 1, gap: 4 }}>
          <div className="accent">{char.stageName}</div>
          <div className="small">Lv {owned.level}</div>
          <div className="tiny dim">
            EXP {owned.exp} / 次Lv {nextLvExp}
          </div>
          <Gauge value={owned.currentHp} max={stats.hp} type="hp" />
          <div className="tiny dim">HP {owned.currentHp}/{stats.hp}</div>
          <Gauge value={owned.currentMp} max={stats.mp} type="mp" />
          <div className="tiny dim">MP {owned.currentMp}/{stats.mp}</div>
        </div>
      </div>

      <div className="row small" style={{ gap: 16, flexWrap: 'wrap' }}>
        <span>こうげき {stats.atk}</span>
        <span>ぼうぎょ {stats.def}</span>
        <span>すばやさ {stats.spd}</span>
      </div>

      <div className="window-title" style={{ marginTop: 4 }}>
        とくぎ
      </div>
      <div className="col" style={{ gap: 6 }}>
        {owned.learnedSkillIds
          .map(getSkill)
          .filter((s) => s.id !== 'attack_basic')
          .map((s) => (
            <div key={s.id} className="small">
              <span className="accent">{s.name}</span> <span className="tiny dim">MP{s.mpCost}</span>
              <div className="tiny dim">{s.description}</div>
            </div>
          ))}
      </div>

      <Button primary center disabled={!evo.hasEvolution} onClick={() => openOverlay('evolution', selectedCharIndex)}>
        {evo.hasEvolution ? (evo.canEvolve ? '進化できる！' : '進化') : '最終進化に到達'}
      </Button>
      <Button center onClick={() => openOverlay('party')}>
        パーティへ戻る
      </Button>
    </Window>
  );
}
