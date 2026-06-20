import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { EQUIPMENT, getCharacter, getWorld, STORE_ITEMS } from '@/data';
import { Button } from '@/components/ui/Button';
import { Window } from '@/components/ui/Window';
import { PartyStatusBar } from '@/components/common/PartyStatusBar';

const DIALOGUES = {
  librarian: '司書: 各世界は、まだ物語の途中で凍りついています。道の先で、その結末を取り戻してください。',
  traveler: '旅人: 洞窟の枝道には休息碑がある。急がず、帰る力を残しておくんだ。',
  merchant: '商人: 剣は勝つため、薬は帰るため。Goldの使い道を間違えるなよ。',
};

export function TownScene() {
  const { save, worldId, restAtInn, buyEquipment, buyItem, enterWorld, goWorldMap, openOverlay } = useGameStore();
  const [dialogue, setDialogue] = useState(DIALOGUES.librarian);
  if (!save || !worldId) return null;
  const world = getWorld(worldId);
  const hero = save.party[0] ? getCharacter(save.party[0].characterId) : null;
  const weapons = Object.values(EQUIPMENT).filter((item) => item.slot === 'weapon');
  const armors = Object.values(EQUIPMENT).filter((item) => item.slot === 'armor' || item.slot === 'accessory');

  const shopRow = (item: (typeof weapons)[number]) => (
    <div key={item.id} className="town-shop-item">
      <div><strong>{item.name}</strong><span>{item.description}</span></div>
      <Button disabled={save.gold < item.price} onClick={() => buyEquipment(0, item.id)}>{item.price}G</Button>
    </div>
  );

  return (
    <div className={`town-scene town-theme-${worldId} fade-in`}>
      <div className="town-backdrop"><i className="town-backdrop__hall" /><i className="town-backdrop__torch town-backdrop__torch--one" /><i className="town-backdrop__torch town-backdrop__torch--two" /></div>
      <div className="town-hud rpg-window"><span>BIBLIOTHECA LODGE</span><strong>{world.title} への出発拠点</strong><b>G {save.gold}</b></div>
      <div className="lodge-npcs" aria-label="Lodge NPCs">
        <button onClick={() => setDialogue(DIALOGUES.librarian)}><i className="npc-sprite npc-librarian" />司書</button>
        <button onClick={() => setDialogue(DIALOGUES.traveler)}><i className="npc-sprite npc-traveler" />旅人</button>
        <button onClick={() => setDialogue(DIALOGUES.merchant)}><i className="npc-sprite npc-merchant" />商人</button>
      </div>
      <div className="lodge-dialogue rpg-window">{dialogue}</div>
      <div className="town-actions town-actions--primary">
        <Button primary center onClick={() => enterWorld(worldId)}>道をたどり、ダンジョンへ</Button>
        <Button center onClick={goWorldMap}>ワールドマップへ</Button>
      </div>
      <div className="town-grid">
        <Window title="宿屋・セーブ" className="town-window">
          <p>蜜酒の火が、傷ついた旅人を休ませる。セーブは行動ごとに記録される。</p>
          <Button disabled={save.gold < 8} onClick={restAtInn}>8Gで休む</Button>
        </Window>
        <Window title="武器屋" className="town-window">{weapons.map(shopRow)}</Window>
        <Window title="防具屋" className="town-window">{armors.map(shopRow)}</Window>
        <Window title="道具屋" className="town-window">
          {Object.values(STORE_ITEMS).map((item) => (
            <div key={item.id} className="town-shop-item"><div><strong>{item.name} ×{save.items[item.id] ?? 0}</strong><span>{item.description}</span></div><Button disabled={save.gold < item.price} onClick={() => buyItem(item.id)}>{item.price}G</Button></div>
          ))}
        </Window>
        <Window title="仲間・進化" className="town-window town-window--party"><PartyStatusBar />{hero && <small>{hero.stageName} の成長を確認し、素材が揃ったら進化させよう。</small>}<Button onClick={() => openOverlay('party')}>仲間を確認する</Button></Window>
      </div>
    </div>
  );
}
