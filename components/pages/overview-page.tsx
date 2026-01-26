'use client'

import { useState, useEffect } from 'react'
import { type User, type Material, type Customer, type Project } from '@/lib/types'
import { getInventory, getCustomers, getProjects } from '@/lib/storage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface OverviewPageProps {
  user: User
}

export function OverviewPage({ user }: OverviewPageProps) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    const fetchInventory = async () => {
      const inventory = await getInventory()
      setMaterials(inventory)
    }

    const fetchCustomers = async () => {
      const customers = await getCustomers()
      setCustomers(customers)
    }

    const fetchProjects = async () => {
      const projects = await getProjects()
      setProjects(projects)
    }

    fetchInventory()
    fetchCustomers()
    fetchProjects()
  }, [])

  const lowStockMaterials = materials.filter(m => m.quantity < 20)
  const activeProjects = projects.filter(p => p.status === 'in-progress')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome, {user.name}</h1>
        <p className="text-muted-foreground mt-2">Overview of your interior company operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{materials.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{customers.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeProjects.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockMaterials.length}</div>
          </CardContent>
        </Card>
      </div>

      {lowStockMaterials.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockMaterials.map(material => (
                <div key={material.id} className="flex justify-between text-sm text-muted-foreground">
                  <span>{material.name}</span>
                  <span className="text-destructive font-medium">{material.quantity} {material.unit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
