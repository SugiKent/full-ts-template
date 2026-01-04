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

  // お問い合わせ関連
  await prisma.contactMessage.deleteMany({})
  await prisma.contactThread.deleteMany({})
  console.log('  ✓ Deleted all contact threads and messages')

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

// サンプルお問い合わせデータ
const sampleContactThreads = [
  {
    category: 'technical',
    subject: 'ログインができません',
    status: 'open',
    messages: [
      {
        senderType: 'user',
        content:
          'パスワードを入力してもログインできません。何度試しても同じエラーが表示されます。助けていただけますか？',
        isRead: true,
      },
      {
        senderType: 'admin',
        content:
          'お問い合わせありがとうございます。パスワードリセットをお試しいただけますか？ログイン画面の「パスワードを忘れた方」リンクからリセットできます。',
        isRead: true,
      },
      {
        senderType: 'user',
        content: 'リセットメールが届きました！ありがとうございます。',
        isRead: false,
      },
    ],
  },
  {
    category: 'feature_request',
    subject: 'ダークモードの実装をお願いします',
    status: 'in_progress',
    messages: [
      {
        senderType: 'user',
        content:
          '夜間に使用することが多いので、ダークモードがあると目に優しくて助かります。ご検討いただけると嬉しいです。',
        isRead: true,
      },
      {
        senderType: 'admin',
        content:
          '貴重なご意見ありがとうございます。ダークモードは現在開発ロードマップに追加しており、次のメジャーアップデートでの実装を予定しています。',
        isRead: true,
      },
    ],
  },
  {
    category: 'billing',
    subject: '請求書の再発行について',
    status: 'resolved',
    messages: [
      {
        senderType: 'user',
        content: '先月分の請求書を紛失してしまいました。再発行していただくことは可能でしょうか？',
        isRead: true,
      },
      {
        senderType: 'admin',
        content:
          '承知いたしました。ご登録のメールアドレス宛に請求書を再送付いたします。数分以内に届くかと思いますので、ご確認ください。',
        isRead: true,
      },
      {
        senderType: 'user',
        content: '届きました！迅速なご対応ありがとうございました。',
        isRead: true,
      },
      {
        senderType: 'admin',
        content:
          'ご確認いただきありがとうございます。他にご不明点がございましたらお気軽にお問い合わせください。',
        isRead: true,
      },
    ],
  },
  {
    category: 'other',
    subject: 'サービスについての質問',
    status: 'open',
    messages: [
      {
        senderType: 'user',
        content: '法人での利用を検討しています。チームプランの詳細について教えていただけますか？',
        isRead: false,
      },
    ],
  },
]

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

  // テストユーザーの作成
  console.log('\n👤 Creating test users...')
  const testUser1 = await prisma.user.create({
    data: {
      email: 'user@example.com',
      name: 'テストユーザー',
      role: 'user',
      emailVerified: true,
    },
  })
  console.log('  ✓ Created test user: user@example.com')

  const testUser2 = await prisma.user.create({
    data: {
      email: 'user2@example.com',
      name: '山田太郎',
      role: 'user',
      emailVerified: true,
    },
  })
  console.log('  ✓ Created test user: user2@example.com')

  await prisma.user.create({
    data: {
      email: 'user3@example.com',
      name: '鈴木花子',
      role: 'user',
      emailVerified: false, // 未認証ユーザー
    },
  })
  console.log('  ✓ Created test user: user3@example.com (unverified)')

  // サンプルお問い合わせの作成
  console.log('\n📝 Creating sample contact threads...')
  const testUsers = [testUser1, testUser2, testUser1, testUser2]

  for (const [i, threadData] of sampleContactThreads.entries()) {
    const user = testUsers[i]
    if (!user) continue

    const thread = await prisma.contactThread.create({
      data: {
        userId: user.id,
        category: threadData.category,
        subject: threadData.subject,
        status: threadData.status,
      },
    })

    // メッセージを作成
    for (const messageData of threadData.messages) {
      await prisma.contactMessage.create({
        data: {
          threadId: thread.id,
          senderType: messageData.senderType,
          senderId: messageData.senderType === 'user' ? user.id : null,
          content: messageData.content,
          isRead: messageData.isRead,
        },
      })
    }

    console.log(`  ✓ Created contact thread: ${threadData.subject}`)
  }

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
