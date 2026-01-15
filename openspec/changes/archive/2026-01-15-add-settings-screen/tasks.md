# Tasks: add-settings-screen

## フェーズ 1: サーバー側の準備

### Task 1.1: Prisma スキーマ更新

- [ ] `UserSettings` モデルに `themeId` フィールドを追加
- [ ] デフォルト値を `"honey"` に設定
- [ ] マイグレーション実行

**検証**: `pnpm prisma migrate dev` が成功する

### Task 1.2: UserSettings API 拡張

- [ ] `UpdateSettingsInput` スキーマに `themeId` を追加
- [ ] `getSettings` レスポンスに `themeId` を含める
- [ ] `updateSettings` で `themeId` の更新を処理

**検証**: API テストで themeId の取得・更新ができる

---

## フェーズ 2: テーマシステムの実装

### Task 2.1: テーマ定数の定義

- [ ] `apps/mobile/src/constants/theme.ts` を作成
- [ ] 16種類のプリセットテーマを5カテゴリに分けて定義
  - ウォーム系: honey, sunset, coffee
  - クール系: ocean, sky, mint
  - ナチュラル系: forest, lime
  - ロマンティック系: sakura, rose, lavender, grape
  - モノトーン系: stone, slate, midnight
- [ ] 各テーマのカラークラス群を定義（Tailwind + Hex値）
- [ ] TypeScript 型定義を追加（ThemeId, Theme, ThemeColors）
- [ ] ユーティリティ関数を追加（isValidThemeId, getThemeById, getAllThemeIds）

**検証**: `pnpm typecheck` が成功する

### Task 2.2: ThemeProvider の実装

- [ ] `apps/mobile/src/providers/ThemeProvider.tsx` を作成
- [ ] ThemeContext を作成
- [ ] AsyncStorage からのテーマ読み込みを実装
- [ ] テーマ変更と保存ロジックを実装
- [ ] サーバー同期ロジックを実装
- [ ] `useTheme` フックをエクスポート

**検証**: useTheme() でテーマ情報を取得できる

### Task 2.3: アプリへの ThemeProvider 統合

- [ ] `apps/mobile/app/_layout.tsx` に ThemeProvider をラップ
- [ ] スプラッシュスクリーン表示中にテーマ読み込みを完了させる

**検証**: アプリ起動時にテーマがちらつかない

---

## フェーズ 3: 設定画面の実装

### Task 3.1: 設定画面の基本構造

- [ ] `apps/mobile/app/(tabs)/settings.tsx` を実装
- [ ] SafeAreaView + ScrollView のレイアウト
- [ ] セクション区切りのスタイリング

**検証**: 設定画面が表示される

### Task 3.2: プロフィールセクション

- [ ] ユーザーアイコン（Circle User アイコン）
- [ ] 「ゲストユーザー」テキスト

**検証**: プロフィールセクションが表示される

### Task 3.3: テーマセレクター

- [ ] 16種類のプリセットテーマを5カテゴリ別に表示する選択UI
- [ ] 各カテゴリ（ウォーム系、クール系、ナチュラル系、ロマンティック系、モノトーン系）ごとにグリッド表示
- [ ] 選択中テーマのハイライト表示
- [ ] タップでテーマ変更（useTheme の setTheme 呼び出し）
- [ ] previewColor を使ったカラープレビュー表示

**検証**: テーマを切り替えると設定画面のカラーが変わる

### Task 3.4: 法的文書セクション

- [ ] 「利用規約」リンク
- [ ] 「プライバシーポリシー」リンク
- [ ] タップで外部ブラウザを起動（Linking.openURL）

**検証**: タップでブラウザが開く

### Task 3.5: データ削除機能

- [ ] 「データを削除」ボタン
- [ ] 確認アラートの実装
- [ ] deleteDeviceData API 呼び出し
- [ ] ローカルストレージクリア
- [ ] オンボーディング画面へのリダイレクト

**検証**: 削除後にオンボーディング画面に遷移する

### Task 3.6: アプリ情報セクション

- [ ] アプリ名表示
- [ ] バージョン番号表示（expo-constants 使用）

**検証**: バージョン情報が表示される

---

## フェーズ 4: テーマの全画面適用

### Task 4.1: Home画面のアイコン変更

- [ ] `HomePageContent.tsx` の Settings アイコンを User アイコンに変更
- [ ] インポートの更新

**検証**: Home画面右上がプロフィールアイコンになる

### Task 4.2: Home画面のテーマ適用

- [ ] `HomePageContent.tsx` に useTheme を導入
- [ ] 背景色、テキスト色、ボタン色をテーマから取得するよう変更

**検証**: テーマ変更時に Home 画面のカラーが変わる

### Task 4.3: SwipeNavigator のテーマ適用

- [ ] `SwipeNavigator.tsx` に useTheme を導入
- [ ] ローディング/エラー画面のカラーをテーマ適用

**検証**: ローディング画面がテーマカラーで表示される

### Task 4.4: CategoryPage のテーマ適用

- [ ] `CategoryPage.tsx` に useTheme を導入
- [ ] 背景色、テキスト色をテーマ適用

**検証**: カテゴリーページがテーマカラーで表示される

### Task 4.5: TimelinePage のテーマ適用

- [ ] `TimelinePage.tsx` に useTheme を導入
- [ ] 背景色、テキスト色、カードスタイルをテーマ適用

**検証**: タイムラインページがテーマカラーで表示される

### Task 4.6: ボトムシート類のテーマ適用

- [ ] `ItemDetailSheet.tsx` にテーマ適用
- [ ] `CreateItemSheet.tsx` にテーマ適用
- [ ] `CreateCategorySheet.tsx` にテーマ適用
- [ ] その他のシートコンポーネントにテーマ適用

**検証**: 各シートがテーマカラーで表示される

### Task 4.7: PageIndicator のテーマ適用

- [ ] `PageIndicator.tsx` に useTheme を導入
- [ ] アクティブインジケーターのカラーをテーマ適用

**検証**: インジケーターがテーマカラーで表示される

---

## フェーズ 5: テストと仕上げ

### Task 5.1: 動作確認

- [ ] 全16テーマの切り替えテスト（各カテゴリから少なくとも1つ）
  - ウォーム系: honey, sunset, coffee
  - クール系: ocean, sky, mint
  - ナチュラル系: forest, lime
  - ロマンティック系: sakura, rose, lavender, grape
  - モノトーン系: stone, slate, midnight
- [ ] アプリ再起動後のテーマ復元確認
- [ ] オフライン時のテーマ変更確認

**検証**: すべてのシナリオが正常に動作する

### Task 5.2: ビルド確認

- [ ] `pnpm run format` 実行
- [ ] `pnpm run lint` 実行
- [ ] `pnpm run typecheck` 実行
- [ ] `pnpm run build` 実行

**検証**: すべてのコマンドがエラーなく完了する

---

## 依存関係

```
フェーズ 1 (サーバー)
    ↓
フェーズ 2 (テーマシステム)
    ↓
フェーズ 3 (設定画面) ─── 並列可 ─── フェーズ 4 (全画面適用)
                                          ↓
                                    フェーズ 5 (テスト)
```

## 見積もり

| フェーズ | 作業量 |
|---------|-------|
| フェーズ 1 | Small |
| フェーズ 2 | Medium |
| フェーズ 3 | Medium |
| フェーズ 4 | Medium |
| フェーズ 5 | Small |
| **合計** | **Medium-Large** |
