import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';

export function TitleScene() {
  const goSaveSelect = useGameStore((s) => s.goSaveSelect);

  return (
    <div className="scene fade-in" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="center" style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 13, letterSpacing: 4 }} className="dim">
          BRITISH LEGENDS
        </div>
        <h1 style={{ fontSize: 34, color: 'var(--accent)', letterSpacing: 2, lineHeight: 1.2 }}>
          ブリティッシュ
          <br />
          レジェンズ
        </h1>
        <div className="small dim" style={{ marginTop: 10 }}>
          失われた文学世界 Bibliotheca を
          <br />
          修復する旅へ
        </div>
      </div>

      <div style={{ width: '70%', marginTop: 30 }} className="menu-list">
        <Button primary center onClick={goSaveSelect}>
          はじめる
        </Button>
      </div>

      <div className="tiny dim center" style={{ marginTop: 'auto', paddingTop: 24 }}>
        v0.1.0 — MVP
      </div>
    </div>
  );
}
