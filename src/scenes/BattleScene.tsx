import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useBattleStore } from '@/store/useBattleStore';
import { getCharacter, getEnemy, getSkill, STORE_ITEMS } from '@/data';
import { Button } from '@/components/ui/Button';
import { Window } from '@/components/ui/Window';
import { Gauge } from '@/components/ui/Gauge';
import { Sprite } from '@/components/ui/Sprite';
import { playBattleSfx, preloadBattleSfx } from '@/audio/sfx';
import type { BattleFeedbackKind, Combatant } from '@/engine/battle';
import { gainExp } from '@/engine/leveling';
import { meterPercent } from '@/engine/tragicFlaw';
import beowulfAttackField from '@/assets/battle/beowulf-attack-field.png';
import hamletAttackField from '@/assets/battle/hamlet-attack-field.png';
import macbethAttackField from '@/assets/battle/macbeth-attack-field.png';
import gulliverBattleField from '@/assets/battle/gulliver-battle-field-v1.png';
import crusoeBattleField from '@/assets/battle/crusoe-battle-field-v1.png';
import marinerBattleField from '@/assets/battle/mariner-battle-field-v1.png';
import frankensteinBattleField from '@/assets/battle/frankenstein-battle-field-v1.png';
import aliceBattleField from '@/assets/battle/alice-battle-field-v1.png';
import holmesBattleField from '@/assets/battle/holmes-battle-field-v1.png';
import draculaBattleField from '@/assets/battle/dracula-battle-field-v1.png';
import dallowayBattleField from '@/assets/battle/dalloway-battle-field-v1.png';
import nineteen84BattleField from '@/assets/battle/nineteen84-battle-field-v1.png';

type Mode = 'command' | 'skill' | 'item' | 'target';

interface FloatingBattleText {
  id: string;
  targetUid: string;
  text: string;
  kind: BattleFeedbackKind;
  slot: number;
}

const ATTACK_FIELDS: Record<string, string> = {
  Beowulf: beowulfAttackField,
  Hamlet: hamletAttackField,
  Macbeth: macbethAttackField,
};

const BATTLE_FIELDS_BY_WORLD: Record<string, string> = {
  beowulf: beowulfAttackField,
  hamlet: hamletAttackField,
  macbeth: macbethAttackField,
  gulliver: gulliverBattleField,
  crusoe: crusoeBattleField,
  mariner: marinerBattleField,
  frankenstein: frankensteinBattleField,
  alice: aliceBattleField,
  holmes: holmesBattleField,
  dracula: draculaBattleField,
  dalloway: dallowayBattleField,
  nineteen84: nineteen84BattleField,
};

export function BattleScene() {
  const { combatants, log, phase, currentActor, chooseCommand, lastAction } = useBattleStore();
  const { onBattleWon, onBattleLost, save, consumeItem } = useGameStore();
  const [mode, setMode] = useState<Mode>('command');
  const [pendingSkillId, setPendingSkillId] = useState<string | null>(null);
  const [modeActorUid, setModeActorUid] = useState<string | null>(null);
  const [targetActorUid, setTargetActorUid] = useState<string | null>(null);
  const [actionPoseUid, setActionPoseUid] = useState<string | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingBattleText[]>([]);
  const [battleRewardLines, setBattleRewardLines] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const processedLogCount = useRef(0);
  const floatingTimeouts = useRef<number[]>([]);
  const rewardFeedbackShown = useRef(false);
  const enemies = combatants.filter((c) => c.side === 'enemy');
  const allies = combatants.filter((c) => c.side === 'ally');
  const actor = phase === 'input' ? currentActor() : undefined;
  const actionActor = combatants.find((combatant) => combatant.uid === actionPoseUid);
  const actionField = actionActor ? ATTACK_FIELDS[actionActor.name] : undefined;
  const battlefieldWorld = enemies[0] ? getEnemy(enemies[0].sourceId).worldId : 'beowulf';
  const battlefieldImage = BATTLE_FIELDS_BY_WORLD[battlefieldWorld] ?? beowulfAttackField;
  // actor が切り替わった瞬間は、前の仲間のターゲット選択画面を絶対に引き継がない。
  const visibleMode: Mode = modeActorUid === actor?.uid ? mode : 'command';

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log, battleRewardLines]);

  useEffect(() => {
    const nextEntries = log.slice(processedLogCount.current);
    processedLogCount.current = log.length;
    const events = nextEntries
      .map((entry) => entry.feedback)
      .filter((event): event is NonNullable<typeof event> => Boolean(event?.targetUid));
    if (events.length === 0) return;

    const nextTexts: FloatingBattleText[] = events
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .slice(0, 8)
      .map((event, index) => ({
        id: `${Date.now()}-${index}-${event.targetUid}`,
        targetUid: event.targetUid!,
        text: event.text,
        kind: event.kind,
        slot: index % 3,
      }));

    setFloatingTexts((current) => [...current.slice(-10), ...nextTexts]);
    const timeout = window.setTimeout(() => {
      setFloatingTexts((current) => current.filter((item) => !nextTexts.some((next) => next.id === item.id)));
    }, 1150);
    floatingTimeouts.current.push(timeout);
  }, [log]);

  useEffect(() => () => {
    floatingTimeouts.current.forEach((timeout) => window.clearTimeout(timeout));
  }, []);

  useEffect(() => {
    preloadBattleSfx();
  }, []);

  useEffect(() => {
    if (phase === 'input') {
      rewardFeedbackShown.current = false;
      setBattleRewardLines([]);
      setFloatingTexts([]);
      setMode('command');
      setPendingSkillId(null);
      setModeActorUid(actor?.uid ?? null);
      setTargetActorUid(null);
    }
  }, [phase, actor?.uid]);

  useEffect(() => {
    if (phase !== 'won' || rewardFeedbackShown.current) return;
    rewardFeedbackShown.current = true;

    const defeatedEnemies = enemies.filter((enemy) => !enemy.alive);
    if (!save || defeatedEnemies.length === 0 || allies.length === 0) return;

    const totalExp = defeatedEnemies.reduce((sum, enemy) => sum + getEnemy(enemy.sourceId).exp, 0);
    const totalGold = defeatedEnemies.reduce((sum, enemy) => {
      const data = getEnemy(enemy.sourceId);
      return sum + (data.gold ?? Math.max(4, Math.floor(data.exp / 3)));
    }, 0);
    const firstAlly = allies.find((ally) => ally.alive) ?? allies[0];
    const lines: string[] = [];
    const rewardTexts: FloatingBattleText[] = [];
    const now = Date.now();

    if (totalExp > 0) {
      lines.push(`EXP +${totalExp}`);
      rewardTexts.push({
        id: `${now}-reward-exp`,
        targetUid: firstAlly.uid,
        text: `EXP +${totalExp}`,
        kind: 'exp',
        slot: 0,
      });
    }
    if (totalGold > 0) {
      lines.push(`Gold +${totalGold}`);
      rewardTexts.push({
        id: `${now}-reward-gold`,
        targetUid: firstAlly.uid,
        text: `Gold +${totalGold}`,
        kind: 'gold',
        slot: 1,
      });
    }

    allies.forEach((ally, index) => {
      if (!ally.alive) return;
      const owned = save.party.find((member) => member.characterId === ally.sourceId);
      if (!owned) return;
      const result = gainExp({ ...owned, currentHp: ally.hp, currentMp: ally.mp }, getCharacter(owned.characterId), totalExp);
      if (!result.leveledUp) return;
      const message = `${ally.name} Level Up!`;
      lines.push(message);
      rewardTexts.push({
        id: `${now}-reward-level-${ally.uid}`,
        targetUid: ally.uid,
        text: 'Level Up!',
        kind: 'level',
        slot: (index + 2) % 3,
      });
    });

    setBattleRewardLines(lines);
    setFloatingTexts((current) => [...current.slice(-10), ...rewardTexts]);
    const timeout = window.setTimeout(() => {
      setFloatingTexts((current) => current.filter((item) => !rewardTexts.some((next) => next.id === item.id)));
    }, 1500);
    floatingTimeouts.current.push(timeout);
  }, [phase, enemies, allies, save]);

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
      playBattleSfx(command.type);
      setMode('command');
      setPendingSkillId(null);
      setModeActorUid(null);
      setTargetActorUid(null);
    }
    return accepted;
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

  const flawChip = (combatant: Combatant) => {
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
              <Sprite label={a.name} side="ally" size="lg" pose={!a.alive ? 'hurt' : actionPoseUid === a.uid ? 'attack' : 'idle'} facing="right" faint={!a.alive} />
              <BattleFloatingTexts effects={floatingTexts.filter((effect) => effect.targetUid === a.uid)} />
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
              <Sprite label={e.name} side="enemy" size="lg" pose={!e.alive ? 'hurt' : actionPoseUid === e.uid ? 'attack' : 'idle'} facing="left" faint={!e.alive} />
              <BattleFloatingTexts effects={floatingTexts.filter((effect) => effect.targetUid === e.uid)} />
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
                {(() => {
                  const character = getCharacter(a.sourceId);
                  return (
                    <div className="battle-role-line">
                      <span>{character.role ?? 'Adventurer'}</span>
                      {character.tragicFlaw && <b>宿命: {character.tragicFlaw.theme}</b>}
                    </div>
                  );
                })()}
                {flawChip(a)}
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
                  <span className="spacer" /><span className="dim tiny">MP {skill.mpCost} / {skill.description}</span>
                </Button>
              ))}
              <Button onClick={() => { setMode('command'); setModeActorUid(actor.uid); }}>もどる</Button>
            </div>
          )}
          {phase === 'input' && actor && visibleMode === 'item' && (
            <div className="menu-list battle-menu-list">
              {Object.values(STORE_ITEMS).filter((item) => item.skillId).map((item) => {
                const faintedAlly = allies.find((ally) => !ally.alive);
                const count = save?.items[item.id] ?? 0;
                const disabled = count <= 0 || (item.skillId === 'phoenix_page' && !faintedAlly);
                return (
                  <Button key={item.id} disabled={disabled} onClick={() => {
                    if (!item.skillId) return;
                    const command = item.skillId === 'phoenix_page'
                      ? { type: 'skill' as const, skillId: item.skillId, targetUid: faintedAlly?.uid }
                      : { type: 'skill' as const, skillId: item.skillId };
                    if (submitCommand(command)) consumeItem(item.id);
                  }}>
                    <span>{item.name} ×{count}</span><span className="spacer" /><span className="dim tiny">{item.description}</span>
                  </Button>
                );
              })}
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
        {[...log.map((entry) => entry.text), ...battleRewardLines].slice(-8).map((entry, index) => <div key={`${entry}-${index}`}>{entry}</div>)}
      </div>
    </div>
  );
}

function BattleFloatingTexts({ effects }: { effects: FloatingBattleText[] }) {
  if (effects.length === 0) return null;
  return (
    <div className="battle-floating-texts" aria-hidden="true">
      {effects.map((effect) => (
        <span
          key={effect.id}
          className={`battle-floating-text battle-floating-text--${effect.kind} battle-floating-text--slot-${effect.slot}`}
        >
          {effect.text}
        </span>
      ))}
    </div>
  );
}
