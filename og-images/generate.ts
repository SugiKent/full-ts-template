/**
 * OGP画像生成スクリプト
 *
 * HTML+CSSテンプレートからPlaywrightでスクリーンショットを撮影し、
 * PNG画像として出力する。
 *
 * Usage:
 *   pnpm run generate:og
 *   # または og-images ディレクトリ内で:
 *   pnpm run generate
 */

import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface Template {
  name: string
  input: string
  output: string
}

const templates: Template[] = [
  {
    name: 'Default',
    input: 'templates/default.html',
    output: '../src/client/public/og/default.png',
  },
  // 新しいテンプレートを追加する場合は以下のように追加:
  // {
  //   name: 'TemplateName',
  //   input: 'templates/your-template.html',
  //   output: '../src/client/public/og/your-template.png',
  // },
]

const WIDTH = 1200
const HEIGHT = 630

async function generateOgImages(): Promise<void> {
  console.log('OGP画像生成を開始します...\n')

  // 出力ディレクトリの確認
  const outputDir = resolve(__dirname, '../src/client/public/og')
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
    console.log(`出力ディレクトリを作成しました: ${outputDir}`)
  }

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2, // Retina対応で高解像度
  })

  for (const template of templates) {
    const inputPath = resolve(__dirname, template.input)
    const outputPath = resolve(__dirname, template.output)

    if (!existsSync(inputPath)) {
      console.warn(`  警告: テンプレートが見つかりません: ${inputPath}`)
      continue
    }

    console.log(`生成中: ${template.name}`)
    console.log(`  入力: ${inputPath}`)
    console.log(`  出力: ${outputPath}`)

    const htmlContent = readFileSync(inputPath, 'utf-8')
    const page = await context.newPage()

    // HTMLを直接読み込む
    await page.setContent(htmlContent, { waitUntil: 'networkidle' })

    // フォント読み込みを待機
    await page.waitForTimeout(500)

    // スクリーンショット撮影
    await page.screenshot({
      path: outputPath,
      type: 'png',
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    })

    await page.close()
    console.log(`  完了!\n`)
  }

  await browser.close()
  console.log('全てのOGP画像生成が完了しました!')
}

generateOgImages().catch((error) => {
  console.error('エラーが発生しました:', error)
  process.exit(1)
})
