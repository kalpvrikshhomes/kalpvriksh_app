'use client'

import { useState, useEffect } from 'react'
import { type Project, type Customer, type User } from '@/lib/types'
import { getProjects, saveProject, deleteProject, getCustomers, getMaterialIssuesForProject } from '@/lib/storage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { dbFetch } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import Image from 'next/image'
import { ClipLoader } from 'react-spinners'
import { formatINR } from '@/hooks/use-currency-converter'

interface ProjectDetails {
  projectValue: number;
  totalMaterialCost: number;
  profit: number;
}

interface DashboardPageProps {
  user: User
}

type GalleryImage = { id: string; image_path: string; project_id: string }

export function ProjectsPage({ user }: DashboardPageProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', customer_id: '', project_value: 0, status: 'pending' as const })
  const [selectedProjectDetails, setSelectedProjectDetails] = useState<ProjectDetails | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [publishFormData, setPublishFormData] = useState({
    title: '',
    description: '',
    cover_image: null as File | null,
    existing_cover_image_path: null as string | null,
    gallery_images: [] as File[],
  })
  const [existingGalleryImages, setExistingGalleryImages] = useState<GalleryImage[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchProjects = async () => {
    const projects = await getProjects()
    setProjects(projects)
  }

  useEffect(() => {
    fetchProjects()
    const fetchCustomers = async () => {
      const customers = await getCustomers()
      setCustomers(customers)
    }
    fetchCustomers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const project = {
      id: editingId || undefined,
      name: formData.name,
      customer_id: formData.customer_id,
      project_value: formData.project_value,
      status: formData.status,
      created_at: editingId ? (projects.find(p => p.id === editingId)?.created_at || new Date().toISOString()) : new Date().toISOString(),
    }
    await saveProject(project)
    await fetchProjects()
    resetForm()
  }

  const resetForm = () => {
    setFormData({ name: '', customer_id: '', project_value: 0, status: 'pending' })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (project: Project) => {
    setFormData({ name: project.name, customer_id: project.customer_id, project_value: project.project_value, status: project.status })
    setEditingId(project.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    await deleteProject(id)
    await fetchProjects()
  }

  const handleViewDetails = async (project: Project) => {
    const materialIssues = await getMaterialIssuesForProject(project.id);
    const totalMaterialCost = materialIssues.reduce((acc, issue) => acc + (issue.quantity * issue.rate_at_issue), 0);
    const profit = project.project_value - totalMaterialCost;
    setSelectedProjectDetails({ projectValue: project.project_value, totalMaterialCost, profit });
    setIsDetailsDialogOpen(true);
  }

  const handlePublishClick = async (project: Project) => {
    setSelectedProject(project)
    setImagesToDelete([])

    try {
      const profileData = await dbFetch('project_profile_cards', 'select', { eq: { project_id: project.id }, single: true })
      const galleryData = await dbFetch('project_images', 'select', { eq: { project_id: project.id } })

      setPublishFormData({
        title: profileData?.title || project.name,
        description: profileData?.description || '',
        cover_image: null,
        existing_cover_image_path: profileData?.cover_image || null,
        gallery_images: [],
      })
      setExistingGalleryImages(galleryData || [])
      setIsPublishDialogOpen(true)
    } catch (error: any) {
      // If profile not found, just use project name.
      setPublishFormData({
        title: project.name,
        description: '',
        cover_image: null,
        existing_cover_image_path: null,
        gallery_images: [],
      })
      setExistingGalleryImages([])
      setIsPublishDialogOpen(true)
    }
  }

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    setIsSubmitting(true)

    try {
      // 1. Delete marked gallery images
      if (imagesToDelete.length > 0) {
        const paths = imagesToDelete.map(img => {
          const parts = img.split('/');
          return parts.slice(-3).join('/'); // project_id/gallery/filename
        });
        await fetch('/api/storage', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket: 'project-images', paths })
        });

        await dbFetch('project_images', 'delete', { in: { image_path: imagesToDelete } });
      }

      // 2. Upload new gallery images
      if (publishFormData.gallery_images.length > 0) {
        const newImageUploads = await Promise.all(publishFormData.gallery_images.map(async (file) => {
          const filePath = `${selectedProject.id}/gallery/${Date.now()}_${file.name}`
          const formData = new FormData()
          formData.append('file', file)
          formData.append('bucket', 'project-images')
          formData.append('path', filePath)
          
          const response = await fetch('/api/storage', { method: 'POST', body: formData })
          const res = await response.json()
          if (res.error) throw new Error(`Failed to upload ${file.name}: ${res.error}`)
          return { project_id: selectedProject.id, image_path: res.data.publicUrl }
        }))
        await dbFetch('project_images', 'insert', newImageUploads)
      }

      // 3. Handle cover image
      let coverImagePath = publishFormData.existing_cover_image_path
      if (publishFormData.cover_image) {
        const file = publishFormData.cover_image
        const filePath = `${selectedProject.id}/cover/${file.name}`
        
        if (publishFormData.existing_cover_image_path) {
          const parts = publishFormData.existing_cover_image_path.split('/');
          const oldPath = parts.slice(-3).join('/');
          await fetch('/api/storage', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bucket: 'project-images', paths: [oldPath] })
          });
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', 'project-images')
        formData.append('path', filePath)
        
        const response = await fetch('/api/storage', { method: 'POST', body: formData })
        const res = await response.json()
        if (res.error) throw new Error(`Failed to upload cover image: ${res.error}`)
        coverImagePath = res.data.publicUrl;
      }
      if (!coverImagePath) throw new Error('A cover image is required to publish a project.')

      // 4. Upsert profile card
      await dbFetch('project_profile_cards', 'upsert', {
        project_id: selectedProject.id,
        title: publishFormData.title,
        description: publishFormData.description,
        cover_image: coverImagePath,
        updated_at: new Date().toISOString()
      })

      toast({ title: 'Success!', description: 'Project profile published successfully.' })
      setIsPublishDialogOpen(false)
      
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleUnpublish = async () => {
    if (!selectedProject) return
    setIsSubmitting(true)
    try {
      // Delete all gallery images from storage and DB
      const galleryImages = await dbFetch('project_images', 'select', { eq: { project_id: selectedProject.id } })
      
      if (galleryImages && galleryImages.length > 0) {
        const paths = galleryImages.map((img: any) => {
          const parts = img.image_path.split('/');
          return parts.slice(-3).join('/');
        })
        await fetch('/api/storage', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket: 'project-images', paths })
        });
        await dbFetch('project_images', 'delete', { eq: { project_id: selectedProject.id } })
      }

      // Delete cover image from storage
      if (publishFormData.existing_cover_image_path) {
        const parts = publishFormData.existing_cover_image_path.split('/');
        const path = parts.slice(-3).join('/');
        await fetch('/api/storage', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket: 'project-images', paths: [path] })
        });
      }
      
      // Delete the profile card record
      await dbFetch('project_profile_cards', 'delete', { eq: { project_id: selectedProject.id } })
      
      toast({ title: 'Success!', description: 'Project has been unpublished.' })
      setIsPublishDialogOpen(false)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'Unknown'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Project Management</h1>
          <p className="text-muted-foreground mt-2">Track and manage interior design projects</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
          {showForm ? 'Cancel' : '+ New Project'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">{editingId ? 'Edit' : 'Create'} Project</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Project name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-input border-border text-foreground"
                required
              />
              <Input
                type="number"
                placeholder="Project Value (INR)"
                value={formData.project_value.toString()}
                onChange={(e) => setFormData({ ...formData, project_value: parseFloat(e.target.value) || 0 })}
                className="bg-input border-border text-foreground"
                required
              />
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground text-sm"
                required
              >
                <option value="">Select a customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground text-sm"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <div className="flex gap-2">
                <Button type="submit" className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
                  Save Project
                </Button>
                <Button type="button" onClick={resetForm} variant="outline">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{project.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Client: {getCustomerName(project.customer_id)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Value: {formatINR(project.project_value)}</p>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${ project.status === 'completed' ? 'bg-green-900/30 text-green-200' : project.status === 'in-progress' ? 'bg-blue-900/30 text-blue-200' : 'bg-gray-700/30 text-gray-300' }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleViewDetails(project)}>Details</Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(project)}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => handlePublishClick(project)}>Publish</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(project.id)}>Delete</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project Financial Details</DialogTitle>
            <DialogDescription>
              A summary of the project's value, material costs, and profit.
            </DialogDescription>
          </DialogHeader>
          {selectedProjectDetails && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Project Value</h4>
                <p>{formatINR(selectedProjectDetails.projectValue)}</p>
              </div>
              <div>
                <h4 className="font-semibold">Total Material Cost</h4>
                <p>{formatINR(selectedProjectDetails.totalMaterialCost)}</p>
              </div>
              <div>
                <h4 className="font-semibold">Profit</h4>
                <p>{formatINR(selectedProjectDetails.profit)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handlePublishSubmit}>
            <DialogHeader>
              <DialogTitle>Publish Project to Website</DialogTitle>
              <DialogDescription>Manage content for {'"'}{selectedProject?.name}{'"'}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto px-2">
              {/* Profile Details */}
              <div className="space-y-4 p-1">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Title</Label>
                  <Input id="title" value={publishFormData.title} onChange={(e) => setPublishFormData({ ...publishFormData, title: e.target.value })} className="col-span-3" required/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Textarea id="description" value={publishFormData.description} onChange={(e) => setPublishFormData({ ...publishFormData, description: e.target.value })} className="col-span-3" placeholder="A short, catchy description."/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cover_image" className="text-right">Cover Image</Label>
                  <Input id="cover_image" type="file" accept="image/*" onChange={(e) => setPublishFormData({ ...publishFormData, cover_image: e.target.files ? e.target.files[0] : null })} className="col-span-3"/>
                </div>
                {publishFormData.existing_cover_image_path && !publishFormData.cover_image && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="col-start-2 col-span-3"><Image src={publishFormData.existing_cover_image_path} alt="Current cover" width={128} height={128} className="rounded-md object-cover"/></div>
                  </div>
                )}
              </div>
              {/* Divider */}
              <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Gallery</span></div></div>
              {/* Gallery Manager */}
              <div className="space-y-4 p-1">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="gallery_images" className="text-right">Add Images</Label>
                    <Input id="gallery_images" type="file" accept="image/*" multiple onChange={(e) => setPublishFormData({...publishFormData, gallery_images: Array.from(e.target.files || [])})} className="col-span-3"/>
                 </div>
                 <div className="grid grid-cols-4 gap-4">
                   <div className="col-start-2 col-span-3">
                      {existingGalleryImages.length === 0 && publishFormData.gallery_images.length === 0 && <p className="text-sm text-muted-foreground">No gallery images yet.</p>}
                      <div className="grid grid-cols-3 gap-2">
                        {existingGalleryImages.map(img => (
                          <div key={img.id} className="relative group">
                            <Image src={img.image_path} alt="Gallery image" width={100} height={100} className={`rounded-md object-cover ${imagesToDelete.includes(img.image_path) ? 'opacity-30' : ''}`}/>
                            <Button variant="destructive" size="icon" className={`absolute top-1 right-1 h-6 w-6 group-hover:opacity-100 ${imagesToDelete.includes(img.image_path) ? 'opacity-100' : 'opacity-0'}`} onClick={() => setImagesToDelete(prev => [...prev, img.image_path])}>X</Button>
                          </div>
                        ))}
                        {publishFormData.gallery_images.map((file, i) => (
                           <div key={i} className="relative"><Image src={URL.createObjectURL(file)} alt={file.name} width={100} height={100} className="rounded-md object-cover"/></div>
                        ))}
                      </div>
                   </div>
                 </div>
              </div>
            </div>
            <DialogFooter className="sm:justify-between pt-4 border-t">
              <Button type="button" variant="destructive" onClick={handleUnpublish} disabled={isSubmitting || !publishFormData.existing_cover_image_path}>
                {isSubmitting ? <ClipLoader size={16} color="white" /> : 'Unpublish All'}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <ClipLoader size={16} color="white" /> : 'Save & Publish'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
