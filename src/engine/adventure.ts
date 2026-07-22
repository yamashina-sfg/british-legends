import type { SaveData } from '@/types';

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
  return{first:true,save:{...save,items:{...save.items,recovery_potion:(save.items.recovery_potion??0)+1},adventure:{...current,completedEventIds:[...current.completedEventIds,eventId]}}};
}

export function tradeAdventureItem(save:SaveData,tradeId:string,giveId:string,giveQty:number,getId:string,getQty:number):SaveData|null {
  if((save.inventory[giveId]??0)<giveQty)return null;const current=save.adventure??{flags:[],openPortals:[],completedEventIds:[],tradeCounts:{}};
  return{...save,inventory:{...save.inventory,[giveId]:(save.inventory[giveId]??0)-giveQty},items:{...save.items,[getId]:(save.items[getId]??0)+getQty},adventure:{...current,tradeCounts:{...current.tradeCounts,[tradeId]:(current.tradeCounts[tradeId]??0)+1}}};
}
