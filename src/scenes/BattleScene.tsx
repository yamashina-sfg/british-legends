import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useBattleStore } from '@/store/useBattleStore';
import { getEnemy, getSkill, STORE_ITEMS } from '@/data';
import { Button } from '@/components/ui/Button';
import { Window } from '@/components/ui/Window';
import { Gauge } from '@/components/ui/Gauge';
import { Sprite } from '@/components/ui/Sprite';
import type { Combatant } from '@/engine/battle';
import { meterPercent } from '@/engine/tragicFlaw';
import beowulfAttackField from '@/assets/battle/beowulf-attack-field.png';
import hamletAttackField from '@/assets/battle/hamlet-attack-field.png';
import macbethAttackField from '@/assets/battle/macbeth-attack-field.png';

type Mode = 'command' | 'skill' | 'item' | 'target';

const ATTACK_FIELDS: Record<string, string> = {
  Beowulf: beowulfAttackField,
  Hamlet: hamletAttackField,
  Macbeth: macbethAttackField,
};

export function BattleScene() {
  const { combatants, log, phase, currentActor, chooseCommand, lastAction } = useBattleStore();
  const { onBattleWon, onBattleLost, save, consumeItem } = useGameStore();
  const [mode, setMode] = useState<Mode>('command');
  const [pendingSkillId, setPendingSkillId] = useState<string | null>(null);
  const [modeActorUid, setModeActorUid] = useState<string | null>(null);
  const [targetActorUid, setTargetActorUid] = useState<string | null>(null);
  const [actionPoseUid, setActionPoseUid] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const enemies = combatants.filter((c) => c.side === 'enemy');
  const allies = combatants.filter((c) => c.side === 'ally');
  const actor = phase === 'input' ? currentActor() : undefined;
  const actionActor = combatants.find((combatant) => combatant.uid === actionPoseUid);
  const actionField = actionActor ? ATTACK_FIELDS[actionActor.name] : undefined;
  const battlefieldWorld = enemies[0] ? getEnemy(enemies[0].sourceId).worldId : 'beowulf';
  const battlefieldImage = ATTACK_FIELDS[battlefieldWorld === 'beowulf' ? 'Beowulf' : battlefieldWorld === 'hamlet' ? 'Hamlet' : 'Macbeth'];
  // actor が切り替わった瞬間は、前の仲間のターゲット選択画面を絶対に引き継がない。
  const visibleMode: Mode = modeActorUid === actor?.uid ? mode : 'command';

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  useEffect(() => {
    if (phase === 'input') {
      setMode('command');
      setPendingSkillId(null);
      setModeActorUid(actor?.uid ?? null);
      setTargetActorUid(null);
    }
  }, [phase, actor?.uid]);

  useEffect(() => {
    if (!lastAction) return;
    setActionPoseUid(lastAction.actorUid);
    const timeout = window.setTimeout(() => setActionPoseUid(null), 760);
    return () => window.clearTimeout(timeout);
  }, [lastAction]);

  const submitCommand = (command: Parameters<typeof chooseCommand>[1]) => {
    if (!actor) return false;
    const accepted = chooseCommand(actor.uid, command);
    if (accepted) {
      setMode('command');
      setPendingSkillId(null);
      setModeActorUid(null);
      setTargetActorUid(null);
    }
    return accepted;
  };

  const flawLine = (combatant: Combatant) => {
    const runtime = combatant.tragicFlaw;
    if (!runtime) return null;
    const meter = meterPercent(runtime);
    return (
      <div className="tragic-flaw-chip" title={runtime.flaw.description}>
        <span className="tragic-flaw-chip__icon">{runtime.flaw.icon}</span>
        <span>{runtime.flaw.theme}</span>
        {meter !== null && <span className="tragic-flaw-chip__meter">{runtime.flaw.meter?.label} {meter}%</span>}
      </div>
    );
  };

  const onSelectTarget = (target: Combatant) => {
    // ターゲットを開いた仲間以外の入力は、連打や描画更新中でも受け付けない。
    if (!actor || targetActorUid !== actor.uid) return;
    if (pendingSkillId) submitCommand({ type: 'skill', skillId: pendingSkillId, targetUid: target.uid });
    else submitCommand({ type: 'attack', targetUid: target.uid });
  };

  const onPickSkill = (skillId: string) => {
    const skill = getSkill(skillId);
    if (skill.target === 'single') {
      setPendingSkillId(skillId);
      setMode('target');
      setModeActorUid(actor?.uid ?? null);
      setTargetActorUid(actor?.uid ?? null);
    } else submitCommand({ type: 'skill', skillId });
  };

  return (
    <div className="battle-scene fade-in">
      <div className={`battle-arena battle-arena--${battlefieldWorld}`} aria-label="battlefield">
        <div className="battle-field-backdrop" style={{ backgroundImage: `url(${battlefieldImage})` }} />
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
        {actionField && <div className="battle-action-backdrop" style={{ backgroundImage: `url(${actionField})` }} />}
        <div className="battle-allies">
          {allies.map((a) => (
            <div key={a.uid} className={`battle-unit battle-unit--ally ${!a.alive ? 'is-fainted' : ''}`}>
              <Sprite label={a.name} side="ally" size="lg" pose={!a.alive ? 'hurt' : actionPoseUid === a.uid ? 'attack' : 'idle'} faint={!a.alive} />
              <span>{a.name}</span>
            </div>
          ))}
        </div>
        <div className="battle-enemies">
          {enemies.map((e) => (
            <button
              key={e.uid}
              type="button"
              disabled={!e.alive || visibleMode !== 'target' || phase !== 'input' || targetActorUid !== actor?.uid}
              onClick={() => onSelectTarget(e)}
              className={`battle-unit battle-unit--enemy ${!e.alive ? 'is-fainted' : ''} ${visibleMode === 'target' && e.alive ? 'is-targetable' : ''}`}
            >
              <Sprite label={e.name} side="enemy" size="lg" pose={!e.alive ? 'hurt' : 'idle'} faint={!e.alive} />
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
                {flawLine(a)}
                <div className="battle-stat-line"><span>HP {a.hp}/{a.maxHp}</span><Gauge value={a.hp} max={a.maxHp} type="hp" /></div>
                <div className="battle-stat-line"><span>MP {a.mp}/{a.maxMp}</span><Gauge value={a.mp} max={a.maxMp} type="mp" /></div>
              </div>
            ))}
          </div>
        </Window>

        <Window className="battle-command-window" title={phase === 'input' && actor ? `${actor.name} のコマンド` : 'BATTLE'}>
          {phase === 'input' && actor?.tragicFlaw && (
            <div className="tragic-flaw-panel">
              <div className="row">
                <span className="tragic-flaw-panel__icon">{actor.tragicFlaw.flaw.icon}</span>
                <strong>{actor.tragicFlaw.flaw.theme}</strong>
                <span className="spacer" />
                <span className="tiny dim">{actor.tragicFlaw.flaw.activeSkill.name}</span>
              </div>
              <div className="tiny dim">{actor.tragicFlaw.flaw.battleTrait.description}</div>
            </div>
          )}
          {phase === 'input' && actor && visibleMode === 'command' && (
            <div className="battle-command-grid">
              <Button onClick={() => { setMode('target'); setModeActorUid(actor.uid); setTargetActorUid(actor.uid); }}>▶ たたかう</Button>
              <Button onClick={() => { setMode('skill'); setModeActorUid(actor.uid); }}>とくぎ</Button>
              <Button onClick={() => { setMode('item'); setModeActorUid(actor.uid); }}>どうぐ</Button>
              <Button onClick={() => submitCommand({ type: 'defend' })}>ぼうぎょ</Button>
            </div>
          )}
          {phase === 'input' && actor && visibleMode === 'skill' && (
            <div className="menu-list battle-menu-list">
              {actor.skillIds.filter((id) => id !== 'attack_basic').map(getSkill).map((skill) => (
                <Button key={skill.id} disabled={actor.mp < skill.mpCost} onClick={() => onPickSkill(skill.id)}>
                  <span>{skill.name}</span>
                  {actor.tragicFlaw?.flaw.activeSkill.skillId === skill.id && <span className="tragic-skill-mark">宿命</span>}
                  <span className="spacer" /><span className="dim tiny">MP {skill.mpCost}</span>
                </Button>
              ))}
              <Button onClick={() => { setMode('command'); setModeActorUid(actor.uid); }}>もどる</Button>
            </div>
          )}
          {phase === 'input' && actor && visibleMode === 'item' && (
            <div className="menu-list battle-menu-list">
              {Object.values(STORE_ITEMS).filter((item) => item.skillId).map((item) => (
                <Button key={item.id} disabled={(save?.items[item.id] ?? 0) <= 0} onClick={() => {
                  if (item.skillId && submitCommand({ type: 'skill', skillId: item.skillId })) consumeItem(item.id);
                }}>
                  <span>{item.name} ×{save?.items[item.id] ?? 0}</span><span className="spacer" /><span className="dim tiny">{item.description}</span>
                </Button>
              ))}
              <Button onClick={() => { setMode('command'); setModeActorUid(actor.uid); }}>もどる</Button>
            </div>
          )}
          {phase === 'input' && actor && visibleMode === 'target' && (
            <div className="menu-list battle-menu-list">
              <div className="tiny dim">敵を選択してください</div>
              <Button onClick={() => { setMode(pendingSkillId ? 'skill' : 'command'); setPendingSkillId(null); setModeActorUid(actor.uid); setTargetActorUid(null); }}>もどる</Button>
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
