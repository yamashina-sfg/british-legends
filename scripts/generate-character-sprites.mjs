import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = join(process.cwd(), 'src/assets/characters/generated');
mkdirSync(outDir, { recursive: true });

const poses = ['map', 'idle', 'attack', 'hurt'];

const actors = {
  beowulf: { kind: 'human', hair: '#8b5b2f', cloth: '#264f78', trim: '#3e6b3f', skin: '#d9a77a', accent: '#d7b85d', weapon: 'sword' },
  hamlet: { kind: 'human', hair: '#111725', cloth: '#1e2f5a', trim: '#a7aaa3', skin: '#d8ad86', accent: '#7867a8', weapon: 'sword' },
  macbeth: { kind: 'human', hair: '#7a3d23', cloth: '#641719', trim: '#2b2b2b', skin: '#d7a77e', accent: '#c24f4a', weapon: 'sword' },
  gulliver: { kind: 'human', hair: '#8b5b2f', cloth: '#2f6fa3', trim: '#f3f7f7', skin: '#e7bd8f', accent: '#d7b85d', weapon: 'sword' },
  crusoe: { kind: 'human', hair: '#6c4327', cloth: '#c7a86d', trim: '#31533d', skin: '#dcae7c', accent: '#64bfd0', weapon: 'knife' },
  mariner: { kind: 'human', hair: '#d6d4c3', cloth: '#102945', trim: '#8ec6b4', skin: '#c9a47e', accent: '#d9d6b4', weapon: 'staff' },
  victor: { kind: 'human', hair: '#1f1f25', cloth: '#6e7474', trim: '#9bff9c', skin: '#e6b98c', accent: '#345b45', weapon: 'spark' },
  alice: { kind: 'human', hair: '#d8b64a', cloth: '#80c7e8', trim: '#f0f4ff', skin: '#f0c8a2', accent: '#f0a5c8', weapon: 'wand' },
  holmes: { kind: 'human', hair: '#4d3828', cloth: '#5b4632', trim: '#a7aaa3', skin: '#ddb28a', accent: '#d2b16c', weapon: 'cane' },
  van_helsing: { kind: 'human', hair: '#cfc3aa', cloth: '#641719', trim: '#d7d0bd', skin: '#d4aa82', accent: '#0c0b0f', weapon: 'crossbow' },
  clarissa: { kind: 'human', hair: '#73533f', cloth: '#747977', trim: '#d2bd80', skin: '#e8bea0', accent: '#8aa082', weapon: 'letter' },
  winston: { kind: 'human', hair: '#4a3a32', cloth: '#585858', trim: '#b74b4b', skin: '#d0a17c', accent: '#2a1517', weapon: 'note' },

  lilliput_soldier: { kind: 'human', hair: '#55351f', cloth: '#b6474d', trim: '#d7b85d', skin: '#d9aa7e', accent: '#f3f7f7', weapon: 'spear' },
  giant_bird: { kind: 'bird', body: '#6f4a32', trim: '#d7b85d', accent: '#f3f7f7' },
  emperor_lilliput: { kind: 'human', hair: '#d7b85d', cloth: '#7e2f4b', trim: '#f3f7f7', skin: '#e0b58b', accent: '#d7b85d', weapon: 'scepter' },

  wild_beast: { kind: 'beast', body: '#6b4f32', trim: '#2e241d', accent: '#d9a24e' },
  cannibal: { kind: 'human', hair: '#242018', cloth: '#735536', trim: '#d5bf75', skin: '#b47a52', accent: '#c05b4b', weapon: 'spear' },
  pirate: { kind: 'human', hair: '#2b1f1a', cloth: '#39475d', trim: '#b43a38', skin: '#d0a17c', accent: '#d7b85d', weapon: 'sword' },
  pirate_captain: { kind: 'human', hair: '#2a1a17', cloth: '#2b2530', trim: '#b43a38', skin: '#d4a77e', accent: '#d7b85d', weapon: 'sword' },

  ghost_sailor: { kind: 'ghost', body: '#8ec6b4', trim: '#102945', accent: '#d9d6b4' },
  sea_spirit: { kind: 'ghost', body: '#66b7c7', trim: '#163f37', accent: '#8ec6b4' },
  cursed_bird: { kind: 'bird', body: '#1d2932', trim: '#8ec6b4', accent: '#d9d6b4' },
  death_ship: { kind: 'ship', body: '#102945', trim: '#8ec6b4', accent: '#d9d6b4' },

  failed_experiment: { kind: 'beast', body: '#6e7474', trim: '#9bff9c', accent: '#345b45' },
  laboratory_guard: { kind: 'human', hair: '#333333', cloth: '#6e7474', trim: '#9bff9c', skin: '#cda27b', accent: '#345b45', weapon: 'sword' },
  electric_spirit: { kind: 'ghost', body: '#9bff9c', trim: '#6e7474', accent: '#f2f7d8' },
  creature: { kind: 'giant', body: '#345b45', trim: '#6e7474', accent: '#9bff9c' },

  card_soldier: { kind: 'card', body: '#f3f7f7', trim: '#b6474d', accent: '#15151b' },
  mad_hatter: { kind: 'human', hair: '#d56355', cloth: '#5a8554', trim: '#f0a5c8', skin: '#e8b892', accent: '#80c7e8', weapon: 'cane' },
  white_rabbit: { kind: 'beast', body: '#f0f4ff', trim: '#f0a5c8', accent: '#d7b85d' },
  queen_hearts: { kind: 'human', hair: '#15151b', cloth: '#b6474d', trim: '#f3f7f7', skin: '#e7b590', accent: '#d7b85d', weapon: 'scepter' },

  thug: { kind: 'human', hair: '#3e2d20', cloth: '#5b4632', trim: '#a7aaa3', skin: '#c99672', accent: '#232323', weapon: 'club' },
  assassin: { kind: 'human', hair: '#171720', cloth: '#222632', trim: '#a7aaa3', skin: '#c99a72', accent: '#d2b16c', weapon: 'knife' },
  criminal: { kind: 'human', hair: '#3d3328', cloth: '#5b4632', trim: '#6d6d66', skin: '#d1a37c', accent: '#d2b16c', weapon: 'club' },
  moriarty: { kind: 'human', hair: '#1f1b18', cloth: '#211f28', trim: '#d2b16c', skin: '#d9ad86', accent: '#a7aaa3', weapon: 'cane' },

  bat: { kind: 'bat', body: '#171116', trim: '#641719', accent: '#d7d0bd' },
  zombie: { kind: 'giant', body: '#4e5b48', trim: '#6b6f65', accent: '#d7d0bd' },
  vampire: { kind: 'human', hair: '#121017', cloth: '#641719', trim: '#0c0b0f', skin: '#d7d0bd', accent: '#b74b4b', weapon: 'claw' },
  dracula: { kind: 'human', hair: '#0c0b0f', cloth: '#641719', trim: '#d7d0bd', skin: '#d7d0bd', accent: '#b74b4b', weapon: 'claw' },

  nightmare: { kind: 'ghost', body: '#2d3035', trim: '#747977', accent: '#d2bd80' },
  shadow: { kind: 'ghost', body: '#17191c', trim: '#747977', accent: '#8aa082' },
  anxiety: { kind: 'ghost', body: '#4f5552', trim: '#d2bd80', accent: '#8aa082' },
  memories: { kind: 'ghost', body: '#d2bd80', trim: '#747977', accent: '#8aa082' },

  thought_police: { kind: 'human', hair: '#191919', cloth: '#585858', trim: '#b74b4b', skin: '#c49a78', accent: '#2a1517', weapon: 'club' },
  spy_drone: { kind: 'drone', body: '#585858', trim: '#b74b4b', accent: '#d0d0d0' },
  officer: { kind: 'human', hair: '#252525', cloth: '#4b4b4b', trim: '#b74b4b', skin: '#c49a78', accent: '#2a1517', weapon: 'club' },
  big_brother: { kind: 'screen', body: '#2a1517', trim: '#585858', accent: '#b74b4b' },
};

function rect(x, y, w, h, fill, extra = '') {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
}

function human(a, pose) {
  const dx = pose === 'attack' ? 4 : pose === 'hurt' ? -3 : 0;
  const lean = pose === 'hurt' ? -2 : 0;
  const weaponReach = pose === 'attack' ? 12 : 3;
  const off = (x) => x + dx;
  const weaponColor = a.trim ?? '#d7d0bd';
  return [
    rect(off(25), 8 + lean, 14, 7, a.hair),
    rect(off(23), 14 + lean, 18, 14, a.skin),
    rect(off(21), 27, 22, 20, a.cloth),
    rect(off(20), 28, 4, 17, a.skin),
    rect(off(42), 28, 4, 17, a.skin),
    rect(off(26), 47, 6, 9, '#2a2523'),
    rect(off(35), 47, 6, 9, '#2a2523'),
    rect(off(22), 28, 20, 4, a.trim),
    rect(off(30), 30, 4, 18, a.accent),
    rect(off(44), 25, 4, weaponReach + 12, weaponColor, `transform="rotate(${pose === 'attack' ? -48 : 20} ${off(44)} 25)"`),
    rect(off(46 + weaponReach), 17, 3, 12, '#f1e7c9', pose === 'attack' ? '' : 'opacity=".0"'),
    rect(off(21), 56, 23, 4, 'rgba(0,0,0,.35)'),
  ].join('');
}

function ghost(a, pose) {
  const y = pose === 'attack' ? 4 : pose === 'hurt' ? 9 : 6;
  return [
    rect(24, 10 + y, 18, 12, a.body),
    rect(19, 22 + y, 28, 22, a.body),
    rect(17, 42 + y, 6, 8, a.body),
    rect(28, 42 + y, 6, 8, a.body),
    rect(39, 42 + y, 6, 8, a.body),
    rect(24, 22 + y, 5, 5, '#111719'),
    rect(37, 22 + y, 5, 5, '#111719'),
    rect(17, 30 + y, 8, 4, a.trim),
    rect(43, 30 + y, 8, 4, a.trim),
    rect(23, 52, 24, 4, 'rgba(0,0,0,.28)'),
  ].join('');
}

function beast(a, pose) {
  const dx = pose === 'attack' ? 5 : pose === 'hurt' ? -3 : 0;
  return [
    rect(16 + dx, 26, 31, 18, a.body),
    rect(37 + dx, 18, 15, 15, a.body),
    rect(42 + dx, 22, 4, 4, a.accent),
    rect(17 + dx, 44, 6, 10, a.trim),
    rect(36 + dx, 44, 6, 10, a.trim),
    rect(48 + dx, 31, 8, 4, a.trim),
    rect(13 + dx, 33, 8, 5, a.body),
    rect(17 + dx, 55, 34, 4, 'rgba(0,0,0,.35)'),
  ].join('');
}

function bird(a, pose) {
  const flap = pose === 'attack' ? -7 : 0;
  return [
    rect(25, 25, 18, 17, a.body),
    rect(38, 19, 11, 11, a.body),
    rect(48, 23, 7, 3, a.accent),
    rect(13, 23 + flap, 15, 8, a.trim),
    rect(40, 33 + flap, 16, 8, a.trim),
    rect(28, 42, 4, 8, '#4b3327'),
    rect(36, 42, 4, 8, '#4b3327'),
    rect(20, 52, 30, 4, 'rgba(0,0,0,.3)'),
  ].join('');
}

function card(a, pose) {
  const dx = pose === 'attack' ? 5 : pose === 'hurt' ? -3 : 0;
  return [
    rect(21 + dx, 12, 25, 40, a.body),
    rect(21 + dx, 12, 25, 4, a.trim),
    rect(21 + dx, 48, 25, 4, a.trim),
    rect(29 + dx, 26, 8, 8, a.trim),
    rect(16 + dx, 31, 7, 5, a.accent),
    rect(44 + dx, 31, 7, 5, a.accent),
    rect(25 + dx, 54, 24, 4, 'rgba(0,0,0,.35)'),
  ].join('');
}

function ship(a, pose) {
  const dx = pose === 'attack' ? 3 : 0;
  return [
    rect(15 + dx, 34, 37, 10, a.body),
    rect(20 + dx, 27, 28, 7, a.trim),
    rect(31 + dx, 13, 3, 21, a.accent),
    rect(34 + dx, 16, 14, 15, a.trim),
    rect(18 + dx, 45, 31, 5, '#111719'),
    rect(18 + dx, 53, 31, 4, 'rgba(0,0,0,.35)'),
  ].join('');
}

function giant(a, pose) {
  const dx = pose === 'attack' ? 5 : pose === 'hurt' ? -4 : 0;
  return [
    rect(23 + dx, 7, 18, 13, a.body),
    rect(19 + dx, 20, 26, 29, a.body),
    rect(17 + dx, 22, 6, 21, a.trim),
    rect(43 + dx, 22, 6, 21, a.trim),
    rect(25 + dx, 49, 7, 9, '#202320'),
    rect(36 + dx, 49, 7, 9, '#202320'),
    rect(27 + dx, 16, 4, 4, a.accent),
    rect(37 + dx, 16, 4, 4, a.accent),
    rect(21 + dx, 59, 28, 4, 'rgba(0,0,0,.35)'),
  ].join('');
}

function bat(a, pose) {
  const flap = pose === 'attack' ? -8 : 0;
  return [
    rect(28, 25, 13, 14, a.body),
    rect(18, 18 + flap, 15, 20, a.body),
    rect(37, 18 + flap, 15, 20, a.body),
    rect(30, 17, 4, 7, a.trim),
    rect(37, 17, 4, 7, a.trim),
    rect(32, 29, 3, 3, a.accent),
    rect(38, 29, 3, 3, a.accent),
    rect(22, 48, 28, 4, 'rgba(0,0,0,.28)'),
  ].join('');
}

function drone(a, pose) {
  const y = pose === 'attack' ? -2 : pose === 'hurt' ? 3 : 0;
  return [
    rect(23, 22 + y, 22, 16, a.body),
    rect(27, 26 + y, 14, 8, '#111719'),
    rect(31, 28 + y, 6, 4, a.accent),
    rect(13, 25 + y, 10, 4, a.trim),
    rect(45, 25 + y, 10, 4, a.trim),
    rect(21, 48, 26, 4, 'rgba(0,0,0,.25)'),
  ].join('');
}

function screen(a, pose) {
  const dx = pose === 'attack' ? 2 : 0;
  return [
    rect(18 + dx, 13, 31, 28, a.body),
    rect(22 + dx, 17, 23, 18, a.trim),
    rect(25 + dx, 20, 17, 12, a.accent),
    rect(27 + dx, 44, 12, 9, '#111719'),
    rect(19 + dx, 54, 29, 4, 'rgba(0,0,0,.35)'),
  ].join('');
}

const drawers = { human, ghost, beast, bird, card, ship, giant, bat, drone, screen };

function svg(slug, actor, pose) {
  const draw = drawers[actor.kind] ?? human;
  const content = draw(actor, pose);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" shape-rendering="crispEdges">
  <title>${slug}-${pose}</title>
  <rect x="0" y="0" width="64" height="64" fill="none"/>
  ${content}
</svg>
`;
}

for (const [slug, actor] of Object.entries(actors)) {
  for (const pose of poses) {
    writeFileSync(join(outDir, `${slug}-${pose}.svg`), svg(slug, actor, pose));
  }
}

console.log(`Generated ${Object.keys(actors).length * poses.length} character sprite SVGs.`);
