import { useGameStore } from '@/store/useGameStore';
import { getMaterial, MATERIALS } from '@/data';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';

export function MaterialsOverlay() {
  const { save, closeOverlay } = useGameStore();
  if (!save) return null;

  const owned = Object.entries(save.inventory).filter(([, q]) => q > 0);

  return (
    <Window title="素材一覧" className="col">
      {owned.length === 0 && <div className="dim small">まだ素材を持っていない。</div>}
      <div className="col" style={{ gap: 8 }}>
        {owned.map(([id, qty]) => {
          const m = MATERIALS[id] ? getMaterial(id) : null;
          if (!m) return null;
          return (
            <div key={id} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
              <div className="sprite sprite-sm">◆</div>
              <div className="col" style={{ flex: 1, gap: 2 }}>
                <div className="row">
                  <span className="accent small">{m.name}</span>
                  <span className="spacer" />
                  <span className="small">×{qty}</span>
                </div>
                <div className="tiny dim">{m.description}</div>
              </div>
            </div>
          );
        })}
      </div>
      <Button center onClick={closeOverlay}>
        とじる
      </Button>
    </Window>
  );
}
