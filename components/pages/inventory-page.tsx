'use client'

import { useState, useEffect } from 'react'
import { type Material } from '@/lib/types'
import { getMaterials, saveMaterial, deleteMaterial } from '@/lib/storage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function InventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    unit: '',
    price: 0,
    category: '',
  })

  useEffect(() => {
    setMaterials(getMaterials())
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const material: Material = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      ...formData,
    }
    saveMaterial(material)
    setMaterials(getMaterials())
    resetForm()
  }

  const resetForm = () => {
    setFormData({ name: '', quantity: 0, unit: '', price: 0, category: '' })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (material: Material) => {
    setFormData(material)
    setEditingId(material.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    deleteMaterial(id)
    setMaterials(getMaterials())
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-2">Manage your materials and supplies</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
        >
          {showForm ? 'Cancel' : '+ Add Material'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">{editingId ? 'Edit' : 'Add'} Material</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Material name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-input border-border text-foreground"
                  required
                />
                <Input
                  placeholder="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="bg-input border-border text-foreground"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="bg-input border-border text-foreground"
                  required
                />
                <Input
                  placeholder="Unit (m, sheets, liters)"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="bg-input border-border text-foreground"
                  required
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="bg-input border-border text-foreground"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
                  Save Material
                </Button>
                <Button type="button" onClick={resetForm} variant="outline">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {materials.map((material) => (
          <Card key={material.id} className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{material.name}</h3>
                  <p className="text-sm text-muted-foreground">{material.category}</p>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span className="text-foreground">
                      Qty: <span className={material.quantity < 20 ? 'text-destructive font-semibold' : 'text-foreground'}>{material.quantity}</span> {material.unit}
                    </span>
                    <span className="text-foreground">Price: ${material.price}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(material)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(material.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
