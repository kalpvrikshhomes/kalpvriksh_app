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

interface Worker {
  id: string
  name: string
  phone: string | null
  trade: string | null
  created_at: string
}

export function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [newWorker, setNewWorker] = useState({
    name: '',
    phone: '',
    trade: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.from('workers').select('*')
    if (error) {
      setError(error.message)
    } else if (data) {
      setWorkers(data)
    }
    setLoading(false)
  }

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase
      .from('workers')
      .insert([newWorker])
      .select()

    if (error) {
      setError(error.message)
    } else if (data) {
      setWorkers([...workers, ...data])
      setNewWorker({ name: '', phone: '', trade: '' })
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
          <CardTitle>Workers</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Worker</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new worker</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddWorker} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="worker-name">Name</Label>
                  <Input
                    id="worker-name"
                    value={newWorker.name}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, name: e.target.value })
                    }
                    placeholder="Worker Name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="worker-phone">Phone</Label>
                  <Input
                    id="worker-phone"
                    value={newWorker.phone}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, phone: e.target.value })
                    }
                    placeholder="Phone Number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="worker-trade">Trade</Label>
                  <Input
                    id="worker-trade"
                    value={newWorker.trade}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, trade: e.target.value })
                    }
                    placeholder="e.g., Carpenter, Fabricator"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add Worker
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
                <TableHead>Trade</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell>{worker.name}</TableCell>
                  <TableCell>{worker.trade}</TableCell>
                  <TableCell>{worker.phone}</TableCell>
                  <TableCell>
                    {new Date(worker.created_at).toLocaleDateString()}
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
