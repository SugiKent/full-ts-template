/**
 * ハードコードされたテキストを検出するルール
 * src/client 配下で日本語/英語/中国語テキストが直接記述されている場合を検出
 * i18n 翻訳キーを使用すべき
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

interface Violation {
  file: string
  line: number
  content: string
  text: string
  type: 'jsx-text' | 'jsx-attribute' | 'js-literal'
}

function getAllTsxFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', '.git', 'coverage', 'locales'].includes(file)) {
        getAllTsxFiles(filePath, fileList)
      }
    } else if (file.endsWith('.tsx')) {
      fileList.push(filePath)
    }
  }

  return fileList
}

// 日本語文字を含むかチェック（ひらがな、カタカナ、漢字）
function containsJapanese(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)
}

// 中国語文字を含むかチェック（簡体字・繁体字特有の文字）
function containsChinese(text: string): boolean {
  // 日本語と共通の漢字は除外し、中国語特有のパターンをチェック
  return /[\u4E00-\u9FAF]/.test(text) && !containsJapanese(text)
}

// 英語の意味のある文章かチェック（単語2つ以上）
function containsMeaningfulEnglish(text: string): boolean {
  // 単純な英単語や識別子は除外
  const words = text.trim().split(/\s+/)
  if (words.length < 2) {
    return false
  }

  // プログラミング関連の文字列は除外
  if (
    /^[A-Z_]+$/.test(text) || // 定数
    /^[a-z]+[A-Z]/.test(text) || // camelCase
    /^[A-Z][a-z]+[A-Z]/.test(text) // PascalCase
  ) {
    return false
  }

  return true
}

// i18n対象のテキストかチェック
function isI18nTargetText(text: string): boolean {
  // 空白のみ、または非常に短いテキストは除外
  if (text.length < 2) {
    return false
  }

  // 数字のみは除外
  if (/^\d+$/.test(text)) {
    return false
  }

  // 日本語を含む場合は対象
  if (containsJapanese(text)) {
    return true
  }

  // 中国語を含む場合は対象
  if (containsChinese(text)) {
    return true
  }

  // 意味のある英語文章の場合は対象
  if (containsMeaningfulEnglish(text)) {
    return true
  }

  return false
}

// 行全体を除外すべきパターン（コメント、import文など）
const LINE_EXCLUDED_PATTERNS = [
  // コメント
  /^\s*\/\//,
  /^\s*\*/,
  /^\s*\/\*/,
  // import文
  /^\s*import\s/,
  // console.log / console.error
  /console\.(log|error|warn|info)/,
  // throw new Error
  /throw\s+new\s+(Error|TypeError|RangeError)/,
]

// JSX属性として除外すべき属性名
const EXCLUDED_JSX_ATTRIBUTES = [
  'className',
  'class',
  'data-testid',
  'key',
  'id',
  'name',
  'type',
  'href',
  'src',
  'alt', // a11y用だが、翻訳対象にすべき場合もある（低優先度）
  'aria-label', // a11y用だが、翻訳対象にすべき場合もある（低優先度）
  'aria-describedby',
  'aria-labelledby',
  'htmlFor',
  'role',
  'rel',
  'target',
  'method',
  'action',
  'encType',
  'autoComplete',
  'inputMode',
  'pattern',
  'accept',
  'maxLength',
  'minLength',
  'max',
  'min',
  'step',
  'cols',
  'rows',
  'tabIndex',
  'disabled',
  'required',
  'readOnly',
  'checked',
  'selected',
  'multiple',
  'autoFocus',
  'spellCheck',
  'wrap',
  'dir',
  'lang',
  'translate',
  'contentEditable',
  'draggable',
  'hidden',
  'slot',
  'is',
  'xmlns',
  'xmlnsXlink',
  'viewBox',
  'fill',
  'stroke',
  'strokeWidth',
  'strokeLinecap',
  'strokeLinejoin',
  'd',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x',
  'y',
  'x1',
  'x2',
  'y1',
  'y2',
  'width',
  'height',
  'transform',
  'points',
  'clipRule',
  'fillRule',
  'clipPath',
  'mask',
  'filter',
  'gradientUnits',
  'gradientTransform',
  'spreadMethod',
  'offset',
  'stopColor',
  'stopOpacity',
  'opacity',
  'preserveAspectRatio',
  // SVG animation/stroke attributes
  'strokeDasharray',
  'strokeDashoffset',
  // Meta tag attributes
  'content',
]

// JSX属性として検知対象の属性名
const TARGET_JSX_ATTRIBUTES = [
  'title',
  'description',
  'placeholder',
  'label',
  'error',
  'errorMessage',
  'helperText',
  'hint',
  'tooltip',
  'message',
  'text',
  'content',
  'children',
  'value', // 一部のケースでは翻訳対象
]

export function checkHardcodedText(): { hasError: boolean; violations: Violation[] } {
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

    // Storybook ファイルは除外
    if (relativePath.includes('.stories.')) {
      return false
    }

    // 管理者画面は除外（i18n対象外）
    if (
      relativePath.includes('pages/admin/') ||
      relativePath.includes('pages\\admin\\') ||
      relativePath.includes('components/admin/') ||
      relativePath.includes('components\\admin\\')
    ) {
      return false
    }

    return true
  })

  const violations: Violation[] = []

  for (const file of targetFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8')
      const lines = content.split('\n')
      const relativePath = path.relative(projectRoot, file)

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line === undefined) continue

        // 行全体を除外すべきパターンにマッチする場合はスキップ
        if (LINE_EXCLUDED_PATTERNS.some((pattern) => pattern.test(line))) {
          continue
        }

        // 1. JSX内のテキスト `>テキスト<` を検出
        checkJsxText(line, i, relativePath, violations)

        // 2. JSX属性値 `属性名="テキスト"` を検出
        checkJsxAttributes(line, i, relativePath, violations)

        // 3. JSX式内の文字列リテラル `{'テキスト'}` や `{cond ? 'A' : 'B'}` を検出
        checkJsLiterals(line, i, relativePath, violations)
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

/**
 * JSX内のテキスト `>テキスト<` を検出
 */
function checkJsxText(
  line: string,
  lineIndex: number,
  filePath: string,
  violations: Violation[],
): void {
  // >テキスト< のパターン（波括弧を含まない）
  const jsxTextPattern = />([^<>{]+)</g

  const matches = line.matchAll(jsxTextPattern)
  for (const match of matches) {
    const matchedText = match[1]
    if (matchedText === undefined) continue
    const text = matchedText.trim()

    // 変数展開のみの場合は除外
    if (/^\{[^}]+\}$/.test(text)) {
      continue
    }

    // JavaScript演算子を含む場合は除外
    if (/&&|\|\||===|!==|==|!=/.test(text)) {
      continue
    }

    // JavaScript式のような文字列を除外
    if (/\w+\s*[-+*/]\s*\w+/.test(text) || /\w+\.\w+/.test(text)) {
      continue
    }

    if (isI18nTargetText(text)) {
      violations.push({
        file: filePath,
        line: lineIndex + 1,
        content: line.trim(),
        text,
        type: 'jsx-text',
      })
    }
  }
}

/**
 * JSX属性値 `属性名="テキスト"` を検出
 */
function checkJsxAttributes(
  line: string,
  lineIndex: number,
  filePath: string,
  violations: Violation[],
): void {
  // 属性名="値" または 属性名='値' のパターン
  const attrPattern = /\b([a-zA-Z][a-zA-Z0-9]*)\s*=\s*["']([^"']+)["']/g

  const matches = line.matchAll(attrPattern)
  for (const match of matches) {
    const attrName = match[1]
    const attrValueRaw = match[2]
    if (attrName === undefined || attrValueRaw === undefined) continue
    const attrValue = attrValueRaw.trim()

    // 除外すべき属性名の場合はスキップ
    if (EXCLUDED_JSX_ATTRIBUTES.includes(attrName)) {
      continue
    }

    // 検知対象の属性名、または対象テキストを含む場合
    if (TARGET_JSX_ATTRIBUTES.includes(attrName) || isI18nTargetText(attrValue)) {
      if (isI18nTargetText(attrValue)) {
        violations.push({
          file: filePath,
          line: lineIndex + 1,
          content: line.trim(),
          text: `${attrName}="${attrValue}"`,
          type: 'jsx-attribute',
        })
      }
    }
  }
}

/**
 * JSX式内の文字列リテラル `{'テキスト'}` や `{cond ? 'A' : 'B'}` を検出
 */
function checkJsLiterals(
  line: string,
  lineIndex: number,
  filePath: string,
  violations: Violation[],
): void {
  // 波括弧内の文字列リテラル（シングル/ダブルクォート）
  // 例: {'テキスト'}, {condition ? 'A' : 'B'}, {`テンプレート`}
  const stringLiteralPattern = /['"`]([^'"`]+)['"`]/g

  // JSX式内かどうかを簡易判定（{ を含む行）
  if (!line.includes('{')) {
    return
  }

  // setError, setFormError などのエラーセッターは検知対象
  const isErrorSetter = /set\w*Error\s*\(/.test(line)

  const matches = line.matchAll(stringLiteralPattern)
  for (const match of matches) {
    const matchedText = match[1]
    if (matchedText === undefined) continue
    const text = matchedText.trim()

    // t('key') のような翻訳関数呼び出しは除外
    if (/t\(['"`]/.test(line.slice(0, match.index))) {
      continue
    }

    // console.log, console.error の引数は除外
    if (/console\.\w+\s*\(/.test(line)) {
      continue
    }

    // import文のパスは除外
    if (/from\s+['"`]/.test(line) || /import\s*\(/.test(line)) {
      continue
    }

    // URLやパスは除外
    if (/^(https?:\/\/|\/[a-z])/i.test(text)) {
      continue
    }

    // CSS関連の値は除外
    if (/^(px|em|rem|%|vh|vw|#[0-9a-f]+|rgb|rgba|hsl|hsla)/i.test(text)) {
      continue
    }

    // 正規表現は除外
    if (/^\^|\\/.test(text)) {
      continue
    }

    // キーの参照（例: t('key')）は除外
    if (/^[a-z][a-zA-Z0-9_.:-]+$/.test(text) && text.includes('.')) {
      continue
    }

    // Tailwind CSSクラス名パターンは除外
    if (
      /^(text-|bg-|flex|grid|px-|py-|pt-|pb-|pl-|pr-|mt-|mb-|ml-|mr-|mx-|my-|w-|h-|min-|max-|gap-|space-|font-|rounded|border|shadow|opacity|scale|translate|rotate|transition|duration|ease|hover:|focus:|active:|disabled:|sm:|md:|lg:|xl:|2xl:|dark:)/.test(
        text,
      )
    ) {
      continue
    }

    // className内のスペース区切りのCSSクラス名は除外
    if (/^[a-z0-9-]+(\s+[a-z0-9-]+)*$/.test(text) && text.includes('-')) {
      continue
    }

    // テンプレートリテラル変数展開のパターンは除外（${...}を含む）
    if (text.includes('${') || text.startsWith('$')) {
      continue
    }

    // コロンやオブジェクトリテラルのパターンは除外
    if (/^,?\s*(key|value|status|frequency|type):/.test(text)) {
      continue
    }

    // 三項演算子の構文フラグメントは除外（") ?"、": diff === 0 ?" など）
    if (/^[)}\s]*\?$/.test(text) || /^:\s*\w+\s*(===|!==|==|!=|>|<|>=|<=)\s*\w+\s*\?$/.test(text)) {
      continue
    }

    // CSSアニメーション/トランジション値は除外
    if (
      /^(stroke-dashoffset|transform|opacity|scale|translate|rotate)\s+[\d.]+s?\s+(linear|ease|ease-in|ease-out|ease-in-out)?/.test(
        text,
      )
    ) {
      continue
    }

    // Tailwind CSSクラスのテンプレートリテラル断片は除外（"} font-medium text-gray-900" など）
    if (
      /^[}\s]+[\w-]+(\s+[\w-]+)*$/.test(text) &&
      /\s+(text-|bg-|font-|rounded|border|shadow|flex|grid|px-|py-|pt-|pb-|pl-|pr-|mt-|mb-|ml-|mr-|mx-|my-|w-|h-|gap-|space-|items-|justify-|overflow-|cursor-|opacity-|scale-|translate-|rotate-|transition|duration|ease|hover:|focus:|active:|disabled:|sm:|md:|lg:|xl:|2xl:|dark:)/.test(
        text,
      )
    ) {
      continue
    }

    if (isI18nTargetText(text)) {
      // エラーセッターの場合、または一般的なJSX式内の場合
      if (isErrorSetter || /\?\s*['"`]|:\s*['"`]/.test(line)) {
        violations.push({
          file: filePath,
          line: lineIndex + 1,
          content: line.trim(),
          text,
          type: 'js-literal',
        })
      }
    }
  }
}

export function reportHardcodedTextViolations(violations: Violation[]): void {
  console.error('❌ ハードコードされたテキストが検出されました\n')
  console.error('UI テキストは i18n 翻訳キーを使用してください\n')
  console.error('例:')
  console.error('  // ❌ 禁止')
  console.error('  <button>送信する</button>')
  console.error('  <p>Welcome to our app</p>')
  console.error('  <Input placeholder="入力してください" />')
  console.error("  {error ? 'エラーが発生しました' : null}")
  console.error('')
  console.error('  // ✅ 推奨')
  console.error("  <button>{t('common.submit')}</button>")
  console.error("  <p>{t('home.welcome')}</p>")
  console.error("  <Input placeholder={t('form.inputPlaceholder')} />")
  console.error("  {error ? t('error.generic') : null}")
  console.error('')
  console.error('違反箇所:')

  // タイプ別にグループ化
  const groupedViolations = {
    'jsx-text': violations.filter((v) => v.type === 'jsx-text'),
    'jsx-attribute': violations.filter((v) => v.type === 'jsx-attribute'),
    'js-literal': violations.filter((v) => v.type === 'js-literal'),
  }

  if (groupedViolations['jsx-text'].length > 0) {
    console.error('\n  [JSXテキスト]')
    for (const violation of groupedViolations['jsx-text']) {
      console.error(`    - ${violation.file}:${violation.line}`)
      console.error(`      テキスト: "${violation.text}"`)
    }
  }

  if (groupedViolations['jsx-attribute'].length > 0) {
    console.error('\n  [JSX属性値]')
    for (const violation of groupedViolations['jsx-attribute']) {
      console.error(`    - ${violation.file}:${violation.line}`)
      console.error(`      属性: ${violation.text}`)
    }
  }

  if (groupedViolations['js-literal'].length > 0) {
    console.error('\n  [JavaScript文字列リテラル]')
    for (const violation of groupedViolations['js-literal']) {
      console.error(`    - ${violation.file}:${violation.line}`)
      console.error(`      テキスト: "${violation.text}"`)
    }
  }

  console.error('')
  console.error('ℹ️  i18n の設定は src/client/locales/ を参照してください')
  console.error('')
}
