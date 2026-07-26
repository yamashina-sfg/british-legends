import { describe, expect, it } from 'vitest';
import { createNewSave } from './save';
import { awardSummonedPetExp, evolvePet, petEvolutionProgress, setPetSlot, trainPet, tryCapturePet } from './pets';

describe('ペット', () => {
  it('対象モンスターから低確率で幼生体を獲得する', () => {
    const result=tryCapturePet(createNewSave(1),['grendel'],0.01);
    expect(result.captured?.petId).toBe('marsh_imp');
  });
  it('召喚枠のペットだけ30%経験値を得る', () => {
    let save=tryCapturePet(createNewSave(1),['grendel'],0).save;
    save=setPetSlot(save,0,save.pets![0].uid);
    expect(awardSummonedPetExp(save,100).pets![0].exp).toBe(30);
  });
  it('鍛錬で素材を消費し、進化すると同じ個体に星が付く', () => {
    let save=tryCapturePet(createNewSave(1),['grendel'],0).save; const uid=save.pets![0].uid;
    save.inventory.monster_fang=1; save=trainPet(save,uid)!; expect(save.pets![0].enhance).toBe(1);
    save.pets![0].level=30; save.gold=500; save=evolvePet(save,uid)!;
    expect(save.pets).toHaveLength(1);
    expect(save.pets![0]).toMatchObject({uid,petId:'marsh_guardian',originRank:1,rarityStars:1});
    expect(petEvolutionProgress(save.pets![0])).toEqual({originRank:1,stars:1,slots:2});
  });
});
