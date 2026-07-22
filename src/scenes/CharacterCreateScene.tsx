import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';
import { Window } from '@/components/ui/Window';

const HEADS = ['♙', '♘', '♗', '♕'] as const;

export function CharacterCreateScene() {
  const createPlayerAvatar = useGameStore((state) => state.createPlayerAvatar);
  const [name, setName] = useState('');
  const [headStyle, setHeadStyle] = useState<1 | 2 | 3 | 4>(1);

  return (
    <main className="character-create-scene">
      <Window title="RESTORER CREATION" className="character-create-card">
        <div className="character-create-sigil">{HEADS[headStyle - 1]}</div>
        <div className="small accent">Bibliotheca 登録の儀</div>
        <p className="small">失われた物語へ入る、あなたの修復者を登録します。</p>
        <label className="character-create-field">
          <span>名前</span>
          <input value={name} maxLength={12} placeholder="Reader" onChange={(event) => setName(event.target.value)} />
        </label>
        <div className="small">外見（ヘッド）</div>
        <div className="character-create-heads" role="radiogroup" aria-label="外見">
          {HEADS.map((icon, index) => {
            const value = (index + 1) as 1 | 2 | 3 | 4;
            return <button key={icon} className={headStyle === value ? 'is-selected' : ''} onClick={() => setHeadStyle(value)}>{icon}</button>;
          })}
        </div>
        <div className="tiny dim">身体素質は、仕様書に従い司書（女神役）が決定します。</div>
        <Button primary center onClick={() => createPlayerAvatar({ name, headStyle })}>物語へ入る</Button>
      </Window>
    </main>
  );
}
