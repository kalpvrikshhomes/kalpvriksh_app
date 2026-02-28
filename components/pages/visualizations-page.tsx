'use client'

import { useState, useEffect } from 'react'
import { dbFetch, getProxyImageUrl } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

type VisualizationCategory = {
  id: string;
  name: string;
}

type Visualization = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category_id: string;
}


export function VisualizationsPage() {
  const [mounted, setMounted] = useState(false)
  const [categories, setCategories] = useState<VisualizationCategory[]>([])
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState('')
  
  const [visualizations, setVisualizations] = useState<Visualization[]>([])
  const [showVisualizationForm, setShowVisualizationForm] = useState(false)
  const [editingVisualizationId, setEditingVisualizationId] = useState<string | null>(null)
  const [visualizationFormData, setVisualizationFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    image: null as any,
  })

  const { toast } = useToast()

  const fetchCategories = async () => {
    try {
      const data = await dbFetch('visualization_categories', 'select', {})
      if (Array.isArray(data)) setCategories(data)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error fetching categories', description: error.message })
    }
  }

  const fetchVisualizations = async () => {
    try {
      const data = await dbFetch('visualizations', 'select', {})
      if (Array.isArray(data)) setVisualizations(data)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error fetching visualizations', description: error.message })
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchCategories()
    fetchVisualizations()
  }, [])

  if (!mounted) return null

  const handleVisualizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!visualizationFormData.category_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a category.' })
      return
    }

    let imageUrl = ''

    if (visualizationFormData.image) {
      const file = visualizationFormData.image
      const filePath = `${visualizationFormData.category_id}/${Date.now()}_${file.name}`
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', '3d-visualizations')
      formData.append('path', filePath)
      
      const response = await fetch('/api/storage', { method: 'POST', body: formData })
      const res = await response.json()
      if (res.error) {
        toast({ variant: 'destructive', title: 'Error uploading image', description: res.error })
        return
      }
      imageUrl = res.data.publicUrl
    }

    try {
      if (editingVisualizationId) {
        const updateData: Partial<Visualization> = {
          title: visualizationFormData.title,
          description: visualizationFormData.description,
          category_id: visualizationFormData.category_id,
        }
        if (imageUrl) {
          updateData.image_url = imageUrl
        }
        await dbFetch('visualizations', 'update', {
          values: updateData,
          eq: { id: editingVisualizationId }
        })
      } else {
        if (!imageUrl) {
          toast({ variant: 'destructive', title: 'Error', description: 'Please provide an image.' })
          return
        }
        await dbFetch('visualizations', 'insert', [{ 
          title: visualizationFormData.title,
          description: visualizationFormData.description,
          category_id: visualizationFormData.category_id,
          image_url: imageUrl,
        }])
      }

      toast({ title: 'Success!', description: `Visualization ${editingVisualizationId ? 'updated' : 'created'} successfully.` })
      await fetchVisualizations()
      resetVisualizationForm()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error saving visualization', description: error.message })
    }
  }

  const resetVisualizationForm = () => {
    setVisualizationFormData({ title: '', description: '', category_id: '', image: null })
    setShowVisualizationForm(false)
    setEditingVisualizationId(null)
  }



  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Category name cannot be empty.' })
      return
    }

    try {
      if (editingCategoryId) {
        // Update existing category
        await dbFetch('visualization_categories', 'update', {
          values: { name: categoryName },
          eq: { id: editingCategoryId }
        })
      } else {
        // Create new category
        await dbFetch('visualization_categories', 'insert', [{ name: categoryName }])
      }

      toast({ title: 'Success!', description: `Category ${editingCategoryId ? 'updated' : 'created'} successfully.` })
      await fetchCategories()
      resetCategoryForm()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error saving category', description: error.message })
    }
  }

  const handleEditCategory = (category: VisualizationCategory) => {
    setCategoryName(category.name)
    setEditingCategoryId(category.id)
    setShowCategoryForm(true)
  }

  const handleDeleteCategory = async (category: VisualizationCategory) => {
    if (window.confirm(`Are you sure you want to delete the category "${category.name}"? This will also delete all visualizations within it.`)) {
      try {
        await dbFetch('visualization_categories', 'delete', { eq: { id: category.id } })
        toast({ title: 'Success!', description: 'Category deleted successfully.' })
        await fetchCategories()
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error deleting category', description: error.message })
      }
    }
  }

  const handleEditVisualization = (visualization: Visualization) => {
    setVisualizationFormData({
      title: visualization.title,
      description: visualization.description,
      category_id: visualization.category_id,
      image: null, // Do not preload the file input
    })
    setEditingVisualizationId(visualization.id)
    setShowVisualizationForm(true)
  }

  const handleDeleteVisualization = async (visualization: Visualization) => {
    if (window.confirm(`Are you sure you want to delete the visualization "${visualization.title}"?`)) {
      try {
        // First, delete the image from storage
        const imagePath = visualization.image_url.split('/3d-visualizations/')[1]
        if(imagePath){
          await fetch('/api/storage', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bucket: '3d-visualizations', paths: [imagePath] })
          });
        }

        // Then, delete the record from the database
        await dbFetch('visualizations', 'delete', { eq: { id: visualization.id } })
        toast({ title: 'Success!', description: 'Visualization deleted successfully.' })
        await fetchVisualizations()
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error deleting visualization', description: error.message })
      }
    }
  }

  const resetCategoryForm = () => {
    setCategoryName('')
    setShowCategoryForm(false)
    setEditingCategoryId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">3D Visualizations</h1>
          <p className="text-muted-foreground mt-2">Manage your 3D renders and categories</p>
        </div>
      </div>

      {/* Category Management Section */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">Categories</CardTitle>
          <Button onClick={() => setShowCategoryForm(!showCategoryForm)} className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
            {showCategoryForm ? 'Cancel' : '+ New Category'}
          </Button>
        </CardHeader>
        <CardContent>
          {showCategoryForm && (
            <form onSubmit={handleCategorySubmit} className="flex gap-2 mb-4">
              <Input
                placeholder="Category name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="bg-input border-border text-foreground"
                required
              />
              <Button type="submit" className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
                {editingCategoryId ? 'Update' : 'Save'}
              </Button>
              {editingCategoryId && (
                <Button type="button" onClick={resetCategoryForm} variant="outline">
                  Cancel
                </Button>
              )}
            </form>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map(category => (
              <div key={category.id} className="p-2 border rounded-md flex justify-between items-center">
                <span>{category.name}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visualizations Management Section */}
      <Card className="bg-card border-border mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">Visualizations</CardTitle>
          <Button onClick={() => setShowVisualizationForm(!showVisualizationForm)} className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
            {showVisualizationForm ? 'Cancel' : '+ New Visualization'}
          </Button>
        </CardHeader>
        <CardContent>
          {showVisualizationForm && (
            <form onSubmit={handleVisualizationSubmit} className="space-y-4 mb-6">
              <Input
                placeholder="Visualization Title"
                value={visualizationFormData.title}
                onChange={(e) => setVisualizationFormData({ ...visualizationFormData, title: e.target.value })}
                className="bg-input border-border text-foreground"
                required
              />
              <textarea
                placeholder="Description"
                value={visualizationFormData.description}
                onChange={(e) => setVisualizationFormData({ ...visualizationFormData, description: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground text-sm"
              />
              <select
                value={visualizationFormData.category_id}
                onChange={(e) => setVisualizationFormData({ ...visualizationFormData, category_id: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground text-sm"
                required
              >
                <option value="">Select a category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setVisualizationFormData({ ...visualizationFormData, image: e.target.files ? e.target.files[0] : null })}
                className="bg-input border-border text-foreground"
              />
              <div className="flex gap-2">
                <Button type="submit" className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
                  {editingVisualizationId ? 'Update Visualization' : 'Save Visualization'}
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {categories.map(category => (
              <div key={category.id}>
                <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {visualizations.filter(v => v.category_id === category.id).map(vis => (
                    <div key={vis.id} className="border rounded-md p-2">
                      <img src={getProxyImageUrl(vis.image_url)} alt={vis.title} className="w-full h-40 object-cover rounded-md mb-2" />
                      <h4 className="font-semibold">{vis.title}</h4>
                      <p className="text-sm text-muted-foreground">{vis.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditVisualization(vis)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteVisualization(vis)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
