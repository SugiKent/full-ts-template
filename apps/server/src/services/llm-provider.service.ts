/**
 * LLM プロバイダーサービス
 *
 * OpenRouter SDK を使用した LLM 連携の抽象化層
 * Structured Outputs（JSON Schema）でレスポンス形式を保証
 */
import { OpenRouter } from '@openrouter/sdk'
import { z } from 'zod'
import { createLayerLogger, serializeError } from '../utils/logger.js'

const logger = createLayerLogger('service', 'llm-provider')

/**
 * デフォルトモデル
 */
const DEFAULT_MODEL = 'openai/gpt-oss-120b'

/**
 * LLM リクエストオプション
 */
export interface LLMRequestOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}

/**
 * Zod 内部型定義（型安全なアクセス用）
 */
interface ZodArrayDef {
  element?: z.ZodTypeAny
  type?: z.ZodTypeAny
}

/**
 * OpenRouter クライアントを取得（遅延初期化）
 */
let openRouterClient: OpenRouter | null = null

function getOpenRouterClient(): OpenRouter {
  if (!openRouterClient) {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      throw new Error(
        'OPENROUTER_API_KEY environment variable is not set. LLM features are unavailable.',
      )
    }

    openRouterClient = new OpenRouter({
      apiKey,
    })
  }

  return openRouterClient
}

/**
 * Structured Output リクエスト
 *
 * JSON Schema を使用してレスポンス形式を保証
 */
export async function createStructuredCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodType<T>,
  schemaName: string,
  options: LLMRequestOptions = {},
): Promise<T> {
  const { model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 2000 } = options

  logger.info(
    { model, schemaName, userPromptLength: userPrompt.length },
    'Creating structured completion',
  )

  try {
    const jsonSchema = zodToJsonSchema(schema) as Record<string, unknown>
    logger.debug({ schemaName, jsonSchema }, 'Generated JSON schema')
    const client = getOpenRouterClient()

    const response = await client.chat.send({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      maxTokens,
      responseFormat: {
        type: 'json_schema',
        jsonSchema: {
          name: schemaName,
          strict: true,
          schema: jsonSchema,
        },
      },
      stream: false,
      // response-healing プラグインで JSON 構文エラーを自動修復
      plugins: [{ id: 'response-healing' }],
    })

    const choice = response.choices[0]
    if (!choice) {
      throw new Error('Empty response from LLM')
    }

    const content = choice.message.content
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid response content from LLM')
    }

    // JSON をパース
    const parsed = JSON.parse(content)

    // デバッグ: LLM の生レスポンスをログ出力
    logger.debug({ rawResponse: parsed, schemaName }, 'LLM raw response')

    // Zod でバリデーション
    const validated = schema.parse(parsed)

    logger.info(
      { model, schemaName, tokensUsed: response.usage?.totalTokens },
      'Structured completion successful',
    )

    return validated
  } catch (error) {
    logger.error(
      { error: serializeError(error), model, schemaName },
      'Failed to create structured completion',
    )
    throw error
  }
}

/**
 * Zod スキーマを JSON Schema に変換
 *
 * 簡易的な変換（必要に応じて拡張）
 */
function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  // zod-to-json-schema ライブラリを使わず簡易実装
  // 今回必要なパターンのみサポート

  if (schema instanceof z.ZodObject) {
    // Zod の shape を取得
    const shape = schema.shape as Record<string, z.ZodTypeAny>
    const properties: Record<string, Record<string, unknown>> = {}
    const required: string[] = []

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToJsonSchema(value)

      // オプショナルでなければ required
      if (!(value instanceof z.ZodOptional)) {
        required.push(key)
      }
    }

    return {
      type: 'object',
      properties,
      required,
      additionalProperties: false,
    }
  }

  if (schema instanceof z.ZodArray) {
    const def = schema._def as unknown as ZodArrayDef
    const elementSchema = (def.element ?? def.type) as z.ZodTypeAny | undefined
    return {
      type: 'array',
      items: zodToJsonSchema(elementSchema ?? z.string()),
    }
  }

  if (schema instanceof z.ZodString) {
    return { type: 'string' }
  }

  if (schema instanceof z.ZodNumber) {
    return { type: 'number' }
  }

  if (schema instanceof z.ZodBoolean) {
    return { type: 'boolean' }
  }

  if (schema instanceof z.ZodOptional) {
    return zodToJsonSchema(schema.unwrap() as z.ZodTypeAny)
  }

  if (schema instanceof z.ZodNullable) {
    const inner = zodToJsonSchema(schema.unwrap() as z.ZodTypeAny)
    return {
      anyOf: [inner, { type: 'null' }],
    }
  }

  // デフォルト
  return { type: 'string' }
}

/**
 * OpenRouter API が利用可能かチェック
 */
export function isLLMAvailable(): boolean {
  return !!process.env.OPENROUTER_API_KEY
}
