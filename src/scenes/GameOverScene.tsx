import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';

export function GameOverScene() {
  const goWorldMap = useGameStore((s) => s.goWorldMap);
  return (
    <div className="scene fade-in center" style={{ justifyContent: 'center', alignItems: 'center', gap: 24 }}>
      <h1 style={{ fontSize: 28, color: 'var(--danger)', letterSpacing: 3 }}>全滅……</h1>
      <p className="dim small" style={{ lineHeight: 1.8 }}>
        物語は途絶えた。
        <br />
        だが文学は何度でも読み返される。
      </p>
      <div style={{ width: '70%' }}>
        <Button primary center onClick={goWorldMap}>
          ワールドマップへ戻る
        </Button>
      </div>
    </div>
  );
}
