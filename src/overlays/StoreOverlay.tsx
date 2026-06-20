import { useState } from 'react';
import { EQUIPMENT, STORE_ITEMS } from '@/data';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';
import { Window } from '@/components/ui/Window';

type StoreTab = 'weapon' | 'armor' | 'item';

const TAB_LABELS: Record<StoreTab, string> = {
  weapon: '武器',
  armor: '防具・護符',
  item: '道具',
};

function bonusLabel(bonus: object) {
  return Object.entries(bonus).map(([stat, value]) => `${stat.toUpperCase()} +${value}`).join('  ');
}

export function StoreOverlay() {
  const [tab, setTab] = useState<StoreTab>('weapon');
  const { save, buyEquipment, buyItem, closeOverlay } = useGameStore();
  if (!save) return null;

  const equipment = Object.values(EQUIPMENT).filter((item) => tab === 'weapon' ? item.slot === 'weapon' : item.slot !== 'weapon');

  return (
    <Window title="BIBLIOTHECA STORE" className="store-overlay">
      <div className="store-header"><div><span>所持 Gold</span><strong>G {save.gold}</strong></div><Button center onClick={closeOverlay}>閉じる</Button></div>
      <div className="store-tabs" role="tablist">
        {(Object.keys(TAB_LABELS) as StoreTab[]).map((key) => <button key={key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>{TAB_LABELS[key]}</button>)}
      </div>
      <div className="store-items">
        {tab === 'item' ? Object.values(STORE_ITEMS).map((item) => (
          <article className="store-item" key={item.id}>
            <div className="store-item__icon store-item__icon--item" />
            <div><strong>{item.name} <small>×{save.items[item.id] ?? 0}</small></strong><p>{item.description}</p></div>
            <div className="store-item__buy"><b>{item.price}G</b><Button disabled={save.gold < item.price} onClick={() => buyItem(item.id)}>買う</Button></div>
          </article>
        )) : equipment.map((item) => (
          <article className="store-item" key={item.id}>
            <div className={`store-item__icon store-item__icon--${item.slot}`} />
            <div><strong>{item.name}</strong><p>{item.description}</p><em>{bonusLabel(item.bonus)}</em></div>
            <div className="store-item__buy"><b>{item.price}G</b><Button disabled={save.gold < item.price} onClick={() => buyEquipment(0, item.id)}>買って装備</Button></div>
          </article>
        ))}
      </div>
    </Window>
  );
}
