import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { ARENA_ENTRY_FEE, arenaRanking, arenaRankingPage, formatArenaTime, nearbyArenaRanking, type ArenaRankingEntry } from '@/engine/arena';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';

function recordTime(ms:number){return `${formatArenaTime(ms/1000)}.${String(ms%1000).padStart(3,'0')}`;}

export function ArenaReceptionOverlay(){
  const {save,enterArena,closeOverlay,setArenaNickname}=useGameStore();
  const max=Math.min(10,Math.max(1,save?.arena?.bestWave??0));
  const [selected,setSelected]=useState(save?.arena?.selectedStartWave??1);
  const [tab,setTab]=useState<'entry'|'ranking'>('entry');
  const [nearby,setNearby]=useState(false);
  const [page,setPage]=useState(0);
  const [detail,setDetail]=useState<ArenaRankingEntry|null>(null);
  const [nickname,setNickname]=useState(save?.arena?.nickname??save?.playerAvatar?.name?.slice(0,6)??'Guest');
  const [nicknameMessage,setNicknameMessage]=useState('');
  const bestWave=save?.arena?.bestWave??0;
  const totalTime=Object.entries(save?.arena?.bestTimes??{}).filter(([wave])=>Number(wave)<=bestWave).reduce((sum,[,time])=>sum+time,0);
  const rows=useMemo(()=>arenaRanking(bestWave,nickname,bestWave>0?totalTime:undefined),[bestWave,nickname,totalTime]);
  if(!save)return null;
  const visible=nearby?nearbyArenaRanking(rows,3):arenaRankingPage(rows,page);
  return <Window title="THE GRAND ARENA — 文学決闘場" className="arena-reception">
    <div className="arena-banner"><small>TIME ATTACK / ENDLESS WAVES</small><h2>失われた物語の試練</h2><p>5分以内に怪異のWAVEを突破し、宝箱と自己記録を獲得せよ。</p></div>
    <nav className="arena-reception-tabs"><button className={tab==='entry'?'is-active':''} onClick={()=>setTab('entry')}>挑戦</button><button className={tab==='ranking'?'is-active':''} onClick={()=>setTab('ranking')}>ランキング</button></nav>
    {tab==='entry'?<>
      <div className="arena-record"><span><small>最高到達</small><b>WAVE {bestWave}</b></span><span><small>挑戦回数</small><b>{save.arena?.attempts??0}</b></span><span><small>参加費</small><b>{ARENA_ENTRY_FEE} G</b></span></div>
      <label>開始WAVE <Button onClick={()=>setSelected(Math.max(1,selected-1))}>◀</Button><input type="range" min="1" max={max} value={Math.min(selected,max)} onChange={e=>setSelected(Number(e.target.value))}/><Button onClick={()=>setSelected(Math.min(max,selected+1))}>▶</Button><strong>{Math.min(selected,max)}</strong></label>
      <div className="arena-times">{Object.entries(save.arena?.bestTimes??{}).sort(([a],[b])=>Number(a)-Number(b)).map(([wave,time])=><span key={wave}>WAVE {wave}<b>{recordTime(time)}</b></span>)}</div>
      <div className="row"><Button onClick={closeOverlay}>キャンセル</Button><Button primary disabled={save.gold<ARENA_ENTRY_FEE} onClick={()=>enterArena(Math.min(selected,max))}>挑戦する</Button></div>
    </>:<section className="arena-ranking">
      <div className="arena-nickname"><label>ランキング名（6文字以内）<input maxLength={6} value={nickname} onChange={event=>setNickname(event.target.value)}/></label><Button onClick={()=>{const result=setArenaNickname(nickname);setNicknameMessage(result.message)}}>登録</Button>{nicknameMessage&&<small>{nicknameMessage}</small>}</div>
      <div className="arena-ranking__tools"><Button disabled={nearby||page===0} onClick={()=>setPage(value=>Math.max(0,value-1))}>◀</Button><b>{nearby?'周辺順位':`${page*100+1}〜${page*100+100}位`}</b><Button disabled={nearby||page===9} onClick={()=>setPage(value=>Math.min(9,value+1))}>▶</Button><Button onClick={()=>setNearby(value=>!value)}>{nearby?'1〜100位':'周辺順位'}</Button></div>
      <div className="arena-ranking__rows">{visible.map((row,index)=><button key={`${row.name}-${index}`} className={row.isPlayer?'is-player':''} onClick={()=>row.isPlayer&&setDetail(row)}><b>#{row.rank}</b><span>{row.name}</span><small>WAVE {row.wave}</small><strong>{recordTime(row.timeMs)}</strong></button>)}</div>
      {nearby&&!rows.some(row=>row.isPlayer)&&<p>ランキング対象外</p>}
      <small>順位は到達WAVE降順、同WAVEでは合計時間昇順。同WAVE・同タイムは同順位です。サーバー同期は未接続です。</small><Button onClick={closeOverlay}>閉じる</Button>
    </section>}
    {detail&&<div className="arena-ranking-detail" onClick={()=>setDetail(null)}><article onClick={event=>event.stopPropagation()}><small>RANK #{detail.rank}</small><h3>{detail.name}</h3><b>WAVE {detail.wave} / {recordTime(detail.timeMs)}</b><p>{detail.partyLabel}</p><div className="arena-detail-times">{Object.entries(save.arena?.bestTimes??{}).sort(([a],[b])=>Number(a)-Number(b)).map(([wave,time])=><span key={wave}>WAVE {wave}<b>{recordTime(time)}</b></span>)}</div><Button onClick={()=>setDetail(null)}>閉じる</Button></article></div>}
  </Window>;
}
