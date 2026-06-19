import { useGameStore } from '@/store/useGameStore';
import { EQUIPMENT, getCharacter, getWorld } from '@/data';
import { Button } from '@/components/ui/Button';
import { Window } from '@/components/ui/Window';
import { PartyStatusBar } from '@/components/common/PartyStatusBar';

export function TownScene() {
  const { save, worldId, restAtInn, buyEquipment, enterWorld, goWorldMap } = useGameStore();
  if (!save || !worldId) return null;
  const world = getWorld(worldId);
  const goods = Object.values(EQUIPMENT).filter((item) => item.worldId === worldId);
  const hero = save.party[0] ? getCharacter(save.party[0].characterId) : null;

  return (
    <div className="town-scene fade-in">
      <div className="town-backdrop"><i className="town-backdrop__hall" /><i className="town-backdrop__torch town-backdrop__torch--one" /><i className="town-backdrop__torch town-backdrop__torch--two" /></div>
      <div className="town-hud rpg-window"><span>HEOROT OUTPOST</span><strong>{world.title} の前哨地</strong><b>G {save.gold}</b></div>
      <div className="town-grid">
        <Window title="宿屋" className="town-window">
          <p>蜜酒の火が、傷ついた旅人を休ませる。</p>
          <Button disabled={save.gold < 8} onClick={restAtInn}>8Gで休む</Button>
        </Window>
        <Window title="武具屋" className="town-window">
          {goods.map((item) => (
            <div key={item.id} className="town-shop-item">
              <div><strong>{item.name}</strong><span>{item.description}</span></div>
              <Button disabled={save.gold < item.price} onClick={() => buyEquipment(0, item.id)}>{item.price}G</Button>
            </div>
          ))}
        </Window>
        <Window title="パーティ" className="town-window town-window--party"><PartyStatusBar />{hero && <small>{hero.stageName} の次の進化条件はパーティ画面で確認できる。</small>}</Window>
      </div>
      <div className="town-actions"><Button primary center onClick={() => enterWorld(worldId)}>ダンジョンへ出発</Button><Button center onClick={goWorldMap}>ワールドマップへ</Button></div>
    </div>
  );
}
