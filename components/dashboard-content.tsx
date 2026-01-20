'use client'

import { type User } from '@/lib/types'
import { OverviewPage } from './pages/overview-page'
import { InventoryPage } from './pages/inventory-page'
import { CustomersPage } from './pages/customers-page'
import { ProjectsPage } from './pages/projects-page'
import { LogsPage } from './pages/logs-page'
import { VendorsPage } from './pages/vendors-page'
import { WorkersPage } from './pages/workers-page'
import { MaterialIssuePage } from './pages/material-issue-page'
import { VendorPurchasePage } from './pages/vendor-purchase-page'
import { PaymentsPage } from './pages/payments-page'

interface DashboardContentProps {
  user: User
  currentPage: string
}

export function DashboardContent({ user, currentPage }: DashboardContentProps) {
  const renderContent = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage user={user} />
      case 'inventory':
        return <InventoryPage user={user} />
      case 'customers':
        return <CustomersPage user={user} />
      case 'projects':
        return <ProjectsPage user={user} />
      case 'vendors':
        return <VendorsPage />
      case 'workers':
        return <WorkersPage />
      case 'materialIssue':
        return <MaterialIssuePage user={user} />
      case 'vendorPurchase':
        return <VendorPurchasePage user={user} />
      case 'payments':
        return <PaymentsPage user={user} />
      case 'logs':
        return user.role === 'admin' ? <LogsPage /> : null
      default:
        return <OverviewPage user={user} />
    }
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 bg-muted/40 min-h-screen">
      {renderContent()}
    </main>
  )
}
