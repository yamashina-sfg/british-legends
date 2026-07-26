import type { SaveData } from '@/types';
import { canReceiveItem, grantItem } from './items';

export const portalId=(worldId:string,floorIndex:number)=>`${worldId}:${floorIndex}`;

export function activatePortal(save:SaveData,worldId:string,floorIndex:number):SaveData {
  const id=portalId(worldId,floorIndex);const current=save.adventure??{flags:[],openPortals:[],completedEventIds:[],tradeCounts:{}};
  if(current.openPortals.includes(id))return save;
  return {...save,adventure:{...current,openPortals:[...current.openPortals,id]}};
}

export function applyBossSoulFlags(save:SaveData,enemyIds:string[]):{save:SaveData;raised:string[]} {
  const bosses=[...new Set(enemyIds)].map((id)=>`defeat:${id}`);const current=save.adventure??{flags:[],openPortals:[],completedEventIds:[],tradeCounts:{}};
  const fresh=bosses.filter((flag)=>!current.flags.includes(flag));if(!fresh.length)return{save,raised:[]};
  const active=new Set(save.activePartyIds??save.party.slice(0,3).map((member)=>member.characterId));const raised:string[]=[];
  const party=save.party.map((member)=>{if(!active.has(member.characterId))return member;raised.push(member.characterId);return{...member,soulLevel:(member.soulLevel??0)+fresh.length};});
  return{save:{...save,party,adventure:{...current,flags:[...current.flags,...fresh]}},raised};
}

export const ADVENTURE_DIALOGUES:Record<string,string[][]>={
  beowulf:[['司書','英雄の名が削られています。まずヘオロットの記録を探してください。'],['司書','怪物を倒した魂には、母の嘆きも読めるはずです。'],['司書','竜の炎の奥に、最後のページが待っています。']],
  hamlet:[['亡霊の記録官','問いを恐れず、城の声を集めなさい。'],['亡霊の記録官','復讐だけでなく、迷いそのものを修復してください。']],
  macbeth:[['三頁の予言書','王冠ではなく、選択が魂を形作る。'],['三頁の予言書','血の記録を読み終えた時、別の結末が開く。']],
};

export function dialogueFor(worldId:string,soulLevel:number):string[] {
  const list=ADVENTURE_DIALOGUES[worldId]??[['司書','まだ読めない物語が、この先にあります。']];return list[Math.min(soulLevel,list.length-1)];
}

export function claimOneTimeEvent(save:SaveData,eventId:string):{save:SaveData;first:boolean} {
  const current=save.adventure??{flags:[],openPortals:[],completedEventIds:[],tradeCounts:{}};if(current.completedEventIds.includes(eventId))return{save,first:false};
  const next=grantItem(save,'recovery_potion',1);return{first:true,save:{...next,adventure:{...current,completedEventIds:[...current.completedEventIds,eventId]}}};
}

export function tradeAdventureItem(save:SaveData,tradeId:string,giveId:string,giveQty:number,getId:string,getQty:number):SaveData|null {
  if((save.inventory[giveId]??0)<giveQty||!canReceiveItem(save,getId,getQty))return null;const current=save.adventure??{flags:[],openPortals:[],completedEventIds:[],tradeCounts:{}};
  const next=grantItem(save,getId,getQty);return{...next,inventory:{...next.inventory,[giveId]:(next.inventory[giveId]??0)-giveQty},adventure:{...current,tradeCounts:{...current.tradeCounts,[tradeId]:(current.tradeCounts[tradeId]??0)+1}}};
}
