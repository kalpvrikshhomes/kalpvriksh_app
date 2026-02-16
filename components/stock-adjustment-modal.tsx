"use client";

import { useState } from "react";
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
import { addInventoryHistory } from "@/lib/storage"; // We will use this function

interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: {
    id: string;
    name: string;
    quantity: number;
  } | null;
  onAdjusted: () => void;
}

export function StockAdjustmentModal({
  open,
  onOpenChange,
  material,
  onAdjusted,
}: StockAdjustmentModalProps) {
  const [adjustment, setAdjustment] = useState(0);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdjust = async () => {
    if (!material || adjustment === 0) return;

    setLoading(true);
    try {
        await addInventoryHistory({
            materialId: material.id,
            quantity: adjustment,
            reason: 'correction',
            projectId: null, 
        });
      onAdjusted();
      onOpenChange(false);
      setAdjustment(0);
    } catch (error) {
      console.error("Failed to adjust stock:", error);
      // TODO: Show an error toast to the user
    } finally {
      setLoading(false);
    }
  };

  if (!material) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock for {material.name}</DialogTitle>
          <DialogDescription>
            Current quantity: {material.quantity}. Enter a positive value to add stock, or a negative value to remove it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="adjustment" className="text-right">
              Adjustment
            </Label>
            <Input
              id="adjustment"
              type="number"
              value={adjustment}
              onChange={(e) => setAdjustment(parseInt(e.target.value, 10) || 0)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">
              Reason
            </Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Initial stock, Correction"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleAdjust} disabled={loading || adjustment === 0}>
            {loading ? "Adjusting..." : "Save Adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
