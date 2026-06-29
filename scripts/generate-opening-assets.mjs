import { mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const W = 1600;
const H = 900;
const OUTS = ['public/opening', 'dist/opening'];
for (const out of OUTS) mkdirSync(out, { recursive: true });

const svg = (body) => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
  <defs>
    <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
      <stop stop-color="#07101a"/><stop offset=".45" stop-color="#111722"/><stop offset="1" stop-color="#08070c"/>
    </linearGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
      <stop stop-color="#4d3320"/><stop offset=".5" stop-color="#2b1b12"/><stop offset="1" stop-color="#140b08"/>
    </linearGradient>
    <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1">
      <stop stop-color="#3d3a3c"/><stop offset="1" stop-color="#19191d"/>
    </linearGradient>
    <radialGradient id="blueGlow">
      <stop stop-color="#94eeff" stop-opacity=".9"/><stop offset=".33" stop-color="#2e9fe6" stop-opacity=".38"/><stop offset="1" stop-color="#01040a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="goldGlow">
      <stop stop-color="#fff4a8" stop-opacity=".9"/><stop offset=".38" stop-color="#d7a23e" stop-opacity=".36"/><stop offset="1" stop-color="#080402" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="voidGlow">
      <stop stop-color="#000" stop-opacity=".9"/><stop offset=".55" stop-color="#170719" stop-opacity=".72"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="blur"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="glow"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  ${body}
</svg>`);

function frame() {
  return `
    <rect width="${W}" height="${H}" fill="#050509" opacity=".18"/>
    <rect x="12" y="12" width="${W - 24}" height="${H - 24}" fill="none" stroke="#17151b" stroke-width="16"/>
    <rect x="30" y="30" width="${W - 60}" height="${H - 60}" fill="none" stroke="#d6bf75" stroke-opacity=".24" stroke-width="2"/>
    <rect x="0" y="0" width="${W}" height="110" fill="#050509" opacity=".18"/>
    <rect x="0" y="760" width="${W}" height="140" fill="#050509" opacity=".23"/>
  `;
}

function plaque(title, index) {
  return `
    <g>
      <rect x="72" y="58" width="520" height="110" fill="#101719" fill-opacity=".92"/>
      <rect x="72" y="58" width="7" height="110" fill="#dfbf63"/>
      <text x="110" y="94" font-family="Georgia, serif" font-size="18" fill="#d5b85f" letter-spacing="5">${index}</text>
      <text x="110" y="136" font-family="Georgia, serif" font-size="34" font-weight="700" fill="#fff4cf">${title}</text>
    </g>`;
}

function shelf(x, y, w, h, rows = 5, opacity = 1) {
  const colors = ['#244b2e', '#17305d', '#6a2430', '#315d48', '#6b5424', '#3b3f48', '#3b2d58'];
  const books = [];
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < Math.floor(w / 34); i++) {
      const bx = x + 18 + i * 34;
      const bh = 54 + ((i + r) % 5) * 7;
      const by = y + 24 + r * (h / rows) + ((i * 7) % 12);
      books.push(`<rect x="${bx}" y="${by}" width="${19 + (i % 3) * 5}" height="${bh}" fill="${colors[(i + r) % colors.length]}" opacity="${opacity}"/>`);
    }
  }
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#160e0a" stroke="#6d4a2c" stroke-width="8"/>
      ${Array.from({ length: rows + 1 }, (_, r) => `<rect x="${x + 8}" y="${y + r * (h / rows)}" width="${w - 16}" height="10" fill="#765235"/>`).join('')}
      ${books.join('')}
      <rect x="${x + 8}" y="${y + h - 22}" width="${w - 16}" height="18" fill="#2a1a10"/>
    </g>`;
}

function bookSpine(x, y, w, h, color, label, glow = false, fade = 1) {
  return `
    <g opacity="${fade}" filter="${glow ? 'url(#glow)' : ''}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${color}" stroke="#d6b75d" stroke-width="8"/>
      <rect x="${x + 18}" y="${y + 24}" width="${w - 36}" height="${h - 48}" fill="#000" fill-opacity=".12"/>
      <line x1="${x + 31}" y1="${y + 14}" x2="${x + 31}" y2="${y + h - 14}" stroke="#f0d87e" stroke-opacity=".36" stroke-width="4"/>
      <text x="${x + w / 2}" y="${y + h * .55}" text-anchor="middle" font-family="Georgia, serif" font-size="${Math.max(24, w / 7)}" font-weight="700" fill="#f6df89" letter-spacing="2">${label}</text>
    </g>`;
}

function robedCensor(cx, cy, scale = 1) {
  const s = scale;
  return `
    <g transform="translate(${cx} ${cy}) scale(${s})" filter="url(#glow)">
      <ellipse cx="0" cy="238" rx="112" ry="24" fill="#000" opacity=".5"/>
      <path d="M-92 220 C-72 78 -50 10 0 -76 C50 10 72 78 92 220 Z" fill="#08070d" stroke="#43314d" stroke-width="7"/>
      <path d="M-54 42 C-38 -15 -20 -58 0 -88 C20 -58 38 -15 54 42 Z" fill="#171022" stroke="#59496a" stroke-width="5"/>
      <rect x="-28" y="-26" width="56" height="22" fill="#020204"/>
      <path d="M-114 80 C-188 112 -214 160 -238 232" fill="none" stroke="#0a080e" stroke-width="35" stroke-linecap="round"/>
      <path d="M114 80 C188 112 214 160 238 232" fill="none" stroke="#0a080e" stroke-width="35" stroke-linecap="round"/>
      ${Array.from({ length: 20 }, (_, i) => `<path d="M${-130 + i * 14} ${124 + (i % 4) * 17} C${-180 + i * 18} ${190 + (i % 5) * 8},${-80 + i * 12} ${236 + (i % 3) * 16},${-120 + i * 11} 292" fill="none" stroke="#171021" stroke-width="${5 + (i % 4)}" opacity=".78"/>`).join('')}
    </g>`;
}

function protagonist(x, y, scale = 1) {
  const s = scale;
  return `
    <g transform="translate(${x} ${y}) scale(${s})">
      <ellipse cx="0" cy="122" rx="40" ry="11" fill="#000" opacity=".38"/>
      <rect x="-20" y="20" width="40" height="72" fill="#1f4d8f" stroke="#0d1b2d" stroke-width="5"/>
      <rect x="-28" y="36" width="12" height="50" fill="#deb889"/>
      <rect x="16" y="36" width="12" height="50" fill="#deb889"/>
      <rect x="-15" y="-10" width="30" height="30" fill="#e4bb8e"/>
      <rect x="-18" y="-18" width="36" height="10" fill="#4b2d24"/>
      <rect x="-18" y="92" width="14" height="28" fill="#102536"/>
      <rect x="4" y="92" width="14" height="28" fill="#102536"/>
      <path d="M24 52 L68 8 L76 16 L32 68 Z" fill="#c8d9df" stroke="#5e6b73" stroke-width="4"/>
    </g>`;
}

function librarian(x, y, scale = 1) {
  const s = scale;
  return `
    <g transform="translate(${x} ${y}) scale(${s})">
      <ellipse cx="0" cy="154" rx="54" ry="12" fill="#000" opacity=".35"/>
      <path d="M-54 154 L-34 8 L0 -28 L34 8 L54 154 Z" fill="#2c2353" stroke="#a891d5" stroke-width="5"/>
      <rect x="-20" y="-54" width="40" height="38" fill="#ead7b2"/>
      <path d="M-28 -62 C-10 -88 22 -82 34 -54 L22 -52 C10 -66 -10 -66 -22 -52 Z" fill="#d8d0c2"/>
      <rect x="-44" y="24" width="18" height="74" fill="#cdb58a"/>
      <rect x="26" y="24" width="18" height="74" fill="#cdb58a"/>
      <rect x="-76" y="85" width="18" height="116" fill="#8b6c35"/>
      <circle cx="-67" cy="74" r="13" fill="#7be9ff" opacity=".75"/>
      <path d="M-12 -30 L-2 -22 L-12 -14" fill="none" stroke="#56422a" stroke-width="3"/>
      <path d="M12 -30 L2 -22 L12 -14" fill="none" stroke="#56422a" stroke-width="3"/>
    </g>`;
}

function openBook(x, y, w, h, mode = 'written') {
  const lines = mode === 'blank'
    ? ''
    : mode === 'beowulf'
      ? '<text x="0" y="15" text-anchor="middle" font-family="Georgia, serif" font-size="42" font-weight="700" fill="#fff0a2" letter-spacing="5">BEOWULF</text>'
      : Array.from({ length: 7 }, (_, i) => `<line x1="-104" y1="${-42 + i * 15}" x2="104" y2="${-42 + i * 15}" stroke="#6b5b3f" stroke-width="4" opacity=".8"/>`).join('');
  return `
    <g transform="translate(${x} ${y})">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="8" fill="#a18453" opacity=".78"/>
      <rect x="${-w / 2 + 18}" y="${-h / 2 + 16}" width="${w / 2 - 24}" height="${h - 32}" fill="${mode === 'blank' ? '#f8f5e9' : '#efe6c9'}" stroke="#7c653e" stroke-width="4"/>
      <rect x="6" y="${-h / 2 + 16}" width="${w / 2 - 24}" height="${h - 32}" fill="${mode === 'blank' ? '#faf7e9' : '#f5edd1'}" stroke="#7c653e" stroke-width="4"/>
      ${lines}
    </g>`;
}

function britishLegendsBook(x, y, w, h) {
  return `
    <g transform="translate(${x} ${y})" filter="url(#glow)">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="8" fill="#62262e" stroke="#efd06f" stroke-width="14"/>
      <rect x="${-w / 2 + 44}" y="${-h / 2 + 54}" width="${w - 88}" height="${h - 108}" fill="#7c3038"/>
      <line x1="0" y1="${-h / 2 + 18}" x2="0" y2="${h / 2 - 18}" stroke="#d9bd68" stroke-width="8"/>
      <text x="0" y="-24" text-anchor="middle" font-family="Georgia, serif" font-size="${w / 7}" font-weight="700" fill="#fff0a8" letter-spacing="7">BRITISH</text>
      <text x="0" y="58" text-anchor="middle" font-family="Georgia, serif" font-size="${w / 7}" font-weight="700" fill="#fff0a8" letter-spacing="7">LEGENDS</text>
    </g>`;
}

function scene1() {
  return svg(`
    <rect width="${W}" height="${H}" fill="url(#night)"/>
    <rect x="0" y="650" width="${W}" height="250" fill="#161015"/>
    <path d="M0 650 C340 520 588 478 800 482 C1038 486 1260 544 1600 658 L1600 900 L0 900 Z" fill="#211918"/>
    ${shelf(42, 102, 310, 614, 6, .78)}
    ${shelf(1248, 102, 310, 614, 6, .78)}
    ${shelf(418, 62, 238, 560, 7, .58)}
    ${shelf(944, 62, 238, 560, 7, .58)}
    ${Array.from({ length: 5 }, (_, i) => `<path d="M${500 + i * 150} 646 L${610 + i * 72} 190 L${710 + i * 72} 646 Z" fill="#121018" opacity=".25"/>`).join('')}
    <circle cx="800" cy="444" r="360" fill="url(#blueGlow)" opacity=".9"/>
    <rect x="690" y="538" width="220" height="44" fill="#3a2a1a" stroke="#caa85a" stroke-width="5"/>
    <circle cx="800" cy="512" r="62" fill="#80eaff" opacity=".78" filter="url(#glow)"/>
    ${Array.from({ length: 80 }, (_, i) => `<rect x="${70 + (i * 89) % 1450}" y="${80 + (i * 53) % 650}" width="${2 + (i % 3) * 2}" height="${2 + (i % 3) * 2}" fill="#dff8ff" opacity="${.18 + (i % 4) * .1}"/>`).join('')}
    ${frame()}${plaque('Bibliotheca', '01')}
    <text x="800" y="780" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#f5df91" letter-spacing="5">A LIBRARY WHERE STORIES SLEEP</text>
  `);
}

function scene2() {
  return svg(`
    <rect width="${W}" height="${H}" fill="#0a090d"/>
    <rect x="70" y="86" width="1460" height="642" fill="#140d09" stroke="#7b5836" stroke-width="12"/>
    ${Array.from({ length: 6 }, (_, row) => `<rect x="90" y="${138 + row * 104}" width="1420" height="14" fill="#765435"/>`).join('')}
    ${Array.from({ length: 185 }, (_, i) => {
      const x = 108 + (i % 37) * 38;
      const y = 105 + Math.floor(i / 37) * 104;
      const colors = ['#263f66', '#6a2430', '#2d5c3e', '#6a4d22', '#3a2d5e', '#463326'];
      return `<rect x="${x}" y="${y}" width="${20 + (i % 3) * 5}" height="${72 + (i % 4) * 7}" fill="${colors[i % colors.length]}" opacity=".72"/>`;
    }).join('')}
    ${bookSpine(128, 244, 170, 318, '#244b2e', 'BEOWULF', true)}
    ${bookSpine(356, 244, 170, 318, '#17305d', 'HAMLET', true)}
    ${bookSpine(584, 244, 170, 318, '#6a2430', 'MACBETH', true)}
    ${bookSpine(812, 244, 170, 318, '#315d48', 'FRANKEN', true)}
    ${bookSpine(1040, 244, 170, 318, '#6b5424', 'HOLMES', true)}
    ${bookSpine(1268, 244, 170, 318, '#3b3f48', '1984', true)}
    <circle cx="800" cy="410" r="540" fill="url(#goldGlow)" opacity=".18"/>
    ${frame()}${plaque('Stories Inheritance', '02')}
  `);
}

function scene3() {
  return svg(`
    <rect width="${W}" height="${H}" fill="#050408"/>
    ${shelf(0, 70, 350, 760, 7, .52)}
    ${shelf(1250, 70, 350, 760, 7, .52)}
    <circle cx="800" cy="395" r="520" fill="url(#voidGlow)" filter="url(#soft)"/>
    ${robedCensor(800, 280, 1.12)}
    ${openBook(510, 652, 322, 146, 'written')}
    ${openBook(1090, 652, 322, 146, 'blank')}
    ${Array.from({ length: 120 }, (_, i) => `<rect x="${240 + (i * 67) % 1120}" y="${162 + (i * 49) % 520}" width="${4 + (i % 4) * 2}" height="${4 + (i % 4) * 2}" fill="#e8dfc6" opacity="${.12 + (i % 5) * .1}"/>`).join('')}
    <text x="800" y="790" text-anchor="middle" font-family="Georgia, serif" font-size="35" fill="#e8d08a" letter-spacing="4">WORDS TURN TO BLANK PAPER</text>
    ${frame()}${plaque('The Censor', '03')}
  `);
}

function scene4() {
  return svg(`
    <rect width="${W}" height="${H}" fill="#0a0b10"/>
    ${shelf(54, 118, 300, 650, 7, .5)}
    ${shelf(1248, 118, 300, 650, 7, .5)}
    <rect x="0" y="620" width="${W}" height="280" fill="#1b1110"/>
    <circle cx="850" cy="518" r="368" fill="url(#goldGlow)" opacity=".88"/>
    ${openBook(850, 502, 372, 196, 'beowulf')}
    ${protagonist(486, 586, 1.72)}
    <path d="M600 676 C686 592 743 540 780 510" fill="none" stroke="#e9d274" stroke-width="8" stroke-linecap="round"/>
    ${Array.from({ length: 42 }, (_, i) => `<rect x="${704 + (i * 29) % 300}" y="${356 + (i * 41) % 210}" width="5" height="5" fill="#fff4a8" opacity="${.36 + (i % 4) * .14}"/>`).join('')}
    <text x="850" y="660" text-anchor="middle" font-family="Georgia, serif" font-size="38" fill="#fff0a2" letter-spacing="6">READING GIFT AWAKENS</text>
    ${frame()}${plaque('Reading Gift', '04')}
  `);
}

function scene5() {
  return svg(`
    <rect width="${W}" height="${H}" fill="#0d0c10"/>
    ${shelf(44, 112, 286, 650, 7, .48)}
    ${shelf(1270, 112, 286, 650, 7, .48)}
    <rect x="0" y="640" width="${W}" height="260" fill="#201410"/>
    <circle cx="820" cy="486" r="370" fill="url(#goldGlow)" opacity=".54"/>
    ${protagonist(430, 586, 1.52)}
    ${librarian(1116, 468, 1.36)}
    ${britishLegendsBook(812, 486, 284, 188)}
    <path d="M560 646 C622 574 686 526 674 496" fill="none" stroke="#e3c978" stroke-width="7" stroke-linecap="round"/>
    <path d="M1024 560 C984 530 944 510 954 492" fill="none" stroke="#e3c978" stroke-width="7" stroke-linecap="round"/>
    <text x="800" y="742" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#f4d77d" letter-spacing="5">ONLY YOU CAN READ WHAT WAS LOST</text>
    ${frame()}${plaque('The Librarian', '05')}
  `);
}

function scene6() {
  return svg(`
    <rect width="${W}" height="${H}" fill="#071016"/>
    <path d="M0 560 C250 430 350 390 520 424 C650 450 710 320 870 346 C1030 374 1120 482 1600 420 L1600 900 L0 900 Z" fill="#183d2d"/>
    <path d="M0 578 C180 510 400 452 580 504 C700 540 746 442 868 444 C1080 448 1180 570 1600 520 L1600 900 L0 900 Z" fill="#214f37"/>
    <path d="M0 450 C190 364 300 288 430 292 C560 296 620 220 760 226 C910 234 1010 348 1160 328 C1310 306 1410 232 1600 250 L1600 900 L0 900 Z" fill="#0b2c36" opacity=".75"/>
    ${Array.from({ length: 80 }, (_, i) => `<path d="M${(i * 67) % 1600} ${488 + (i * 31) % 270} l-24 66 h48 z" fill="${i % 2 ? '#0f3b2d' : '#123f30'}" opacity=".82"/>`).join('')}
    <circle cx="950" cy="450" r="405" fill="url(#goldGlow)" opacity=".82"/>
    ${protagonist(414, 604, 1.72)}
    ${britishLegendsBook(1086, 420, 456, 302)}
    <path d="M548 684 C678 572 778 482 852 438" fill="none" stroke="#efd06f" stroke-width="9" stroke-linecap="round" opacity=".95"/>
    <text x="800" y="780" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="#fff0a8" letter-spacing="5">THE BOOK OPENS TO BEOWULF</text>
    ${frame()}${plaque('British Legends', '06')}
  `);
}

async function write(name, buffer) {
  const png = await sharp(buffer).png().toBuffer();
  for (const out of OUTS) await sharp(png).png().toFile(join(out, `${name}.png`));
}

const scenes = [
  ['opening-bibliotheca', scene1()],
  ['opening-legacy-shelf', scene2()],
  ['opening-censor', scene3()],
  ['opening-reading-gift', scene4()],
  ['opening-librarian-vow', scene5()],
  ['opening-title-book', scene6()],
];

for (const [name, img] of scenes) {
  await write(name, img);
  copyFileSync(join('public/opening', `${name}.png`), join('dist/opening', `${name}.png`));
}

console.log('generated six original opening-specific PNG backgrounds without reusing existing maps/lodge art');
