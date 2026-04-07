"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Vendor as ApiVendor } from "@/lib/api/vendor";
import ActiveVendorPreviewDialog from "./ActiveVendorPreviewDialog";
import type { VendorTransactionsSheetRow } from "./VendorTransactionsSheet";

interface ActiveVendorAddButtonProps {
  activeVendors: ApiVendor[];
  vendorsLoading: boolean;
  currentMarketDate: string;
  rows: VendorTransactionsSheetRow[];
  onRowsChange: (rows: VendorTransactionsSheetRow[]) => void;
}

const createLocalId = () => Math.random().toString(36).slice(2, 11);

export default function ActiveVendorAddButton({
  activeVendors,
  vendorsLoading,
  currentMarketDate,
  rows,
  onRowsChange,
}: ActiveVendorAddButtonProps) {
  const [pendingVendors, setPendingVendors] = useState<ApiVendor[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const openPreview = () => {
    if (vendorsLoading) {
      toast.info("Active vendor list is still loading.");
      return;
    }

    if (activeVendors.length === 0) {
      toast.info("No active vendors are available.");
      return;
    }

    const existingVendorIds = new Set(rows.map((row) => row.vendor_id));
    const missingActiveVendors = activeVendors.filter(
      (vendor) => !existingVendorIds.has(vendor.id)
    );

    if (missingActiveVendors.length === 0) {
      toast.info("All active vendors are already present.");
      return;
    }

    setPendingVendors(missingActiveVendors);
    setIsPreviewOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsPreviewOpen(open);
    if (!open) {
      setPendingVendors([]);
    }
  };

  const handleConfirm = () => {
    if (pendingVendors.length === 0) {
      setIsPreviewOpen(false);
      return;
    }

    const newRows: VendorTransactionsSheetRow[] = pendingVendors.map((vendor) => ({
      id: createLocalId(),
      vendor_id: vendor.id,
      vendor_name: vendor.vendorName,
      market_date: currentMarketDate,
      present: false,
      snap: 0,
      dufb: 0,
      wdfm_tokens: 0,
      voucher: 0,
      reimbursement_due: 0,
      reported_sales: 0,
      est_produce_sales: 0,
      est_num_transactions: 0,
      isInvalid: false,
    }));

    onRowsChange([...newRows, ...rows]);
    setIsPreviewOpen(false);
    setPendingVendors([]);
    toast.success(`Added ${newRows.length} active vendor${newRows.length === 1 ? "" : "s"}.`);
  };

  return (
    <>
      <div className="flex flex-col gap-1 text-right">
        <button
          type="button"
          onClick={openPreview}
          disabled={vendorsLoading || activeVendors.length === 0}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all border shadow-sm
            ${vendorsLoading || activeVendors.length === 0
              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              : "bg-white text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/10"}
          `}
        >
          <span className="material-icons text-base leading-none">group_add</span>
          Add active vendors
        </button>
        <p className="text-xs text-slate-500">
          {vendorsLoading ? "Loading active vendors..." : ""}
        </p>
      </div>

      <ActiveVendorPreviewDialog
        open={isPreviewOpen}
        pendingVendors={pendingVendors}
        onOpenChange={handleOpenChange}
        onConfirm={handleConfirm}
        formatCurrency={(amount) =>
          new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
        }
      />
    </>
  );
}
