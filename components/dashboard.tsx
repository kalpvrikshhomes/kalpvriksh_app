'use client'

import { useState, useEffect } from 'react'
import { type User } from '@/lib/types'
import { initializeDemoData } from '@/lib/storage'
import { DashboardNav } from './dashboard-nav'
import { DashboardContent } from './dashboard-content'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardProps {
  user: User
  onLogout: () => void
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState<'overview' | 'inventory' | 'customers' | 'projects' | 'logs'>('overview')
  const isMobile = useIsMobile()
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile)



  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false)
    } else {
      setIsSidebarOpen(true)
    }
  }, [isMobile])

  const handlePageChange = (page: any) => {
    setCurrentPage(page)
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardNav
        user={user}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onLogout={onLogout}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobile={isMobile}
      />
      <main
        className={cn(
          'transition-all duration-300 ease-in-out',
          isSidebarOpen && !isMobile ? 'pl-64' : 'pl-0'
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8">
            {isMobile && (
              <header className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold text-center">Interior Manager</h1>
                <div className="w-8"></div>
              </header>
            )}
            <DashboardContent user={user} currentPage={currentPage} />
        </div>
      </main>
    </div>
  )
}