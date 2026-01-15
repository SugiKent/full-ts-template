/**
 * テストデータ投入スクリプト
 * ローカル開発・E2Eテスト用のサンプルデータを作成します
 *
 * 使用方法:
 *   pnpm run db:testData
 *
 * 注意:
 *   - このスクリプトは開発・テスト環境専用です
 *   - 本番環境では実行しないでください
 *   - データベースを完全にリセットしてからテストデータを投入します
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * データベースを完全にリセットする
 */
async function resetDatabase(): Promise<void> {
  // 外部キー制約を考慮して削除順序を決定

  // 認証関連
  await prisma.session.deleteMany({})
  console.log('  ✓ Deleted all sessions')

  await prisma.account.deleteMany({})
  console.log('  ✓ Deleted all accounts')

  await prisma.verification.deleteMany({})
  console.log('  ✓ Deleted all verifications')

  await prisma.user.deleteMany({})
  console.log('  ✓ Deleted all users')
}

async function main() {
  console.log('🧪 Loading test data for development/E2E testing...')

  // 本番環境チェック
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ This script should not be run in production!')
    process.exit(1)
  }

  // データベースを完全にリセット
  console.log('\n🗑️  Resetting database...')
  await resetDatabase()
  console.log('✅ Database reset completed!')

  // 管理者アカウントの作成（seed.tsと同等）
  console.log('\n👤 Creating admin user...')
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  await prisma.user.create({
    data: {
      email: adminEmail,
      name: '管理者',
      role: 'admin',
      emailVerified: true,
    },
  })
  console.log(`  ✓ Created admin user: ${adminEmail}`)

  console.log('\n🎉 Test data loading completed!')
  console.log('\n📝 テストアカウント情報:')
  console.log(`   管理者: ${adminEmail}`)
  console.log('   ユーザー: user@example.com, user2@example.com, user3@example.com')
  console.log('   ※ ログインはマジックリンク（メール認証）で行います')
  console.log('\n💡 E2Eテストを実行するには:')
  console.log('   pnpm run test:e2e')
}

main()
  .catch((e) => {
    console.error('❌ Test data loading failed:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
