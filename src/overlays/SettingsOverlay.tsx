import { useGameStore } from '@/store/useGameStore';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';

export function SettingsOverlay() {
  const { closeOverlay, persist, goTitle } = useGameStore();

  return (
    <Window title="設定" className="col">
      <Button
        center
        onClick={() => {
          persist();
          closeOverlay();
          alert('セーブしました。');
        }}
      >
        いまセーブする
      </Button>
      <Button
        center
        onClick={() => {
          if (confirm('タイトルに戻りますか？（進行は自動セーブ済み）')) {
            persist();
            goTitle();
          }
        }}
      >
        タイトルに戻る
      </Button>
      <div className="tiny dim center" style={{ lineHeight: 1.7 }}>
        進行は戦闘・進化のたびに自動セーブされます。
      </div>
      <Button center onClick={closeOverlay}>
        とじる
      </Button>
    </Window>
  );
}
