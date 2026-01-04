/**
 * TypeScript 型チェック回避コメントの使用を検出するルール
 * @ts-expect-error, @ts-nocheck, @ts-expect-error は禁止
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

interface Violation {
  file: string
  line: number
  content: string
  type: '@ts-ignore' | '@ts-nocheck' | '@ts-expect-error'
}

function getAllTsFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', '.git', 'coverage'].includes(file)) {
        getAllTsFiles(filePath, fileList)
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath)
    }
  }

  return fileList
}

export function checkTsIgnore(): { hasError: boolean; violations: Violation[] } {
  const projectRoot = process.cwd()
  const srcPath = path.join(projectRoot, 'src')

  if (!fs.existsSync(srcPath)) {
    console.log('src directory not found')
    return { hasError: false, violations: [] }
  }

  const allFiles = getAllTsFiles(srcPath)

  // テストファイルも含めてチェック（型安全性は全体で守るべき）
  const targetFiles = allFiles.filter((file) => {
    const relativePath = path.relative(projectRoot, file)

    // 型定義ファイルは除外
    if (relativePath.endsWith('.d.ts')) {
      return false
    }

    return true
  })

  const violations: Violation[] = []

  // @ts-expect-error, @ts-nocheck, @ts-expect-error を検出
  const tsIgnorePattern = /@ts-ignore/
  const tsNocheckPattern = /@ts-nocheck/
  const tsExpectErrorPattern = /@ts-expect-error/

  for (const file of targetFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8')
      const lines = content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line === undefined) continue
        const relativePath = path.relative(projectRoot, file)

        if (tsIgnorePattern.test(line)) {
          violations.push({
            file: relativePath,
            line: i + 1,
            content: line.trim(),
            type: '@ts-ignore',
          })
        }

        if (tsNocheckPattern.test(line)) {
          violations.push({
            file: relativePath,
            line: i + 1,
            content: line.trim(),
            type: '@ts-nocheck',
          })
        }

        if (tsExpectErrorPattern.test(line)) {
          violations.push({
            file: relativePath,
            line: i + 1,
            content: line.trim(),
            type: '@ts-expect-error',
          })
        }
      }
    } catch (_error) {
      console.warn(`Failed to read file: ${file}`)
    }
  }

  return {
    hasError: violations.length > 0,
    violations,
  }
}

export function reportTsIgnoreViolations(violations: Violation[]): void {
  console.error('❌ TypeScript 型チェック回避コメントが検出されました\n')
  console.error('型チェックを無効化するコメントは禁止されています\n')
  console.error('型エラーを正しく修正してください\n')

  const byType = {
    '@ts-ignore': violations.filter((v) => v.type === '@ts-ignore'),
    '@ts-nocheck': violations.filter((v) => v.type === '@ts-nocheck'),
    '@ts-expect-error': violations.filter((v) => v.type === '@ts-expect-error'),
  }

  if (byType['@ts-ignore'].length > 0) {
    console.error('🚫 @ts-ignore:')
    for (const violation of byType['@ts-ignore']) {
      console.error(`  - ${violation.file}:${violation.line}`)
      console.error(`    ${violation.content}`)
    }
    console.error('')
  }

  if (byType['@ts-nocheck'].length > 0) {
    console.error('🚫 @ts-nocheck:')
    for (const violation of byType['@ts-nocheck']) {
      console.error(`  - ${violation.file}:${violation.line}`)
      console.error(`    ${violation.content}`)
    }
    console.error('')
  }

  if (byType['@ts-expect-error'].length > 0) {
    console.error('🚫 @ts-expect-error:')
    for (const violation of byType['@ts-expect-error']) {
      console.error(`  - ${violation.file}:${violation.line}`)
      console.error(`    ${violation.content}`)
    }
    console.error('')
  }

  console.error('ℹ️  型エラーが発生する場合は、正しい型定義を追加してください')
  console.error('')
}
