import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
import { orpcClient } from '@/services/orpc-client'

/**
 * Get contact threads for current user
 */
export function useContactThreads(page = 1, limit = 20) {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  return useQuery({
    queryKey: ['contact', 'threads', userId, page, limit],
    queryFn: () => orpcClient.contact.getThreads({ userId, page, limit }),
    enabled: !!userId,
  })
}

/**
 * Send message to a thread
 */
export function useSendMessage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? ''

  return useMutation({
    mutationFn: (params: { threadId: string; content: string }) =>
      orpcClient.contact.sendMessage({ userId, ...params }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact'] })
    },
  })
}
