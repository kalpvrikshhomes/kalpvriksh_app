'use client'

import { type User } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface DashboardNavProps {
  user: User
  currentPage: string
  onPageChange: (page: any) => void
  onLogout: () => void
  isSidebarOpen: boolean
  setIsSidebarOpen: (isOpen: boolean) => void
  isMobile: boolean
}

export function DashboardNav({
  user,
  currentPage,
  onPageChange,
  onLogout,
  isSidebarOpen,
  setIsSidebarOpen,
  isMobile,
}: DashboardNavProps) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'projects', label: 'Projects', icon: '🎯' },
    { id: 'vendors', label: 'Vendors', icon: '🚚' },
    { id: 'workers', label: 'Workers', icon: '🛠️' },
    { id: 'materialIssue', label: 'Material Issue', icon: '📤' },
    { id: 'vendorPurchase', label: 'Vendor Purchase', icon: '📥' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    ...(user.role === 'admin' ? [{ id: 'logs', label: 'Logs', icon: '📋' }] : []),
  ]

  return (
    <>
      <nav
        className={cn(
          'bg-sidebar border-r border-sidebar-border p-6 flex flex-col h-screen fixed top-0 left-0 w-64 transition-transform duration-300 ease-in-out z-40',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          isMobile ? 'z-50' : ''
        )}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-sidebar-primary">Interior Manager</h1>
            <p className="text-xs text-sidebar-foreground/60 mt-1">Inventory & Project Management</p>
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          )}
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto sidebar-nav-list">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors',
                currentPage === item.id
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="border-t border-sidebar-border pt-4 mt-4">
          <div className="mb-4 text-sm">
            <p className="text-sidebar-foreground font-medium">{user.name}</p>
            <p className="text-sidebar-foreground/60 text-xs">{user.role}</p>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full text-sm"
          >
            Sign Out
          </Button>
        </div>
      </nav>
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </>
  )
}