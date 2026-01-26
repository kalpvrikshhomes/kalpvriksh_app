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
  const [editingId, setEditingId] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const workerData = {
      name: newWorker.name,
      phone: newWorker.phone || null,
      trade: newWorker.trade || null,
    };

    if (editingId) {
      // Update existing worker
      const { error } = await supabase
        .from('workers')
        .update(workerData)
        .eq('id', editingId);

      if (error) {
        setError(error.message);
      } else {
        setWorkers(workers.map(w => w.id === editingId ? { ...w, ...workerData } : w));
      }
    } else {
      // Add new worker
      const { data, error } = await supabase
        .from('workers')
        .insert([workerData])
        .select();

      if (error) {
        setError(error.message);
      } else if (data && data.length > 0) {
        setWorkers(prevWorkers => [...prevWorkers, data[0]]);
      } else {
        setError('Failed to add worker: No data returned after insert.');
      }
    }

    setLoading(false);
    setNewWorker({ name: '', phone: '', trade: '' });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (worker: Worker) => {
    setNewWorker({
      name: worker.name,
      phone: worker.phone || '',
      trade: worker.trade || '',
    });
    setEditingId(worker.id);
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
          <CardTitle>Workers</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) { // When dialog closes, reset form and editing ID
              setNewWorker({ name: '', phone: '', trade: '' });
              setEditingId(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                  setNewWorker({ name: '', phone: '', trade: '' });
                  setEditingId(null);
              }}>Add Worker</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Worker' : 'Add a new worker'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  {editingId ? 'Save Changes' : 'Add Worker'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((worker) => (
              // Ensure worker.id is valid for key and other usage
              <Card key={worker.id || `worker-${Math.random()}`} className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{worker.name || 'Unknown Worker'}</h3>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <p>🛠️ {worker.trade || 'N/A'}</p>
                        <p>📞 {worker.phone || 'N/A'}</p>
                        <p>📅 Added on: {worker.created_at ? new Date(worker.created_at).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(worker)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(worker.id)}
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
