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

interface VendorPurchasePageProps {
  user: User;
}

interface Customer {
  id: string
  name: string
}

interface Vendor {
  id: string
  name: string
}

export function VendorPurchasePage({ user }: VendorPurchasePageProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedVendor, setSelectedVendor] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [rate, setRate] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  
  const totalAmount = (parseFloat(quantity) * parseFloat(rate)) || 0;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      const [customersRes, vendorsRes] = await Promise.all([
        supabase.from('customers').select('id, name'),
        supabase.from('vendors').select('id, name'),
      ])

      if (customersRes.error) setError(customersRes.error.message)
      else if (customersRes.data) setCustomers(customersRes.data)

      if (vendorsRes.error) setError(vendorsRes.error.message)
      else if (vendorsRes.data) setVendors(vendorsRes.data)
      
      setLoading(false)
    }
    fetchData()
  }, [])

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || !selectedVendor || !itemDescription || !quantity || !rate) {
      toast({ title: 'Error', description: 'Please fill in all fields.', variant: 'destructive' })
      return
    }

    const { error } = await supabase.from('project_vendor_purchases').insert([
      {
        customer_id: selectedCustomer,
        vendor_id: selectedVendor,
        item_description: itemDescription,
        quantity: parseInt(quantity),
        unit,
        rate: parseFloat(rate),
        total_amount: totalAmount,
        purchased_by: user.id,
      },
    ])

    if (error) {
      toast({ title: 'Error recording purchase', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Success', description: 'Vendor purchase has been recorded successfully.' })
      setSelectedCustomer('')
      setSelectedVendor('')
      setItemDescription('')
      setQuantity('')
      setUnit('')
      setRate('')
    }
  }
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Record Vendor Purchase for Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePurchase} className="space-y-6">
            <div className="space-y-2">
              <Label>Project / Customer</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vendor</Label>
               <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger><SelectValue placeholder="Select a vendor" /></SelectTrigger>
                <SelectContent>{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="item">Item Description</Label>
                <Input id="item" value={itemDescription} onChange={e => setItemDescription(e.target.value)} placeholder="e.g., Plywood 18mm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g., 10" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input id="unit" value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g., sheets" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="rate">Rate</Label>
                <Input id="rate" type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g., 150.50" />
            </div>
            <div className="space-y-2">
                <Label>Total Amount</Label>
                <Input value={totalAmount.toFixed(2)} readOnly className="bg-muted" />
            </div>
            <Button type="submit" className="w-full">Record Purchase</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
