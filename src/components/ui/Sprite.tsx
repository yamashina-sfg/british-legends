interface Props {
  label: string;
  side?: 'ally' | 'enemy';
  size?: 'sm' | 'md' | 'lg';
  faint?: boolean;
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

export function Sprite({ label, side, size = 'md', faint }: Props) {
  const kind = spriteKind(label, side);
  const sideClass = side ? `sprite-${side}` : '';
  return (
    <div
      aria-label={label}
      className={`sprite pixel-sprite ${sideClass} sprite-${kind} ${sizeClass[size]}`}
      style={faint ? { opacity: 0.25, filter: 'grayscale(1)' } : undefined}
    >
      <span className="pixel-sprite__head" />
      <span className="pixel-sprite__body" />
      <span className="pixel-sprite__arm pixel-sprite__arm--left" />
      <span className="pixel-sprite__arm pixel-sprite__arm--right" />
      <span className="pixel-sprite__weapon" />
    </div>
  );
}
