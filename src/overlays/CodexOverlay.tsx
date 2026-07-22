import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { CODEX, getCharacter, getEnemy, getMaterial, getWorld, WORLDS } from '@/data';
import { CORE_WORLD_IDS, CORE_WORLD_META, LONG_TERM_FOUNDATIONS, type CoreWorldId } from '@/data/literaryProgress';
import type { CodexEntry, CodexType, SaveData } from '@/types';
import { Window } from '@/components/ui/Window';
import { Button } from '@/components/ui/Button';
import { Sprite } from '@/components/ui/Sprite';
import { enemyDefeatStatBonus, enemyResearchBenefit } from '@/engine/research';
import { ALBUM_WORLD_IDS, fragmentsForWorld, MANUSCRIPT_BLESSING_THRESHOLDS, manuscriptBlessingLevel, manuscriptStats, manuscriptWorldLevel } from '@/data/manuscripts';
import { petForEnemy } from '@/data/pets';

const TABS: { type: CodexType; label: string }[] = [
  { type: 'world', label: '作品' },
  { type: 'story', label: 'アルバム' },
  { type: 'character', label: '仲間' },
  { type: 'enemy', label: '魔物' },
];

const TAB_ICONS: Record<CodexType, string> = { world: '▤', story: '❖', character: '♟', enemy: '♜', material: '◆' };

export function CodexOverlay() {
  const { save, closeOverlay } = useGameStore();
  const [tab, setTab] = useState<CodexType>('world');
  const [albumIndex,setAlbumIndex]=useState(0);
  const [selectedEnemyId,setSelectedEnemyId]=useState<string|null>(null);
  if (!save) return null;

  const isDiscovered = (entry: CodexEntry): boolean => {
    switch (entry.type) {
      case 'world':
        return save.progress.unlockedWorldIds.includes(entry.refId);
      case 'enemy':
        return (save.defeatCounts?.[entry.refId]??0)>0||save.codex.discoveredIds.includes(entry.id);
      case 'character':
        return save.party.some(
          (p) => getCharacter(p.characterId).worldId === getCharacter(entry.refId).worldId,
        );
      case 'story':
        return save.codex.discoveredIds.includes(entry.id);
      default:
        return false;
    }
  };

  const titleOf = (entry: CodexEntry): string => {
    if (entry.type === 'world') return getWorld(entry.refId).title;
    if (entry.type === 'story') {
      const worldId = getEntryWorldId(entry);
      return worldId ? `物語の断片: ${getWorld(worldId).title}` : 'Lost Page';
    }
    if (entry.type === 'enemy') return getEnemy(entry.refId).name;
    return getCharacter(entry.refId).name;
  };

  const entries = Object.values(CODEX).filter((e) => e.type === tab);
  const discoveredCount = entries.filter(isDiscovered).length;
  const allEntries = Object.values(CODEX);
  const allDiscoveredCount = allEntries.filter(isDiscovered).length;
  const totalRate = Math.round((allDiscoveredCount / Math.max(allEntries.length, 1)) * 100);
  const coreRestored = CORE_WORLD_IDS.filter((id) => save.progress.clearedWorldIds.includes(id)).length;
  const manuscriptBonus = manuscriptStats(save.storyFragments ?? []);
  const manuscriptLevel = manuscriptBlessingLevel(save.storyFragments ?? []);

  const worldRate = (worldId: CoreWorldId) => {
    const related = allEntries.filter((entry) => entry.refId === worldId || getEntryWorldId(entry) === worldId);
    const found = related.filter(isDiscovered).length;
    return Math.round((found / Math.max(related.length, 1)) * 100);
  };

  const pixelClass = (entry: CodexEntry) => {
    if (entry.type === 'world' || entry.type === 'story') return `codex-pixel codex-pixel--${entry.refId}`;
    if (entry.type === 'character') return `codex-pixel codex-pixel--${getCharacter(entry.refId).worldId}`;
    if (entry.type === 'enemy') return `codex-pixel codex-pixel--${getEnemy(entry.refId).worldId}`;
    return 'codex-pixel';
  };

  return (
    <Window title="THE GRAND ARCHIVE" className="codex-collection">
      <div className="codex-header">
        <div className="codex-header__seal">B</div>
        <div><span>BIBLIOTHECA / RESTORATION RECORD</span><strong>失われた英国文学の大図鑑</strong></div>
        <Button center onClick={closeOverlay}>閉じる</Button>
      </div>
      <div className="codex-summary">
        <div className="codex-summary__primary">
          <span>ARCHIVE RESTORED</span>
          <strong>{totalRate}<small>%</small></strong>
          <i><b style={{ width: `${totalRate}%` }} /></i>
        </div>
        <div>
          <span>CORE STORIES</span>
          <strong>{coreRestored}/3</strong>
        </div>
        <div>
          <span>DISCOVERED</span>
          <strong>{allDiscoveredCount}/{allEntries.length}</strong>
        </div>
      </div>

      <div className="codex-achievements">
        {LONG_TERM_FOUNDATIONS.map((foundation, index) => (
          <span key={foundation.id} className={index < Math.max(1, coreRestored) ? 'is-awake' : ''} title={foundation.description}>
            {foundation.label}
          </span>
        ))}
      </div>

      <div className="codex-tabs">
        {TABS.map((t) => (
          <button
            key={t.type}
            className={tab === t.type ? 'is-active' : ''}
            onClick={() => setTab(t.type)}
          >
            <i>{TAB_ICONS[t.type]}</i><span>{t.label}</span><small>{Object.values(CODEX).filter((entry) => entry.type === t.type && isDiscovered(entry)).length}</small>
          </button>
        ))}
      </div>
      <div className="codex-count">
        収集 {discoveredCount}/{entries.length}
      </div>

      <div className="codex-scroll-area">
      {tab === 'story' && (
        <section className="manuscript-album" aria-label="写本アルバム">
          <header>
            <div>
              <span>MANUSCRIPT ALBUM</span>
              <strong>Bibliothecaの祝福 Rank {manuscriptLevel}/{ALBUM_WORLD_IDS.length*4}</strong>
            </div>
            <p>HP +{manuscriptBonus.hp} / MP +{manuscriptBonus.mp} / ATK +{manuscriptBonus.atk} / DEF +{manuscriptBonus.def}</p>
          </header>
          {(()=>{const worldId=ALBUM_WORLD_IDS[albumIndex],fragments=fragmentsForWorld(worldId),owned=fragments.filter((fragment)=>save.storyFragments.includes(fragment.id)).length,level=manuscriptWorldLevel(save.storyFragments,worldId);return <article className="manuscript-volume manuscript-volume--sixteen">
            <div className="manuscript-volume__title"><button aria-label="前のアルバム" onClick={()=>setAlbumIndex((albumIndex-1+ALBUM_WORLD_IDS.length)%ALBUM_WORLD_IDS.length)}>‹</button><strong>{getWorld(worldId).title}</strong><span>復元 {owned}/16</span><button aria-label="次のアルバム" onClick={()=>setAlbumIndex((albumIndex+1)%ALBUM_WORLD_IDS.length)}>›</button></div>
            <div className="manuscript-piece-grid">{fragments.map((fragment)=>{const found=save.storyFragments.includes(fragment.id);return <button key={fragment.id} className={found?'is-found':''} title={found?fragment.name:fragment.hint}><i>{fragment.pieceNumber}</i><b>{found?fragment.name:'未復元'}</b></button>})}</div>
            <div className="manuscript-blessings">{MANUSCRIPT_BLESSING_THRESHOLDS.map((threshold,index)=><i key={threshold} className={level>index?'is-unlocked':''}>{threshold}片<br/>{index===0?'HP +10':index===1?'ATK +2':index===2?'DEF +2':'ALL +2 / HP +20 / MP +5'}</i>)}</div>
          </article>})()}
        </section>
      )}

      {tab!=='story'&&<div className="codex-collection-grid">
        {entries.map((e) => {
          const found = isDiscovered(e);
          const defeatCount = e.type === 'enemy' ? (save.defeatCounts?.[e.refId] ?? 0) : 0;
          const research = enemyResearchBenefit(defeatCount);
          const worldId = getEntryWorldId(e);
          const meta = worldId && CORE_WORLD_IDS.includes(worldId as CoreWorldId)
            ? CORE_WORLD_META[worldId as CoreWorldId]
            : null;
          return (
            <div key={e.id} role={e.type==='enemy'?'button':undefined} tabIndex={e.type==='enemy'?0:undefined} onClick={()=>e.type==='enemy'&&setSelectedEnemyId(e.refId)} className={found ? 'codex-card is-found' : 'codex-card'}>
              <div className={found ? pixelClass(e) : 'codex-pixel codex-pixel--locked'}>
                {found && e.type === 'character' && <Sprite label={getCharacter(e.refId).name} side="ally" size="sm" presentation="portrait" />}
                {found && e.type === 'enemy' && <Sprite label={getEnemy(e.refId).name} side="enemy" size="sm" presentation="portrait" facing={getEnemy(e.refId).facing ?? 'left'} />}
                {found && (e.type === 'world' || e.type === 'story') && <b>{e.type === 'world' ? 'BOOK' : 'PAGE'}</b>}
                {!found && <b>?</b>}
              </div>
              <div>
                <div className="codex-card__title">{found ? titleOf(e) : '？？？'}</div>
                {found && meta && (
                  <div className="codex-card__meta">
                    <span>{meta.theme}</span>
                    <span>{meta.year}</span>
                    <span>{meta.period}</span>
                    {e.type === 'world' && <span>解放率 {worldRate(e.refId as CoreWorldId)}%</span>}
                  </div>
                )}
                {found && e.type === 'enemy' && (
                  <div className="codex-research">
                    <span>討伐 {defeatCount}</span>
                    <span>研究 Rank {research.level}/3</span>
                    <span>{research.nextThreshold ? `次の記録まで ${research.nextThreshold - defeatCount}` : '研究完了'}</span>
                    <div className="codex-research__bonuses">
                      <i className={research.level >= 1 ? 'is-unlocked' : ''}>I EXP +5%</i>
                      <i className={research.level >= 2 ? 'is-unlocked' : ''}>II Gold +10%</i>
                      <i className={research.level >= 3 ? 'is-unlocked' : ''}>III Drop +5pt</i>
                    </div>
                    {(()=>{const bonus=enemyDefeatStatBonus(e.refId,defeatCount);return <b>討伐効果 {bonus.stat.toUpperCase()} +{bonus.value}（{bonus.unit}体ごと / 上限{bonus.maxCount}）</b>})()}
                  </div>
                )}
                <p>{found ? e.loreText : 'まだ発見していない。作品を修復し、仲間と戦い、断片を集めると余白が埋まる。'}</p>
              </div>
            </div>
          );
        })}
      </div>}
      {selectedEnemyId&&<EnemyDetail enemyId={selectedEnemyId} save={save} onClose={()=>setSelectedEnemyId(null)}/>}
      </div>
    </Window>
  );
}

const UNIQUE_EQUIPMENT:Record<string,string|undefined>={dragon:'dragon_heart_mail',grendel:'grendel_fang_blade',claudius:'royal_ring',macbeths_fate:'cursed_crown'};
function EnemyDetail({enemyId,save,onClose}:{enemyId:string;save:SaveData;onClose:()=>void}){
  const enemy=getEnemy(enemyId),count=save.defeatCounts?.[enemyId]??0,found=count>0;const worldEnemies=Object.values(CODEX).filter((entry)=>entry.type==='enemy'&&getEnemy(entry.refId).worldId===enemy.worldId);const index=Math.max(0,worldEnemies.findIndex((entry)=>entry.refId===enemyId));const piece=fragmentsForWorld(enemy.worldId)[index%16];const pet=petForEnemy(enemyId);const equipmentId=UNIQUE_EQUIPMENT[enemyId];const pieceGot=piece?save.storyFragments.includes(piece.id):true;const petGot=!pet||(save.pets??[]).some((owned)=>owned.petId===pet.id);const equipmentGot=!equipmentId||save.equipmentInventory.includes(equipmentId);const complete=found&&pieceGot&&petGot&&equipmentGot;const bonus=enemyDefeatStatBonus(enemyId,count);
  return <div className="monster-detail-shade"><section className="monster-detail"><header><div><small>MONSTER ARCHIVE</small><strong>{found?enemy.name:'？？？'}</strong></div>{complete&&<b>COMPLETE!</b>}<button onClick={onClose}>×</button></header>{found?<><div className="monster-stat-grid">{Object.entries(enemy.stats).map(([key,value])=><span key={key}><small>{key.toUpperCase()}</small><b>{value}</b></span>)}</div><div className="monster-detail-count"><b>討伐 {count}</b><span>{bonus.stat.toUpperCase()} +{bonus.value} / 次の+1まで {bonus.unit-(count%bonus.unit)}体</span></div><div className="monster-rewards"><article><strong>通常ドロップ</strong>{enemy.dropTable.map((drop)=><span key={drop.materialId}>{getMaterial(drop.materialId).name} <small>{Math.round(drop.rate*100)}%</small></span>)}</article><article><strong>ユニーク報酬</strong><span className={pieceGot?'is-got':''}>アルバム：{piece?.name??'無し'} {pieceGot&&'GET!'}</span><span className={equipmentGot?'is-got':''}>装備：{equipmentId??'無し'} {equipmentId&&equipmentGot&&'GET!'}</span><span className={petGot?'is-got':''}>ペット：{pet?.name??'無し'} {pet&&petGot&&'GET!'}</span></article></div></>:<div className="monster-unknown">属性・能力・ドロップ・報酬<br/>すべて ？？？<small>一度討伐すると記録が開示されます。</small></div>}<Button center onClick={onClose}>閉じる</Button></section></div>;
}

function getEntryWorldId(entry: CodexEntry): string | null {
  if (entry.type === 'world') return entry.refId;
  if (entry.type === 'story') {
    if (WORLDS[entry.refId]) return entry.refId;
    return Object.keys(WORLDS).find((worldId) => entry.refId.startsWith(`${worldId}_`)) ?? null;
  }
  if (entry.type === 'character') return getCharacter(entry.refId).worldId;
  if (entry.type === 'enemy') return getEnemy(entry.refId).worldId;
  return null;
}
