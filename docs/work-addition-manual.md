# British Legends 作品追加マニュアル

British Legends は「作品データを足すだけで遊べる」構造を目指す。新しい作品世界を追加するときは、ロジックを増やす前に以下のデータをそろえる。

## 1. 作品世界を追加する

編集ファイル: `src/data/worlds.ts`

必須項目:

- `id`: 英小文字の短い識別子。例: `dracula`
- `title`: 作品名
- `author`: 作者名
- `era`: 年代
- `order`: 解放順。文学史の年代順を優先する
- `description`: 1文の説明
- `dungeonId`: 対応するダンジョンID
- `rewardCharacterId`: クリア時に仲間になるキャラID
- `recommendedLevel`: 推奨レベル
- `theme`: 作品色。`primary`, `secondary`, `accent`

## 2. ダンジョンを追加する

編集ファイル: `src/data/dungeons.ts`

必須項目:

- `id`: `worlds.ts` の `dungeonId` と一致
- `name`: ダンジョン名
- `worldId`: 作品世界ID
- `floors`: 最低3階層を推奨
- `bossEnemyId`: 最終階層のボスID

各フロアは、敵、宝箱、休憩、階段、ボスが破綻なく配置されるようにする。理不尽な詰みを避けるため、ボス以外の敵は移動可、階段は常に到達可能にする。

## 3. 仲間キャラを追加する

編集ファイル: `src/data/characters.ts`

必須項目:

- `id`: `worlds.ts` の `rewardCharacterId` と一致
- `name`
- `title`
- `baseStats`
- `skills`
- `evolution`

最初は進化なしでもよいが、MVP以降は最低1段階の進化条件を持たせる。

## 4. 敵を追加する

編集ファイル: `src/data/enemies.ts`

必須項目:

- `id`
- `name`
- `worldId`
- `stats`
- `skills`
- `drops`
- `gold`
- `exp`

雑魚敵3体、ボス1体を基本セットにする。ボス以外はダンジョン内で移動対象にする。

## 5. 素材を追加する

編集ファイル: `src/data/materials.ts`

必須項目:

- `id`
- `name`
- `description`
- `rarity`
- `worldId`

素材名は作品の世界観を表現する。クイズや解説ではなく、敵・素材・スキルで文学要素を出す。

## 6. 背景画像を追加する

推奨配置:

- ワールドマップ: `src/assets/world/{worldId}-overworld-v1.png`
- 戦闘背景: `src/assets/battle/{worldId}-battle-field-v1.png`

登録箇所:

- `src/scenes/WorldMapScene.tsx` の `overworldArt`
- `src/scenes/BattleScene.tsx` の `BATTLE_FIELDS_BY_WORLD`

背景は横長16:9を基本にし、スマホ横持ちで重要オブジェクトが中央に入るようにする。

## 7. キャラ画像を追加する

推奨配置:

- `src/assets/characters/generated/{characterId}-map.png`
- `src/assets/characters/generated/{characterId}-idle.png`
- `src/assets/characters/generated/{characterId}-attack.png`
- `src/assets/characters/generated/{characterId}-hurt.png`

登録箇所:

- `src/components/ui/characterArt.ts`
- `src/components/ui/Sprite.tsx`

未登録でも汎用スプライトにフォールバックするが、主要仲間とボスは専用画像を作る。

大量追加時は `scripts/generate-character-sprites.mjs` にキャラ定義を追加してから、以下を実行する。

```bash
node scripts/generate-character-sprites.mjs
```

このスクリプトは `map`, `idle`, `attack`, `hurt` の4ポーズを `src/assets/characters/generated/` に生成する。

## 8. 確認手順

実装後は必ず以下を実行する。

```bash
tsc -b
vite build
vitest run
```

確認すること:

- ワールドマップに新作品が年代順で出る
- ダンジョンへ入れる
- 階段へ到達できる
- 戦闘で全員が攻撃できる
- 勝利時だけ経験値、素材、ゴールドが入る
- クリア後に仲間加入と次作品解放が起きる

## 追加テンプレート

```ts
newWorldId: {
  id: 'newWorldId',
  title: 'Work Title',
  author: 'Author Name',
  era: '0000年',
  order: 13,
  description: 'ゲーム内で使う短い説明。',
  dungeonId: 'dungeon_newWorldId',
  rewardCharacterId: 'new_character',
  recommendedLevel: 42,
  theme: { primary: '#000000', secondary: '#333333', accent: '#d7b465' },
}
```
