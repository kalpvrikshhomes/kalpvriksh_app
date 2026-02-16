"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recordPurchase } from "@/lib/storage";
import { type Material, type Vendor } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface PurchaseToInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materials: Material[];
  onPurchase: () => void;
}

export function PurchaseToInventoryModal({
  open,
  onOpenChange,
  materials,
  onPurchase,
}: PurchaseToInventoryModalProps) {
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'credit' | 'partial'>('credit');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchVendors() {
      const { data, error } = await supabase.from("vendors").select("id, name");
      if (error) {
        console.error("Error fetching vendors:", error);
      } else {
        setVendors(data as Vendor[]);
      }
    }
    if (open) {
      fetchVendors();
    }
  }, [open]);

  const handlePurchase = async () => {
    const rate = quantity > 0 ? totalAmount / quantity : 0;
    if (!selectedMaterialId || quantity <= 0 || !selectedVendorId || totalAmount <= 0) {
        toast({ title: 'Error', description: 'Please fill all fields correctly.', variant: 'destructive' });
        return;
    }

    setLoading(true);
    try {
      await recordPurchase({
        vendorId: selectedVendorId,
        paymentStatus: paymentStatus,
        totalAmount: totalAmount,
        itemId: selectedMaterialId,
        quantity: quantity,
        rate: rate,
      });
      onPurchase();
      onOpenChange(false);
      // Reset form
      setSelectedMaterialId("");
      setQuantity(0);
      setSelectedVendorId("");
      setTotalAmount(0);
      setPaymentStatus('credit');
    } catch (error: any) {
      console.error("Failed to record purchase:", error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Purchase Material to Inventory</DialogTitle>
          <DialogDescription>
            Record a bulk purchase of materials directly into the main inventory.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="material" className="text-right">
              Material
            </Label>
            <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a material" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vendor" className="text-right">
              Vendor
            </Label>
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cost" className="text-right">
              Total Amount
            </Label>
            <Input
              id="cost"
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="payment-status" className="text-right">
              Payment
            </Label>
            <Select value={paymentStatus} onValueChange={(value: 'paid' | 'credit' | 'partial') => setPaymentStatus(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handlePurchase} disabled={loading}>
            {loading ? "Recording..." : "Record Purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
