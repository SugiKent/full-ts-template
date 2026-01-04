/**
 * ページごとのSEOメタデータを設定するコンポーネント
 *
 * react-helmet-asyncを使用してhead要素を動的に更新する
 */
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

interface PageMetaProps {
  /** ページタイトル */
  title: string
  /** ページの説明文 */
  description: string
  /** OGP画像のパス */
  ogImage?: string
  /** OGPタイプ（デフォルト: website） */
  ogType?: 'website' | 'article'
  /** ページのパス（canonical URLに使用） */
  path?: string
  /** 検索エンジンにインデックスさせない場合はtrue */
  noIndex?: boolean
  /** JSON-LD構造化データ */
  jsonLd?: Record<string, unknown>
}

/**
 * アプリのベースURLを取得
 */
function getAppUrl(): string {
  return import.meta.env.VITE_APP_URL || 'http://localhost:5173'
}

export function PageMeta({
  title,
  description,
  ogImage,
  ogType = 'website',
  path = '/',
  noIndex = false,
  jsonLd,
}: PageMetaProps) {
  const { i18n } = useTranslation()
  const appUrl = getAppUrl()
  const fullUrl = `${appUrl}${path}`
  const ogImageUrl = ogImage ? `${appUrl}${ogImage}` : undefined
  const locale = i18n.language === 'ja' ? 'ja_JP' : 'en_US'

  return (
    <Helmet>
      {/* 基本メタデータ */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}
      <meta property="og:locale" content={locale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImageUrl && <meta name="twitter:image" content={ogImageUrl} />}

      {/* JSON-LD構造化データ */}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  )
}
