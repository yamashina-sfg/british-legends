interface Props {
  value: number;
  max: number;
  type: 'hp' | 'mp';
}

export function Gauge({ value, max, type }: Props) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="gauge">
      <div className={`gauge-fill gauge-${type}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
