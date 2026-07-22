import { getCharacter } from '@/data';
import type { SaveData } from '@/types';
import { statsWithEquipment } from './equipment';
import { permanentStats } from './permanentStats';

/** 通常敗北時は仕様書どおり、拠点でパーティーを最大HP/MPまで回復する。 */
export function recoverPartyAfterDefeat(save: SaveData) {
  const bonuses = permanentStats(save);
  return save.party.map((owned) => {
    const stats = statsWithEquipment(
      getCharacter(owned.characterId),
      owned,
      bonuses,
      save.equipmentLevels,
    );
    return { ...owned, currentHp: stats.hp, currentMp: stats.mp };
  });
}
