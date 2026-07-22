import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { fishingLuck } from '@/engine/fishing';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';

type FishingPhase = 'idle' | 'waiting' | 'bite' | 'caught' | 'failed';

export function FishingOverlay() {
  const { save, completeFishing, closeOverlay } = useGameStore();
  const [phase, setPhase] = useState<FishingPhase>('idle');
  const [message, setMessage] = useState('文学の海へ糸を垂らそう。');
  const [auto,setAuto]=useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  if (!save) return null;
  const count = save.fishing?.count ?? 0;

  const start = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setPhase('waiting');
    setMessage('ウキが静かにページの波を漂っている……');
    timer.current = window.setTimeout(() => {
      setPhase('bite');
      setMessage('！　いまです！');
      timer.current = window.setTimeout(() => { setPhase('failed'); setMessage('獲物は物語の底へ逃げてしまった。'); }, 1000 + Math.random() * 1000);
    }, 2000 + Math.random() * 1000);
  };

  const pull = () => {
    if (timer.current) window.clearTimeout(timer.current);
    if (phase !== 'bite') {
      setPhase('failed');
      setMessage('まだ早い。釣り回数は増えません。');
      return;
    }
    const reward = completeFishing();
    setPhase('caught');
    setMessage(reward ? `${reward.label} ×${reward.qty} を釣り上げた！` : '釣果を記録できなかった。');
  };

  useEffect(()=>{if(!auto||!save.fishing?.autoUnlocked)return;let cancelled=false;const cycle=()=>{if(cancelled)return;setPhase('waiting');setMessage('AUTO：写本の海を探索中……');timer.current=window.setTimeout(()=>{if(cancelled)return;setPhase('bite');setMessage('！ AUTO CATCH');timer.current=window.setTimeout(()=>{if(cancelled)return;const reward=completeFishing();setPhase('caught');setMessage(reward?`AUTO：${reward.label} ×${reward.qty}`:'釣果を記録できなかった。');timer.current=window.setTimeout(cycle,900);},1000+Math.random()*1000);},2000+Math.random()*1000);};cycle();return()=>{cancelled=true;if(timer.current)window.clearTimeout(timer.current)}},[auto,save.fishing?.autoUnlocked,completeFishing]);

  return (
    <Window title="THE INKWELL — 写本釣り" className="fishing-overlay">
      <div className={`fishing-water is-${phase}`} onClick={() => (phase === 'waiting' || phase === 'bite') && pull()}>
        <div className="fishing-moon">☾</div><div className="fishing-float">{phase === 'bite' ? '！' : '│'}</div><div className="fishing-ripples">)))</div>
      </div>
      <div className="fishing-record"><div><small>TOTAL CASTS</small><strong>{count}</strong></div><div><small>PERMANENT LUK</small><strong>+{fishingLuck(count)}</strong></div><div><small>NEXT LUK</small><strong>{Math.min(1000, 1000 - (count % 1000))}回</strong></div></div>
      <p className={`fishing-message is-${phase}`}>{message}</p>
      <div className="row"><Button onClick={()=>{setAuto(false);closeOverlay()}}>やめる</Button>{!auto&&(phase === 'idle' || phase === 'caught' || phase === 'failed' ? <Button primary onClick={start}>釣り始める</Button> : <Button primary onClick={pull}>{phase === 'bite' ? '引き上げる！' : 'ウキを引く'}</Button>)}{save.fishing?.autoUnlocked&&<Button primary onClick={()=>setAuto(x=>!x)}>{auto?'自動釣り停止':'自動釣り開始'}</Button>}</div>
      <div className="tiny dim">1000回ごとにLUK+1（最大+100）。10・50・100回では固定報酬があります。</div>
    </Window>
  );
}
