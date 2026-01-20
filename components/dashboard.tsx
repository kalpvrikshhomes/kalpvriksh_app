'use client'

import { useState, useEffect } from 'react'
import { type User } from '@/lib/types'
import { initializeDemoData } from '@/lib/storage'
import { DashboardNav } from './dashboard-nav'
import { DashboardContent } from './dashboard-content'

interface DashboardProps {
  user: User
  onLogout: () => void
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState<'overview' | 'inventory' | 'customers' | 'projects' | 'logs'>('overview')

  useEffect(() => {
    initializeDemoData()
  }, [])

  return (
    <div className="flex h-screen bg-background text-foreground">
      <DashboardNav
        user={user}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogout={onLogout}
      />
      <div className="flex-1 overflow-auto">
        <DashboardContent user={user} currentPage={currentPage} />
      </div>
    </div>
  )
}
