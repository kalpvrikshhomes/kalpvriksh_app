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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Vendor {
  id: string
  name: string
  phone: string | null
  address: string | null
  created_at: string
}

export function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [newVendor, setNewVendor] = useState({
    name: '',
    phone: '',
    address: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.from('vendors').select('*')
    if (error) {
      setError(error.message)
    } else if (data) {
      setVendors(data)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const vendorData = {
      name: newVendor.name,
      phone: newVendor.phone || null,
      address: newVendor.address || null,
    };

    if (editingId) {
      // Update existing vendor
      const { error } = await supabase
        .from('vendors')
        .update(vendorData)
        .eq('id', editingId);

      if (error) {
        setError(error.message);
      } else {
        setVendors(vendors.map(v => v.id === editingId ? { ...v, ...vendorData } : v));
      }
    } else {
      // Add new vendor
      const { data, error } = await supabase
        .from('vendors')
        .insert([vendorData])
        .select();

      if (error) {
        setError(error.message);
      } else if (data && data.length > 0) {
        setVendors(prevVendors => [...prevVendors, data[0]]);
      } else {
        setError('Failed to add vendor: No data returned after insert.');
      }
    }

    setLoading(false);
    setNewVendor({ name: '', phone: '', address: '' });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (vendor: Vendor) => {
    setNewVendor({
      name: vendor.name,
      phone: vendor.phone || '',
      address: vendor.address || '',
    });
    setEditingId(vendor.id);
    setIsDialogOpen(true); // Open the dialog for editing
  };

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <CardTitle>Vendors</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) { // When dialog closes, reset form and editing ID
              setNewVendor({ name: '', phone: '', address: '' });
              setEditingId(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                  setNewVendor({ name: '', phone: '', address: '' });
                  setEditingId(null);
              }}>Add Vendor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Vendor' : 'Add a new vendor'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor-name">Name</Label>
                  <Input
                    id="vendor-name"
                    value={newVendor.name}
                    onChange={(e) =>
                      setNewVendor({ ...newVendor, name: e.target.value })
                    }
                    placeholder="Vendor Name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-phone">Phone</Label>
                  <Input
                    id="vendor-phone"
                    value={newVendor.phone}
                    onChange={(e) =>
                      setNewVendor({ ...newVendor, phone: e.target.value })
                    }
                    placeholder="Phone Number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-address">Address</Label>
                  <Input
                    id="vendor-address"
                    value={newVendor.address}
                    onChange={(e) =>
                      setNewVendor({ ...newVendor, address: e.target.value })
                    }
                    placeholder="Address"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? 'Save Changes' : 'Add Vendor'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((vendor) => (
              <Card key={vendor.id || `vendor-${Math.random()}`} className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{vendor.name || 'Unknown Vendor'}</h3>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <p>📞 {vendor.phone || 'N/A'}</p>
                        <p>📍 {vendor.address || 'N/A'}</p>
                        <p>📅 Added on: {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(vendor)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(vendor.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
