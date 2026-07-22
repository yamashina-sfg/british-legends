import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { dialogueFor } from '@/engine/adventure';
import { getMaterial, getWorld, STORE_ITEMS } from '@/data';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';

const TRADE_MATERIAL:Record<string,string>={beowulf:'monster_fang',hamlet:'ghost_fragment',macbeth:'witch_scroll',gulliver:'tiny_sword',crusoe:'wood_log',mariner:'ancient_feather',frankenstein:'research_notes',alice:'magic_card',holmes:'detective_notebook',dracula:'vampire_fang',dalloway:'old_letter',nineteen84:'secret_document'};
type PortalGroup='all'|'east'|'west'|'south';
const PORTAL_GROUPS:{id:PortalGroup;label:string}[]=[{id:'all',label:'全体'},{id:'east',label:'東門'},{id:'west',label:'西門'},{id:'south',label:'南門'}];
const portalGroupFor=(worldId:string):Exclude<PortalGroup,'all'>=>{const order=getWorld(worldId).order;return order<=4?'east':order<=8?'west':'south';};

export function AdventureOverlay(){
  const {save,closeOverlay,travelPortal,claimAdventureEvent,tradeAdventure,enterTown}=useGameStore();
  const [tab,setTab]=useState<'dialog'|'trade'|'portal'>('dialog');const[portalGroup,setPortalGroup]=useState<PortalGroup>('all');const[confirmPortal,setConfirmPortal]=useState<string|null>(null);const[message,setMessage]=useState('');
  if(!save)return null;const worldId=save.progress.currentWorldId??save.progress.unlockedWorldIds[0];const soul=Math.max(0,...save.party.map((member)=>member.soulLevel??0));const[name,line]=dialogueFor(worldId,soul);const materialId=TRADE_MATERIAL[worldId]??'monster_fang';const have=save.inventory[materialId]??0;const eventId=`librarian:${worldId}:${soul}`;const claimed=save.adventure?.completedEventIds.includes(eventId)??false;const portals=[...(save.adventure?.openPortals??[])].sort((a,b)=>{const[aw,af]=a.split(':'),[bw,bf]=b.split(':');return getWorld(aw).order-getWorld(bw).order||Number(af)-Number(bf);});const visiblePortals=portalGroup==='all'?portals:portals.filter((id)=>portalGroupFor(id.split(':')[0])===portalGroup);
  return <Window title="ADVENTURE ARCHIVE — 旅の記録" className="adventure-overlay">
    <header><div><small>SOUL LEVEL</small><strong>{soul}</strong></div><span>討伐フラッグ {save.adventure?.flags.length??0}<br/>解放ポータル {portals.length}</span></header>
    <nav><button className={tab==='dialog'?'is-active':''} onClick={()=>setTab('dialog')}>会話</button><button className={tab==='trade'?'is-active':''} onClick={()=>setTab('trade')}>交換</button><button className={tab==='portal'?'is-active':''} onClick={()=>setTab('portal')}>ポータル</button></nav>
    {tab==='dialog'&&<section className="adventure-dialog"><b>{name}</b><p>{line}</p><small>魂レベルに応じて会話とマップの物語が変化します。</small><Button disabled={claimed} onClick={()=>{if(claimAdventureEvent(eventId))setMessage('回復薬を1個受け取った。');}}>{claimed?'この記録の贈り物は受取済み':'記録を読み、贈り物を受け取る'}</Button></section>}
    {tab==='trade'&&<section className="adventure-trade"><b>巡回する紙片商</b><p>物語素材を、探索用の上級回復薬へ交換します。</p><div><span>{getMaterial(materialId).name} ×3</span><i>→</i><span>{STORE_ITEMS.high_recovery_potion.name} ×1</span></div><small>所持 {have}</small><Button primary disabled={have<3} onClick={()=>{if(tradeAdventure(`trade:${worldId}`,materialId,3,'high_recovery_potion',1))setMessage('交換が成立した。');}}>交換</Button></section>}
    {tab==='portal'&&<section className="adventure-portal-panel"><Button primary center className="adventure-return" onClick={()=>enterTown(worldId)}>村に帰還</Button><div className="adventure-portal-tabs">{PORTAL_GROUPS.map(group=>{const available=group.id==='all'||portals.some(id=>portalGroupFor(id.split(':')[0])===group.id);return <button key={group.id} className={portalGroup===group.id?'is-active':''} disabled={!available} onClick={()=>setPortalGroup(group.id)}>{group.label}</button>;})}</div><div className="adventure-portals">{visiblePortals.length?visiblePortals.map((id)=>{const[wid,floor]=id.split(':');const required=Number(floor),locked=soul<required;return <button key={id} disabled={locked} onClick={()=>setConfirmPortal(id)}><i>✦</i><strong>{getWorld(wid).title}</strong><small>第{required+1}層 {locked?`/ 魂Lv${required}必要`:''}</small></button>}):<p>この門には解放済みのポータルがありません。</p>}</div></section>}
    {message&&<div className="adventure-message">{message}</div>}
    <Button center onClick={closeOverlay}>とじる</Button>
    {confirmPortal&&<div className="adventure-confirm"><div><strong>このポータルへ転移しますか？</strong><p>{confirmPortal}</p><div className="row"><Button onClick={()=>setConfirmPortal(null)}>キャンセル</Button><Button primary onClick={()=>travelPortal(confirmPortal)}>転移</Button></div></div></div>}
  </Window>;
}
