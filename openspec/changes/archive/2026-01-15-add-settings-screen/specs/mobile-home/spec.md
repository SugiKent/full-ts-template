# mobile-home Specification (Delta)

## ADDED Requirements

### Requirement: Home画面ヘッダーアイコン変更

Home画面右上のアイコンを歯車（Settings）からプロフィール（User）アイコンに変更しなければならない（SHALL）。

#### Scenario: ヘッダーのプロフィールアイコン表示

- **WHEN** Home画面が表示される
- **THEN** 右上にプロフィールアイコン（User）が表示される
- **AND** アイコンは白背景の丸ボタン内に配置される

#### Scenario: 設定画面への遷移（変更なし）

- **WHEN** ユーザーが右上のプロフィールアイコンをタップする
- **THEN** 設定画面（`/settings`）に遷移する

**変更前**:
```tsx
<Settings size={22} color="#78716C" />
```

**変更後**:
```tsx
<User size={22} color="#78716C" />
```

### Requirement: テーマカラーの動的適用

Home画面は現在選択中のテーマカラーを適用しなければならない（SHALL）。

- 背景色はテーマの `background` カラーを使用しなければならない（MUST）
- テキストカラーはテーマの `text` および `textMuted` カラーを使用しなければならない（SHALL）
- ボタンやアクセントはテーマの `primary` カラーを使用しなければならない（SHALL）
- ローディング/エラー表示もテーマカラーに準拠しなければならない（SHALL）

#### Scenario: テーマ変更時のHome画面更新

- **WHEN** ユーザーが設定画面でテーマを変更する
- **THEN** Home画面に戻った際に新しいテーマカラーが適用されている
- **AND** 「今月やること」セクションの背景色が変更される
- **AND** ボタンやリンクのカラーが変更される
