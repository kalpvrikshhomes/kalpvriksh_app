'use client'

import { useState, useEffect } from 'react'
import { type Project, type Customer } from '@/lib/types'
import { getProjects, saveProject, deleteProject, getCustomers, getMaterialIssuesForProject } from '@/lib/storage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { ClipLoader } from 'react-spinners' // Assuming ClipLoader might be used or needed for loading states
import { formatINR } from '@/hooks/use-currency-converter' // Keep formatINR as it's useful for displaying INR values

interface ProjectDetails {
  projectValue: number;
  totalMaterialCost: number;
  profit: number;
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    customer_id: '',
    project_value: 0,
    status: 'pending' as const,
  })
  const [selectedProjectDetails, setSelectedProjectDetails] = useState<ProjectDetails | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  
  // Removed useCurrencyConverter hook and its related variables

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
    console.log('Project data being sent:', project) // Add this line
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
    setSelectedProjectDetails({
      projectValue: project.project_value,
      totalMaterialCost,
      profit
    });
    setIsDetailsDialogOpen(true);
  }

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'Unknown'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Project Management</h1>
          <p className="text-muted-foreground mt-2">Track and manage interior design projects</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
        >
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
                <option value="in-progress">In Progress</option>
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
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      project.status === 'completed' ? 'bg-green-900/30 text-green-200' :
                      project.status === 'in-progress' ? 'bg-blue-900/30 text-blue-200' :
                      'bg-gray-700/30 text-gray-300'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(project)}
                    >
                      Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(project)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      console.log('Delete button clicked', project.id);
                      handleDelete(project.id);
                    }}
                  >
                    Delete
                  </Button>
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
    </div>
  )
}
