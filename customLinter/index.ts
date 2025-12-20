import { checkFetchUsageInClient, reportFetchUsageViolations } from './check-fetch-usage.js'
/**
 * カスタムLinterのエントリーポイント
 * 各種lintルールを実行し、結果を集約する
 */
import { checkPrismaDirectAccess, reportPrismaAccessViolations } from './check-prisma-access.js'

async function main() {
  console.log('🔍 Running custom linter...\n')

  let hasErrors = false

  // Prisma直接アクセスチェック
  console.log('Checking Prisma model direct access...')
  const prismaResult = checkPrismaDirectAccess()
  if (prismaResult.hasError) {
    hasErrors = true
    reportPrismaAccessViolations(prismaResult.violations)
  } else {
    console.log('✅ No Prisma direct access violations found\n')
  }

  // src/client での fetch 使用チェック
  console.log('Checking fetch usage in src/client...')
  const fetchResult = checkFetchUsageInClient()
  if (fetchResult.hasError) {
    hasErrors = true
    reportFetchUsageViolations(fetchResult.violations)
  } else {
    console.log('✅ No fetch usage violations found in src/client\n')
  }

  if (hasErrors) {
    console.error('❌ Custom linter found violations')
    process.exit(1)
  } else {
    console.log('✅ All custom lint checks passed')
  }
}

main().catch((error) => {
  console.error('Custom linter failed:', error)
  process.exit(1)
})
