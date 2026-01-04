/**
 * class の使用を検出するルール
 * React Component 以外での class 使用は禁止
 * 関数・オブジェクトベースの設計を推奨
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

interface Violation {
  file: string
  line: number
  content: string
  className: string
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

// 許可されるクラス名パターン
const ALLOWED_CLASS_PATTERNS = [
  // Errorクラスの拡張は許可
  /Error$/,
  // Exceptionクラスの拡張は許可
  /Exception$/,
]

// 許可されるextendsパターン
const ALLOWED_EXTENDS_PATTERNS = [
  // React.Component, Component の拡張は許可
  /extends\s+(React\.)?(Component|PureComponent)/,
  // Error の拡張は許可
  /extends\s+Error/,
  // カスタムErrorの拡張は許可
  /extends\s+\w*Error/,
]

export function checkClassUsage(): { hasError: boolean; violations: Violation[] } {
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

  // class 宣言パターンを検出
  const classPattern = /^\s*(export\s+)?(abstract\s+)?class\s+(\w+)/

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

        const match = line.match(classPattern)
        if (match) {
          const className = match[3]
          if (className === undefined) continue

          // 許可されるクラス名パターンをチェック
          const isAllowedByName = ALLOWED_CLASS_PATTERNS.some((pattern) => pattern.test(className))

          if (isAllowedByName) {
            continue
          }

          // 許可されるextendsパターンをチェック
          // 同じ行または次の行にextendsがあるかチェック
          const extendedLine = line + (lines[i + 1] || '')
          const isAllowedByExtends = ALLOWED_EXTENDS_PATTERNS.some((pattern) =>
            pattern.test(extendedLine),
          )

          if (isAllowedByExtends) {
            continue
          }

          const relativePath = path.relative(projectRoot, file)
          violations.push({
            file: relativePath,
            line: i + 1,
            content: line.trim(),
            className,
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

export function reportClassViolations(violations: Violation[]): void {
  console.error('❌ class の使用が検出されました\n')
  console.error('React Component と Error 拡張以外での class 使用は禁止されています\n')
  console.error('関数・オブジェクトベースの設計を使用してください\n')
  console.error('例:')
  console.error('  // ❌ 禁止')
  console.error('  class UserService {')
  console.error('    findById(id: string) { ... }')
  console.error('  }')
  console.error('')
  console.error('  // ✅ 推奨')
  console.error('  const userService = {')
  console.error('    findById(id: string) { ... }')
  console.error('  }')
  console.error('')
  console.error('  // ✅ または関数として')
  console.error('  function findUserById(id: string) { ... }')
  console.error('')
  console.error('違反箇所:')
  for (const violation of violations) {
    console.error(`  - ${violation.file}:${violation.line}`)
    console.error(`    class: ${violation.className}`)
    console.error(`    ${violation.content}`)
  }
  console.error('')
}
