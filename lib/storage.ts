import { supabase } from '@/lib/supabase'
import { type Material, type Customer, type Project, type MaterialLog } from './types'

// Materials
export function getMaterials(): Material[] {
  const stored = localStorage.getItem('materials')
  return stored ? JSON.parse(stored) : []
}

export function saveMaterial(material: Material): void {
  const materials = getMaterials()
  const index = materials.findIndex(m => m.id === material.id)
  if (index >= 0) {
    materials[index] = material
  } else {
    materials.push(material)
  }
  localStorage.setItem('materials', JSON.stringify(materials))
}

export function deleteMaterial(id: string): void {
  const materials = getMaterials().filter(m => m.id !== id)
  localStorage.setItem('materials', JSON.stringify(materials))
}

// Customers
export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from('customers').select('*')
  if (error) {
    console.error('Error fetching customers:', error)
    return []
  }
  return data || []
}

export async function saveCustomer(customer: Omit<Customer, 'id'> & { id?: string }): Promise<void> {
  if (customer.id) {
    const { error } = await supabase.from('customers').update(customer).eq('id', customer.id)
    if (error) {
      console.error('Error updating customer:', error)
    }
  } else {
    const { error } = await supabase.from('customers').insert(customer)
    if (error) {
      console.error('Error inserting customer:', error)
    }
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) {
    console.error('Error deleting customer:', error)
  }
}

// Projects
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('*')
  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }
  return data || []
}

export async function saveProject(project: Omit<Project, 'id' | 'materials'> & { id?: string }): Promise<void> {
  if (project.id) {
    const { error } = await supabase.from('projects').update(project).eq('id', project.id)
    if (error) {
      console.error('Error updating project:', error)
    }
  } else {
    const { error } = await supabase.from('projects').insert(project)
    if (error) {
      console.error('Error inserting project:', error)
    }
  }
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) {
      console.error('Error deleting project:', JSON.stringify(error, null, 2))
    }
}

// Material Logs
export function getMaterialLogs(): MaterialLog[] {
  const stored = localStorage.getItem('materialLogs')
  return stored ? JSON.parse(stored) : []
}

export function addMaterialLog(log: MaterialLog): void {
  const logs = getMaterialLogs()
  logs.push(log)
  localStorage.setItem('materialLogs', JSON.stringify(logs))
}

// Demo data
export function initializeDemoData(): void {
  if (localStorage.getItem('materials')) return

  const demoMaterials: Material[] = [
    { id: '1', name: 'Fabric - Beige Linen', quantity: 50, unit: 'meters', price: 25, category: 'Fabrics' },
    { id: '2', name: 'Wood - Oak Plywood', quantity: 100, unit: 'sheets', price: 45, category: 'Wood' },
    { id: '3', name: 'Paint - Charcoal Grey', quantity: 30, unit: 'liters', price: 35, category: 'Finishes' },
    { id: '4', name: 'Leather - Cognac', quantity: 20, unit: 'meters', price: 120, category: 'Fabrics' },
  ]

  const demoCustomers: Customer[] = [
    { id: '1', name: 'Sarah Mitchell', email: 'sarah@example.com', phone: '555-0101', address: '123 Park Ave' },
    { id: '2', name: 'John Anderson', email: 'john@example.com', phone: '555-0102', address: '456 Oak St' },
  ]

  localStorage.setItem('materials', JSON.stringify(demoMaterials))
  localStorage.setItem('customers', JSON.stringify(demoCustomers))
  localStorage.setItem('projects', JSON.stringify([]))
  localStorage.setItem('materialLogs', JSON.stringify([]))
}
