import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useBattleStore } from '@/store/useBattleStore';
import { getSkill, STORE_ITEMS } from '@/data';
import { Button } from '@/components/ui/Button';
import { Window } from '@/components/ui/Window';
import { Gauge } from '@/components/ui/Gauge';
import { Sprite } from '@/components/ui/Sprite';
import type { Combatant } from '@/engine/battle';

type Mode = 'command' | 'skill' | 'item' | 'target';

export function BattleScene() {
  const { combatants, log, phase, currentActor, chooseCommand } = useBattleStore();
  const { onBattleWon, onBattleLost, save, consumeItem } = useGameStore();
  const [mode, setMode] = useState<Mode>('command');
  const [pendingSkillId, setPendingSkillId] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const enemies = combatants.filter((c) => c.side === 'enemy');
  const allies = combatants.filter((c) => c.side === 'ally');
  const actor = phase === 'input' ? currentActor() : undefined;

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  useEffect(() => {
    if (phase === 'input') {
      setMode('command');
      setPendingSkillId(null);
    }
  }, [phase, actor?.uid]);

  const onSelectTarget = (target: Combatant) => {
    if (pendingSkillId) chooseCommand({ type: 'skill', skillId: pendingSkillId, targetUid: target.uid });
    else chooseCommand({ type: 'attack', targetUid: target.uid });
  };

  const onPickSkill = (skillId: string) => {
    const skill = getSkill(skillId);
    if (skill.target === 'single') {
      setPendingSkillId(skillId);
      setMode('target');
    } else chooseCommand({ type: 'skill', skillId });
  };

  return (
    <div className="battle-scene fade-in">
      <div className="battle-arena" aria-label="battlefield">
        <div className="battle-arena__sky" />
        <div className="battle-arena__ink-cloud battle-arena__ink-cloud--one" />
        <div className="battle-arena__ink-cloud battle-arena__ink-cloud--two" />
        <div className="battle-arena__mountains" />
        <div className="battle-arena__forest" />
        <div className="battle-arena__road" />
        <div className="battle-arena__ruin battle-arena__ruin--one" />
        <div className="battle-arena__ruin battle-arena__ruin--two" />
        <div className="battle-arena__back-plateau" />
        <div className="battle-arena__front-plateau" />
        <div className="battle-allies">
          {allies.map((a) => (
            <div key={a.uid} className={`battle-unit battle-unit--ally ${!a.alive ? 'is-fainted' : ''}`}>
              <Sprite label={a.name} side="ally" size="lg" faint={!a.alive} />
              <span>{a.name}</span>
            </div>
          ))}
        </div>
        <div className="battle-enemies">
          {enemies.map((e) => (
            <button
              key={e.uid}
              type="button"
              disabled={!e.alive || mode !== 'target' || phase !== 'input'}
              onClick={() => onSelectTarget(e)}
              className={`battle-unit battle-unit--enemy ${!e.alive ? 'is-fainted' : ''} ${mode === 'target' && e.alive ? 'is-targetable' : ''}`}
            >
              <Sprite label={e.name} side="enemy" size="lg" faint={!e.alive} />
              <span>{e.name}</span>
              {e.alive && <Gauge value={e.hp} max={e.maxHp} type="hp" />}
            </button>
          ))}
        </div>
      </div>

      <div className="battle-hud">
        <Window className="battle-status-window">
          <div className="battle-status-list">
            {allies.map((a) => (
              <div key={a.uid} className={`battle-status ${!a.alive ? 'is-fainted' : ''}`}>
                <div className="row"><strong>{a.name}</strong><span className="spacer" />{actor?.uid === a.uid && phase === 'input' && <span className="cursor">▶</span>}</div>
                <div className="battle-stat-line"><span>HP {a.hp}/{a.maxHp}</span><Gauge value={a.hp} max={a.maxHp} type="hp" /></div>
                <div className="battle-stat-line"><span>MP {a.mp}/{a.maxMp}</span><Gauge value={a.mp} max={a.maxMp} type="mp" /></div>
              </div>
            ))}
          </div>
        </Window>

        <Window className="battle-command-window" title={phase === 'input' && actor ? `${actor.name} のコマンド` : 'BATTLE'}>
          {phase === 'input' && actor && mode === 'command' && (
            <div className="battle-command-grid">
              <Button onClick={() => setMode('target')}>▶ たたかう</Button>
              <Button onClick={() => setMode('skill')}>とくぎ</Button>
              <Button onClick={() => setMode('item')}>どうぐ</Button>
              <Button onClick={() => chooseCommand({ type: 'defend' })}>ぼうぎょ</Button>
            </div>
          )}
          {phase === 'input' && actor && mode === 'skill' && (
            <div className="menu-list battle-menu-list">
              {actor.skillIds.filter((id) => id !== 'attack_basic').map(getSkill).map((skill) => (
                <Button key={skill.id} disabled={actor.mp < skill.mpCost} onClick={() => onPickSkill(skill.id)}>
                  <span>{skill.name}</span><span className="spacer" /><span className="dim tiny">MP {skill.mpCost}</span>
                </Button>
              ))}
              <Button onClick={() => setMode('command')}>もどる</Button>
            </div>
          )}
          {phase === 'input' && actor && mode === 'item' && (
            <div className="menu-list battle-menu-list">
              {Object.values(STORE_ITEMS).filter((item) => item.skillId).map((item) => (
                <Button key={item.id} disabled={(save?.items[item.id] ?? 0) <= 0} onClick={() => {
                  if (consumeItem(item.id) && item.skillId) chooseCommand({ type: 'skill', skillId: item.skillId });
                }}>
                  <span>{item.name} ×{save?.items[item.id] ?? 0}</span><span className="spacer" /><span className="dim tiny">{item.description}</span>
                </Button>
              ))}
              <Button onClick={() => setMode('command')}>もどる</Button>
            </div>
          )}
          {phase === 'input' && mode === 'target' && (
            <div className="menu-list battle-menu-list">
              <div className="tiny dim">敵を選択してください</div>
              <Button onClick={() => { setMode(pendingSkillId ? 'skill' : 'command'); setPendingSkillId(null); }}>もどる</Button>
            </div>
          )}
          {phase === 'resolving' && <div className="center dim">敵の行動を見守る…</div>}
          {phase === 'won' && <Button primary center onClick={onBattleWon}>勝利を受け取る</Button>}
          {phase === 'lost' && <Button center onClick={onBattleLost}>退却する</Button>}
        </Window>
      </div>

      <div className="battle-log battle-message-window" ref={logRef}>
        {log.slice(-3).map((entry, index) => <div key={index}>{entry.text}</div>)}
      </div>
    </div>
  );
}
