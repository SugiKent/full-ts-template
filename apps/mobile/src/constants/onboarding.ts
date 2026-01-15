/**
 * オンボーディング関連の定数
 */

import type { OnboardingStep, PresetCategory, ProposedStep } from '@/types/onboarding'

/**
 * プリセットカテゴリー（PROJECT.md準拠）
 */
export const PRESET_CATEGORIES: PresetCategory[] = [
  { id: 'travel', name: '旅行', icon: '🌍' },
  { id: 'skill', name: 'スキル習得', icon: '📚' },
  { id: 'hobby', name: '趣味', icon: '🎨' },
  { id: 'health', name: '健康', icon: '💪' },
  { id: 'career', name: 'キャリア', icon: '💼' },
  { id: 'money', name: 'お金', icon: '💰' },
  { id: 'relationship', name: '人間関係', icon: '👥' },
  { id: 'self-investment', name: '自己投資', icon: '📖' },
  { id: 'experience', name: '体験', icon: '🎭' },
  { id: 'other', name: 'その他', icon: '✨' },
] as const

/**
 * オンボーディングステップの順序
 */
export const ONBOARDING_STEP_ORDER: OnboardingStep[] = [
  'splash',
  'introduction',
  'terms',
  'categories',
  'items',
  'monthly-goals',
  'steps',
  'completed',
]

/**
 * 今月やることの最大数
 */
export const MAX_MONTHLY_GOALS = 10

/**
 * AIが提案するステップの初期数
 */
export const INITIAL_STEPS_COUNT = 5

/**
 * 「もっとやれる！」で追加されるステップ数
 */
export const ADDITIONAL_STEPS_COUNT = 5

/**
 * モックステップ提案（カテゴリー別）
 * 実際のAI連携時はこのデータをAPIレスポンスに置き換え
 */
export const MOCK_STEP_PROPOSALS: Record<string, ProposedStep[]> = {
  travel: [
    { id: 'travel-1', title: '旅行雑誌を買う' },
    { id: 'travel-2', title: 'YouTubeで行き先を調べる' },
    { id: 'travel-3', title: 'パスポートの有効期限を確認' },
    { id: 'travel-4', title: '予算を計算する' },
    { id: 'travel-5', title: '候補の国を3つ絞る' },
    { id: 'travel-6', title: '航空券の相場を調べる' },
    { id: 'travel-7', title: '必要な持ち物リストを作る' },
    { id: 'travel-8', title: '現地の言葉を3つ覚える' },
    { id: 'travel-9', title: '旅行保険を調べる' },
    { id: 'travel-10', title: '友達に旅行計画を話す' },
  ],
  skill: [
    { id: 'skill-1', title: '学習アプリをインストール' },
    { id: 'skill-2', title: '毎日10分学習する' },
    { id: 'skill-3', title: 'オンライン講座を調べる' },
    { id: 'skill-4', title: '無料体験を受ける' },
    { id: 'skill-5', title: '関連の本を1冊読む' },
    { id: 'skill-6', title: '学習計画を立てる' },
    { id: 'skill-7', title: '仲間を見つける' },
    { id: 'skill-8', title: '小さな目標を設定' },
    { id: 'skill-9', title: '進捗を記録する' },
    { id: 'skill-10', title: '習得したことを誰かに教える' },
  ],
  hobby: [
    { id: 'hobby-1', title: '必要な道具を調べる' },
    { id: 'hobby-2', title: '初心者向け動画を探す' },
    { id: 'hobby-3', title: '体験教室を予約' },
    { id: 'hobby-4', title: '同じ趣味の人を探す' },
    { id: 'hobby-5', title: '週に1回は時間を確保' },
    { id: 'hobby-6', title: '作品を作ってみる' },
    { id: 'hobby-7', title: 'SNSでシェアする' },
    { id: 'hobby-8', title: '上達のコツを調べる' },
    { id: 'hobby-9', title: 'イベントに参加する' },
    { id: 'hobby-10', title: '目標作品を決める' },
  ],
  health: [
    { id: 'health-1', title: '現在の状態を記録' },
    { id: 'health-2', title: '目標を具体的に設定' },
    { id: 'health-3', title: 'ジム・施設を調べる' },
    { id: 'health-4', title: '週間スケジュールを決める' },
    { id: 'health-5', title: '必要な道具を揃える' },
    { id: 'health-6', title: '専門家に相談する' },
    { id: 'health-7', title: '仲間を見つける' },
    { id: 'health-8', title: '進捗を写真で記録' },
    { id: 'health-9', title: 'ご褒美を決める' },
    { id: 'health-10', title: '1週間継続する' },
  ],
  career: [
    { id: 'career-1', title: '自分のスキルを棚卸し' },
    { id: 'career-2', title: '目指す姿を明確にする' },
    { id: 'career-3', title: '必要なスキルをリスト化' },
    { id: 'career-4', title: '情報収集を始める' },
    { id: 'career-5', title: 'メンターを探す' },
    { id: 'career-6', title: '資格や研修を調べる' },
    { id: 'career-7', title: '履歴書を更新する' },
    { id: 'career-8', title: '人脈を広げる' },
    { id: 'career-9', title: '実績を作る' },
    { id: 'career-10', title: '転職サイトに登録' },
  ],
  money: [
    { id: 'money-1', title: '現在の収支を把握' },
    { id: 'money-2', title: '目標金額を設定' },
    { id: 'money-3', title: '節約ポイントを見つける' },
    { id: 'money-4', title: '投資について調べる' },
    { id: 'money-5', title: '副業の可能性を検討' },
    { id: 'money-6', title: '家計簿アプリを使う' },
    { id: 'money-7', title: '固定費を見直す' },
    { id: 'money-8', title: '本を1冊読む' },
    { id: 'money-9', title: '専門家に相談する' },
    { id: 'money-10', title: '自動積立を設定' },
  ],
  relationship: [
    { id: 'relationship-1', title: '大切な人をリスト化' },
    { id: 'relationship-2', title: '連絡を取る' },
    { id: 'relationship-3', title: '会う約束をする' },
    { id: 'relationship-4', title: '感謝を伝える' },
    { id: 'relationship-5', title: '新しい出会いの場を探す' },
    { id: 'relationship-6', title: 'コミュニティに参加' },
    { id: 'relationship-7', title: '話を聞く練習をする' },
    { id: 'relationship-8', title: '小さな親切をする' },
    { id: 'relationship-9', title: 'SNSで近況を報告' },
    { id: 'relationship-10', title: 'イベントを企画する' },
  ],
  'self-investment': [
    { id: 'self-1', title: '興味のある分野を探す' },
    { id: 'self-2', title: '毎日15分の学習時間を確保' },
    { id: 'self-3', title: '本を1冊選ぶ' },
    { id: 'self-4', title: 'セミナーを探す' },
    { id: 'self-5', title: '朝の習慣を作る' },
    { id: 'self-6', title: '日記をつける' },
    { id: 'self-7', title: '目標を紙に書く' },
    { id: 'self-8', title: '尊敬する人を見つける' },
    { id: 'self-9', title: '健康管理を始める' },
    { id: 'self-10', title: '週次で振り返る' },
  ],
  experience: [
    { id: 'exp-1', title: 'やりたいことリストを作る' },
    { id: 'exp-2', title: '日程を決める' },
    { id: 'exp-3', title: '予約を入れる' },
    { id: 'exp-4', title: '一緒に行く人を誘う' },
    { id: 'exp-5', title: '必要な準備をリスト化' },
    { id: 'exp-6', title: '体験談を調べる' },
    { id: 'exp-7', title: '費用を計算する' },
    { id: 'exp-8', title: '写真で記録する' },
    { id: 'exp-9', title: 'SNSでシェアする' },
    { id: 'exp-10', title: '感想をまとめる' },
  ],
  other: [
    { id: 'other-1', title: '目標を明確にする' },
    { id: 'other-2', title: '必要なことを調べる' },
    { id: 'other-3', title: '小さな一歩を決める' },
    { id: 'other-4', title: 'スケジュールに入れる' },
    { id: 'other-5', title: '関連する人に相談' },
    { id: 'other-6', title: '進捗を記録する' },
    { id: 'other-7', title: '障害をリスト化' },
    { id: 'other-8', title: '解決策を考える' },
    { id: 'other-9', title: '協力者を見つける' },
    { id: 'other-10', title: '完了イメージを描く' },
  ],
}

/**
 * カテゴリーIDからモックステップを取得
 */
export function getMockStepsForCategory(categoryId: string): ProposedStep[] {
  return MOCK_STEP_PROPOSALS[categoryId] ?? MOCK_STEP_PROPOSALS.other ?? []
}

/**
 * アイテムのカテゴリーからモックステップを取得
 */
export function getMockStepsForItem(categoryIds: string[]): ProposedStep[] {
  // 最初のカテゴリーからステップを取得
  const primaryCategory = categoryIds[0] || 'other'
  return getMockStepsForCategory(primaryCategory)
}
