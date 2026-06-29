import { useGameStore } from '@/store/useGameStore';
import { getCharacter, getEnemy, getWorld } from '@/data';
import { statsWithEquipment } from '@/engine/equipment';
import { checkEvolution } from '@/engine/evolution';
import { Button } from '@/components/ui/Button';

/** ボスマスに対峙した時の「準備を促す」確認モーダル。 */
export function BossPrompt() {
  const { bossPrompt, save, worldId, confirmBossBattle, cancelBossPrompt, retreatToLodge } = useGameStore();
  if (!bossPrompt || !save || !worldId) return null;

  const world = getWorld(worldId);
  const bossId = bossPrompt.enemyIds[0];
  const boss = bossId ? getEnemy(bossId) : null;

  const party = save.party;
  const totalHp = party.reduce((s, p) => s + statsWithEquipment(getCharacter(p.characterId), p).hp, 0);
  const curHp = party.reduce((s, p) => s + Math.max(0, p.currentHp), 0);
  const hpPct = totalHp ? Math.round((curHp / totalHp) * 100) : 0;
  const fainted = party.filter((p) => p.currentHp <= 0).length;
  const topLevel = party.reduce((m, p) => Math.max(m, p.level), 1);
  const canEvolveAny = party.some((p) => checkEvolution(p, getCharacter(p.characterId), save.inventory).canEvolve);

  const warnings: string[] = [];
  if (fainted > 0) warnings.push(`倒れた仲間が ${fainted} 人。Lodgeのベッドで回復させたい。`);
  if (hpPct < 60) warnings.push(`パーティのHPが ${hpPct}%。回復してから挑むのが安全だ。`);
  if (canEvolveAny) warnings.push('進化できる仲間がいる。机で強化してから挑める。');
  if (topLevel < world.recommendedLevel) warnings.push(`推奨Lv${world.recommendedLevel} に対していまLv${topLevel}。鍛えると安定する。`);
  const ready = warnings.length === 0;

  return (
    <div className="overlay-backdrop fade-in" onClick={cancelBossPrompt}>
      <div className="boss-prompt rpg-window" onClick={(e) => e.stopPropagation()}>
        <div className="boss-prompt__crest">⚔</div>
        <div className="boss-prompt__title">最深部の主</div>
        <strong className="boss-prompt__name">{boss?.name ?? 'ボス'}</strong>
        <p className="boss-prompt__desc">{world.title}の物語を縛る存在が、この先で待っている。</p>

        <div className={`boss-prompt__status ${ready ? 'is-ready' : 'is-warning'}`}>
          <span>準備状況</span>
          <strong>HP {hpPct}% ／ 最高Lv {topLevel}</strong>
          {ready ? (
            <small>準備は万端のようだ。挑むがいい。</small>
          ) : (
            <ul>
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="boss-prompt__actions">
          <Button primary center onClick={confirmBossBattle}>
            ボスに挑む
          </Button>
          <Button center onClick={retreatToLodge}>
            Lodgeへ退いて備える
          </Button>
          <Button center onClick={cancelBossPrompt}>
            まだ探索する
          </Button>
        </div>
      </div>
    </div>
  );
}
