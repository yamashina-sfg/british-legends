import { useState } from 'react';
import { EQUIPMENT, getMaterial, STORE_ITEMS } from '@/data';
import type { EquipmentSlot } from '@/data/equipment';
import { STORE_ICON_BY_ID } from '@/data/storeIcons';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';
import { Window } from '@/components/ui/Window';
import { forgeCost, MAX_EQUIPMENT_LEVEL } from '@/engine/forging';
import { equippedItemIds } from '@/engine/equipment';
import { canCraftEquipment, EQUIPMENT_RECIPES } from '@/engine/equipmentCrafting';
import { CASH_CATEGORY_LABELS, CASH_SHOP_PRODUCTS, type CashShopCategory } from '@/data/cashShop';
import { normalizeCommerce } from '@/engine/commerce';

type StoreTab = EquipmentSlot | 'item' | 'forge' | 'craft' | 'premium';

const TAB_LABELS: Record<StoreTab, string> = {
  weapon: '武器',
  head: '頭', armor: '鎧', arms: '腕', shield: '盾', legs: '脚',
  item: '道具',
  forge: '鍛造',
  craft: '制作',
  premium: 'ダイヤ',
};

const TAB_ICONS: Record<StoreTab, string> = { weapon: '⚔', head: '♛', armor: '◆', arms: '❖', shield: '◈', legs: '♟', item: '▣', forge: '♨', craft: '⚒', premium:'♦' };

function bonusLabel(bonus: object) {
  return Object.entries(bonus).map(([stat, value]) => `${stat.toUpperCase()} +${value}`).join('  ');
}

export function StoreOverlay() {
  const [tab, setTab] = useState<StoreTab>('weapon');
  const [selectedQuickSlot, setSelectedQuickSlot] = useState(0);
  const [cashCategory,setCashCategory]=useState<CashShopCategory>('currency');
  const [shopMessage,setShopMessage]=useState('');
  const { save, buyEquipment, buyItem, forgeEquipment, craftEquipment, setQuickSlot, closeOverlay,purchaseCashProduct,grantSandboxDiamonds,activateBoost } = useGameStore();
  if (!save) return null;

  const commerce=normalizeCommerce(save.commerce);
  const equipment = tab === 'item' || tab === 'forge' || tab === 'craft' || tab==='premium' ? [] : Object.values(EQUIPMENT).filter((item) => item.slot === tab);
  const ownedEquipment = [...new Set([
    ...(save.equipmentInventory ?? []),
    ...save.party.flatMap(equippedItemIds),
  ])].map((id) => EQUIPMENT[id]).filter(Boolean);
  const ownedIds = new Set(ownedEquipment.map((item) => item.id));
  const equippedIds = new Set(save.party.flatMap(equippedItemIds));

  return (
    <Window title="BIBLIOTHECA STORE" className="store-overlay">
      <div className="store-header">
        <div className="store-keeper"><i>♜</i><div><span>MASTER OF RELICS</span><strong>失われた物語の武具を、あなたへ。</strong></div></div>
        <div className="store-wallet"><span>YOUR WALLET</span><strong><i>G</i> {save.gold}　♦ {commerce.diamonds}</strong></div>
        <Button center onClick={closeOverlay}>閉じる</Button>
      </div>
      <div className="store-tabs" role="tablist">
        {(Object.keys(TAB_LABELS) as StoreTab[]).map((key) => <button key={key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}><i>{TAB_ICONS[key]}</i><span>{TAB_LABELS[key]}</span></button>)}
      </div>
      <div className="store-items">
        {tab==='premium'&&<section className="cash-shop">
          <div className="cash-shop__notice"><div><b>DIAMOND SHOP</b><span>実課金は未接続です。テスト通貨に金銭価値はありません。</span></div><Button disabled={commerce.sandboxGrantClaimed} onClick={grantSandboxDiamonds}>{commerce.sandboxGrantClaimed?'受取済み':'テスト♦500を受取'}</Button></div>
          <nav className="cash-shop__categories">{(Object.keys(CASH_CATEGORY_LABELS) as CashShopCategory[]).map(x=><button className={cashCategory===x?'is-active':''} onClick={()=>setCashCategory(x)} key={x}>{CASH_CATEGORY_LABELS[x]}</button>)}</nav>
          {shopMessage&&<p className="cash-shop__message">{shopMessage}</p>}
          <div className="cash-shop__grid">{CASH_SHOP_PRODUCTS.filter(x=>x.category===cashCategory).map(product=>{const count=commerce.purchaseCounts[product.id]??0;const owned=Boolean(product.purchaseLimit&&count>=product.purchaseLimit);const included=product.grant.kind==='entitlement'&&commerce.entitlements.includes(product.grant.id);const disabled=Boolean(product.cashYen||owned||included||(product.diamondCost??0)>commerce.diamonds);return <article className={`cash-product ${owned||included?'is-owned':''}`} key={product.id}><div><strong>{product.name}</strong><p>{product.description}</p>{count>0&&<small>購入数 {count}</small>}</div><div><b>{product.cashYen?`¥${product.cashYen.toLocaleString()}`:`♦ ${product.diamondCost}`}</b><Button disabled={disabled} onClick={()=>{const r=purchaseCashProduct(product.id,0);setShopMessage(r.message)}}>{product.cashYen?'準備中':owned?'購入済み':included?'標準付属':'購入'}</Button></div></article>})}</div>
          {cashCategory==='boost'&&<div className="cash-shop__boosts"><Button disabled={(save.items.exp_boost??0)<1} onClick={()=>activateBoost('exp_boost')}>経験値10倍を使用 ×{save.items.exp_boost??0}</Button><Button disabled={(save.items.drop_boost??0)<1} onClick={()=>activateBoost('drop_boost')}>ドロップ10倍を使用 ×{save.items.drop_boost??0}</Button></div>}
          <details className="purchase-history"><summary>購入履歴（{commerce.purchaseHistory.length}件）</summary>{commerce.purchaseHistory.length===0?<p>購入履歴はありません。</p>:commerce.purchaseHistory.map(x=><p key={x.id}><time>{new Date(x.purchasedAt).toLocaleString('ja-JP')}</time><b>{x.grantLabel}</b><span>♦ {x.diamondSpent}</span></p>)}</details>
        </section>}
        {tab === 'item' && (
          <section className="quick-slot-settings" aria-label="クイックスロット設定">
            <header><strong>クイックスロット設定</strong><span>枠を選び、道具の「登録」を押す</span></header>
            <div>
              {save.quickSlots.map((itemId, index) => (
                <button key={index} className={selectedQuickSlot === index ? 'is-selected' : ''} onClick={() => setSelectedQuickSlot(index)}>
                  <small>SLOT {index + 1}</small>
                  <b>{itemId ? STORE_ITEMS[itemId]?.name ?? '不明' : '未登録'}</b>
                  <span>×{itemId ? save.items[itemId] ?? 0 : 0}</span>
                </button>
              ))}
            </div>
            <button className="quick-slot-clear" onClick={() => setQuickSlot(selectedQuickSlot, null)}>選択枠を解除</button>
          </section>
        )}
        {tab === 'forge' && ownedEquipment.length === 0 && (
          <div className="store-empty">鍛造できる装備がない。6部位の武具を購入するか、探索で発見しよう。</div>
        )}
        {tab === 'craft' ? EQUIPMENT_RECIPES.map((recipe) => {
          const base = EQUIPMENT[recipe.baseEquipmentId];
          const result = EQUIPMENT[recipe.resultEquipmentId];
          const level = save.equipmentLevels?.[base.id] ?? 0;
          const material = getMaterial(recipe.materialId);
          return (
            <article className={`store-item forge-item ${canCraftEquipment(save, recipe) ? '' : 'is-unaffordable'}`} key={recipe.id}>
              <div className="store-item__art"><img className="store-item__icon" src={STORE_ICON_BY_ID[result.id]} alt="" aria-hidden="true" /><span>CRAFT</span></div>
              <div><strong>{result.name}</strong><p>{base.name} +5 から上位武器を制作。素材装備は消費されない。</p><em>基礎: {base.name} +{level} / {material.name} {save.inventory[recipe.materialId] ?? 0}/{recipe.materialQty}</em></div>
              <div className="store-item__buy"><b><i>G</i> {recipe.gold}</b><Button disabled={!canCraftEquipment(save, recipe)} onClick={() => craftEquipment(recipe.id)}>制作する</Button></div>
            </article>
          );
        }) : tab === 'forge' ? ownedEquipment.map((item) => {
          const level = save.equipmentLevels?.[item.id] ?? 0;
          const cost = forgeCost(item, level);
          const canForge = Boolean(cost && save.gold >= cost.gold && (save.inventory[cost.materialId] ?? 0) >= cost.materialQty);
          return (
            <article className={`store-item forge-item ${level >= MAX_EQUIPMENT_LEVEL ? 'is-max' : ''}`} key={item.id}>
              <div className="store-item__art"><img className="store-item__icon" src={STORE_ICON_BY_ID[item.id]} alt="" aria-hidden="true" /><span>FORGE</span></div>
              <div><strong>{item.name} <small>+{level}</small></strong><p>{level >= MAX_EQUIPMENT_LEVEL ? '最大強化に到達。物語の力が完全に定着している。' : '装備固有ステータスを10%強化する。'}</p><em>{bonusLabel(item.bonus)}</em></div>
              <div className="store-item__buy">
                {cost ? <b>{cost.gold}G / {getMaterial(cost.materialId).name} ×{cost.materialQty}</b> : <b>MAX</b>}
                <Button disabled={!canForge} onClick={() => forgeEquipment(item.id)}>強化する</Button>
              </div>
            </article>
          );
        }) : tab === 'item' ? Object.values(STORE_ITEMS).map((item) => (
          <article className={`store-item ${save.gold < item.price ? 'is-unaffordable' : ''}`} key={item.id}>
            <div className="store-item__art"><img className="store-item__icon" src={STORE_ICON_BY_ID[item.id]} alt="" aria-hidden="true" /><span>ITEM</span></div>
            <div><strong>{item.name} <small>×{save.items[item.id] ?? 0}</small></strong><p>{item.description}</p></div>
            <div className="store-item__buy"><b><i>G</i> {item.price}</b><Button onClick={() => setQuickSlot(selectedQuickSlot, item.id)}>登録</Button><Button disabled={save.gold < item.price} onClick={() => buyItem(item.id)}>購入</Button></div>
          </article>
        )) : equipment.map((item) => (
          <article className={`store-item ${save.gold < item.price ? 'is-unaffordable' : ''} ${equippedIds.has(item.id) ? 'is-equipped' : ''}`} key={item.id}>
            <div className="store-item__art"><img className="store-item__icon" src={STORE_ICON_BY_ID[item.id]} alt="" aria-hidden="true" /><span>{item.slot.toUpperCase()}</span></div>
            <div><div className="store-item__name"><strong>{item.name}</strong>{equippedIds.has(item.id) ? <small>装備中</small> : ownedIds.has(item.id) ? <small>所持済</small> : null}</div><p>{item.description}</p><em>{bonusLabel(item.bonus)} / 装着Lv {item.requiredLevel ?? 1}</em></div>
            <div className="store-item__buy"><b><i>G</i> {item.price}</b><Button disabled={save.gold < item.price || (save.party[0]?.level ?? 0) < (item.requiredLevel ?? 1)} onClick={() => buyEquipment(0, item.id)}>{(save.party[0]?.level ?? 0) < (item.requiredLevel ?? 1) ? `Lv${item.requiredLevel}必要` : ownedIds.has(item.id) ? '装備する' : '購入して装備'}</Button></div>
          </article>
        ))}
      </div>
    </Window>
  );
}
