/**
 * enum の使用を検出するルール
 * enum は禁止されており、const assertion を使用すべき
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

interface Violation {
  file: string
  line: number
  content: string
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

export function checkEnumUsage(): { hasError: boolean; violations: Violation[] } {
  const projectRoot = process.cwd()
  const srcPath = path.join(projectRoot, 'src')

  if (!fs.existsSync(srcPath)) {
    console.log('src directory not found')
    return { hasError: false, violations: [] }
  }

  const allFiles = getAllTsFiles(srcPath)

  const targetFiles = allFiles.filter((file) => {
    const relativePath = path.relative(projectRoot, file)

    // テストファイルは除外
    if (
      relativePath.includes('.test.') ||
      relativePath.includes('.spec.') ||
      relativePath.includes('__tests__')
    ) {
      return false
    }

    // 型定義ファイルは除外
    if (relativePath.endsWith('.d.ts')) {
      return false
    }

    return true
  })

  const violations: Violation[] = []

  // enum 宣言パターンを検出
  // export enum, enum, const enum など
  const enumPattern = /^\s*(export\s+)?(const\s+)?enum\s+\w+/

  for (const file of targetFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8')
      const lines = content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line === undefined) continue

        // コメント行は除外
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
          continue
        }

        if (enumPattern.test(line)) {
          const relativePath = path.relative(projectRoot, file)
          violations.push({
            file: relativePath,
            line: i + 1,
            content: line.trim(),
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

export function reportEnumViolations(violations: Violation[]): void {
  console.error('❌ enum の使用が検出されました\n')
  console.error('enum は禁止されています。代わりに const assertion を使用してください\n')
  console.error('例:')
  console.error('  // ❌ 禁止')
  console.error('  enum Status { Active = "active", Inactive = "inactive" }')
  console.error('')
  console.error('  // ✅ 推奨')
  console.error('  const Status = { Active: "active", Inactive: "inactive" } as const')
  console.error('  type Status = (typeof Status)[keyof typeof Status]')
  console.error('')
  console.error('違反箇所:')
  for (const violation of violations) {
    console.error(`  - ${violation.file}:${violation.line}`)
    console.error(`    ${violation.content}`)
  }
  console.error('')
}
