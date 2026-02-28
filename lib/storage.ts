
import { type Material, type Customer, type Project, type MaterialLog } from './types'
import { dbFetch } from './utils'

// Inventory
export async function getInventory(): Promise<Material[]> {
  try {
    const data = await dbFetch('inventory_items', 'select', {})
    if (!data) return []
    return data.map((item: any) => ({
      ...item,
      quantity: item.total_quantity,
      price: item.cost_price,
    })) || []
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return []
  }
}

export async function getOrCreateInventoryItem(
    itemName: string, 
    unit: string,
    rate: number
): Promise<string> {
    try {
        // First, try to find the item by name.
        const existingItem = await dbFetch('inventory_items', 'select', {
          eq: { name: itemName },
          single: true
        })

        if (existingItem) {
            return existingItem.id;
        }
    } catch (selectError: any) {
        if (selectError.message !== 'PGRST116' && !selectError.message.includes('JSON')) { 
            console.error('Error searching for inventory item:', selectError);
            throw selectError;
        }
    }

    // If it doesn't exist, create it.
    const newItem = await dbFetch('inventory_items', 'insert', {
        name: itemName,
        unit: unit,
        cost_price: rate,
        total_quantity: 0,
        category: 'Uncategorized',
    })

    if (!newItem || !newItem[0]) {
        throw new Error('Error creating new inventory item');
    }

    return newItem[0].id;
}


export async function saveInventory(inventoryItem: Omit<Material, 'id'> & { id?: string; initial_quantity?: number }): Promise<void> {
    const { id, name, category, unit, price, initial_quantity } = inventoryItem;
  
    if (id) {
      // When updating, only update non-quantity fields. Quantity is managed by triggers.
      const itemToUpdate = {
        name,
        category,
        unit,
        cost_price: price,
      };
      await dbFetch('inventory_items', 'update', {
        values: itemToUpdate,
        eq: { id }
      })
    } else {
      // When inserting, create the item first with 0 quantity.
      const itemToInsert = {
        name,
        category,
        unit,
        cost_price: price,
        total_quantity: 0,
      };
      const newItem = await dbFetch('inventory_items', 'insert', itemToInsert)
      
      if (!newItem || !newItem[0]) {
        throw new Error('Error inserting inventory item');
      }

      // If there's an initial quantity, create a history record for it.
      if (initial_quantity && initial_quantity > 0) {
        await addInventoryHistory({
          materialId: newItem[0].id,
          quantity: initial_quantity,
          reason: 'initial_stock',
        });
      }
    }
  }

export async function deleteInventory(id: string): Promise<void> {
  try {
    await dbFetch('inventory_items', 'delete', { eq: { id } })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
  }
}

// Customers
export async function getCustomers(nameFilter?: string, addressFilter?: string): Promise<Customer[]> {
  try {
    const data = await dbFetch('customers', 'select', {
      ilike: {
        ...(nameFilter && { name: `%${nameFilter}%` }),
        ...(addressFilter && { address: `%${addressFilter}%` }),
      }
    })
    return data || []
  } catch (error) {
    console.error('Error fetching customers:', error)
    return []
  }
}

export async function saveCustomer(customer: Omit<Customer, 'id'> & { id?: string }): Promise<void> {
  try {
    if (customer.id) {
      await dbFetch('customers', 'update', {
        values: customer,
        eq: { id: customer.id }
      })
    } else {
      await dbFetch('customers', 'insert', customer)
    }
  } catch (error) {
    console.error('Error saving customer:', error)
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    await dbFetch('customers', 'delete', { eq: { id } })
  } catch (error) {
    console.error('Error deleting customer:', error)
  }
}

// Projects
export async function getProjects(): Promise<Project[]> {
  try {
    const data = await dbFetch('projects', 'select', {})
    return data || []
  } catch (error) {
    console.error('Error fetching projects:', error)
    return []
  }
}

export async function saveProject(project: Omit<Project, 'id' | 'materials'> & { id?: string }): Promise<void> {
  try {
    if (project.id) {
      await dbFetch('projects', 'update', {
        values: project,
        eq: { id: project.id }
      })
    } else {
      await dbFetch('projects', 'insert', project)
    }
  } catch (error) {
    console.error('Error saving project:', error)
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    await dbFetch('projects', 'delete', { eq: { id } })
  } catch (error) {
      console.error('Error deleting project:', error)
    }
}

// Material Issues
export async function addCustomerMaterialIssue(issue: {
    project_id: string,
    inventory_item_id: string,
    quantity: number,
    rate_at_issue: number,
    issued_by: string,
}): Promise<void> {
    try {
        await dbFetch('customer_material_issue', 'insert', issue);
    } catch (error) {
        console.error('Error adding customer material issue:', error);
        throw error;
    }
}

// Inventory History
export async function getMaterialIssuesForProject(projectId: string): Promise<any[]> {
  try {
    const data = await dbFetch('customer_material_issue', 'select', {
      eq: { project_id: projectId }
    })
    return data || [];
  } catch (error) {
    console.error(`Error fetching material issues for project ${projectId}:`, error);
    return [];
  }
}

export async function getInventoryHistory(): Promise<MaterialLog[]> {
    try {
        // Special case for complex select with joins
        // We'll handle this in the generic API route by adding more options or creating a specific route
        // For now, let's keep it simple or create a dedicated route for history
        const response = await fetch('/api/db/inventory-history', { method: 'GET' })
        const res = await response.json()
        if (res.error) throw new Error(res.error)
        return res.data || []
    } catch (error) {
        console.error('Error fetching inventory history:', error)
        return []
    }
}

export async function addInventoryHistory(log: {
    materialId: string;
    quantity: number;
    reason: 'purchase' | 'issued_to_project' | 'correction' | 'initial_stock';
    projectId?: string | null;
}): Promise<void> {
    try {
        // First get current user
        const sessionRes = await fetch('/api/session')
        const { user } = await sessionRes.json()
        if (!user) {
            throw new Error('Authentication required.');
        }

        await dbFetch('inventory_history', 'insert', {
            inventory_item_id: log.materialId,
            quantity_change: log.quantity,
            reason: log.reason,
            related_project_id: log.projectId,
            created_by: user.id,
        })
    } catch (error) {
        console.error('Error adding inventory history:', error);
        throw error;
    }
}

export async function recordPurchase(purchase: {
    vendorId: string;
    paymentStatus: 'paid' | 'credit' | 'partial';
    totalAmount: number;
    itemId: string;
    quantity: number;
    rate: number;
}): Promise<void> {
    try {
        // 1. Create the main vendor purchase record
        const purchaseRecord = await dbFetch('vendor_purchases', 'insert', {
            vendor_id: purchase.vendorId,
            payment_status: purchase.paymentStatus,
            total_amount: purchase.totalAmount,
        })

        if (!purchaseRecord || !purchaseRecord[0]) {
            throw new Error('Error creating vendor purchase');
        }

        // 2. Create the purchase line item
        await dbFetch('vendor_purchase_items', 'insert', {
            purchase_id: purchaseRecord[0].id,
            inventory_item_id: purchase.itemId,
            quantity: purchase.quantity,
            rate: purchase.rate,
        });

        // 3. Create the inventory history record to update stock
        await addInventoryHistory({
            materialId: purchase.itemId,
            quantity: purchase.quantity,
            reason: 'purchase',
        });
    } catch (error) {
        console.error('Error recording purchase:', error);
        throw error;
    }
}
