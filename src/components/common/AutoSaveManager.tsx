import{useEffect}from'react';import{useGameStore}from'@/store/useGameStore';import{AUTOSAVE_INTERVAL_MS}from'@/engine/autosave';

export function AutoSaveManager(){
  useEffect(()=>{let last=Date.now();const flush=()=>{const now=Date.now(),seconds=(now-last)/1000;last=now;useGameStore.getState().autosave(seconds);};const timer=window.setInterval(flush,AUTOSAVE_INTERVAL_MS);const onVisibility=()=>{if(document.visibilityState==='hidden')flush();};document.addEventListener('visibilitychange',onVisibility);return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',onVisibility);};},[]);
  return null;
}
