export type UserRole = 'admin' | 'employee'

export interface User {
  id: string
  name: string
  role: UserRole
}

export interface Material {
  id: string
  name: string
  quantity: number
  unit: string
  price: number
  category: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  customer_id: string
  project_value: number
  status: 'pending' | 'in-progress' | 'completed'
  created_at: string
}

export interface ProjectMaterial {
  materialId: string
  quantity: number
  usedQuantity: number
}

export interface MaterialLog {
  id: string
  projectId: string
  materialId: string
  quantity: number
  usedBy: string
  timestamp: string
}
