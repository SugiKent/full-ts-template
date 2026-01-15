# Change: 利用規約・プライバシーポリシーの追加

## Why

現在、オンボーディングの利用規約同意画面では `https://example.com/terms` などのプレースホルダーURLが設定されています。App Store/Google Play への公開およびユーザーへの法的義務を果たすため、正式な利用規約とプライバシーポリシーを作成し、公開する必要があります。

PROJECT.md の「5.2 法規制・コンプライアンス」にも以下の要件が記載されています：
- 個人情報保護法の遵守
- GDPR対応（データ削除リクエスト、データポータビリティ）
- 利用規約・プライバシーポリシーへの明示的な同意取得

## What Changes

- 利用規約（Terms of Service）のHTMLファイルを `apps/client/public/legal/` に作成
- プライバシーポリシー（Privacy Policy）のHTMLファイルを `apps/client/public/legal/` に作成
- モバイルアプリの利用規約同意画面のURL参照を更新（`terms.tsx`）
- 管理画面のフッターにリンクを追加（任意）

### 利用規約に含まれる主要な条項

1. サービスの定義と利用条件
2. ユーザーの責任と禁止事項
3. Device ID認証と匿名利用について
4. 知的財産権
5. 免責事項
6. サービスの変更・終了
7. 準拠法・管轄裁判所

### プライバシーポリシーに含まれる主要な条項

1. 収集する情報（Device ID、ウィッシュリストデータ等）
2. 情報の利用目的
3. 情報の保管とセキュリティ（AES-256暗号化、HTTPS/TLS）
4. 第三者提供の制限
5. データ削除リクエストの方法
6. Cookieの使用について
7. ポリシーの変更について
8. お問い合わせ先

## Impact

- 新規Spec: `legal-documents`（新しいCapability）
- 変更されるコード:
  - `apps/client/public/legal/terms.html`（新規作成）
  - `apps/client/public/legal/privacy.html`（新規作成）
  - `apps/mobile/app/(onboarding)/terms.tsx`（URLの更新）
- 関連Spec: `onboarding`（Terms Acceptance 要件との連携）
