/**
 * src/client 配下での fetch 使用を検出するルール
 * クライアントコードでは oRPC を使用すべきで、直接 fetch を使用してはいけない
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
      // node_modules, dist, .git などは除外
      if (!['node_modules', 'dist', '.git', 'coverage'].includes(file)) {
        getAllTsFiles(filePath, fileList)
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath)
    }
  }

  return fileList
}

export function checkFetchUsageInClient(): { hasError: boolean; violations: Violation[] } {
  const projectRoot = process.cwd()
  const clientPath = path.join(projectRoot, 'src', 'client')

  if (!fs.existsSync(clientPath)) {
    console.log('src/client directory not found')
    return { hasError: false, violations: [] }
  }

  const allFiles = getAllTsFiles(clientPath)

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

    // oRPC クライアント内部実装は除外
    if (relativePath.includes('orpc-client.ts') && relativePath.includes('src/client/services/')) {
      return false
    }

    // 認証フックは Better Auth への直接 fetch が必要なため除外
    if (relativePath.includes('src/client/hooks/useUserAuth.ts')) {
      return false
    }
    if (relativePath.includes('src/client/hooks/useAdminAuth.ts')) {
      return false
    }

    // 特殊なクライアントアプリは除外（独自の認証フローを持つ場合など）
    // プロジェクトに応じて追加してください
    // if (relativePath.startsWith('src/client/special-app/')) {
    //   return false
    // }

    return true
  })

  const violations: Violation[] = []

  // fetch 使用パターンを検出
  // window.fetch, global.fetch, fetch() などを検出
  // ただし、import 文やコメントは除外
  const fetchPattern = /\b(window\.)?fetch\s*\(/g

  for (const file of targetFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8')
      const lines = content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line === undefined) continue

        // インポート文は除外
        if (line.trim().startsWith('import')) {
          continue
        }

        // エクスポート文のtype定義は除外（例: export type FetchResult）
        if (line.trim().startsWith('export type') || line.trim().startsWith('type ')) {
          continue
        }

        // コメント行は除外
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
          continue
        }

        // fetch の使用を検出
        if (fetchPattern.test(line)) {
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

export function reportFetchUsageViolations(violations: Violation[]): void {
  console.error('⚠️  src/client 配下で fetch の使用が検出されました\n')
  console.error('クライアントコードでは oRPC を使用してください\n')
  console.error('違反箇所:')
  for (const violation of violations) {
    console.error(`  - ${violation.file}:${violation.line}`)
    console.error(`    ${violation.content}`)
  }
  console.error('')
  console.error('ℹ️  oRPC の使用方法については @docs/FRONTEND.md を参照してください')
  console.error('')
}
