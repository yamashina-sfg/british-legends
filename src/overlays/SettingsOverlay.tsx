import { useGameStore } from '@/store/useGameStore';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { useI18n } from '@/i18n';

export function SettingsOverlay() {
  const { closeOverlay, persist, goTitle, save, setSkipBlessingCinematics,setGameSettings } = useGameStore();
  const [section,setSection]=useState<'system'|'account'|'inventory'|'legal'>('system');
  const {t}=useI18n();
  if(!save)return null;
  const settings=save.settings??{skipBlessingCinematics:false,blessingCinematicsSeen:false,bgmVolume:.7,seVolume:.8,language:'ja' as const};

  return (
    <Window title="GAME MENU" className="game-menu">
      <nav>{([['system','system'],['account','account'],['inventory','inventory'],['legal','legal']] as const).map(([id,label])=><button key={id} className={section===id?'is-active':''} onClick={()=>setSection(id)}>{t(label)}</button>)}</nav>
      {section==='system'&&<section className="game-menu__section">
      <label>BGM音量 <b>{Math.round((settings.bgmVolume??.7)*100)}</b><input type="range" min="0" max="1" step=".1" value={settings.bgmVolume??.7} onChange={e=>setGameSettings({bgmVolume:Number(e.target.value)})}/></label>
      <label>SE音量 <b>{Math.round((settings.seVolume??.8)*100)}</b><input type="range" min="0" max="1" step=".1" value={settings.seVolume??.8} onChange={e=>setGameSettings({seVolume:Number(e.target.value)})}/></label>
      <label>{t('language')} <select value={settings.language??'ja'} onChange={e=>setGameSettings({language:e.target.value as 'ja'|'en'})}><option value="ja">日本語</option><option value="en">English</option></select></label>
      <Button
        center
        onClick={() => {
          persist();
          closeOverlay();
          alert(t('saved'));
        }}
      >
        {t('saveNow')}
      </Button>
      <Button center onClick={() => setSkipBlessingCinematics(!(save?.settings?.skipBlessingCinematics ?? false))}>
        既読の祝福演出を自動スキップ：{save?.settings?.skipBlessingCinematics ? 'ON' : 'OFF'}
      </Button>
      </section>}
      {section==='account'&&<section className="game-menu__section game-menu__records"><p><span>PLAYER</span><b>{save.playerAvatar?.name??'名無しの司書'}</b></p><p><span>SAVE SLOT</span><b>{save.slotId}</b></p><p><span>PLAY TIME</span><b>{Math.floor(save.playTimeSec/3600)}h {Math.floor(save.playTimeSec%3600/60)}m</b></p><p><span>DATA VERSION</span><b>{save.dataVersion}</b></p><small>現在は端末内保存です。外部アカウント同期は未接続です。</small></section>}
      {section==='inventory'&&<section className="game-menu__section game-menu__records"><p><span>GOLD</span><b>{save.gold.toLocaleString()}</b></p><p><span>DIAMOND</span><b>{save.commerce?.diamonds??0}</b></p><p><span>EQUIPMENT</span><b>{save.equipmentInventory.length}</b></p><p><span>MATERIAL</span><b>{Object.values(save.inventory).reduce((a,b)=>a+b,0)}</b></p><p><span>ITEM</span><b>{Object.values(save.items).reduce((a,b)=>a+b,0)}</b></p><p><span>PET</span><b>{save.pets?.length??0}</b></p></section>}
      {section==='legal'&&<section className="game-menu__section game-menu__legal"><h3>利用と権利について</h3><p>British Legendsの物語・名称・画面素材を使用しています。元仕様書はゲームシステム設計の参照に限り、元IP固有の名称・画像・音声は使用しません。</p><p>テストダイヤに金銭価値はなく、現金決済は接続されていません。</p><p>BGM / SE: CC0またはプロジェクト内許諾素材。</p></section>}
      <Button
        center
        onClick={() => {
          if (confirm('タイトルに戻りますか？（進行は自動セーブ済み）')) {
            persist();
            goTitle();
          }
        }}
      >
        {t('backTitle')}
      </Button>
      {section==='system'&&<div className="tiny dim center" style={{ lineHeight: 1.7 }}>
        進行は戦闘・進化のたびに自動セーブされます。
        <br />
        BGM: CC0音源（cynicmusic / Katana / RandomMind / CleytonKauffman）
      </div>}
      <Button center onClick={closeOverlay}>
        {t('close')}
      </Button>
    </Window>
  );
}
