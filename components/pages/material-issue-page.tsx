'use client'

import { useState, useEffect } from 'react'
import { dbFetch } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { type Project, type InventoryItem, type Vendor, type User } from '@/lib/types'

// Define a type for the issue mode
type IssueMode = 'from_inventory' | 'direct_purchase'

interface DashboardPageProps {
  user: User
}

export function MaterialIssuePage({ user }: DashboardPageProps) {
  const [issueMode, setIssueMode] = useState<IssueMode>('from_inventory')
  const [projects, setProjects] = useState<Project[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form data for both modes
  const [formData, setFormData] = useState({
    projectId: '',
    inventoryItemId: '',
    quantity: '',
    rate: '', // Used for rate_at_issue (from_inventory) or purchase rate (direct_purchase)
    vendorId: '', // Only for direct_purchase
    paymentStatus: '', // Only for direct_purchase
  })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [projectsData, inventoryData, vendorsData] = await Promise.all([
          dbFetch('projects', 'select', {}),
          dbFetch('inventory_items', 'select', {}),
          dbFetch('vendors', 'select', {}),
        ]);

        setProjects(projectsData || [])
        setInventoryItems(inventoryData || [])
        setVendors(vendorsData || [])
      } catch (err: any) {
        console.error('Error fetching data:', err)
        toast.error('Error fetching data.')
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const { projectId, inventoryItemId, quantity, rate, vendorId, paymentStatus } = formData

    if (!projectId || !inventoryItemId || !quantity || !rate) {
      toast.error('Please fill in all required fields.')
      setSubmitting(false)
      return
    }

    const payload: any = {
      p_project_id: projectId,
      p_issue_payload: {},
    }

    if (issueMode === 'from_inventory') {
      payload.p_issue_payload = {
        inventory_issues: [
          {
            inventory_item_id: inventoryItemId,
            quantity: parseInt(quantity),
            rate_at_issue: parseFloat(rate),
          },
        ],
      }
    } else {
      if (!vendorId || !paymentStatus) {
        toast.error('Please fill in all vendor purchase details.')
        setSubmitting(false)
        return
      }
      payload.p_issue_payload = {
        vendor_purchases: [
          {
            inventory_item_id: inventoryItemId,
            vendor_id: vendorId,
            payment_status: paymentStatus,
            quantity: parseInt(quantity),
            rate: parseFloat(rate), // This is the purchase rate for direct purchase
          },
        ],
      }
    }

    try {
      await dbFetch('', 'rpc', { name: 'issue_materials', params: payload });
      toast.success('Materials issued successfully!')
      // Reset form after successful submission
      setFormData({
        projectId: '',
        inventoryItemId: '',
        quantity: '',
        rate: '',
        vendorId: '',
        paymentStatus: '',
      })
    } catch (err: any) {
      console.error('Error issuing materials:', err)
      toast.error(err.message || 'Failed to issue materials.')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Material Issue Management</h1>
          <p className="text-muted-foreground mt-2">Issue materials to projects from inventory or directly from vendors</p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Issue Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Project Selection */}
              <div className="space-y-2">
                <Label htmlFor="projectId">Project</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => handleSelectChange('projectId', value)}
                >
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Issue Mode Selection */}
              <div className="space-y-2">
                <Label>Issue Mode</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={issueMode === 'from_inventory' ? 'default' : 'outline'}
                    onClick={() => setIssueMode('from_inventory')}
                  >
                    From Inventory
                  </Button>
                  <Button
                    type="button"
                    variant={issueMode === 'direct_purchase' ? 'default' : 'outline'}
                    onClick={() => {
                      if (user.role === 'admin') {
                        setIssueMode('direct_purchase')
                      } else {
                        toast.error('Only administrators can directly purchase and issue from vendors.')
                        setIssueMode('from_inventory') // Revert to default if not admin
                      }
                    }}
                    disabled={user.role !== 'admin'}
                  >
                    Direct Purchase from Vendor
                  </Button>
                </div>
              </div>

              {/* Conditional Fields based on Issue Mode */}
              {issueMode === 'from_inventory' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="inventoryItemId">Material</Label>
                    <Select
                      value={formData.inventoryItemId}
                      onValueChange={(value) => handleSelectChange('inventoryItemId', value)}
                    >
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue placeholder="Select material from inventory" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.total_quantity} {item.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="Quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="bg-input border-border text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate">Rate at Issue</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      placeholder="Rate at which material is issued"
                      value={formData.rate}
                      onChange={handleChange}
                      className="bg-input border-border text-foreground"
                      required
                    />
                  </div>
                </>
              )}

              {issueMode === 'direct_purchase' && user.role === 'admin' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="vendorId">Vendor</Label>
                    <Select
                      value={formData.vendorId}
                      onValueChange={(value) => handleSelectChange('vendorId', value)}
                    >
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inventoryItemId">Material to Purchase</Label>
                    <Select
                      value={formData.inventoryItemId}
                      onValueChange={(value) => handleSelectChange('inventoryItemId', value)}
                    >
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue placeholder="Select material to purchase" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity to Purchase</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="Quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="bg-input border-border text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate">Purchase Rate</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      placeholder="Rate at which material is purchased"
                      value={formData.rate}
                      onChange={handleChange}
                      className="bg-input border-border text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Select
                      value={formData.paymentStatus}
                      onValueChange={(value) => handleSelectChange('paymentStatus', value)}
                    >
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <Button
              type="submit"
              className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              disabled={submitting}
            >
              {submitting ? 'Issuing...' : 'Issue Material'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}