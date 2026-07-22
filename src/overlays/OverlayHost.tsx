import { useGameStore } from '@/store/useGameStore';
import { PartyOverlay } from './PartyOverlay';
import { CharacterDetailOverlay } from './CharacterDetailOverlay';
import { EvolutionOverlay } from './EvolutionOverlay';
import { MaterialsOverlay } from './MaterialsOverlay';
import { CodexOverlay } from './CodexOverlay';
import { SettingsOverlay } from './SettingsOverlay';
import { StoreOverlay } from './StoreOverlay';
import { BlessingOverlay } from './BlessingOverlay';
import { FishingOverlay } from './FishingOverlay';
import { PetsOverlay } from './PetsOverlay';
import { ArenaReceptionOverlay } from './ArenaReceptionOverlay';
import { ConstellationsOverlay } from './ConstellationsOverlay';
import { SkinsOverlay } from './SkinsOverlay';
import { SkillLoadoutOverlay } from './SkillLoadoutOverlay';

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
        {overlay === 'blessing' && <BlessingOverlay />}
        {overlay === 'materials' && <MaterialsOverlay />}
        {overlay === 'codex' && <CodexOverlay />}
        {overlay === 'settings' && <SettingsOverlay />}
        {overlay === 'store' && <StoreOverlay />}
        {overlay === 'fishing' && <FishingOverlay />}
        {overlay === 'pets' && <PetsOverlay />}
        {overlay === 'arenaReception' && <ArenaReceptionOverlay />}
        {overlay === 'constellations' && <ConstellationsOverlay />}
        {overlay === 'skins' && <SkinsOverlay />}
        {overlay === 'skillLoadout' && <SkillLoadoutOverlay />}
      </div>
    </div>
  );
}
