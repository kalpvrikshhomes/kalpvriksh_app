import { supabase } from '@/lib/supabase'
import { type Material, type Customer, type Project, type MaterialLog } from './types'

// Inventory
export async function getInventory(): Promise<Material[]> {
  const { data, error } = await supabase.from('inventory').select('*')
  if (error) {
    console.error('Error fetching inventory:', error)
    return []
  }
  return data.map(item => ({
    ...item,
    quantity: item.total_quantity,
    price: item.cost_price,
  })) || []
}

export async function saveInventory(inventoryItem: Omit<Material, 'id'> & { id?: string }): Promise<void> {
  const { id, name, category, unit, quantity, price } = inventoryItem;
  const item = {
    name,
    category,
    unit,
    total_quantity: quantity,
    cost_price: price,
  };

  if (id) {
    const { error } = await supabase.from('inventory').update(item).eq('id', id)
    if (error) {
      console.error('Error updating inventory item:', error)
    }
  } else {
    const { error } = await supabase.from('inventory').insert(item)
    if (error) {
      console.error('Error inserting inventory item:', error)
    }
  }
}

export async function deleteInventory(id: string): Promise<void> {
  const { error } = await supabase.from('inventory').delete().eq('id', id)
  if (error) {
    console.error('Error deleting inventory item:', error)
  }
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

// Inventory History
export async function getMaterialIssuesForProject(projectId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('customer_material_issue')
    .select('*')
    .eq('project_id', projectId);

  if (error) {
    console.error(`Error fetching material issues for project ${projectId}:`, error);
    return [];
  }
  return data || [];
}

export async function getInventoryHistory(): Promise<MaterialLog[]> {
    console.log('Fetching inventory history from Supabase...');
    const { data, error } = await supabase.from('inventory_history').select(`
      *,
      profiles ( full_name ),
      inventory ( name )
    `);

    console.log('Supabase response for inventory_history:', { data, error });

    if (error) {
        console.error('Error fetching inventory history:', error)
        return []
    }

    if (!data) {
        console.log('No data returned for inventory history.');
        return [];
    }
    
    console.log('Raw inventory history data:', data);

    return data.map((log: any) => ({
        id: log.id,
        projectId: log.related_project_id,
        materialId: log.inventory_item_id,
        materialName: log.inventory?.name, // Extract the material name
        quantity: log.quantity_change,
        usedBy: log.profiles?.full_name ?? log.created_by,
        timestamp: log.created_at,
    })) || []
}

export async function addInventoryHistory(log: Omit<MaterialLog, 'id' | 'timestamp'>): Promise<void> {
    const { error } = await supabase.from('inventory_history').insert({
        inventory_item_id: log.materialId,
        quantity_change: log.quantity,
        reason: 'correction', // Or some other reason
        related_project_id: log.projectId,
        created_by: log.usedBy,
    })
    if (error) {
        console.error('Error adding inventory history:', error)
    }
}
