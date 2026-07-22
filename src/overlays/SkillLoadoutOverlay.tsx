import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getCharacter, getSkill } from '@/data';
import { skillBookMultiplier } from '@/engine/battle';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';
import { unlockedMagicSlotCount } from '@/engine/commerce';

export function SkillLoadoutOverlay() {
  const { save, selectedCharIndex, setSkillSlot, openOverlay } = useGameStore();
  const [selectedSlot, setSelectedSlot] = useState(0);
  const owned = save?.party[selectedCharIndex];
  if (!save || !owned) return null;
  const hero = getCharacter(owned.characterId);
  const unlockedSlots = unlockedMagicSlotCount(save);
  const selectedLocked = selectedSlot >= unlockedSlots;
  const slots = Array.from({ length: 3 }, (_, index) => owned.equippedSkillIds?.[index] ?? null);
  return <Window title="MAGIC LOADOUT — 魔法スロット" className="skill-loadout">
    <header><strong>{hero.name}</strong><span>使用するスロットを選び、魔法リストから装着します。</span></header>
    <div className="skill-slots">{slots.map((id, index) => { const locked=index>=unlockedSlots; return <button key={index} className={`${selectedSlot === index ? 'is-selected ' : ''}${locked?'is-locked':''}`} onClick={() => setSelectedSlot(index)}><small>SLOT {index + 1}</small><b>{locked?'LOCKED':id ? getSkill(id).name : 'EMPTY'}</b><span>{locked?'ダイヤショップで解放':id ? `MP ${getSkill(id).mpCost}` : '未装着'}</span></button>;})}</div>
    {selectedLocked&&<div className="skill-slot-lock"><span>この魔法スロットは未解放です。</span><Button onClick={()=>openOverlay('store')}>ダイヤショップへ</Button></div>}
    <div className="skill-library">{owned.learnedSkillIds.filter((id) => id !== 'attack_basic').map((id) => {
      const skill = getSkill(id); const used = slots.includes(id); const bookCount = skill.targetBookItemId ? save.inventory[skill.targetBookItemId] ?? 0 : 0;
      return <button key={id} disabled={selectedLocked} className={used ? 'is-used' : ''} onClick={() => setSkillSlot(selectedCharIndex, selectedSlot, id)}><i>{skill.type === 'barrier' ? '◈' : skill.target === 'all' ? '✹' : '✦'}</i><div><strong>{skill.name}</strong><p>{skill.description}</p><small>{skill.type.toUpperCase()} / {skill.target} / MP {skill.mpCost}{skill.targetBookItemId ? ` / 本×${bookCount} = ${skillBookMultiplier(skill, save.inventory).toFixed(2)}倍` : ''}</small></div><b>{selectedLocked?'解放が必要':used ? '使用中' : '装着'}</b></button>;
    })}</div>
    <div className="row"><Button disabled={selectedLocked} onClick={() => setSkillSlot(selectedCharIndex, selectedSlot, null)}>選択枠を外す</Button><Button primary onClick={() => openOverlay('character', selectedCharIndex)}>決定</Button></div>
  </Window>;
}
