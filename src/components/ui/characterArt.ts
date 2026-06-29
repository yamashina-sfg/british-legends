import beowulfMap from '@/assets/characters/generated/beowulf-map.png';
import beowulfIdle from '@/assets/characters/generated/beowulf-idle.png';
import hamletMap from '@/assets/characters/generated/hamlet-map.png';
import hamletIdle from '@/assets/characters/generated/hamlet-idle.png';
import macbethMap from '@/assets/characters/generated/macbeth-map.png';
import macbethIdle from '@/assets/characters/generated/macbeth-idle.png';
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

type ImportMetaWithGlob = ImportMeta & {
  glob<T>(pattern: string, options: { eager: true; query: string; import: 'default' }): Record<string, T>;
};

const generatedSvgModules = (import.meta as ImportMetaWithGlob).glob<string>('../../assets/characters/generated/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});

const generatedAiModules = (import.meta as ImportMetaWithGlob).glob<string>('../../assets/characters/generated-ai/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

const generatedSvgByFile = Object.fromEntries(
  Object.entries(generatedSvgModules).map(([path, url]) => [path.split('/').pop() ?? path, url]),
);

const generatedAiByFile = Object.fromEntries(
  Object.entries(generatedAiModules).map(([path, url]) => [path.split('/').pop() ?? path, url]),
);

function generatedPoseSet(slug: string): PoseSet {
  return {
    map: generatedSvgByFile[`${slug}-map.svg`],
    idle: generatedSvgByFile[`${slug}-idle.svg`],
    attack: generatedSvgByFile[`${slug}-attack.svg`],
    hurt: generatedSvgByFile[`${slug}-hurt.svg`],
  };
}

function aiPoseSet(slug: string): PoseSet {
  const idle = generatedAiByFile[`${slug}-idle.png`];
  if (!idle) return generatedPoseSet(slug);

  return {
    map: idle,
    idle,
    attack: idle,
    hurt: idle,
  };
}

export const CHARACTER_ART: Record<string, PoseSet> = {
  beowulf: { map: beowulfMap, idle: beowulfIdle, attack: beowulfIdle, hurt: beowulfIdle },
  hamlet: { map: hamletMap, idle: hamletIdle, attack: hamletIdle, hurt: hamletIdle },
  macbeth: { map: macbethMap, idle: macbethIdle, attack: macbethIdle, hurt: macbethIdle },
  grendel: { idle: grendelIdle },
  mother: { idle: grendelsMotherIdle },
  dragon: { idle: dragonIdle },
  ghost: { idle: ghostIdle },
  king: { idle: claudiusIdle },
  guard: { idle: royalGuardIdle },
  witch: { idle: witchIdle },
  fate: { idle: macbethsFateIdle },
  banquo: { idle: banquosGhostIdle },
  gulliver: aiPoseSet('gulliver'),
  crusoe: aiPoseSet('crusoe'),
  mariner: aiPoseSet('mariner'),
  victor: aiPoseSet('victor'),
  alice: aiPoseSet('alice'),
  holmes: aiPoseSet('holmes'),
  van_helsing: aiPoseSet('van_helsing'),
  clarissa: aiPoseSet('clarissa'),
  winston: aiPoseSet('winston'),
  lilliput_soldier: aiPoseSet('lilliput_soldier'),
  giant_bird: aiPoseSet('giant_bird'),
  emperor_lilliput: aiPoseSet('emperor_lilliput'),
  wild_beast: aiPoseSet('wild_beast'),
  cannibal: aiPoseSet('cannibal'),
  pirate: aiPoseSet('pirate'),
  pirate_captain: aiPoseSet('pirate_captain'),
  ghost_sailor: aiPoseSet('ghost_sailor'),
  sea_spirit: aiPoseSet('sea_spirit'),
  cursed_bird: aiPoseSet('cursed_bird'),
  death_ship: aiPoseSet('death_ship'),
  failed_experiment: aiPoseSet('failed_experiment'),
  laboratory_guard: aiPoseSet('laboratory_guard'),
  electric_spirit: aiPoseSet('electric_spirit'),
  creature: aiPoseSet('creature'),
  card_soldier: aiPoseSet('card_soldier'),
  mad_hatter: aiPoseSet('mad_hatter'),
  white_rabbit: aiPoseSet('white_rabbit'),
  queen_hearts: aiPoseSet('queen_hearts'),
  thug: aiPoseSet('thug'),
  assassin: aiPoseSet('assassin'),
  criminal: aiPoseSet('criminal'),
  moriarty: aiPoseSet('moriarty'),
  bat: aiPoseSet('bat'),
  zombie: aiPoseSet('zombie'),
  vampire: aiPoseSet('vampire'),
  dracula: aiPoseSet('dracula'),
  nightmare: aiPoseSet('nightmare'),
  shadow: aiPoseSet('shadow'),
  anxiety: aiPoseSet('anxiety'),
  memories: aiPoseSet('memories'),
  thought_police: aiPoseSet('thought_police'),
  spy_drone: aiPoseSet('spy_drone'),
  officer: aiPoseSet('officer'),
  big_brother: aiPoseSet('big_brother'),
};

export function getCharacterArt(kind: string, pose: SpritePose) {
  const poses = CHARACTER_ART[kind];
  return poses?.[pose] ?? poses?.idle ?? poses?.map;
}
