"use client"

import { useUser } from '@/context/UserContext'
import { useState } from 'react'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { user, loading } = useUser()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen((s) => !s)
  const closeSidebar = () => setIsSidebarOpen(false)

  // While loading, render nothing to avoid flicker
  if (loading) return <>{children}</>

  // If user not authenticated, render children only
  if (!user) return <>{children}</>

  // Authenticated: show global app shell
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="flex pt-16">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <main className="flex-1 lg:ml-0">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
