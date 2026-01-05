import { useRouter, useSegments } from 'expo-router'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect } from 'react'
import { signOut, useSession } from '@/services/auth-client'

interface User {
  id: string
  email: string
  name: string
  emailVerified: boolean
  image?: string | null | undefined
  createdAt: Date
  updatedAt: Date
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (isPending) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!session?.user && !inAuthGroup) {
      // Redirect unauthenticated users to login
      router.replace('/(auth)/login')
    } else if (session?.user && inAuthGroup) {
      // Redirect authenticated users to home
      router.replace('/(tabs)')
    }
  }, [session, isPending, segments, router])

  const logout = async () => {
    await signOut()
    router.replace('/(auth)/login')
  }

  const user: User | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        emailVerified: session.user.emailVerified,
        image: session.user.image,
        createdAt: session.user.createdAt,
        updatedAt: session.user.updatedAt,
      }
    : null

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isPending,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
