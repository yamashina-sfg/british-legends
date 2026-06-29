import beowulfPortrait from '@/assets/characters/beowulf-portrait.png';
import { getCharacterArt, type SpritePose } from '@/components/ui/characterArt';

interface Props {
  label: string;
  side?: 'ally' | 'enemy';
  size?: 'sm' | 'md' | 'lg';
  faint?: boolean;
  presentation?: 'sprite' | 'portrait';
  pose?: SpritePose;
  facing?: 'left' | 'right';
}

const sizeClass = { sm: 'sprite-sm', md: '', lg: 'sprite-lg' };

function spriteKind(label: string, side?: Props['side']) {
  const normalized = label.toLowerCase().replace(/[^a-z]/g, '');
  if (normalized.includes('bigbrother')) return 'big_brother';
  if (normalized.includes('thoughtpolice')) return 'thought_police';
  if (normalized.includes('spydrone')) return 'spy_drone';
  if (normalized.includes('queenofhearts')) return 'queen_hearts';
  if (normalized.includes('whiterabbit')) return 'white_rabbit';
  if (normalized.includes('madhatter')) return 'mad_hatter';
  if (normalized.includes('cardsoldier')) return 'card_soldier';
  if (normalized.includes('professormoriarty') || normalized.includes('moriarty')) return 'moriarty';
  if (normalized.includes('piratecaptain')) return 'pirate_captain';
  if (normalized.includes('deathship')) return 'death_ship';
  if (normalized.includes('ghostsailor')) return 'ghost_sailor';
  if (normalized.includes('seaspirit')) return 'sea_spirit';
  if (normalized.includes('cursedbird')) return 'cursed_bird';
  if (normalized.includes('failedexperiment')) return 'failed_experiment';
  if (normalized.includes('laboratoryguard')) return 'laboratory_guard';
  if (normalized.includes('electricspirit')) return 'electric_spirit';
  if (normalized.includes('emperoroflilliput') || normalized.includes('emperorlilliput')) return 'emperor_lilliput';
  if (normalized.includes('lilliputsoldier')) return 'lilliput_soldier';
  if (normalized.includes('giantbird')) return 'giant_bird';
  if (normalized.includes('wildbeast')) return 'wild_beast';
  if (normalized.includes('vanhelsing')) return 'van_helsing';
  if (normalized.includes('robinsoncrusoe')) return 'crusoe';
  if (normalized.includes('ancientmariner')) return 'mariner';
  if (normalized.includes('victorfrankenstein')) return 'victor';
  if (normalized.includes('sherlockholmes')) return 'holmes';
  if (normalized.includes('winstonsmith')) return 'winston';
  if (normalized.includes('nightmare')) return 'nightmare';
  if (normalized.includes('shadow')) return 'shadow';
  if (normalized.includes('anxiety')) return 'anxiety';
  if (normalized.includes('memories') || normalized.includes('memory')) return 'memories';
  if (normalized.includes('dragon')) return 'dragon';
  if (normalized.includes('grendel')) return normalized.includes('mother') ? 'mother' : 'grendel';
  if (normalized.includes('banquo')) return 'banquo';
  if (
    normalized.includes('ghost') ||
    normalized.includes('spirit') ||
    normalized.includes('death')
  ) return 'ghost';
  if (normalized.includes('witch')) return 'witch';
  if (normalized.includes('officer')) return 'officer';
  if (normalized.includes('cannibal')) return 'cannibal';
  if (normalized.includes('assassin')) return 'assassin';
  if (normalized.includes('criminal')) return 'criminal';
  if (normalized.includes('pirate')) return 'pirate';
  if (normalized.includes('thug')) return 'thug';
  if (
    normalized.includes('guard') ||
    normalized.includes('soldier') ||
    normalized.includes('police') ||
    normalized.includes('officer') ||
    normalized.includes('lilliput')
  ) return 'guard';
  if (
    normalized.includes('emperor') ||
    normalized.includes('queen') ||
    normalized.includes('moriarty')
  ) return 'king';
  if (normalized.includes('creature')) return 'creature';
  if (normalized.includes('vampire')) return 'vampire';
  if (normalized.includes('zombie')) return 'zombie';
  if (normalized.includes('dracula')) return 'dracula';
  if (
    normalized.includes('experiment') ||
    normalized.includes('beast')
  ) return 'grendel';
  if (normalized.includes('bat')) return 'bat';
  if (normalized.includes('bird') || normalized.includes('bat') || normalized.includes('rabbit')) return 'witch';
  if (normalized.includes('fate')) return 'fate';
  if (normalized.includes('claudius')) return 'king';
  if (normalized.includes('hamlet')) return 'hamlet';
  if (normalized.includes('macbeth')) return 'macbeth';
  if (normalized.includes('gulliver')) return 'gulliver';
  if (normalized.includes('crusoe')) return 'crusoe';
  if (normalized.includes('mariner')) return 'mariner';
  if (normalized.includes('victor')) return 'victor';
  if (normalized.includes('alice')) return 'alice';
  if (normalized.includes('holmes')) return 'holmes';
  if (normalized.includes('helsing')) return 'van_helsing';
  if (normalized.includes('clarissa')) return 'clarissa';
  if (normalized.includes('winston')) return 'winston';
  return side === 'enemy' ? 'grendel' : 'wanderer';
}

export function Sprite({ label, side, size = 'md', faint, presentation = 'sprite', pose = 'map', facing }: Props) {
  const kind = spriteKind(label, side);
  const sideClass = side ? `sprite-${side}` : '';
  const playableKind = label.toLowerCase().includes('beowulf') ? 'beowulf' : label.toLowerCase().includes('hamlet') ? 'hamlet' : label.toLowerCase().includes('macbeth') ? 'macbeth' : kind;
  const generatedArt = presentation === 'sprite' || playableKind !== 'beowulf'
    ? getCharacterArt(playableKind, presentation === 'portrait' ? 'idle' : pose)
    : undefined;
  const usesBeowulfPortrait = presentation === 'portrait' && playableKind === 'beowulf';
  return (
    <div
      aria-label={label}
      className={`sprite pixel-sprite ${sideClass} ${facing ? `sprite-facing-${facing}` : ''} sprite-${kind} ${generatedArt ? `sprite-generated sprite-pose-${pose}` : ''} ${presentation === 'portrait' && generatedArt ? 'sprite-generated-portrait' : ''} ${usesBeowulfPortrait ? 'sprite-beowulf-portrait' : ''} ${sizeClass[size]}`}
      style={faint ? { opacity: 0.25, filter: 'grayscale(1)' } : undefined}
    >
      {generatedArt || usesBeowulfPortrait ? (
        <img
          alt=""
          className="pixel-sprite__generated-art"
          src={usesBeowulfPortrait ? beowulfPortrait : generatedArt}
          draggable={false}
        />
      ) : (
        <>
          <span className="pixel-sprite__head" />
          <span className="pixel-sprite__body" />
          <span className="pixel-sprite__arm pixel-sprite__arm--left" />
          <span className="pixel-sprite__arm pixel-sprite__arm--right" />
          <span className="pixel-sprite__weapon" />
        </>
      )}
    </div>
  );
}
