"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Button from "./Button";
import type { Vendor as ApiVendor } from "@/lib/api/vendor";

interface ActiveVendorPreviewDialogProps {
  open: boolean;
  pendingVendors: ApiVendor[];
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  formatCurrency: (amount: number) => string;
}

export default function ActiveVendorPreviewDialog({
  open,
  pendingVendors,
  onOpenChange,
  onConfirm,
  formatCurrency,
}: ActiveVendorPreviewDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[60] w-[min(420px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl duration-200 text-slate-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
        <div className="flex items-start justify-between gap-3">
          <div>
            <DialogPrimitive.Title className="text-lg font-semibold">
              Confirm adding active vendors
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-slate-500">
              These rows will be added with fresh zeroed values. Existing rows stay as-is.
            </DialogPrimitive.Description>
          </div>
          <DialogPrimitive.Close className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981]/60">
            <span className="material-icons text-base">close</span>
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </div>

        <div className="mt-4 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Vendor</th>
                <th className="px-3 py-2 text-center">Present</th>
                <th className="px-3 py-2 text-right">SNAP</th>
                <th className="px-3 py-2 text-right">DUFB</th>
                <th className="px-3 py-2 text-right">WDFM</th>
                <th className="px-3 py-2 text-right">Voucher</th>
              </tr>
            </thead>
            <tbody>
              {pendingVendors.map((vendor) => (
                <tr key={vendor.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-3 py-2 font-medium text-slate-700">{vendor.vendorName}</td>
                  <td className="px-3 py-2 text-center text-slate-500">No</td>
                  <td className="px-3 py-2 text-right text-slate-500">{formatCurrency(0)}</td>
                  <td className="px-3 py-2 text-right text-slate-500">{formatCurrency(0)}</td>
                  <td className="px-3 py-2 text-right text-slate-500">{formatCurrency(0)}</td>
                  <td className="px-3 py-2 text-right text-slate-500">{formatCurrency(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <DialogPrimitive.Close asChild>
            <button className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              Cancel
            </button>
          </DialogPrimitive.Close>
          <Button
            variant="primary"
            size="sm"
            onClick={onConfirm}
            disabled={pendingVendors.length === 0}
            className="px-4 py-2 text-sm"
          >
            Confirm add
          </Button>
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Root>
  );
}
