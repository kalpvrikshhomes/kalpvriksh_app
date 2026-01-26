'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { type User } from '@/lib/types'

interface MaterialIssuePageProps {
  user: User;
}

interface Project {
  id: string
  name: string
}

interface InventoryItem {
  id: string
  name: string
}

export function MaterialIssuePage({ user }: MaterialIssuePageProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedInventoryItem, setSelectedInventoryItem] = useState('')
  const [quantity, setQuantity] = useState('')
  const [rate, setRate] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      const [projectsRes, inventoryRes] = await Promise.all([
        supabase.from('projects').select('id, name'),
        supabase.from('inventory').select('id, name'),
      ])

      if (projectsRes.error) {
        setError(projectsRes.error.message)
      } else if (projectsRes.data) {
        setProjects(projectsRes.data)
      }

      if (inventoryRes.error) {
        setError(inventoryRes.error.message)
      } else if (inventoryRes.data) {
        setInventoryItems(inventoryRes.data)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleIssueMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject || !selectedInventoryItem || !quantity || !rate) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      })
      return
    }

    const parsedQuantity = parseInt(quantity);
    const parsedRate = parseFloat(rate);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      toast({
        title: 'Error',
        description: 'Quantity must be a positive number.',
        variant: 'destructive',
      })
      return
    }

    if (isNaN(parsedRate) || parsedRate < 0) {
      toast({
        title: 'Error',
        description: 'Rate at Issue must be a non-negative number.',
        variant: 'destructive',
      })
      return
    }

    const issueData = {
      project_id: selectedProject,
      inventory_item_id: selectedInventoryItem,
      quantity: parsedQuantity,
      rate_at_issue: parsedRate,
      issued_by: user.id,
    }

    console.log('Issuing material with data:', issueData)

    const { data, error } = await supabase.from('customer_material_issue').insert(issueData).select()

    console.log('Supabase response for customer_material_issue:', { data, error })

    if (error) {
      console.error('Supabase error:', error);
      let errorMessage = `Message: ${error.message}.`;
      if (error.details) {
        errorMessage += ` Details: ${error.details}`;
      }

      if (error.message.includes('Row Level Security') || (error.details && error.details.includes('policy'))) {
        errorMessage += ' This might be due to Row Level Security policies. Please ensure you are authenticated and your user ID matches the "issued_by" field, or that you have appropriate admin privileges.';
      }
      
      toast({
        title: 'Error issuing material',
        description: errorMessage,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Material has been issued successfully.',
      })
      setSelectedProject('')
      setSelectedInventoryItem('')
      setQuantity('')
      setRate('')
    }
  }
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Issue Material to Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleIssueMaterial} className="space-y-6">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Material</Label>
               <Select value={selectedInventoryItem} onValueChange={setSelectedInventoryItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a material" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
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
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="e.g., 10"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="rate">Rate at Issue</Label>
                <Input 
                    id="rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={rate}
                    onChange={e => setRate(e.target.value)}
                    placeholder="e.g., 150.50"
                />
            </div>
            <Button type="submit" className="w-full">Issue Material</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
