import { supabase } from '@/lib/supabase'
import { type Material, type Customer, type Project, type MaterialLog } from './types'

// Inventory
export async function getInventory(): Promise<Material[]> {
  const { data, error } = await supabase.from('inventory_items').select('*')
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

export async function getOrCreateInventoryItem(
    itemName: string, 
    unit: string,
    rate: number
): Promise<string> {
    // First, try to find the item by name.
    const { data: existingItem, error: selectError } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('name', itemName)
        .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116: "object not found"
        console.error('Error searching for inventory item:', selectError);
        throw selectError;
    }

    if (existingItem) {
        return existingItem.id;
    }

    // If it doesn't exist, create it.
    const { data: newItem, error: insertError } = await supabase
        .from('inventory_items')
        .insert({
            name: itemName,
            unit: unit,
            cost_price: rate,
            total_quantity: 0, // Starts with 0, will be updated by triggers
            category: 'Uncategorized', // Default category
        })
        .select('id')
        .single();

    if (insertError) {
        console.error('Error creating new inventory item:', insertError);
        throw insertError;
    }

    return newItem.id;
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
      const { error } = await supabase.from('inventory_items').update(itemToUpdate).eq('id', id);
      if (error) {
        console.error('Error updating inventory item:', error);
        throw error;
      }
    } else {
      // When inserting, create the item first with 0 quantity.
      const itemToInsert = {
        name,
        category,
        unit,
        cost_price: price,
        total_quantity: 0,
      };
      const { data: newItem, error } = await supabase.from('inventory_items').insert(itemToInsert).select('id').single();
      
      if (error) {
        console.error('Error inserting inventory item:', error);
        throw error;
      }

      // If there's an initial quantity, create a history record for it.
      // The trigger on the history table will then update the item's total_quantity.
      if (newItem && initial_quantity && initial_quantity > 0) {
        await addInventoryHistory({
          materialId: newItem.id,
          quantity: initial_quantity,
          reason: 'initial_stock',
        });
      }
    }
  }

export async function deleteInventory(id: string): Promise<void> {
  const { error } = await supabase.from('inventory_items').delete().eq('id', id)
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

// Material Issues
export async function addCustomerMaterialIssue(issue: {
    project_id: string,
    inventory_item_id: string,
    quantity: number,
    rate_at_issue: number,
    issued_by: string,
}): Promise<void> {
    const { error } = await supabase.from('customer_material_issue').insert(issue);
    if (error) {
        console.error('Error adding customer material issue:', error);
        throw error;
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
      inventory_items ( name )
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
        materialName: log.inventory_items?.name, // Extract the material name
        quantity: log.quantity_change,
        usedBy: log.profiles?.full_name ?? log.created_by,
        timestamp: log.created_at,
    })) || []
}

export async function addInventoryHistory(log: {
    materialId: string;
    quantity: number;
    reason: 'purchase' | 'issued_to_project' | 'correction' | 'initial_stock';
    projectId?: string | null;
}): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error('No user logged in to perform this action.');
        throw new Error('Authentication required.');
    }

    const { error } = await supabase.from('inventory_history').insert({
        inventory_item_id: log.materialId,
        quantity_change: log.quantity,
        reason: log.reason,
        related_project_id: log.projectId,
        created_by: user.id,
    });

    if (error) {
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
    // 1. Create the main vendor purchase record
    const { data: purchaseRecord, error: purchaseError } = await supabase
        .from('vendor_purchases')
        .insert({
            vendor_id: purchase.vendorId,
            payment_status: purchase.paymentStatus,
            total_amount: purchase.totalAmount,
        })
        .select('id')
        .single();

    if (purchaseError) {
        console.error('Error creating vendor purchase:', purchaseError);
        throw purchaseError;
    }

    // 2. Create the purchase line item
    const { error: itemError } = await supabase
        .from('vendor_purchase_items')
        .insert({
            purchase_id: purchaseRecord.id,
            inventory_item_id: purchase.itemId,
            quantity: purchase.quantity,
            rate: purchase.rate,
        });

    if (itemError) {
        console.error('Error creating vendor purchase item:', itemError);
        // Here you might want to delete the purchaseRecord you just created for consistency
        throw itemError;
    }

    // 3. Create the inventory history record to update stock
    await addInventoryHistory({
        materialId: purchase.itemId,
        quantity: purchase.quantity,
        reason: 'purchase',
    });
}