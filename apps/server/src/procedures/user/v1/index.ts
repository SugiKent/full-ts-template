/**
 * ユーザー向け API v1 Router
 *
 * バージョン 1 の API エンドポイント
 * 後方互換性を維持するため、破壊的変更は禁止
 */

import { os } from '@orpc/server'
import { categoryRouter } from './category.js'
import { deviceAuthRouter } from './device-auth.js'
import { monthlyGoalRouter } from './monthly-goal.js'
import { onboardingRouter } from './onboarding.js'
import { presetRouter } from './preset.js'
import { stepRouter } from './step.js'
import { stepSuggestionRouter } from './step-suggestion.js'
import { timelineRouter } from './timeline.js'
import { userSettingsRouter } from './user-settings.js'
import { wishlistItemRouter } from './wishlist-item.js'

/**
 * v1 Router
 */
export const v1Router = os.router({
  // デバイス認証
  auth: os.router(deviceAuthRouter),

  // オンボーディング
  onboarding: os.router(onboardingRouter),

  // プリセットカテゴリー
  preset: os.router(presetRouter),

  // AI
  ai: os.router(stepSuggestionRouter),

  // CRUD API
  category: os.router(categoryRouter),
  item: os.router(wishlistItemRouter),
  step: os.router(stepRouter),
  monthlyGoal: os.router(monthlyGoalRouter),

  // タイムライン
  timeline: os.router(timelineRouter),

  // ユーザー設定
  settings: os.router(userSettingsRouter),
})

/**
 * v1 Router 型
 */
export type V1Router = typeof v1Router
