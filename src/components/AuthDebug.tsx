'use client'

import { useUser } from '@/context/UserContext'
import { useLayoutEffect, useState } from 'react'

interface DebugInfo {
  isMobile: boolean
  isLoading: boolean
  user: string
  timestamp: string
  userAgent: string
  redirectPending: boolean
  inviteToken: boolean
}

export function AuthDebug() {
  const { user, loading } = useUser()
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)

  useLayoutEffect(() => {
    // Only on client
    const updateDebugInfo = () => {
      const isMobile =
        /android|iphone|ipad|ipod|mobile|windows phone|opera mini|blackberry|webos/i.test(
          navigator.userAgent.toLowerCase()
        ) || window.innerWidth < 768

      setDebugInfo({
        isMobile,
        isLoading: loading,
        user: user ? `${user.email}` : 'null',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 40),
        redirectPending: localStorage.getItem('pendingAuthRedirect') === 'true',
        inviteToken: !!sessionStorage.getItem('pendingInviteToken'),
      })
    }

    updateDebugInfo()
    const interval = setInterval(updateDebugInfo, 1000)
    return () => clearInterval(interval)
  }, [user, loading])

  // Only show in development and after hydration
  if (process.env.NODE_ENV !== 'development' || !debugInfo) {
    return null
  } return (
    <div className="fixed bottom-2 right-2 z-50 text-xs font-mono bg-slate-900 text-green-400 p-2 rounded border border-green-700 max-w-xs">
      <div className="space-y-1">
        <div>Mobile: {debugInfo.isMobile ? '✓' : '✗'}</div>
        <div>Loading: {debugInfo.isLoading ? '✓' : '✗'}</div>
        <div>User: {debugInfo.user}</div>
        <div>Pending Redirect: {debugInfo.redirectPending ? '✓' : '✗'}</div>
        <div>Has Invite: {debugInfo.inviteToken ? '✓' : '✗'}</div>
        <div className="text-slate-400 mt-2 text-[10px] truncate">
          UA: {debugInfo.userAgent}...
        </div>
        {debugInfo.timestamp && (
          <div className="text-slate-500 text-[10px] mt-1">
            {debugInfo.timestamp.split('T')[1].split('.')[0]}
          </div>
        )}
      </div>
    </div>
  )
}
