# Change: スクロール可能なタブバーの実装

## Why

現在の画面下部のタブバー（PageIndicator）は、カテゴリーが増加すると横幅が画面を超えてUIが破綻する。最大横幅を維持しつつ、多数のカテゴリーに対応するため横スクロールを可能にする必要がある。

## What Changes

- PageIndicator コンポーネントに横スクロール機能を追加
- 最大幅を制限し、それを超えた場合に ScrollView でスクロール可能にする
- 現在選択中のタブが自動的に表示領域に収まるようスクロール位置を調整

## Impact

- Affected specs: `mobile-home`
- Affected code: `apps/mobile/src/components/swipe-navigation/PageIndicator.tsx`
