import Constants from 'expo-constants'

export const API_URL = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:8080'

// Handle scheme which can be string or string[]
const rawScheme = Constants.expoConfig?.scheme
export const APP_SCHEME: string = Array.isArray(rawScheme)
  ? (rawScheme[0] ?? 'fulltsmobile')
  : (rawScheme ?? 'fulltsmobile')

// Legal document URLs
export { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from './legal'
