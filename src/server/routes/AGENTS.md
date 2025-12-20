# routes

このディレクトリにはFastifyルート定義を配置します。

## ディレクトリ構成

```
routes/
├── admin/          # 管理画面用ルート
│   └── rpc.ts      # oRPC ルート登録
└── user/           # ユーザー向けルート
    └── rpc.ts      # oRPC ルート登録
```

## 設計方針

- **Fastifyプラグイン形式**: 各ルートファイルはFastifyPluginAsyncをエクスポート
- **oRPC統合**: RPCエンドポイントは `/api/admin/rpc` 等に登録
- **認証**: ルートレベルでの認証ガードを設定

## 使用例

```typescript
import type { FastifyPluginAsync } from 'fastify'

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async () => ({ status: 'ok' }))
}

export default routes
```

## 参照ドキュメント

- [docs/BACKEND.md](../../../docs/BACKEND.md) - Fastifyベストプラクティス
