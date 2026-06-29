import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';
import { Window } from '@/components/ui/Window';
import { listSlots, SAVE_SLOTS } from '@/engine/save';

export function SaveSelectScene() {
  const { newGame, continueGame, eraseGame, goTitle, replayOpening } = useGameStore();
  const [, force] = useState(0);
  const slots = listSlots();

  const formatDate = (ts: number) => new Date(ts).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className="scene fade-in">
      <div className="scene-header">セーブ選択</div>
      <div className="menu-list">
        {SAVE_SLOTS.map((id, i) => {
          const data = slots[i];
          return (
            <Window key={id} className="col">
              <div className="row">
                <strong>スロット {id}</strong>
                <span className="spacer" />
                {data && <span className="tiny dim">{formatDate(data.lastSavedAt)}</span>}
              </div>
              {data ? (
                <>
                  <div className="small dim">
                    仲間 {data.party.length}人 ／ クリア {data.progress.clearedWorldIds.length}作品
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <Button primary onClick={() => continueGame(id)}>
                      つづきから
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm(`スロット${id}のデータを消去しますか？`)) {
                          eraseGame(id);
                          force((n) => n + 1);
                        }
                      }}
                      style={{ width: 'auto' }}
                    >
                      消去
                    </Button>
                    <Button onClick={() => replayOpening(id)} style={{ width: 'auto' }}>
                      Opening
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="small dim">― 空きスロット ―</div>
                  <Button onClick={() => newGame(id)}>はじめから</Button>
                </>
              )}
            </Window>
          );
        })}
      </div>
      <Button center onClick={goTitle}>
        もどる
      </Button>
    </div>
  );
}
