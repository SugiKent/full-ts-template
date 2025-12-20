/**
 * Prisma Seed スクリプト
 * デフォルト管理者アカウントを作成します
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // データベースを完全にリセット
  console.log('🗑️  Resetting database...')

  // 外部キー制約を考慮して削除順序を決定
  await prisma.session.deleteMany({})
  console.log('  ✓ Deleted all sessions')

  await prisma.account.deleteMany({})
  console.log('  ✓ Deleted all accounts')

  await prisma.verification.deleteMany({})
  console.log('  ✓ Deleted all verifications')

  await prisma.user.deleteMany({})
  console.log('  ✓ Deleted all users')

  console.log('✅ Database reset completed!\n')

  // テスト用アカウントの設定
  const testAccounts = [
    {
      email: 'admin@example.com',
      password: 'password',
      name: '管理者',
      role: 'admin',
    },
    {
      email: 'user@example.com',
      password: 'password',
      name: 'テストユーザー',
      role: 'user',
    },
  ]

  // Better Auth API を使用してユーザーを作成
  console.log('Creating test users via Better Auth API...')

  for (const account of testAccounts) {
    try {
      const response = await fetch('http://localhost:8080/api/auth/sign-up/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: account.email,
          password: account.password,
          name: account.name,
          role: account.role,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to create user: ${JSON.stringify(error)}`)
      }

      await response.json()
      console.log(`User created via Better Auth API: ${account.email}`)

      // emailVerifiedをtrueに設定（開発環境用）
      await prisma.user.update({
        where: { email: account.email },
        data: { emailVerified: true },
      })

      console.log(`✅ Created ${account.role} user: ${account.email}`)
      console.log(`   Email: ${account.email}`)
      console.log(`   Password: ${account.password}`)
      console.log(`   Role: ${account.role}`)
    } catch (error) {
      console.error(`❌ Failed to create user ${account.email}:`, error)
    }
  }

  console.log('\n⚠️  本番環境では必ずパスワードを変更してください!')
  console.log('\n📝 テストアカウント情報:')
  console.log('   管理者: admin@example.com / password')
  console.log('   ユーザー: user@example.com / password')

  // サーバーが起動していない場合のメッセージ
  if (testAccounts.length > 0) {
    const userCount = await prisma.user.count()
    if (userCount === 0) {
      console.log('\n⚠️  ユーザーが作成されていません')
      console.log('   サーバーが起動していることを確認してください')
      console.log('   pnpm run dev:server でサーバーを起動してから再実行してください')
    }
  }

  console.log('\n🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
