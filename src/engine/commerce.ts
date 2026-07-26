import type { CommerceState, SaveData } from '@/types';
import { getCashProduct } from '@/data/cashShop';
import { getPet } from '@/data/pets';
import { canReceiveItem, grantItem } from './items';

export const defaultCommerce=():CommerceState=>({diamonds:0,purchaseCounts:{},purchaseHistory:[],entitlements:[],activeBoosts:{expUntil:0,dropUntil:0},sandboxGrantClaimed:false});
export function normalizeCommerce(value?:Partial<CommerceState>):CommerceState{const d=defaultCommerce();return {...d,...value,purchaseCounts:value?.purchaseCounts??{},purchaseHistory:value?.purchaseHistory??[],entitlements:[...new Set([...d.entitlements,...(value?.entitlements??[])])],activeBoosts:{...d.activeBoosts,...value?.activeBoosts}}}
export function pauseTimedBoosts(save:SaveData,now=Date.now()):SaveData{const c=normalizeCommerce(save.commerce),a=c.activeBoosts;const activeBoosts={...a,expPausedAt:a.expUntil>now?(a.expPausedAt??now):a.expPausedAt,dropPausedAt:a.dropUntil>now?(a.dropPausedAt??now):a.dropPausedAt};return {...save,commerce:{...c,activeBoosts}}}
export function resumeTimedBoosts(save:SaveData,now=Date.now()):SaveData{const c=normalizeCommerce(save.commerce),a=c.activeBoosts;const expShift=a.expPausedAt===undefined?0:Math.max(0,now-a.expPausedAt),dropShift=a.dropPausedAt===undefined?0:Math.max(0,now-a.dropPausedAt);return {...save,commerce:{...c,activeBoosts:{expUntil:a.expUntil+expShift,dropUntil:a.dropUntil+dropShift}}}}
export function boostRemainingLabel(until:number,now=Date.now()):string{const seconds=Math.max(0,Math.ceil((until-now)/1000));if(seconds<60)return `${seconds}s`;if(seconds<3600)return `${Math.ceil(seconds/60)}m`;if(seconds<86400)return `${Math.ceil(seconds/3600)}h`;return `${Math.min(999,Math.ceil(seconds/86400))}d`}
export function unlockedMagicSlotCount(save:SaveData):number{const e=normalizeCommerce(save.commerce).entitlements;return e.includes('magic_slot_3')?3:e.includes('magic_slot_2')?2:1}
export function purchaseProduct(save:SaveData,productId:string,partyIndex=0):{ok:boolean;message:string;save:SaveData}{
  const product=getCashProduct(productId),commerce=normalizeCommerce(save.commerce);
  if(!product)return {ok:false,message:'商品が見つかりません',save};
  if(product.cashYen)return {ok:false,message:'実決済は現在準備中です',save};
  if(product.purchaseLimit&&(commerce.purchaseCounts[productId]??0)>=product.purchaseLimit)return {ok:false,message:'購入済みの商品です',save};
  if(product.prerequisiteId&&!commerce.entitlements.includes(product.prerequisiteId))return {ok:false,message:'先に前提商品を解放してください',save};
  if(product.grant.kind==='item'&&!canReceiveItem(save,product.grant.itemId,product.grant.amount))return {ok:false,message:'所持上限99個を超えるため購入できません',save};
  const cost=product.diamondCost??0;if(commerce.diamonds<cost)return {ok:false,message:'ダイヤが不足しています',save};
  let next:SaveData={...save,commerce:{...commerce,diamonds:commerce.diamonds-cost,purchaseCounts:{...commerce.purchaseCounts,[productId]:(commerce.purchaseCounts[productId]??0)+1},purchaseHistory:[{id:`${Date.now()}-${productId}`,productId,purchasedAt:Date.now(),diamondSpent:cost,grantLabel:product.name},...commerce.purchaseHistory].slice(0,100)}};
  const g=product.grant;
  if(g.kind==='gold')next={...next,gold:next.gold+g.amount};
  if(g.kind==='status'&&next.party[partyIndex])next={...next,party:next.party.map((x,i)=>i===partyIndex?{...x,paidStatusPoints:(x.paidStatusPoints??0)+g.amount}:x)};
  if(g.kind==='item')next=grantItem(next,g.itemId,g.amount);
  if(g.kind==='equipment'&&!next.equipmentInventory.includes(g.equipmentId))next={...next,equipmentInventory:[...next.equipmentInventory,g.equipmentId]};
  if(g.kind==='head')next={...next,ownedHeadStyles:[...new Set([...(next.ownedHeadStyles??[]),g.style])]};
  if(g.kind==='pet'&&!(next.pets??[]).some(x=>x.petId===g.petId)){const pet=getPet(g.petId);next={...next,pets:[...(next.pets??[]),{uid:`paid-${g.petId}`,petId:g.petId,level:1,exp:0,enhance:0,currentHp:pet.baseStats.hp,originRank:pet.rank,rarityStars:0}]};}
  if(g.kind==='entitlement'){next={...next,commerce:{...normalizeCommerce(next.commerce),entitlements:[...new Set([...normalizeCommerce(next.commerce).entitlements,g.id])]}};if(g.id==='auto_fishing')next={...next,fishing:{...(next.fishing??{count:0,claimedMilestones:[]}),autoUnlocked:true}};}
  return {ok:true,message:`${product.name}を購入しました`,save:next};
}
export function grantSandboxDiamonds(save:SaveData):SaveData{const c=normalizeCommerce(save.commerce);if(c.sandboxGrantClaimed)return save;return {...save,commerce:{...c,diamonds:c.diamonds+500,sandboxGrantClaimed:true}}}
export function useTimedBoost(save:SaveData,itemId:'exp_boost'|'drop_boost',now=Date.now()):SaveData|null{if((save.items[itemId]??0)<1)return null;const c=normalizeCommerce(save.commerce),key=itemId==='exp_boost'?'expUntil':'dropUntil',pausedKey=itemId==='exp_boost'?'expPausedAt':'dropPausedAt',base=Math.max(now,c.activeBoosts[key]);return {...save,items:{...save.items,[itemId]:save.items[itemId]-1},commerce:{...c,activeBoosts:{...c.activeBoosts,[key]:base+30*60*1000,[pausedKey]:c.activeBoosts[pausedKey]??now}}};}
