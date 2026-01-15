/**
 * プリセットカテゴリー oRPC Procedures
 *
 * オンボーディング用のプリセットカテゴリーを提供
 */
import { os } from '@orpc/server'
import { PRESET_CATEGORIES } from '../../../constants/preset-categories.js'
import { createLayerLogger } from '../../../utils/logger.js'

const logger = createLayerLogger('procedure', 'preset')

// ========================================
// 出力型定義
// ========================================

interface GetCategoriesResult {
  success: true
  data: {
    categories: typeof PRESET_CATEGORIES
  }
}

// ========================================
// Procedures
// ========================================

/**
 * プリセットカテゴリー一覧を取得
 *
 * 認証不要 - オンボーディング前に呼び出し可能
 */
const getCategories = os.handler(async (): Promise<GetCategoriesResult> => {
  logger.info('Getting preset categories')

  return {
    success: true,
    data: {
      categories: PRESET_CATEGORIES,
    },
  }
})

// ========================================
// Router
// ========================================

export const presetRouter = {
  getCategories,
}
