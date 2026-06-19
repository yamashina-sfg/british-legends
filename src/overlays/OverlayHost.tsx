import { useGameStore } from '@/store/useGameStore';
import { PartyOverlay } from './PartyOverlay';
import { CharacterDetailOverlay } from './CharacterDetailOverlay';
import { EvolutionOverlay } from './EvolutionOverlay';
import { MaterialsOverlay } from './MaterialsOverlay';
import { CodexOverlay } from './CodexOverlay';
import { SettingsOverlay } from './SettingsOverlay';

export function OverlayHost() {
  const overlay = useGameStore((s) => s.overlay);
  const closeOverlay = useGameStore((s) => s.closeOverlay);
  if (!overlay) return null;

  return (
    <div className="overlay-backdrop fade-in" onClick={closeOverlay}>
      <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
        {overlay === 'party' && <PartyOverlay />}
        {overlay === 'character' && <CharacterDetailOverlay />}
        {overlay === 'evolution' && <EvolutionOverlay />}
        {overlay === 'materials' && <MaterialsOverlay />}
        {overlay === 'codex' && <CodexOverlay />}
        {overlay === 'settings' && <SettingsOverlay />}
      </div>
    </div>
  );
}
