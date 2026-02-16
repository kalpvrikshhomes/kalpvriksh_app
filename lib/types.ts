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
  materialName?: string // Added material name
  quantity: number
  usedBy: string
  timestamp: string
}

export interface InventoryItem {
  id: string
  name: string
}

export interface Vendor {
    id: string;
    name: string;
}

export interface IssueItem {
    id: string;
    inventory_item_id: string;
    quantity: string;
    rate: string;
    unit: string;
    is_vendor_purchase: boolean;
    vendor_id: string;
    item_description: string;
    payment_status?: 'paid' | 'credit';
}
