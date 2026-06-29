import { useGameStore } from '@/store/useGameStore';
import { getCharacter, getWorld, WORLDS } from '@/data';
import { Button } from '@/components/ui/Button';
import { Window } from '@/components/ui/Window';
import { Sprite } from '@/components/ui/Sprite';

const RESTORATION_EVENTS: Record<string, { title: string; lines: string[]; fragment: string }> = {
  beowulf: {
    title: '黒い余白',
    lines: [
      '竜の炎が消えたあと、写本の端に黒い余白が残った。',
      '司書: これは破損ではありません。誰かが、この物語を「なかったこと」にしようとしている。',
      '余白には、ただ一語だけが浮かぶ。Oblivion。',
    ],
    fragment: '物語の断片: 黒い余白',
  },
  hamlet: {
    title: '検閲官の印',
    lines: [
      '王冠が砕けると、城の壁から赤い封蝋が剥がれ落ちた。',
      '司書: The Censor。悲劇の問いを消し、答えだけを残す者たちです。',
      'Hamletは黙って剣を収めた。次の物語にも、同じ印がある。',
    ],
    fragment: '物語の断片: 検閲官の印',
  },
  macbeth: {
    title: '消された結末',
    lines: [
      '血の霧が晴れると、最後のページだけが燃えずに残っていた。',
      '司書: Oblivionは英雄も王も、選択の痕跡ごと消します。',
      '残された灰は、まだ書かれていない最終章へ流れていく。',
    ],
    fragment: '物語の断片: 消された結末',
  },
};

export function WorldClearScene() {
  const { save, newlyJoinedCharacterId, openLodge } = useGameStore();
  if (!save) return null;

  const clearedId = save.progress.currentWorldId;
  const world = clearedId ? WORLDS[clearedId] : null;
  const event = clearedId ? RESTORATION_EVENTS[clearedId] : null;
  const joined = newlyJoinedCharacterId ? getCharacter(newlyJoinedCharacterId) : null;

  // 新たに解放された世界
  const newlyUnlocked = save.progress.unlockedWorldIds
    .filter((id) => !save.progress.clearedWorldIds.includes(id) && id !== clearedId)
    .map((id) => getWorld(id));

  return (
    <div className="scene fade-in center" style={{ justifyContent: 'center', alignItems: 'center', gap: 18 }}>
      <h1 style={{ fontSize: 24, color: 'var(--accent)', letterSpacing: 2 }}>WORLD RESTORED</h1>
      {world && <div className="small dim">『{world.title}』の世界を修復した！</div>}

      {event && (
        <Window title={event.title} className="world-clear-story">
          {event.lines.map((line) => <p key={line}>{line}</p>)}
          <strong>{event.fragment} を図鑑に記録した。</strong>
        </Window>
      )}

      {joined && (
        <Window title="仲間が加わった！" className="center col" >
          <div className="row" style={{ justifyContent: 'center' }}>
            <Sprite label={joined.name} side="ally" size="lg" />
          </div>
          <div className="accent" style={{ marginTop: 8 }}>
            {joined.name}（{joined.stageName}）
          </div>
        </Window>
      )}

      {newlyUnlocked.length > 0 && (
        <div className="small">
          新たな世界が解放された：
          <span className="accent"> {newlyUnlocked.map((w) => w.title).join('、')}</span>
        </div>
      )}

      <div style={{ width: '70%', marginTop: 10 }}>
        <Button primary center onClick={openLodge}>
          Lodgeへ帰る
        </Button>
      </div>
    </div>
  );
}
