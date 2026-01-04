/**
 * Prisma モデルへの直接アクセスを検出するルール
 * src/server/repositories/ 配下以外でのPrismaモデルへのアクセスを禁止
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

export function checkPrismaDirectAccess(): { hasError: boolean; violations: Violation[] } {
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

    // src/server/repositories/ 配下は除外
    if (relativePath.startsWith('src/server/repositories/')) {
      return false
    }

    return true
  })

  const violations: Violation[] = []

  // Prismaモデルへの直接アクセスパターンを検出
  // 例: prisma.user.findMany(), db.endUser.create() など
  // Note: プロジェクトのスキーマに合わせてモデル名を追加してください
  const prismaAccessPattern =
    /(prisma|db)\.(user|endUser|organization|appointment|message|session|account|verification)\./gi

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
        // コメント行は除外
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
          continue
        }

        if (prismaAccessPattern.test(line)) {
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

export function reportPrismaAccessViolations(violations: Violation[]): void {
  console.error('❌ Prisma モデルへの直接アクセスが検出されました\n')
  console.error(
    'Prisma モデルへのアクセスは src/server/repositories/ 配下のRepositoryクラス経由で行ってください\n',
  )
  console.error('違反箇所:')
  for (const violation of violations) {
    console.error(`  - ${violation.file}:${violation.line}`)
    console.error(`    ${violation.content}`)
  }
  console.error('')
}
