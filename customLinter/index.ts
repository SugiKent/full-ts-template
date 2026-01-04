/**
 * カスタムLinterのエントリーポイント
 * 各種lintルールを実行し、結果を集約する
 */
import { checkClassUsage, reportClassViolations } from './check-class-usage.js'
import { checkEnumUsage, reportEnumViolations } from './check-enum-usage.js'
import { checkFetchUsageInClient, reportFetchUsageViolations } from './check-fetch-usage.js'
import { checkHardcodedText, reportHardcodedTextViolations } from './check-hardcoded-text.js'
import { checkI18nStructure, reportI18nViolations } from './check-i18n-structure.js'
import { checkInlineStyles, reportInlineStyleViolations } from './check-inline-styles.js'
import { checkPrismaDirectAccess, reportPrismaAccessViolations } from './check-prisma-access.js'
import { checkTsIgnore, reportTsIgnoreViolations } from './check-ts-ignore.js'

async function main() {
  console.log('🔍 Running custom linter...\n')

  let hasErrors = false

  // ========================================
  // TypeScript 規約チェック
  // ========================================

  // enum 使用チェック
  console.log('Checking enum usage...')
  const enumResult = checkEnumUsage()
  if (enumResult.hasError) {
    hasErrors = true
    reportEnumViolations(enumResult.violations)
  } else {
    console.log('✅ No enum usage violations found\n')
  }

  // ts-ignore/nocheck/expect-error 使用チェック
  console.log('Checking @ts-ignore usage...')
  const tsIgnoreResult = checkTsIgnore()
  if (tsIgnoreResult.hasError) {
    hasErrors = true
    reportTsIgnoreViolations(tsIgnoreResult.violations)
  } else {
    console.log('✅ No @ts-ignore violations found\n')
  }

  // class 使用チェック
  console.log('Checking class usage...')
  const classResult = checkClassUsage()
  if (classResult.hasError) {
    hasErrors = true
    reportClassViolations(classResult.violations)
  } else {
    console.log('✅ No class usage violations found\n')
  }

  // ========================================
  // アーキテクチャ規約チェック
  // ========================================

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

  // ========================================
  // フロントエンド規約チェック
  // ========================================

  // インラインスタイル使用チェック
  console.log('Checking inline style usage...')
  const inlineStyleResult = checkInlineStyles()
  if (inlineStyleResult.hasError) {
    hasErrors = true
    reportInlineStyleViolations(inlineStyleResult.violations)
  } else {
    console.log('✅ No inline style violations found\n')
  }

  // ハードコードテキストチェック
  console.log('Checking hardcoded text...')
  const hardcodedTextResult = checkHardcodedText()
  if (hardcodedTextResult.hasError) {
    hasErrors = true
    reportHardcodedTextViolations(hardcodedTextResult.violations)
  } else {
    console.log('✅ No hardcoded text violations found\n')
  }

  // ========================================
  // i18n 規約チェック
  // ========================================

  // i18n JSON構造チェック
  console.log('Checking i18n JSON structure consistency...')
  const i18nResult = await checkI18nStructure()
  if (i18nResult.hasError) {
    hasErrors = true
    reportI18nViolations(i18nResult.violations)
  } else {
    console.log('✅ All i18n JSON files have consistent structure\n')
  }

  // ========================================
  // 結果サマリー
  // ========================================

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
