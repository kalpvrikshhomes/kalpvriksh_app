'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { type IssueItem } from '@/lib/types';

interface PaymentStatusModalProps {
  isOpen: boolean
  onClose: () => void
  vendorPurchases: IssueItem[]
  onSubmit: (paymentStatus: 'paid' | 'credit') => void
}

export function PaymentStatusModal({
  isOpen,
  onClose,
  vendorPurchases,
  onSubmit,
}: PaymentStatusModalProps) {

  const totalAmount = vendorPurchases.reduce((acc, item) => {
    const quantity = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return acc + quantity * rate;
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Vendor Purchase Payment</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <p>You are about to record the following items purchased directly from vendors:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {vendorPurchases.map(item => (
                    <li key={item.id}>
                        {item.quantity} x {item.item_description} @ {item.rate} each
                    </li>
                ))}
            </ul>
            <p className="text-right font-semibold">
                Total Amount: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalAmount)}
            </p>
            <p className="text-sm">
                Please confirm the payment status for this entire batch of vendor purchases.
            </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={() => onSubmit('credit')}>
            On Credit
          </Button>
          <Button type="button" onClick={() => onSubmit('paid')}>
            Paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
