# データベース設計ドキュメント

このドキュメントは、Prisma + PostgreSQLを使用したデータベース設計の詳細を説明します。

**関連ドキュメント:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 全体アーキテクチャ
- [BACKEND.md](./BACKEND.md) - バックエンド開発規約
- [AUTH.md](./AUTH.md) - 認証実装

## 目次
1. [Prismaスキーマ設計](#1-prismaスキーマ設計)
2. [Prisma拡張パターン](#2-prisma拡張パターン)
3. [Repository層の実装](#3-repository層の実装)
4. [マイグレーション戦略](#4-マイグレーション戦略)

## 1. Prismaスキーマ設計

### 1.1 認証テーブル（管理画面用 - Better Auth標準）

```prisma
// prisma/schema.prisma

// ========================================
// 管理画面用認証テーブル (Better Auth 標準)
// ========================================

// 管理者・スタッフアカウント (Better Auth の User テーブル)
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // カスタムフィールド: ロール
  role          String    @default("staff") // 'admin' | 'staff' | 'company_admin'

  // Better Auth 標準リレーション
  sessions      Session[]
  accounts      Account[]

  // アプリケーション固有リレーション
  appointments  Appointment[] @relation("StaffAppointments")
}

// セッション (Better Auth 標準)
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expiresAt    DateTime
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// OAuth連携アカウント (Better Auth 標準)
model Account {
  id                String  @id @default(cuid())
  userId            String
  accountId         String  // Better Auth標準フィールド
  providerId        String  // Better Auth標準フィールド
  accessToken       String?
  refreshToken      String?
  idToken           String?
  expiresAt         DateTime?
  password          String? // Email/パスワード認証用
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([providerId, accountId])
  @@index([userId])
}

// Verification (Better Auth 標準 - メール認証用)
model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([identifier, value])
}
```

### 1.2 エンドユーザー認証テーブル（カスタム実装）

```prisma
// ========================================
// エンドユーザー用認証テーブル（カスタム実装）
// ========================================

// 組織・企業テーブル
model Organization {
  id        String   @id @default(cuid())
  code      String   @unique // 6桁の英数字コード
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  endUsers EndUser[]

  @@index([code])
}

// エンドユーザー（サービス利用者）
model EndUser {
  id             String    @id @default(cuid())
  organizationId String
  email          String    @unique
  passwordHash   String?   // パスワードハッシュ
  name           String    // 氏名
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime? // 論理削除

  organization Organization @relation(fields: [organizationId], references: [id])
  appointments Appointment[]
  messages     Message[]

  @@index([organizationId])
  @@index([email])
}
```

### 1.3 アプリケーションテーブル

```prisma
// 予約（管理者とエンドユーザーの両方に関連）
model Appointment {
  id           String   @id @default(cuid())
  endUserId    String
  staffId      String   // 担当スタッフ（Userテーブル）
  scheduledAt  DateTime
  status       String   @default("scheduled") // 'scheduled' | 'completed' | 'cancelled'
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  endUser  EndUser @relation(fields: [endUserId], references: [id])
  staff    User    @relation("StaffAppointments", fields: [staffId], references: [id])

  @@index([endUserId])
  @@index([staffId])
  @@index([scheduledAt])
}

// メッセージ
model Message {
  id         String   @id @default(cuid())
  endUserId  String
  content    String
  isFromUser Boolean  @default(true)
  createdAt  DateTime @default(now())

  endUser EndUser @relation(fields: [endUserId], references: [id])

  @@index([endUserId])
  @@index([createdAt])
}
```

### 1.4 認証テーブルの分離ポイント

**管理者テーブル（Better Auth標準）**:
- `User`: Better Auth標準のUserテーブル + カスタムフィールド（role）
- `Session`: Better Auth標準のSessionテーブル
- `Account`: Better Auth標準のAccountテーブル（Email/パスワード、OAuth対応）
- `Verification`: Better Auth標準のVerificationテーブル（メール認証）

**エンドユーザーテーブル（カスタム実装）**:
- `Organization`: 組織・企業情報
- `EndUser`: エンドユーザー情報
- セッションはRedisで管理（DBには保存しない）

**共通関連テーブル**:
- `Appointment`: 管理者（User.role=staff）とエンドユーザーを紐付け
- `Message`: エンドユーザーのみに関連

## 2. Prisma拡張パターン

### 2.1 基本的な拡張パターン

```typescript
// ✅ 正しい実装: Prisma $extendsを使用したモデル拡張
// src/server/db/client.ts
import { PrismaClient, Prisma } from '@prisma/client'

// モデル拡張の定義を分離（推奨）
const userExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    model: {
      user: {
        // モデルメソッドの追加
        async signUp(email: string, password: string, name: string) {
          const hashedPassword = await hashPassword(password)
          return client.user.create({
            data: { email, password: hashedPassword, name }
          })
        },

        async authenticate(email: string, password: string) {
          const user = await client.user.findUnique({ where: { email } })
          if (!user) return null

          const isValid = await verifyPassword(password, user.password)
          return isValid ? user : null
        }
      }
    },
    result: {
      user: {
        // computed field（仮想フィールド）の追加
        displayName: {
          needs: { lastName: true, firstName: true },
          compute(user) {
            return `${user.lastName} ${user.firstName}`
          }
        },

        isActive: {
          needs: { deletedAt: true, status: true },
          compute(user) {
            return !user.deletedAt && user.status === 'ACTIVE'
          }
        }
      }
    }
  })
})

// 拡張したPrismaClientをエクスポート
export const prisma = new PrismaClient().$extends(userExtension)

// 型定義もエクスポート（他のファイルで型を使う場合）
export type ExtendedPrismaClient = typeof prisma
```

### 2.2 複数の拡張を組み合わせる

```typescript
// ✅ 正しい実装: 複数の拡張を組み合わせる
// src/server/db/client.ts
import { PrismaClient, Prisma } from '@prisma/client'

// User拡張
const userExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    model: {
      user: {
        async findActive() {
          return client.user.findMany({
            where: { deletedAt: null, status: 'ACTIVE' }
          })
        }
      }
    }
  })
})

// EndUser拡張
const endUserExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    model: {
      endUser: {
        async findByEmail(email: string) {
          return client.endUser.findFirst({
            where: { email, deletedAt: null }
          })
        }
      }
    }
  })
})

// 複数の拡張を適用
export const prisma = new PrismaClient()
  .$extends(userExtension)
  .$extends(endUserExtension)

export type ExtendedPrismaClient = typeof prisma
```

### 2.3 Prisma拡張のベストプラクティス

1. **拡張定義の分離**: `Prisma.defineExtension`を使用して拡張を個別モジュール化
2. **命名規則の統一**: モデルメソッドは動詞で開始（例: `findActive`, `createWithDefaults`）
3. **computed fieldsの依存管理**: `needs`で必要なフィールドを明示的に指定
4. **型安全性の確保**: 拡張後のクライアント型をエクスポートして再利用
5. **責務の分離**: 複雑なビジネスロジックはService層に、単純なデータ操作のみModel拡張に

## 3. Repository層の実装

### 3.1 基本的なRepository

```typescript
// ✅ 正しい実装: Repository層
// src/server/repositories/userRepository.ts
import { prisma } from '@/server/db/client'

export const userRepository = {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } })
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  },

  async create(data: CreateUserData) {
    return prisma.user.create({ data })
  },

  async update(id: string, data: UpdateUserData) {
    return prisma.user.update({
      where: { id },
      data
    })
  },

  async delete(id: string) {
    return prisma.user.delete({ where: { id } })
  },

  // 拡張メソッドもRepository層でラップして提供
  async signUp(email: string, password: string, name: string) {
    return prisma.user.signUp(email, password, name)
  }
}
```

### 3.2 複雑なクエリのRepository

```typescript
// ✅ 正しい実装: 複雑なクエリのRepository
// src/server/repositories/endUserRepository.ts
import { prisma } from '@/server/db/client'

export const endUserRepository = {
  async findByEmail(email: string) {
    return prisma.endUser.findFirst({
      where: {
        email,
        deletedAt: null
      },
      include: {
        organization: true
      }
    })
  },

  async findByOrganization(organizationId: string) {
    return prisma.endUser.findMany({
      where: {
        organizationId,
        deletedAt: null
      },
      include: {
        organization: true,
        appointments: {
          orderBy: { scheduledAt: 'desc' },
          take: 5
        }
      }
    })
  }
}
```

### 3.3 トランザクション処理

```typescript
// ✅ 正しい実装: トランザクション処理
// src/server/repositories/appointmentRepository.ts
import { prisma } from '@/server/db/client'

export const appointmentRepository = {
  async createWithNotification(appointmentData: CreateAppointmentData) {
    return prisma.$transaction(async (tx) => {
      // 予約を作成
      const appointment = await tx.appointment.create({
        data: appointmentData
      })

      // 通知メッセージを作成
      await tx.message.create({
        data: {
          endUserId: appointmentData.endUserId,
          content: `予約が確定しました: ${appointmentData.scheduledAt}`,
          isFromUser: false
        }
      })

      return appointment
    })
  }
}
```

## 4. マイグレーション戦略

### 4.1 開発フロー

```bash
# スキーマ変更後、マイグレーションファイルを作成
pnpm prisma migrate dev --name add_user_role

# マイグレーション適用（本番環境）
pnpm prisma migrate deploy

# Prisma Clientの再生成
pnpm prisma generate
```

### 4.2 シードデータ

```typescript
// ✅ 正しい実装: シードデータ
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 組織データのシード
  const organization = await prisma.organization.create({
    data: {
      code: 'TEST01',
      name: 'テスト企業株式会社'
    }
  })

  // 管理者ユーザーのシード
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: '管理者',
      role: 'admin',
      emailVerified: true
    }
  })

  // エンドユーザーのシード
  await prisma.endUser.create({
    data: {
      organizationId: organization.id,
      name: '山田太郎',
      email: 'yamada@example.com'
    }
  })

  console.log('シードデータを作成しました')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### 4.3 マイグレーションのベストプラクティス

1. **小さく頻繁に**: 大きな変更を一度にせず、小さな変更を頻繁に適用
2. **可逆性の確保**: ロールバック可能な設計を心がける
3. **本番前のテスト**: ステージング環境で必ずテスト
4. **データ移行スクリプト**: 既存データの移行が必要な場合はスクリプトを作成
5. **バックアップ**: 本番マイグレーション前に必ずバックアップ

### 4.4 インデックス戦略

```prisma
// ✅ 正しい実装: インデックスの最適化

model EndUser {
  id             String    @id @default(cuid())
  organizationId String
  email          String    @unique
  name           String

  // 頻繁に使用するクエリ用のインデックス
  @@index([organizationId])
  @@index([email])
}

model Message {
  id         String   @id @default(cuid())
  endUserId  String
  createdAt  DateTime @default(now())

  // 時系列ソート用のインデックス
  @@index([endUserId, createdAt])
}
```

---

## 変更履歴

### 2025年12月
- ボイラープレートテンプレートとして初期化
- 汎用的なエンドユーザーテーブル設計に変更

### 2025年11月15日
- ARCHITECTURE.mdから分離してDATABASE.mdを作成
- Prismaスキーマの詳細設計を追加
- Prisma拡張パターンのベストプラクティスを強化
- Repository層の実装パターンを明確化

最終更新: 2025年12月
