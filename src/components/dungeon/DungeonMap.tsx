import type { DungeonMap as MapData, MapEntity } from '@/types';

const TILE = 26; // px

function entityGlyph(e: MapEntity): { glyph: string; cls: string } {
  switch (e.kind) {
    case 'boss':
      return { glyph: 'B', cls: 'ent-boss' };
    case 'enemy':
      return { glyph: e.label?.charAt(0).toUpperCase() ?? 'E', cls: 'ent-enemy' };
    case 'chest':
      return { glyph: e.opened ? '·' : '', cls: e.opened ? 'ent-chest-open' : 'ent-chest' };
    case 'stairs':
      return { glyph: '', cls: 'ent-stairs' };
    case 'rest':
      return { glyph: '', cls: 'ent-rest' };
    case 'memory':
      return { glyph: '', cls: 'ent-memory' };
  }
}

interface Props {
  map: MapData;
}

export function DungeonMap({ map }: Props) {
  return (
    <div
      className={`dungeon-map dungeon-map--${map.worldId} dungeon-map--floor-${map.floorIndex}`}
      style={{ width: map.width * TILE, height: map.height * TILE }}
    >
      {/* タイル層 */}
      {map.tiles.map((row, y) =>
        row.map((t, x) => (
          <div
            key={`${x},${y}`}
            className={`tile tile-${t} ${map.visited[y][x] ? '' : 'tile-fog'}`}
            style={{ left: x * TILE, top: y * TILE, width: TILE, height: TILE }}
          />
        )),
      )}

      {/* エンティティ層（座標で配置＝動かせる） */}
      {map.entities.map((e) => {
        const { glyph, cls } = entityGlyph(e);
        return (
          <div
            key={e.id}
            className={`map-entity ${cls}`}
            style={{ transform: `translate(${e.x * TILE}px, ${e.y * TILE}px)`, width: TILE, height: TILE }}
          >
            {glyph}
          </div>
        );
      })}

      {/* プレイヤー */}
      <div
        className="map-entity ent-player"
        style={{ transform: `translate(${map.player.x * TILE}px, ${map.player.y * TILE}px)`, width: TILE, height: TILE }}
      />
    </div>
  );
}
