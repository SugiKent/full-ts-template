/**
 * インラインスタイルの使用を検出するルール
 * 静的なインラインスタイルは禁止、Tailwind CSS を使用すべき
 * 動的な値（変数、テンプレートリテラル）を使用するケースは許可
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

interface Violation {
  file: string
  line: number
  content: string
}

function getAllTsxFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', '.git', 'coverage'].includes(file)) {
        getAllTsxFiles(filePath, fileList)
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      fileList.push(filePath)
    }
  }

  return fileList
}

/**
 * 動的な値を使用しているかどうかを判定
 * - テンプレートリテラル (${...})
 * - 変数参照 (style={{ property: variable }})
 * - スプレッド ({...styles})
 * - 複数行スタイル（次の行に続く場合）
 */
function isDynamicStyle(line: string): boolean {
  // テンプレートリテラルを使用
  if (line.includes('${')) {
    return true
  }

  // スプレッド演算子を使用
  if (/style\s*=\s*\{\s*\.\.\./.test(line)) {
    return true
  }

  // style={{ variable }} のパターン（変数を直接渡している）
  if (/style\s*=\s*\{\{\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\}\}/.test(line)) {
    return true
  }

  // style={variable} のパターン（変数を直接渡している）
  if (/style\s*=\s*\{[a-zA-Z_][a-zA-Z0-9_]*\}/.test(line)) {
    return true
  }

  // style={{ で始まり }} で終わらない場合（複数行スタイル）
  if (/style\s*=\s*\{\{/.test(line) && !/\}\}/.test(line)) {
    return true
  }

  // style属性の中で変数を使用しているかチェック
  // 例: style={{ width: percent, color: entry.color }}
  // ハードコードされた値: '10px', "red", '#ffffff', 100 (数値)
  const styleMatch = line.match(/style\s*=\s*\{\{([^}]+)\}\}/)
  if (styleMatch) {
    const styleContent = styleMatch[1]
    if (styleContent === undefined) return false
    // プロパティ: 値 のペアを抽出
    const properties = styleContent.split(',')

    for (const prop of properties) {
      const colonIndex = prop.indexOf(':')
      if (colonIndex === -1) continue

      const value = prop.substring(colonIndex + 1).trim()

      // 値がハードコードされていない場合（変数参照）は動的
      // ハードコードされた値のパターン:
      // - 文字列リテラル: 'xxx' または "xxx"
      // - 数値: 123, 0.5
      // - undefined, null, true, false
      const isHardcoded =
        /^['"][^'"]*['"]$/.test(value) || // 文字列リテラル
        /^\d+(\.\d+)?$/.test(value) || // 数値
        /^(undefined|null|true|false)$/.test(value) // プリミティブ

      if (!isHardcoded && value.length > 0) {
        // 変数参照を含む場合は動的
        return true
      }
    }
  }

  return false
}

export function checkInlineStyles(): { hasError: boolean; violations: Violation[] } {
  const projectRoot = process.cwd()
  const clientPath = path.join(projectRoot, 'src', 'client')

  if (!fs.existsSync(clientPath)) {
    console.log('src/client directory not found')
    return { hasError: false, violations: [] }
  }

  const allFiles = getAllTsxFiles(clientPath)

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

    return true
  })

  const violations: Violation[] = []

  // style属性のパターンを検出
  const inlineStylePattern = /\bstyle\s*=\s*\{/

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

        // インポート文は除外
        if (line.trim().startsWith('import')) {
          continue
        }

        if (inlineStylePattern.test(line)) {
          // 動的な値を使用している場合は許可
          if (isDynamicStyle(line)) {
            continue
          }

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

export function reportInlineStyleViolations(violations: Violation[]): void {
  console.error('❌ 静的なインラインスタイルの使用が検出されました\n')
  console.error(
    'ハードコードされた style 属性は禁止されています。Tailwind CSS を使用してください\n',
  )
  console.error('例:')
  console.error('  // ❌ 禁止（静的な値）')
  console.error('  <div style={{ backgroundColor: "red", padding: "10px" }}>')
  console.error('')
  console.error('  // ✅ 推奨（Tailwind CSS）')
  console.error('  <div className="bg-red-500 p-2.5">')
  console.error('')
  console.error('  // ✅ 許可（動的な値）')
  console.error('  <div style={{ width: `$' + '{progress}%` }}>')
  console.error('  <div style={{ color: entry.color }}>')
  console.error('')
  console.error('違反箇所:')
  for (const violation of violations) {
    console.error(`  - ${violation.file}:${violation.line}`)
    console.error(`    ${violation.content}`)
  }
  console.error('')
  console.error('ℹ️  Tailwind CSS の使用方法については @docs/FRONTEND.md を参照してください')
  console.error('')
}
