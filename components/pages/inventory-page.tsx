'use client'

import { useState, useEffect } from 'react'
import { type Material } from '@/lib/types'
import { getInventory, saveInventory, deleteInventory } from '@/lib/storage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClipLoader } from 'react-spinners'
import { formatINR } from '@/hooks/use-currency-converter' // Keep formatINR as it's useful for displaying INR values

export function InventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // Removed useCurrencyConverter hook and its related variables
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    unit: '',
    price: 0,
    category: '',
  })

  async function fetchInventory() {
    setLoading(true)
    const inventory = await getInventory()
    setMaterials(inventory)
    setLoading(false)
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.unit) {
      // TODO: Add proper validation and user feedback
      alert("Please select a unit.")
      return
    }
    const material: Omit<Material, 'id'> & { id?: string } = {
      ...formData,
    }
    if (editingId) {
      material.id = editingId
    }
    await saveInventory(material)
    await fetchInventory()
    resetForm()
  }

  const resetForm = () => {
    setFormData({ name: '', quantity: 0, unit: '', price: 0, category: '' })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (material: Material) => {
    setFormData({
      name: material.name,
      quantity: material.quantity,
      unit: material.unit,
      price: material.price,
      category: material.category,
    })
    setEditingId(material.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    await deleteInventory(id)
    await fetchInventory()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="bg-input border-border text-foreground"
                  required
                />
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sheet">Sheet</SelectItem>
                    <SelectItem value="sq ft">Sq Ft</SelectItem>
                    <SelectItem value="piece">Piece</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Price (INR)"
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

      {loading ? (
        <div className="flex justify-center">
            <ClipLoader color="#ffffff" loading={loading} size={35} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <span className="text-foreground">
                            Price: {formatINR(material.price)}
                        </span>
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
      )}
    </div>
  )
}
