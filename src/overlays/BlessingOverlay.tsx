import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getCharacter, getWorld } from '@/data';
import { MAX_BLESSING_COUNT, maxCharacterLevel, normalizeOwnedGrowth } from '@/engine/characterGrowth';
import { patronBlessingBonus } from '@/engine/equipment';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';
import { unlockedConstellationIds } from '@/engine/constellations';

const bonusLabel=(worldId:string)=>Object.entries(patronBlessingBonus(worldId)).map(([key,value])=>`${key.toUpperCase()} +${value}`).join(' / ');

export function BlessingOverlay() {
  const { save, selectedCharIndex, blessCharacter, openOverlay } = useGameStore();
  const unlocked = save ? unlockedConstellationIds(save) : [];
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(unlocked[0] ?? null);
  const [confirming,setConfirming]=useState(false);
  const [ceremony,setCeremony]=useState(false);
  const touchStart=useRef<number|null>(null);
  const finished=useRef(false);
  const owned = save?.party[selectedCharIndex];
  const finish=()=>{if(finished.current||!selectedWorldId)return;finished.current=true;blessCharacter(selectedCharIndex,selectedWorldId);};
  useEffect(()=>{if(!ceremony)return;const id=window.setTimeout(finish,2600);return()=>window.clearTimeout(id);},[ceremony]);
  if (!save || !owned) return null;
  const growth = normalizeOwnedGrowth(owned);
  const hero = getCharacter(owned.characterId);
  const bonus = 9 + unlocked.length;
  const eligible=owned.level>=maxCharacterLevel(growth)&&(growth.blessingCount??0)<MAX_BLESSING_COUNT&&unlocked.length>0;
  const move=(delta:number)=>{if(!selectedWorldId||!unlocked.length)return;const index=unlocked.indexOf(selectedWorldId);setSelectedWorldId(unlocked[(index+delta+unlocked.length)%unlocked.length]);};
  const confirm=()=>{setConfirming(false);if(save.settings?.skipBlessingCinematics&&save.settings?.blessingCinematicsSeen)finish();else setCeremony(true);};

  if(ceremony)return <div className="blessing-ceremony" aria-label="文学星座の祝福演出"><div className="blessing-stars">✦　✧　✦　✧　✦</div><div className="blessing-lightburst"/><strong>{getWorld(selectedWorldId!).title}</strong><p>失われた物語の星々が、{hero.name}の新たな身体と運命を綴る。</p>{save.settings?.blessingCinematicsSeen&&<Button onClick={finish}>SKIP</Button>}</div>;

  return (
    <Window title="CONSTELLATION BLESSING — 星神の婚姻" className="blessing-overlay">
      <div className="blessing-overlay__hero"><span>✦</span><div><small>THE RESTORED SKY</small><strong>{hero.name}へ文学星座の祝福を</strong><p>物語の頂点から新たな第1章へ。星神との婚姻により成長上限を広げます。</p></div></div>
      <div className="blessing-effects">
        <div><small>LEVEL</small><b>{owned.level} → 1</b></div>
        <div><small>MAX LEVEL</small><b>{50 + (growth.blessingCount ?? 0)} → {Math.min(60,51 + (growth.blessingCount ?? 0))}</b></div>
        <div><small>STATUS CAP</small><b>{99 + (growth.blessingCount ?? 0) * 10} → {109 + (growth.blessingCount ?? 0) * 10}</b></div>
        <div><small>BONUS POINT</small><b>+{bonus}</b></div>
      </div>
      <div className="blessing-overlay__caption">解放済み文学星座を選択　{unlocked.indexOf(selectedWorldId??'')+1}/{unlocked.length}</div>
      <div className="blessing-carousel" onTouchStart={(event)=>touchStart.current=event.touches[0].clientX} onTouchEnd={(event)=>{if(touchStart.current===null)return;const delta=event.changedTouches[0].clientX-touchStart.current;if(Math.abs(delta)>35)move(delta>0?-1:1);touchStart.current=null;}}>
        <button aria-label="前の星神" onClick={()=>move(-1)}>‹</button>
        <div className="blessing-patrons">{unlocked.map((worldId) => {const world=getWorld(worldId);return <button key={worldId} className={selectedWorldId===worldId?'is-selected':''} onClick={()=>setSelectedWorldId(worldId)}><i>✦</i><strong>{world.title}</strong><small>{world.author}</small><em>{bonusLabel(worldId)}</em></button>;})}</div>
        <button aria-label="次の星神" onClick={()=>move(1)}>›</button>
      </div>
      <div className="tiny dim">婚姻すると装備は外れ、レベルポイントは0になります。振分済み能力と祝福ポイントは保持され、選んだ星神の永久バフは次の婚姻まで有効です。</div>
      {!eligible&&<div className="blessing-requirement">条件：Lv {maxCharacterLevel(growth)}到達・星神1体以上解放・婚姻{MAX_BLESSING_COUNT}回未満（現在 {growth.blessingCount??0}回）</div>}
      <div className="row"><Button onClick={()=>openOverlay('character',selectedCharIndex)}>戻る</Button><Button primary disabled={!selectedWorldId||!eligible} onClick={()=>setConfirming(true)}>この星神と婚姻する</Button></div>
      {confirming&&<div className="blessing-confirm"><div><strong>{getWorld(selectedWorldId!).title}の星神を選びますか？</strong><p>レベルは1になり、装備がすべて外れます。</p><div className="row"><Button onClick={()=>setConfirming(false)}>キャンセル</Button><Button primary onClick={confirm}>確認</Button></div></div></div>}
    </Window>
  );
}
