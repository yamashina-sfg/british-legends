import { useGameStore } from '@/store/useGameStore';
import { getCharacter } from '@/data';
import { statsAtLevel } from '@/engine/leveling';
import { checkEvolution } from '@/engine/evolution';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';
import { Gauge } from '@/components/ui/Gauge';
import { Sprite } from '@/components/ui/Sprite';
import { ACTIVE_PARTY_LIMIT, getActivePartyIds } from '@/engine/party';

export function PartyOverlay() {
  const { save, openOverlay, closeOverlay, toggleActiveParty } = useGameStore();
  if (!save) return null;
  const activeIds = getActivePartyIds(save);

  return (
    <Window title="パーティ編成" className="party-formation-overlay">
      <div className="party-formation-summary">
        <strong>出撃メンバー</strong>
        <span>{activeIds.length} / {ACTIVE_PARTY_LIMIT}</span>
        <small>戦闘に参加できる仲間は3人まで。控えは経験値を得ず、拠点で待機します。</small>
      </div>

      <div className="party-active-slots" aria-label="現在の出撃メンバー">
        {Array.from({ length: ACTIVE_PARTY_LIMIT }).map((_, slotIndex) => {
          const characterId = activeIds[slotIndex];
          const member = characterId ? save.party.find((p) => p.characterId === characterId) : undefined;
          const char = member ? getCharacter(member.characterId) : undefined;
          return (
            <div key={slotIndex} className={`party-active-slot ${member ? 'is-filled' : ''}`}>
              <span>出撃 {slotIndex + 1}</span>
              {member && char ? (
                <>
                  <Sprite label={char.name} side="ally" size="md" faint={member.currentHp <= 0} />
                  <strong>{char.name}</strong>
                  <small>Lv{member.level}</small>
                </>
              ) : (
                <em>空き</em>
              )}
            </div>
          );
        })}
      </div>

      {save.party.length === 0 && <div className="dim small">まだ仲間がいない。</div>}
      <div className="party-roster">
        {save.party.map((p, i) => {
          const char = getCharacter(p.characterId);
          const stats = statsAtLevel(char, p.level);
          const evo = checkEvolution(p, char, save.inventory);
          const isActive = activeIds.includes(p.characterId);
          const canJoin = isActive || activeIds.length < ACTIVE_PARTY_LIMIT;
          return (
            <div key={i} className={`party-member-card ${isActive ? 'is-active' : ''}`}>
              <div className="party-member-main">
                <Sprite label={char.name} side="ally" size="sm" faint={p.currentHp <= 0} />
                <div className="party-member-info">
                  <div className="party-member-name">
                    <strong>{char.name}</strong>
                    <span>Lv{p.level}</span>
                  </div>
                  <div className="tiny dim">{char.stageName}</div>
                  <div className="tiny accent">
                    {char.role ?? 'Adventurer'}{char.tragicFlaw ? ` / 宿命: ${char.tragicFlaw.name}` : ''}
                  </div>
                  <Gauge value={p.currentHp} max={stats.hp} type="hp" />
                  <div className="party-member-tags">
                    {isActive && <span>出撃中</span>}
                    {evo.canEvolve && <span>進化可能</span>}
                  </div>
                </div>
                <div className="party-member-actions">
                  <Button disabled={!canJoin} onClick={() => toggleActiveParty(i)}>
                    {isActive ? '控えへ' : activeIds.length >= ACTIVE_PARTY_LIMIT ? '満員' : '出撃'}
                  </Button>
                  <Button onClick={() => openOverlay('character', i)}>詳細</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Button center onClick={closeOverlay}>
        とじる
      </Button>
    </Window>
  );
}
