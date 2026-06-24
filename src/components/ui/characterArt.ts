import beowulfMap from '@/assets/characters/generated/beowulf-map.png';
import beowulfIdle from '@/assets/characters/generated/beowulf-idle.png';
import beowulfAttack from '@/assets/characters/generated/beowulf-attack.png';
import beowulfHurt from '@/assets/characters/generated/beowulf-hurt.png';
import hamletMap from '@/assets/characters/generated/hamlet-map.png';
import hamletIdle from '@/assets/characters/generated/hamlet-idle.png';
import hamletAttack from '@/assets/characters/generated/hamlet-attack.png';
import hamletHurt from '@/assets/characters/generated/hamlet-hurt.png';
import macbethMap from '@/assets/characters/generated/macbeth-map.png';
import macbethIdle from '@/assets/characters/generated/macbeth-idle.png';
import macbethAttack from '@/assets/characters/generated/macbeth-attack.png';
import macbethHurt from '@/assets/characters/generated/macbeth-hurt.png';
import grendelIdle from '@/assets/characters/generated/grendel-idle.png';
import grendelsMotherIdle from '@/assets/characters/generated/grendels-mother-idle.png';
import dragonIdle from '@/assets/characters/generated/dragon-idle.png';
import ghostIdle from '@/assets/characters/generated/ghost-idle.png';
import claudiusIdle from '@/assets/characters/generated/claudius-idle.png';
import royalGuardIdle from '@/assets/characters/generated/royal-guard-idle.png';
import witchIdle from '@/assets/characters/generated/witch-idle.png';
import banquosGhostIdle from '@/assets/characters/generated/banquos-ghost-idle.png';
import macbethsFateIdle from '@/assets/characters/generated/macbeths-fate-idle.png';

export type SpritePose = 'map' | 'idle' | 'attack' | 'hurt';

type PoseSet = Partial<Record<SpritePose, string>>;

export const CHARACTER_ART: Record<string, PoseSet> = {
  beowulf: { map: beowulfMap, idle: beowulfIdle, attack: beowulfAttack, hurt: beowulfHurt },
  hamlet: { map: hamletMap, idle: hamletIdle, attack: hamletAttack, hurt: hamletHurt },
  macbeth: { map: macbethMap, idle: macbethIdle, attack: macbethAttack, hurt: macbethHurt },
  grendel: { idle: grendelIdle },
  mother: { idle: grendelsMotherIdle },
  dragon: { idle: dragonIdle },
  ghost: { idle: ghostIdle },
  king: { idle: claudiusIdle },
  guard: { idle: royalGuardIdle },
  witch: { idle: witchIdle },
  fate: { idle: macbethsFateIdle },
  banquo: { idle: banquosGhostIdle },
};

export function getCharacterArt(kind: string, pose: SpritePose) {
  const poses = CHARACTER_ART[kind];
  return poses?.[pose] ?? poses?.idle ?? poses?.map;
}
