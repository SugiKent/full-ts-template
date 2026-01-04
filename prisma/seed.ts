/**
 * Prisma Seed スクリプト
 * サービスに必須のデータ（管理者アカウント等）のみを作成します
 *
 * テスト・開発用のサンプルデータは testData.ts を使用してください:
 *   pnpm run db:testData
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding essential data...')

  // 管理者アカウントの設定
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'

  // 管理者ユーザーが存在しない場合のみ作成
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: '管理者',
        role: 'admin',
        emailVerified: true,
      },
    })
    console.log(`✅ Created admin user: ${adminEmail}`)
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`)
  }

  console.log('\n🎉 Seeding completed!')
  console.log('\n💡 テスト・開発用データを追加するには:')
  console.log('   pnpm run db:testData')
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
