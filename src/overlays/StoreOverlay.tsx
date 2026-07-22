import { useState } from 'react';
import { EQUIPMENT, getMaterial, STORE_ITEMS } from '@/data';
import { STORE_ICON_BY_ID } from '@/data/storeIcons';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';
import { Window } from '@/components/ui/Window';
import { forgeCost, MAX_EQUIPMENT_LEVEL } from '@/engine/forging';

type StoreTab = 'weapon' | 'armor' | 'accessory' | 'item' | 'forge';

const TAB_LABELS: Record<StoreTab, string> = {
  weapon: '武器',
  armor: '防具',
  accessory: '装飾品',
  item: '道具',
  forge: '鍛造',
};

function bonusLabel(bonus: object) {
  return Object.entries(bonus).map(([stat, value]) => `${stat.toUpperCase()} +${value}`).join('  ');
}

export function StoreOverlay() {
  const [tab, setTab] = useState<StoreTab>('weapon');
  const { save, buyEquipment, buyItem, forgeEquipment, closeOverlay } = useGameStore();
  if (!save) return null;

  const equipment = tab === 'item' || tab === 'forge' ? [] : Object.values(EQUIPMENT).filter((item) => item.slot === tab);
  const ownedEquipment = [...new Set([
    ...(save.equipmentInventory ?? []),
    ...save.party.flatMap((member) => [member.equippedWeaponId, member.equippedArmorId, member.equippedAccessoryId].filter(Boolean) as string[]),
  ])].map((id) => EQUIPMENT[id]).filter(Boolean);

  return (
    <Window title="BIBLIOTHECA STORE" className="store-overlay">
      <div className="store-header"><div><span>所持 Gold</span><strong>G {save.gold}</strong></div><Button center onClick={closeOverlay}>閉じる</Button></div>
      <div className="store-tabs" role="tablist">
        {(Object.keys(TAB_LABELS) as StoreTab[]).map((key) => <button key={key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>{TAB_LABELS[key]}</button>)}
      </div>
      <div className="store-items">
        {tab === 'forge' && ownedEquipment.length === 0 && (
          <div className="store-empty">鍛造できる装備がない。武器・防具・装飾品を購入するか、探索で発見しよう。</div>
        )}
        {tab === 'forge' ? ownedEquipment.map((item) => {
          const level = save.equipmentLevels?.[item.id] ?? 0;
          const cost = forgeCost(item, level);
          const canForge = Boolean(cost && save.gold >= cost.gold && (save.inventory[cost.materialId] ?? 0) >= cost.materialQty);
          return (
            <article className="store-item forge-item" key={item.id}>
              <img className="store-item__icon" src={STORE_ICON_BY_ID[item.id]} alt="" aria-hidden="true" />
              <div><strong>{item.name} <small>+{level}</small></strong><p>{level >= MAX_EQUIPMENT_LEVEL ? '最大強化に到達。物語の力が完全に定着している。' : '装備固有ステータスを10%強化する。'}</p><em>{bonusLabel(item.bonus)}</em></div>
              <div className="store-item__buy">
                {cost ? <b>{cost.gold}G / {getMaterial(cost.materialId).name} ×{cost.materialQty}</b> : <b>MAX</b>}
                <Button disabled={!canForge} onClick={() => forgeEquipment(item.id)}>強化する</Button>
              </div>
            </article>
          );
        }) : tab === 'item' ? Object.values(STORE_ITEMS).map((item) => (
          <article className="store-item" key={item.id}>
            <img className="store-item__icon" src={STORE_ICON_BY_ID[item.id]} alt="" aria-hidden="true" />
            <div><strong>{item.name} <small>×{save.items[item.id] ?? 0}</small></strong><p>{item.description}</p></div>
            <div className="store-item__buy"><b>{item.price}G</b><Button disabled={save.gold < item.price} onClick={() => buyItem(item.id)}>買う</Button></div>
          </article>
        )) : equipment.map((item) => (
          <article className="store-item" key={item.id}>
            <img className="store-item__icon" src={STORE_ICON_BY_ID[item.id]} alt="" aria-hidden="true" />
            <div><strong>{item.name}</strong><p>{item.description}</p><em>{bonusLabel(item.bonus)}</em></div>
            <div className="store-item__buy"><b>{item.price}G</b><Button disabled={save.gold < item.price} onClick={() => buyEquipment(0, item.id)}>買って装備</Button></div>
          </article>
        ))}
      </div>
    </Window>
  );
}
