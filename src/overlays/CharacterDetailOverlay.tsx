import { useGameStore } from '@/store/useGameStore';
import { getCharacter, getEquipment, getSkill } from '@/data';
import { expForLevel } from '@/engine/leveling';
import { statsWithEquipment } from '@/engine/equipment';
import { checkEvolution } from '@/engine/evolution';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';
import { Gauge } from '@/components/ui/Gauge';
import { Sprite } from '@/components/ui/Sprite';
import { manuscriptStats } from '@/data/manuscripts';
import type { AllocatableStat } from '@/types';
import { BASE_STAT_ALLOCATION_CAP, normalizeOwnedGrowth } from '@/engine/characterGrowth';

export function CharacterDetailOverlay() {
  const { save, selectedCharIndex, openOverlay, allocateStatusPoint } = useGameStore();
  if (!save) return null;
  const owned = save.party[selectedCharIndex];
  if (!owned) return null;

  const char = getCharacter(owned.characterId);
  const stats = statsWithEquipment(char, owned, manuscriptStats(save.storyFragments ?? []), save.equipmentLevels ?? {});
  const evo = checkEvolution(owned, char, save.inventory);
  const nextLvExp = expForLevel(owned.level + 1);
  const growth = normalizeOwnedGrowth(owned);
  const statRows: { key: AllocatableStat; label: string; value: number }[] = [
    { key: 'atk', label: 'ATK 物理攻撃', value: stats.atk },
    { key: 'int', label: 'INT 魔法攻撃', value: stats.int ?? 0 },
    { key: 'def', label: 'DEF 物理防御', value: stats.def },
    { key: 'mdef', label: 'MDEF 魔法防御', value: stats.mdef ?? 0 },
    { key: 'spd', label: 'SPD 素早さ', value: stats.spd },
    { key: 'luk', label: 'LUK 運', value: stats.luk ?? 0 },
  ];

  return (
    <Window title={`${char.name} の詳細`} className="col">
      <div className="row" style={{ gap: 12 }}>
        <Sprite label={char.name} side="ally" size="lg" presentation="portrait" />
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

      <div className="status-allocation">
        <div className="row small">
          <strong>レベルポイント</strong><span className="spacer" /><span className="accent">残り {growth.unspentStatusPoints}</span>
        </div>
        <div className="status-allocation__grid">
          {statRows.map(({ key, label, value }) => {
            const allocated = growth.allocatedStats?.[key] ?? 0;
            return (
              <div className="status-allocation__row" key={key}>
                <span>{label}</span><strong>{value}</strong>
                <span className="tiny dim">振分 {allocated}/{BASE_STAT_ALLOCATION_CAP}</span>
                <Button disabled={(growth.unspentStatusPoints ?? 0) <= 0 || allocated >= BASE_STAT_ALLOCATION_CAP} onClick={() => allocateStatusPoint(selectedCharIndex, key)}>＋</Button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="tiny dim">
        装備: {equipmentName(owned.equippedWeaponId, save.equipmentLevels)} / {equipmentName(owned.equippedArmorId, save.equipmentLevels)} / {equipmentName(owned.equippedAccessoryId, save.equipmentLevels)}
      </div>

      {char.tragicFlaw && (
        <div className="tragic-flaw-detail">
          <div className="row">
            <span className="tragic-flaw-detail__icon">{char.tragicFlaw.icon}</span>
            <strong>{char.tragicFlaw.theme}</strong>
            <span className="spacer" />
            <span className="tiny dim">Tragic Flaw</span>
          </div>
          <div className="small">{char.tragicFlaw.description}</div>
          <div className="tragic-flaw-detail__grid">
            <div>
              <span className="tiny dim">Passive</span>
              <strong>{char.tragicFlaw.passiveAbility.name}</strong>
              <p>{char.tragicFlaw.passiveAbility.description}</p>
            </div>
            <div>
              <span className="tiny dim">Active</span>
              <strong>{char.tragicFlaw.activeSkill.name}</strong>
              <p>{char.tragicFlaw.activeSkill.description}</p>
            </div>
            <div>
              <span className="tiny dim">Trait</span>
              <strong>{char.tragicFlaw.battleTrait.name}</strong>
              <p>{char.tragicFlaw.battleTrait.description}</p>
            </div>
            <div>
              <span className="tiny dim">Awakening</span>
              <strong>{char.tragicFlaw.awakeningCondition.name}</strong>
              <p>{char.tragicFlaw.awakeningCondition.description}</p>
            </div>
          </div>
        </div>
      )}

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

function equipmentName(id: string | undefined, levels: Record<string, number>): string {
  if (!id) return 'なし';
  const level = levels?.[id] ?? 0;
  return `${getEquipment(id).name}${level > 0 ? ` +${level}` : ''}`;
}
