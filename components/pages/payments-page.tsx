'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { type User } from '@/lib/types'

interface PaymentsPageProps {
  user: User;
}

interface Worker { id: string; name: string; }
interface Vendor { id: string; name: string; }
interface Project { id: string; name: string; } // Use Project type

export function PaymentsPage({ user }: PaymentsPageProps) {
  const [payeeType, setPayeeType] = useState<'worker' | 'vendor' | ''>('');
  
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]); // Change to projects

  const [selectedPayeeId, setSelectedPayeeId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(''); // Change to selectedProjectId
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const [workersRes, vendorsRes, projectsRes] = await Promise.all([ // Fetch projects
        supabase.from('workers').select('id, name'),
        supabase.from('vendors').select('id, name'),
        supabase.from('projects').select('id, name'), // Fetch projects
      ]);

      if (workersRes.error) setError(workersRes.error.message);
      else if (workersRes.data) setWorkers(workersRes.data);

      if (vendorsRes.error) setError(vendorsRes.error.message);
      else if (vendorsRes.data) setVendors(vendorsRes.data);
      
      if (projectsRes.error) setError(projectsRes.error.message); // Check projectsRes
      else if (projectsRes.data) setProjects(projectsRes.data); // Set projects
      
      setLoading(false);
    };
    fetchData();
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payeeType || !selectedPayeeId || !amount) {
      toast({ title: 'Error', description: 'Payee Type, Payee, and Amount are required.', variant: 'destructive' });
      return;
    }

    const paymentData = {
      payee_type: payeeType,
      worker_id: payeeType === 'worker' ? selectedPayeeId : null,
      vendor_id: payeeType === 'vendor' ? selectedPayeeId : null,
      project_id: selectedProjectId || null, // Change to project_id
      amount: parseFloat(amount),
      notes,
      paid_by: user.id,
    };

    const { error } = await supabase.from('payments').insert([paymentData]);

    if (error) {
      toast({ title: 'Error Recording Payment', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Payment has been recorded successfully.' });
      setPayeeType('');
      setSelectedPayeeId('');
      setSelectedProjectId(''); // Reset selectedProjectId
      setAmount('');
      setNotes('');
    }
  };

  const payeeList = payeeType === 'worker' ? workers : vendors;

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader><CardTitle>Record a Payment</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handlePayment} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payee Type</Label>
                <Select value={payeeType} onValueChange={(value) => {
                  setPayeeType(value as any);
                  setSelectedPayeeId('');
                }}>
                  <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">Worker</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payee</Label>
                <Select value={selectedPayeeId} onValueChange={setSelectedPayeeId} disabled={!payeeType}>
                  <SelectTrigger><SelectValue placeholder={`Select a ${payeeType || 'payee'}`} /></SelectTrigger>
                  <SelectContent>
                    {payeeList.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Project (Optional)</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 5000.00 (INR)" required/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Advance payment for project X" />
            </div>

            <Button type="submit" className="w-full">Record Payment</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
