import beowulfMapSprite from '@/assets/characters/beowulf-map.png';
import beowulfPortrait from '@/assets/characters/beowulf-portrait.png';

interface Props {
  label: string;
  side?: 'ally' | 'enemy';
  size?: 'sm' | 'md' | 'lg';
  faint?: boolean;
  presentation?: 'sprite' | 'portrait';
}

const sizeClass = { sm: 'sprite-sm', md: '', lg: 'sprite-lg' };

function spriteKind(label: string, side?: Props['side']) {
  const normalized = label.toLowerCase().replace(/[^a-z]/g, '');
  if (normalized.includes('dragon')) return 'dragon';
  if (normalized.includes('grendel')) return normalized.includes('mother') ? 'mother' : 'grendel';
  if (normalized.includes('ghost')) return 'ghost';
  if (normalized.includes('witch')) return 'witch';
  if (normalized.includes('guard') || normalized.includes('soldier')) return 'guard';
  if (normalized.includes('claudius') || normalized.includes('fate')) return 'king';
  if (normalized.includes('hamlet')) return 'hamlet';
  if (normalized.includes('macbeth')) return 'macbeth';
  return side === 'enemy' ? 'grendel' : 'wanderer';
}

export function Sprite({ label, side, size = 'md', faint, presentation = 'sprite' }: Props) {
  const kind = spriteKind(label, side);
  const sideClass = side ? `sprite-${side}` : '';
  const isBeowulf = side !== 'enemy' && kind === 'wanderer' && label.toLowerCase().includes('beowulf');
  const usesBeowulfArt = isBeowulf && presentation === 'sprite';
  const usesBeowulfPortrait = isBeowulf && presentation === 'portrait';
  return (
    <div
      aria-label={label}
      className={`sprite pixel-sprite ${sideClass} sprite-${kind} ${usesBeowulfArt ? 'sprite-beowulf-art' : ''} ${usesBeowulfPortrait ? 'sprite-beowulf-portrait' : ''} ${sizeClass[size]}`}
      style={faint ? { opacity: 0.25, filter: 'grayscale(1)' } : undefined}
    >
      {usesBeowulfArt || usesBeowulfPortrait ? (
        <span
          className="pixel-sprite__generated-art"
          style={{ backgroundImage: `url(${usesBeowulfPortrait ? beowulfPortrait : beowulfMapSprite})` }}
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
