import { describe,expect,it } from 'vitest';
import { activatePortal,applyBossSoulFlags,claimOneTimeEvent,dialogueFor,portalId,tradeAdventureItem } from './adventure';
import { createNewSave,createOwnedCharacter } from './save';

describe('アドベンチャー進行',()=>{
  it('ボス討伐フラッグは一度だけ保存され、出撃キャラの魂Lvを上げる',()=>{
    const hero=createOwnedCharacter('beowulf_young');const base={...createNewSave(1),party:[hero],activePartyIds:[hero.characterId]};const first=applyBossSoulFlags(base,['dragon']);expect(first.save.adventure?.flags).toContain('defeat:dragon');expect(first.save.party[0].soulLevel).toBe(1);const second=applyBossSoulFlags(first.save,['dragon']);expect(second.save.party[0].soulLevel).toBe(1);expect(second.raised).toEqual([]);
  });
  it('ポータル解放、魂Lv会話分岐、一回報酬を保持する',()=>{
    const base=createNewSave(1);const opened=activatePortal(base,'beowulf',2);expect(opened.adventure?.openPortals).toContain(portalId('beowulf',2));expect(dialogueFor('beowulf',1)[1]).toContain('母の嘆き');const first=claimOneTimeEvent(opened,'memory:1');const again=claimOneTimeEvent(first.save,'memory:1');expect(first.save.items.recovery_potion).toBe(1);expect(again.first).toBe(false);
  });
  it('交換は必要素材を消費して道具と履歴を追加する',()=>{
    const save={...createNewSave(1),inventory:{monster_fang:3}};const next=tradeAdventureItem(save,'fang-trade','monster_fang',3,'high_recovery_potion',1);expect(next?.inventory.monster_fang).toBe(0);expect(next?.items.high_recovery_potion).toBe(1);expect(next?.adventure?.tradeCounts['fang-trade']).toBe(1);
  });
});
