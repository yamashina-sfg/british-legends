import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getCharacter, getEquipment, getSkill } from '@/data';
import { expForLevel } from '@/engine/leveling';
import { equippedItemIds, statsWithEquipment } from '@/engine/equipment';
import { checkEvolution } from '@/engine/evolution';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';
import { Gauge } from '@/components/ui/Gauge';
import { Sprite } from '@/components/ui/Sprite';
import { permanentStats } from '@/engine/permanentStats';
import type { AllocatableStat, AllocatedStats } from '@/types';
import { allocationCap, maxCharacterLevel, normalizeOwnedGrowth } from '@/engine/characterGrowth';
import { unlockedConstellationIds } from '@/engine/constellations';
import { characterStatBreakdown } from '@/engine/statBreakdown';

export function CharacterDetailOverlay() {
  const { save, selectedCharIndex, openOverlay, commitStatusAllocation } = useGameStore();
  if (!save) return null;
  const owned = save.party[selectedCharIndex];
  if (!owned) return null;

  const char = getCharacter(owned.characterId);
  const stats = statsWithEquipment(char, owned, permanentStats(save), save.equipmentLevels ?? {});
  const evo = checkEvolution(owned, char, save.inventory);
  const nextLvExp = expForLevel(owned.level + 1);
  const growth = normalizeOwnedGrowth(owned);
  const committed = growth.allocatedStats!;
  const [draft, setDraft] = useState<AllocatedStats>({ ...committed });
  const [breakdownOpen,setBreakdownOpen]=useState(false);
  useEffect(() => setDraft({ ...committed }), [owned.characterId, owned.level, committed.atk, committed.int, committed.def, committed.mdef, committed.spd, committed.luk]);
  const draftCost = useMemo(() => Object.keys(draft).reduce((sum, key) => sum + draft[key as AllocatableStat] - committed[key as AllocatableStat], 0), [draft, committed]);
  const remaining = (growth.unspentStatusPoints ?? 0) - draftCost;
  const cap = allocationCap(growth);
  const changeDraft = (key: AllocatableStat, amount: number) => setDraft((current) => {
    const next = Math.max(committed[key], Math.min(cap, current[key] + amount));
    const increase = next - current[key];
    if (increase > remaining) return { ...current, [key]: current[key] + Math.max(0, remaining) };
    return { ...current, [key]: next };
  });
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
          <div className="small">Lv {owned.level}/{maxCharacterLevel(growth)} ・ 祝福 {growth.blessingCount ?? 0}回</div>
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
          <strong>ステータス振り分け</strong><span className="spacer" /><span className="accent">残り {remaining}</span>
        </div>
        <div className="status-allocation__grid">
          {statRows.map(({ key, label, value }) => {
            const allocated = draft[key];
            const projected = value + (allocated - committed[key]);
            return (
              <div className="status-allocation__row" key={key}>
                <span>{label}</span><strong>{projected}</strong>
                <span className="tiny dim">{allocated}/{cap}</span>
                <div className="status-allocation__controls">
                  {[-100, -10, -1, 1, 10, 100].map((amount) => <button key={amount} disabled={amount < 0 ? allocated <= committed[key] : remaining <= 0 || allocated >= cap} onClick={() => changeDraft(key, amount)}>{amount > 0 ? `+${amount}` : amount}</button>)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="status-allocation__actions"><Button disabled={draftCost === 0} onClick={() => setDraft({ ...committed })}>キャンセル</Button><Button primary disabled={draftCost === 0} onClick={() => commitStatusAllocation(selectedCharIndex, draft)}>確定</Button></div>
        <div className="tiny dim">レベル {growth.levelStatusPoints ?? 0} / 祝福 {growth.bonusStatusPoints ?? 0} / 有料 {growth.paidStatusPoints ?? 0}</div>
        <button className="status-breakdown-toggle" onClick={()=>setBreakdownOpen(x=>!x)}>{breakdownOpen?'▲ 能力内訳を閉じる':'▼ 能力内訳を表示'}</button>
        {breakdownOpen&&<div className="status-breakdown"><header><span>能力</span><span>基礎</span><span>振分</span><span>装備</span><span>アルバム</span><span>図鑑</span><span>釣り</span><span>星神</span></header>{statRows.map(({key})=>{const b=characterStatBreakdown(char,owned,save,key);return <div key={key}><b>{key.toUpperCase()}</b><span>{b.base}</span><span>{b.allocated}</span><span>{b.equipment}</span><span>{b.album}</span><span>{b.codex}</span><span>{b.fishing}</span><span>{b.constellation}</span></div>})}</div>}
      </div>
      <div className="tiny dim">
        装備6部位: {equippedItemIds(owned).length ? equippedItemIds(owned).map((id) => equipmentName(id, save.equipmentLevels)).join(' / ') : 'なし'}
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
      <Button center disabled={owned.level < maxCharacterLevel(growth) || unlockedConstellationIds(save).length === 0} onClick={() => openOverlay('blessing', selectedCharIndex)}>
        星辰の祝福 {owned.level < maxCharacterLevel(growth) ? `（Lv${maxCharacterLevel(growth)}で解放）` : ''}
      </Button>
      <Button center onClick={() => openOverlay('skins', selectedCharIndex)}>頭・身体スキン</Button>
      <Button center onClick={() => openOverlay('skillLoadout', selectedCharIndex)}>魔法スロット</Button>
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
