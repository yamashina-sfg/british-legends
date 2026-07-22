import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { TitleScene } from '@/scenes/TitleScene';
import { OpeningScene } from '@/scenes/OpeningScene';
import { CharacterCreateScene } from '@/scenes/CharacterCreateScene';
import { SaveSelectScene } from '@/scenes/SaveSelectScene';
import { WorldMapScene } from '@/scenes/WorldMapScene';
import { WorldSelectScene } from '@/scenes/WorldSelectScene';
import { DungeonScene } from '@/scenes/DungeonScene';
import { BattleScene } from '@/scenes/BattleScene';
import { GameOverScene } from '@/scenes/GameOverScene';
import { WorldClearScene } from '@/scenes/WorldClearScene';
import { TownScene } from '@/scenes/TownScene';
import { ArenaScene } from '@/scenes/ArenaScene';
import { OverlayHost } from '@/overlays/OverlayHost';
import { AudioManager } from '@/components/common/AudioManager';
import { NotificationProvider } from '@/notifications/NotificationProvider';
import { VersionGate } from '@/components/common/VersionGate';
import { playGameSfx } from '@/audio/sfx';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

/** Never leave a player with a blank screen if an old save or a future view fails. */
class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // The recovery screen intentionally avoids exposing internal error details to players.
  }

  private resetSave = () => {
    [1, 2, 3].forEach((slot) => localStorage.removeItem(`british-legends:slot:${slot}`));
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="startup-recovery">
          <div className="startup-recovery__crest">BL</div>
          <h1>BRITISH LEGENDS</h1>
          <p>物語の頁を開き直しています。</p>
          <button onClick={() => window.location.reload()}>もう一度ひらく</button>
          <button className="startup-recovery__reset" onClick={this.resetSave}>セーブデータを初期化して再開</button>
        </main>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const scene = useGameStore((s) => s.scene);

  return (
    <AppErrorBoundary>
      <VersionGate><NotificationProvider>
        <div className="game-frame" onClick={(event)=>{const target=event.target as HTMLElement;if(target.closest('button')&&!target.closest('.audio-toggle'))playGameSfx('click')}}>
          {scene === 'title' && <TitleScene />}
          {scene === 'opening' && <OpeningScene />}
          {scene === 'characterCreate' && <CharacterCreateScene />}
          {scene === 'saveSelect' && <SaveSelectScene />}
          {scene === 'worldMap' && <WorldMapScene />}
          {scene === 'worldSelect' && <WorldSelectScene />}
          {scene === 'town' && <TownScene />}
          {scene === 'dungeon' && <DungeonScene />}
          {scene === 'arena' && <ArenaScene />}
          {scene === 'battle' && <BattleScene />}
          {scene === 'gameOver' && <GameOverScene />}
          {scene === 'worldClear' && <WorldClearScene />}
          <OverlayHost />
          <AudioManager />
        </div>
      </NotificationProvider></VersionGate>
    </AppErrorBoundary>
  );
}
