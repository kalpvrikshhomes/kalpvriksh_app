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

interface Customer {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
}

export function MaterialIssuePage({ user }: MaterialIssuePageProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState('')
  const [rate, setRate] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      const [customersRes, productsRes] = await Promise.all([
        supabase.from('customers').select('id, name'),
        supabase.from('products').select('id, name'),
      ])

      if (customersRes.error) {
        setError(customersRes.error.message)
      } else if (customersRes.data) {
        setCustomers(customersRes.data)
      }

      if (productsRes.error) {
        setError(productsRes.error.message)
      } else if (productsRes.data) {
        setProducts(productsRes.data)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleIssueMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || !selectedProduct || !quantity || !rate) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      })
      return
    }

    const { error } = await supabase.from('customer_material_issue').insert([
      {
        customer_id: selectedCustomer,
        product_id: selectedProduct,
        quantity: parseInt(quantity),
        rate_at_issue: parseFloat(rate),
        issued_by: user.id,
      },
    ])

    if (error) {
      toast({
        title: 'Error issuing material',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Material has been issued successfully.',
      })
      setSelectedCustomer('')
      setSelectedProduct('')
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
              <Label>Project / Customer</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Product</Label>
               <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
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
