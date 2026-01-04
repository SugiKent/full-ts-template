/**
 * i18n JSON 構造整合性チェック
 *
 * 各言語の翻訳ファイル間でJSON構造（キーの位置・順序）が一致しているかを検証します
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SUPPORTED_LANGUAGES } from '../packages/shared/src/config/i18n.js'

const LOCALES_DIR = 'apps/client/src/locales'

type JsonObject = { [key: string]: unknown }

interface I18nViolation {
  type: 'structure' | 'file-set' | 'key-order'
  message: string
}

export interface I18nCheckResult {
  hasError: boolean
  violations: I18nViolation[]
}

/**
 * JSONオブジェクトのキーを再帰的に取得（深さ優先）
 */
function getKeyPaths(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) {
    return [prefix]
  }

  const paths: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      paths.push(...getKeyPaths(value, fullPath))
    } else {
      paths.push(fullPath)
    }
  }

  return paths
}

/**
 * JSONキーの順序を含めた文字列表現を取得（検証用）
 */
function getStructureSignature(obj: unknown, indent = 0): string {
  if (typeof obj !== 'object' || obj === null) {
    return ''
  }

  const lines: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const indentStr = '  '.repeat(indent)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      lines.push(`${indentStr}${key}:`)
      lines.push(getStructureSignature(value, indent + 1))
    } else {
      lines.push(`${indentStr}${key}`)
    }
  }

  return lines.join('\n')
}

/**
 * 2つのJSON構造を比較
 */
function compareStructures(
  file1: string,
  obj1: JsonObject,
  file2: string,
  obj2: JsonObject,
): I18nViolation[] {
  const violations: I18nViolation[] = []

  // キーパスの取得
  const paths1 = getKeyPaths(obj1)
  const paths2 = getKeyPaths(obj2)

  const set1 = new Set(paths1)
  const set2 = new Set(paths2)

  // 欠けているキーをチェック
  for (const path of set1) {
    if (!set2.has(path)) {
      violations.push({
        type: 'structure',
        message: `Key "${path}" exists in ${file1} but not in ${file2}`,
      })
    }
  }

  for (const path of set2) {
    if (!set1.has(path)) {
      violations.push({
        type: 'structure',
        message: `Key "${path}" exists in ${file2} but not in ${file1}`,
      })
    }
  }

  // キーの順序をチェック
  const sig1 = getStructureSignature(obj1)
  const sig2 = getStructureSignature(obj2)

  if (sig1 !== sig2) {
    violations.push({
      type: 'key-order',
      message: `Key order differs between ${file1} and ${file2}`,
    })
  }

  return violations
}

/**
 * i18n JSONファイルの構造をチェック
 */
export async function checkI18nStructure(): Promise<I18nCheckResult> {
  const violations: I18nViolation[] = []

  try {
    // 各言語のファイルリストを取得
    const languageFiles = new Map<string, string[]>()

    for (const lang of SUPPORTED_LANGUAGES) {
      const langDir = join(LOCALES_DIR, lang)
      try {
        const files = await readdir(langDir)
        const jsonFiles = files.filter((f) => f.endsWith('.json')).sort()
        languageFiles.set(lang, jsonFiles)
      } catch (_error) {
        violations.push({
          type: 'file-set',
          message: `Failed to read directory: ${langDir}`,
        })
      }
    }

    // ファイルセットの整合性チェック
    // 最初の言語を基準言語として使用
    const baseLang = SUPPORTED_LANGUAGES[0]
    const baseFiles = languageFiles.get(baseLang)
    if (!baseFiles) {
      violations.push({
        type: 'file-set',
        message: `Base language (${baseLang}) not found`,
      })
      return { hasError: true, violations }
    }

    for (const [lang, files] of languageFiles) {
      if (lang === baseLang) continue

      const baseSet = new Set(baseFiles)
      const langSet = new Set(files)

      for (const file of baseSet) {
        if (!langSet.has(file)) {
          violations.push({
            type: 'file-set',
            message: `File "${file}" exists in ${baseLang}/ but not in ${lang}/`,
          })
        }
      }

      for (const file of langSet) {
        if (!baseSet.has(file)) {
          violations.push({
            type: 'file-set',
            message: `File "${file}" exists in ${lang}/ but not in ${baseLang}/`,
          })
        }
      }
    }

    // 各ファイルの構造チェック
    for (const filename of baseFiles) {
      const fileContents = new Map<string, JsonObject>()

      // すべての言語でファイルを読み込み
      for (const lang of SUPPORTED_LANGUAGES) {
        const filepath = join(LOCALES_DIR, lang, filename)
        try {
          const content = await readFile(filepath, 'utf-8')
          const json = JSON.parse(content) as JsonObject
          fileContents.set(lang, json)
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            violations.push({
              type: 'structure',
              message: `Failed to parse ${filepath}: ${(error as Error).message}`,
            })
          }
        }
      }

      // ペアワイズで構造を比較
      const langs = Array.from(fileContents.keys())
      for (let i = 0; i < langs.length; i++) {
        for (let j = i + 1; j < langs.length; j++) {
          const lang1 = langs[i]
          const lang2 = langs[j]
          if (lang1 === undefined || lang2 === undefined) continue
          const obj1 = fileContents.get(lang1)
          const obj2 = fileContents.get(lang2)

          if (!obj1 || !obj2) continue

          const fileViolations = compareStructures(
            `${lang1}/${filename}`,
            obj1,
            `${lang2}/${filename}`,
            obj2,
          )

          violations.push(...fileViolations)
        }
      }
    }
  } catch (error) {
    violations.push({
      type: 'structure',
      message: `Unexpected error: ${(error as Error).message}`,
    })
  }

  return {
    hasError: violations.length > 0,
    violations,
  }
}

/**
 * i18n構造違反をレポート
 */
export function reportI18nViolations(violations: I18nViolation[]): void {
  console.error(`\n❌ Found ${violations.length} i18n structure issue(s):\n`)

  const violationsByType = {
    'file-set': violations.filter((v) => v.type === 'file-set'),
    structure: violations.filter((v) => v.type === 'structure'),
    'key-order': violations.filter((v) => v.type === 'key-order'),
  }

  if (violationsByType['file-set'].length > 0) {
    console.error('📁 File Set Issues:')
    for (const violation of violationsByType['file-set']) {
      console.error(`  - ${violation.message}`)
    }
    console.error()
  }

  if (violationsByType.structure.length > 0) {
    console.error('🔑 Structure Issues:')
    for (const violation of violationsByType.structure) {
      console.error(`  - ${violation.message}`)
    }
    console.error()
  }

  if (violationsByType['key-order'].length > 0) {
    console.error('📋 Key Order Issues:')
    for (const violation of violationsByType['key-order']) {
      console.error(`  - ${violation.message}`)
    }
    console.error()
  }
}
