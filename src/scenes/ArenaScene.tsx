import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { ARENA_MAX_WAVE } from '@/engine/arena';
import { Button } from '@/components/ui/Button';

export function ArenaScene(){
  const {arenaRun,startArenaWave,exitArena,save,setArenaNickname,onBattleLost}=useGameStore();
  const [elapsed,setElapsed]=useState(0);
  const [nickname,setNickname]=useState(save?.arena?.nickname??save?.playerAvatar?.name?.slice(0,6)??'Guest');
  const [message,setMessage]=useState('');
  const started=useRef(false);
  const wave=arenaRun?.currentWave;
  useEffect(()=>{
    if(!wave||wave>ARENA_MAX_WAVE||arenaRun?.finished)return;
    started.current=false;setElapsed(0);
    const began=Date.now();
    const timer=window.setInterval(()=>{
      const next=Date.now()-began;setElapsed(next);
      if(next>=6000&&!started.current){started.current=true;window.clearInterval(timer);startArenaWave();}
    },50);
    return()=>window.clearInterval(timer);
  },[wave,arenaRun?.finished,startArenaWave]);
  if(!arenaRun)return null;
  if(arenaRun.finished){const times=Object.entries(arenaRun.waveTimes??{}).sort(([a],[b])=>Number(a)-Number(b));const total=times.reduce((sum,[,time])=>sum+time,0);return <main className="arena-intermission arena-result"><small>ARENA RESULT</small><h1>試合終了</h1><div className="arena-record"><span><small>到達WAVE</small><b>{Math.max(arenaRun.startWave,arenaRun.currentWave-1)}</b></span><span><small>合計タイム</small><b>{(total/1000).toFixed(3)}秒</b></span><span><small>突破数</small><b>{times.length}</b></span></div><label>ランキングに載せるニックネーム（6文字以内）<input maxLength={6} value={nickname} onChange={event=>setNickname(event.target.value)}/></label><Button onClick={()=>{const result=setArenaNickname(nickname);setMessage(result.message)}}>ニックネーム登録</Button>{message&&<p>{message}</p>}<div className="arena-result-times">{times.length?times.map(([wave,time])=><span key={wave}>WAVE {wave}<b>{(time/1000).toFixed(3)}秒</b></span>):<span>クリア記録なし</span>}</div><Button primary onClick={exitArena}>閉じる</Button></main>}
  const complete=arenaRun.currentWave>ARENA_MAX_WAVE;
  const phase=elapsed<3000?'ready':'wave';
  const count=phase==='ready'?Math.max(1,3-Math.floor(elapsed/1000)):Math.max(1,3-Math.floor((elapsed-3000)/1000));
  return <main className="arena-intermission">
    <div className="arena-gate">⚔</div><small>THE GRAND ARENA</small>
    <h1>{complete?'ALL WAVES RESTORED':phase==='ready'?`READY ${count}`:`WAVE ${arenaRun.currentWave}`}</h1>
    {complete?<div className="arena-chest"><i>♛</i><strong>全WAVE踏破</strong><span>文学決闘場の記録が保存されました。</span></div>:arenaRun.lastRewardLabel?<div className="arena-chest"><i>▣</i><strong>{arenaRun.lastRewardLabel}</strong><span>{((arenaRun.lastWaveTime??0)/1000).toFixed(3)}秒で突破</span><small>{phase==='ready'?'報酬を保存中…':'次の敵が出現します'}</small></div>:<p>{phase==='ready'?'闘技場へ転移しました。戦闘準備中です。':'WAVE告知後、敵出現と同時に5分タイマーが始まります。'}</p>}
    <div className="arena-countdown-track"><i style={{width:`${Math.min(100,elapsed/60)}%`}}/></div>
    <Button onClick={()=>{if(confirm('闘技を終了しますか？'))onBattleLost();}}>途中退出</Button>
  </main>;
}
