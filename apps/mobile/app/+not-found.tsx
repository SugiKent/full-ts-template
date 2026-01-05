import { Link, Stack } from 'expo-router'
import { Text, View } from 'react-native'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center bg-white p-5">
        <Text className="mb-4 text-xl font-bold">ページが見つかりません</Text>
        <Link href="/" className="mt-4 py-4">
          <Text className="text-base text-blue-600">ホームに戻る</Text>
        </Link>
      </View>
    </>
  )
}
