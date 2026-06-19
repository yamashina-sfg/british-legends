import { useGameStore } from '@/store/useGameStore';
import { TitleScene } from '@/scenes/TitleScene';
import { SaveSelectScene } from '@/scenes/SaveSelectScene';
import { WorldMapScene } from '@/scenes/WorldMapScene';
import { WorldSelectScene } from '@/scenes/WorldSelectScene';
import { DungeonScene } from '@/scenes/DungeonScene';
import { BattleScene } from '@/scenes/BattleScene';
import { GameOverScene } from '@/scenes/GameOverScene';
import { WorldClearScene } from '@/scenes/WorldClearScene';
import { TownScene } from '@/scenes/TownScene';
import { OverlayHost } from '@/overlays/OverlayHost';

export default function App() {
  const scene = useGameStore((s) => s.scene);

  return (
    <div className="game-frame">
      {scene === 'title' && <TitleScene />}
      {scene === 'saveSelect' && <SaveSelectScene />}
      {scene === 'worldMap' && <WorldMapScene />}
      {scene === 'worldSelect' && <WorldSelectScene />}
      {scene === 'town' && <TownScene />}
      {scene === 'dungeon' && <DungeonScene />}
      {scene === 'battle' && <BattleScene />}
      {scene === 'gameOver' && <GameOverScene />}
      {scene === 'worldClear' && <WorldClearScene />}
      <OverlayHost />
    </div>
  );
}
