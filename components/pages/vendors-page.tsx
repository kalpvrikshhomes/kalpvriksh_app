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

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase
      .from('vendors')
      .insert([newVendor])
      .select()

    if (error) {
      setError(error.message)
    } else if (data) {
      setVendors([...vendors, ...data])
      setNewVendor({ name: '', phone: '', address: '' })
      setIsDialogOpen(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Vendors</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Vendor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new vendor</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddVendor} className="space-y-4">
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
                  Add Vendor
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>{vendor.name}</TableCell>
                  <TableCell>{vendor.phone}</TableCell>
                  <TableCell>{vendor.address}</TableCell>
                  <TableCell>
                    {new Date(vendor.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
