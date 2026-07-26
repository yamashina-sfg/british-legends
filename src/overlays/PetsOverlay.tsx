import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getPet } from '@/data/pets';
import { PET_ENHANCE_MAX, PET_EVOLVE_LEVEL, petEvolutionProgress, petExpForLevel, petStats } from '@/engine/pets';
import { getMaterial, getSkill } from '@/data';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';

type RankFilter='all'|1|2|3;
export function PetsOverlay(){
  const {save,setPetSlot,trainPet,evolvePet,closeOverlay}=useGameStore();
  const [filter,setFilter]=useState<RankFilter>('all'); const [selectedUid,setSelectedUid]=useState<string|null>(save?.pets?.[0]?.uid??null); const [slot,setSlot]=useState(0);
  const [trainingEffects,setTrainingEffects]=useState<number[]>([]);
  const [evolutionEffect,setEvolutionEffect]=useState<{uid:string;name:string}|null>(null);
  if(!save)return null;
  const pets=[...(save.pets??[])].filter((owned)=>filter==='all'||getPet(owned.petId).rank===filter).sort((a,b)=>{const sa=petStats(a),sb=petStats(b);return (sb.atk+(sb.int??0)+sb.def+(sb.mdef??0)+sb.spd+(sb.luk??0))-(sa.atk+(sa.int??0)+sa.def+(sa.mdef??0)+sa.spd+(sa.luk??0));});
  const selected=(save.pets??[]).find((pet)=>pet.uid===selectedUid)??pets[0]; const definition=selected?getPet(selected.petId):null; const stats=selected?petStats(selected):null;
  const trainWithEffect=(uid:string)=>{if(!trainPet(uid))return;const key=Date.now()+Math.random();setTrainingEffects((current)=>[...current,key]);window.setTimeout(()=>setTrainingEffects((current)=>current.filter((value)=>value!==key)),1000);};
  const evolveWithEffect=(uid:string,name:string)=>{if(evolutionEffect)return;setEvolutionEffect({uid,name});window.setTimeout(()=>{evolvePet(uid);setEvolutionEffect(null)},1400);};
  return <Window title="LITERARY FAMILIARS — 使い魔" className="pets-overlay">
    {trainingEffects.map((key)=><div className="pet-training-effect" key={key} aria-live="polite"><i>✦</i><strong>LEVEL UP!!</strong></div>)}
    {evolutionEffect&&<div className="pet-evolution-effect" aria-live="assertive"><div className="pet-evolution-effect__orb">✦</div><strong>EVOLUTION</strong><span>{evolutionEffect.name}</span></div>}
    <div className="pet-slots">{[0,1,2].map((index)=>{const uid=save.petSlots?.[index];const owned=save.pets?.find((pet)=>pet.uid===uid);return <button key={index} className={slot===index?'is-selected':''} onClick={()=>setSlot(index)}><small>SUMMON {index+1}</small><strong>{owned?getPet(owned.petId).name:'EMPTY'}</strong>{owned&&<span>HP {owned.currentHp}/{petStats(owned).hp}</span>}</button>})}</div>
    <div className="pet-rank-tabs">{([['all','全体'],[1,'幼生体'],[2,'成体'],[3,'完全体']] as [RankFilter,string][]).map(([key,label])=><button key={key} className={filter===key?'is-active':''} onClick={()=>setFilter(key)}>{label}</button>)}</div>
    <div className="pets-layout"><div className="pet-list">{pets.length?pets.map((owned)=>{const pet=getPet(owned.petId),progress=petEvolutionProgress(owned);const used=save.petSlots?.includes(owned.uid);return <button key={owned.uid} className={`${selected?.uid===owned.uid?'is-selected':''} ${used?'is-used':''}`} onClick={()=>setSelectedUid(owned.uid)}><i className="pet-rarity" aria-label={`進化星 ${progress.stars}/${progress.slots}`}>{Array.from({length:progress.slots},(_,index)=><b className={index<progress.stars?'is-filled':''} key={index}>★</b>)}</i><strong>{pet.name}</strong><span>Lv{owned.level} +{owned.enhance}</span></button>}):<p>まだ使い魔を獲得していません。対象の怪異を討伐すると低確率で契約できます。</p>}</div>
      {selected&&definition&&stats&&<section className="pet-detail"><header><div className={`pet-orb is-${definition.element}`}>◉</div><div><small>RANK {definition.rank} / {definition.element.toUpperCase()} / STAR {petEvolutionProgress(selected).stars}/{petEvolutionProgress(selected).slots}</small><h3>{definition.name}</h3><span>Lv {selected.level}/99　鍛錬 +{selected.enhance}/{PET_ENHANCE_MAX}</span></div></header><div className="pet-stats">{Object.entries(stats).map(([key,value])=><span key={key}><small>{key.toUpperCase()}</small><b>{value}</b></span>)}</div><div className="pet-skills">{definition.skillIds.slice(0,2).map((id)=><span key={id}><b>{getSkill(id).name}</b><small>{getSkill(id).description}</small></span>)}</div><p>EXP {selected.exp}/{petExpForLevel(Math.min(99,selected.level+1),definition.expScale)}　召喚中は英雄EXPの30%を追加獲得</p><div className="row"><Button primary onClick={()=>setPetSlot(slot,selected.uid)}>枠{slot+1}に召喚</Button><Button disabled={selected.enhance>=PET_ENHANCE_MAX||(save.inventory[definition.enhanceMaterialId]??0)<selected.enhance+1} onClick={()=>trainWithEffect(selected.uid)}>鍛錬（{getMaterial(definition.enhanceMaterialId).name} {save.inventory[definition.enhanceMaterialId]??0}/{selected.enhance+1}）</Button><Button disabled={Boolean(evolutionEffect)||!definition.evolveTo||selected.level<PET_EVOLVE_LEVEL||save.gold<500*definition.rank} onClick={()=>evolveWithEffect(selected.uid,definition.name)}>進化</Button></div></section>}
    </div><Button center onClick={closeOverlay}>閉じる</Button>
  </Window>;
}
