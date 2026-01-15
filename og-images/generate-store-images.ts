/**
 * ストアマーケティング画像生成スクリプト
 *
 * App Store / Google Play 用のスクリーンショット画像を生成
 * HTML+CSSテンプレートからPlaywrightでスクリーンショットを撮影し、PNG画像として出力
 *
 * Usage:
 *   pnpm run generate:store
 */

import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 出力サイズ設定
 * App Store: 6.5インチ iPhone用 (1284 x 2778)
 * Google Play: Phone (1080 x 1920)
 */
interface OutputSize {
  name: string
  width: number
  height: number
  folder: string
}

const OUTPUT_SIZES: OutputSize[] = [
  {
    name: 'iOS App Store (6.5")',
    width: 1284,
    height: 2778,
    folder: 'ios',
  },
  {
    name: 'Google Play',
    width: 1080,
    height: 1920,
    folder: 'android',
  },
]

/**
 * 画面テンプレート設定
 */
interface ScreenTemplate {
  id: string
  name: string
  htmlFile: string
  sortOrder: number
}

const SCREEN_TEMPLATES: ScreenTemplate[] = [
  {
    id: 'home',
    name: 'ホーム画面',
    htmlFile: 'templates/store/01-home.html',
    sortOrder: 1,
  },
  {
    id: 'categories',
    name: 'カテゴリ選択',
    htmlFile: 'templates/store/02-categories.html',
    sortOrder: 2,
  },
  {
    id: 'steps',
    name: 'AIステップ提案',
    htmlFile: 'templates/store/03-steps.html',
    sortOrder: 3,
  },
  {
    id: 'progress',
    name: '進捗管理',
    htmlFile: 'templates/store/04-progress.html',
    sortOrder: 4,
  },
  {
    id: 'complete',
    name: '達成・シェア',
    htmlFile: 'templates/store/05-complete.html',
    sortOrder: 5,
  },
]

async function generateStoreImages(): Promise<void> {
  console.log('ストアマーケティング画像生成を開始します...\n')

  // 出力ディレクトリの作成
  const outputBaseDir = resolve(__dirname, 'output/store')
  for (const size of OUTPUT_SIZES) {
    const outputDir = resolve(outputBaseDir, size.folder)
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
      console.log(`出力ディレクトリを作成しました: ${outputDir}`)
    }
  }

  const browser = await chromium.launch()

  for (const template of SCREEN_TEMPLATES) {
    const inputPath = resolve(__dirname, template.htmlFile)

    if (!existsSync(inputPath)) {
      console.warn(`  警告: テンプレートが見つかりません: ${inputPath}`)
      continue
    }

    console.log(`\n生成中: ${template.name} (${template.id})`)
    const htmlContent = readFileSync(inputPath, 'utf-8')

    for (const size of OUTPUT_SIZES) {
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
        deviceScaleFactor: 1, // 実際のピクセル数で出力
      })

      const page = await context.newPage()

      // HTMLを読み込み、サイズ変数を注入
      const htmlWithSize = htmlContent
        .replace('{{WIDTH}}', String(size.width))
        .replace('{{HEIGHT}}', String(size.height))

      await page.setContent(htmlWithSize, { waitUntil: 'networkidle' })

      // フォント読み込みを待機
      await page.waitForTimeout(500)

      const outputPath = resolve(
        outputBaseDir,
        size.folder,
        `${String(template.sortOrder).padStart(2, '0')}-${template.id}.png`,
      )

      await page.screenshot({
        path: outputPath,
        type: 'png',
        clip: { x: 0, y: 0, width: size.width, height: size.height },
      })

      console.log(`  ✓ ${size.name}: ${outputPath}`)

      await page.close()
      await context.close()
    }
  }

  await browser.close()
  console.log('\n\n全てのストア画像生成が完了しました!')
  console.log(`出力先: ${outputBaseDir}`)
}

generateStoreImages().catch((error) => {
  console.error('エラーが発生しました:', error)
  process.exit(1)
})
