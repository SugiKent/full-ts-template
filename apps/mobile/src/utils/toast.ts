/**
 * トースト通知ヘルパー関数
 *
 * react-native-toast-message のラッパー
 * 成功/エラー/情報の3種類をサポート
 */
import Toast from 'react-native-toast-message'

/**
 * 成功トースト（2秒で自動消去）
 */
export function showSuccessToast(message: string): void {
  Toast.show({
    type: 'success',
    text1: message,
    visibilityTime: 2000,
  })
}

/**
 * エラートースト（タップで消去）
 */
export function showErrorToast(message: string): void {
  Toast.show({
    type: 'error',
    text1: message,
    autoHide: false,
  })
}

/**
 * 情報トースト（2秒で自動消去）
 */
export function showInfoToast(message: string): void {
  Toast.show({
    type: 'info',
    text1: message,
    visibilityTime: 2000,
  })
}
