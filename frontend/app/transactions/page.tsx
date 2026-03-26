"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Table as TableIcon, 
  Trash2, 
  Loader2,
  AlertCircle,
  Check,
  Upload,
  Download
} from 'lucide-react';
import SidebarNavigation from '../components/SidebarNavigation';
import Button from '../components/Button';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { AddVendorDialog } from '../components/AddVendorDialog'
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'sonner';
import * as XLSX from 'xlsx';
import {
  bulkCreateVendorTransactions,
  searchVendorTransactions,
  type CreateVendorTransactionRequest,
  type VendorTransaction,
} from '@/lib/api/transactions';
import { getVendors, type Vendor as ApiVendor } from '@/lib/api/vendor';

// --- Types ---
interface Vendor {
  id: string;
  name: string;
}

// Matching the database schema exactly
interface SalesRecord {
  id: string;
  vendor_id: string;
  vendor_name: string;
  market_date: string;
  present: boolean;
  snap: number;
  dufb: number;
  wdfm_tokens: number;
  voucher: number;
  reported_sales: number;
  reimbursement_due: number;
  est_produce_sales: number;
  est_num_transactions: number;
  autoAdded?: boolean;
  isInvalid?: boolean;
}

const initialRecords: SalesRecord[] = [];

const mapTransactionToSalesRecord = (transaction: VendorTransaction): SalesRecord => ({
  id: transaction.id,
  vendor_id: transaction.vendorId,
  vendor_name: transaction.vendorName,
  market_date: transaction.marketDate,
  present: transaction.present,
  snap: transaction.snap,
  dufb: transaction.dufb,
  wdfm_tokens: transaction.wdfmTokens,
  voucher: transaction.voucher,
  reported_sales: transaction.reportedSales,
  reimbursement_due: transaction.reimbursementDue,
  est_produce_sales: transaction.estProduceSales,
  est_num_transactions: transaction.estNumTransactions,
  isInvalid: false,
});

// Helper to get the most recent Saturday
const getMostRecentSaturday = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = (day + 1) % 7;
  const result = new Date(d);
  result.setDate(d.getDate() - diff);
  return result.toISOString().split('T')[0];
};

// Helper to format currency
const formatCurrency = (amount: number = 0) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

function TransactionsContent() {
  const [currentMarketDate, setCurrentMarketDate] = useState(getMostRecentSaturday());
  const [records, setRecords] = useState<SalesRecord[]>(() => {
    const saturday = getMostRecentSaturday();
    return initialRecords.map(r => ({ ...r, market_date: saturday }));
  });
  const [isImporting, setIsImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [activeVendors, setActiveVendors] = useState<ApiVendor[]>([]);
  const [includeActiveVendors, setIncludeActiveVendors] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const generateRecordId = () => {
    if (
      typeof globalThis.crypto !== "undefined" &&
      typeof globalThis.crypto.randomUUID === "function"
    ) {
      return globalThis.crypto.randomUUID();
    }

    return Math.random().toString(36).slice(2, 11);
  };
  const { user, logout } = useAuth();
  const userName = user?.username || "Admin User";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) setShowUserMenu(false);
    };
    if (showUserMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  useEffect(() => {
    let isMounted = true;

    const loadVendors = async () => {
      setVendorsLoading(true);

      try {
        const response = await getVendors(0, 1000);
        if (!isMounted) return;

        const vendorList: ApiVendor[] = Array.isArray(response)
          ? response
          : response?.data ?? [];

        const activeOnly = vendorList
          .filter((vendor) => vendor.isActive)
          .sort((a, b) => a.vendorName.localeCompare(b.vendorName));

        setActiveVendors(activeOnly);
        setAllVendors(
          vendorList
            .map((vendor) => ({ id: vendor.id, name: vendor.vendorName }))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      } catch (error) {
        console.error("Failed to load vendors:", error);
        toast.error("Failed to load vendors.");
      } finally {
        if (isMounted) {
          setVendorsLoading(false);
        }
      }
    };

    loadVendors();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadTransactions = async () => {
      setIsLoadingTransactions(true);

      try {
        const response = await searchVendorTransactions({
          marketDate: currentMarketDate,
          page: 0,
          size: 500,
        });

        if (!isActive) return;

        setRecords(response.data.map(mapTransactionToSalesRecord));
        setEditingId(null);
      } catch (error) {
        console.error('Failed to load transactions:', error);
        if (!isActive) return;

        setRecords([]);
        toast.error('Failed to load transactions for the selected market date.');
      } finally {
        if (isActive) {
          setIsLoadingTransactions(false);
        }
      }
    };

    loadTransactions();

    return () => {
      isActive = false;
    };
  }, [currentMarketDate]);

  const handleMarketDateChange = (newDate: string) => {
    if (includeActiveVendors) {
      setRecords(prev => prev.filter(record => !record.autoAdded));
      setIncludeActiveVendors(false);
    }

    setCurrentMarketDate(newDate);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        const dataRows = rows.slice(1);

        if (dataRows.length === 0) {
          toast.error("The file appears to be empty.");
          setIsImporting(false);
          return;
        }

        const importedRecords: SalesRecord[] = dataRows.filter(row => row.length > 0).map((row) => {
          const vendorName = row[0]?.toString().trim() || 'Unknown Vendor';
          const presentValue = row[1]?.toString().trim().toUpperCase();
          const isPresent = presentValue === 'Y' || presentValue === 'YES' || presentValue === 'TRUE';
          
          const snap = parseFloat(row[2] || 0);
          const dufb = parseFloat(row[3] || 0);
          const wdfm = parseFloat(row[4] || 0);
          const voucher = parseFloat(row[5] || 0);
          const reportedSales = parseFloat(row[6] || 0);

          const matchedVendor = allVendors.find(v => v.name.toLowerCase() === vendorName.toLowerCase());

          return {
            id: Math.random().toString(36).substr(2, 9),
            vendor_id: matchedVendor?.id ?? '',
            vendor_name: vendorName,
            market_date: currentMarketDate,
            present: isPresent,
            snap,
            dufb,
            wdfm_tokens: wdfm,
            voucher,
            reimbursement_due: snap + dufb + wdfm + voucher,
            reported_sales: reportedSales,
            est_produce_sales: 0,
            est_num_transactions: 0,
            isInvalid: !matchedVendor,
          };
        });

        setRecords(prev => [...importedRecords, ...prev]);

        const invalidCount = importedRecords.filter(r => r.isInvalid).length;
        if (invalidCount > 0) {
          toast.warning(`${invalidCount} vendor(s) could not be matched — highlighted in red. Correct the name(s) before saving.`);
        } else {
          toast.success(`Successfully imported ${importedRecords.length} records from ${file.name}`);
        }
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error("Failed to process the file. Please ensure it's a valid Excel or CSV file.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      toast.error("Error reading file.");
      setIsImporting(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleAddVendor = (vendor: Vendor) => {
    if (records.some(r => r.vendor_id === vendor.id)) {
      toast.error(`${vendor.name} is already in the list.`);
      return;
    }

    const newRecord: SalesRecord = {
      id: Math.random().toString(36).substr(2, 9),
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      market_date: currentMarketDate,
      present: true,
      snap: 0,
      dufb: 0,
      wdfm_tokens: 0,
      voucher: 0,
      reimbursement_due: 0,
      reported_sales: 0,
      est_produce_sales: 0,
      est_num_transactions: 0,
      isInvalid: false,
    };

    setRecords(prev => [newRecord, ...prev]);
    setTimeout(() => setEditingId(newRecord.id), 50);
    toast.success(`Added ${vendor.name}`);
  };

  const handleToggleActiveVendors = () => {
    if (includeActiveVendors) {
      setRecords(prev => prev.filter(record => !record.autoAdded));
      setIncludeActiveVendors(false);
      toast.info('Removed auto-added active vendor rows.');
      return;
    }

    if (vendorsLoading) {
      toast.info('Active vendor list is still loading.');
      return;
    }

    if (activeVendors.length === 0) {
      toast.info('No active vendors are available.');
      return;
    }

    const existingVendorIds = new Set(records.map(record => record.vendor_id));
    const vendorsToAdd = activeVendors.filter(vendor => !existingVendorIds.has(vendor.id));

    if (vendorsToAdd.length === 0) {
      toast.info('All active vendors are already present.');
      return;
    }

    const newRecords = vendorsToAdd.map(vendor => ({
      id: generateRecordId(),
      vendor_id: vendor.id,
      vendor_name: vendor.vendorName,
      market_date: currentMarketDate,
      present: true,
      snap: 0,
      dufb: 0,
      wdfm_tokens: 0,
      voucher: 0,
      reimbursement_due: 0,
      reported_sales: 0,
      est_produce_sales: 0,
      est_num_transactions: 0,
      isInvalid: false,
      autoAdded: true,
    }));

    setRecords(prev => [...newRecords, ...prev]);
    setIncludeActiveVendors(true);
    setEditingId(newRecords[0].id);
    toast.success(`Added ${newRecords.length} active vendor${newRecords.length === 1 ? '' : 's'}.`);
  };

  const handleUpdateRecord = (id: string, updates: Partial<SalesRecord>) => {
    setRecords(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, ...updates };

      // Re-validate vendor name if it changed
      if ('vendor_name' in updates) {
        for(const v of allVendors) {
          if(v.name.toLowerCase() === updated.vendor_name.toLowerCase()) {
            console.log(v.id)
          }
        }
        const matchedVendor = allVendors.find(
          v => v.name.toLowerCase() === updated.vendor_name.toLowerCase()
        );
        updated.vendor_id = matchedVendor?.id ?? '';
        updated.isInvalid = !matchedVendor;
        //console.log(updated)
      }

      if (
        ('snap' in updates || 'dufb' in updates || 'wdfm_tokens' in updates || 'voucher' in updates) &&
        !('reimbursement_due' in updates)
      ) {
        updated.reimbursement_due = (updated.snap || 0) + (updated.dufb || 0) + (updated.wdfm_tokens || 0) + (updated.voucher || 0);
      }

      return updated;
    }));
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    toast.info('Row removed');
  };

  const handleSaveToBackend = async () => {
    if (records.length === 0) {
      toast.error('No records to save. Please add vendor data first.');
      return;
    }

    const invalidRows = records.filter(r => r.isInvalid || !r.vendor_id);
    if (invalidRows.length > 0) {
      toast.error(`Please fix ${invalidRows.length} invalid vendor name(s) before saving.`);
      return;
    }

    setIsSaving(true);

    try {
      const payload: CreateVendorTransactionRequest[] = records.map((record) => ({
        vendorId: record.vendor_id,       // guaranteed non-empty by guard above
        vendorName: record.vendor_name,
        marketDate: record.market_date,
        present: record.present,
        snap: record.snap,
        dufb: record.dufb,
        wdfmTokens: record.wdfm_tokens,
        voucher: record.voucher,
        reimbursementDue: record.reimbursement_due,
        reportedSales: record.reported_sales,
        estProduceSales: record.est_produce_sales,
        estNumTransactions: record.est_num_transactions,
      }));

      await bulkCreateVendorTransactions(payload);
      toast.success(`Successfully saved ${records.length} sales records!`);
    } catch (error) {
      console.error('Error saving to backend:', error);
      toast.error('Failed to save data. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const invalidCount = records.filter(r => r.isInvalid).length;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen flex transition-colors duration-300">
      <style dangerouslySetInnerHTML={{ __html: `
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}} />
      <Toaster position="top-right" />
      <SidebarNavigation activeItem="Transactions" />

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 animate-slide-up">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sales Spreadsheet</h2>
            <p className="text-slate-700 dark:text-slate-400 mt-1">Manage vendor sales data, reimbursements, and produce estimates.</p>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all border shadow-sm
                ${isImporting
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed' 
                  : 'bg-white dark:bg-slate-800 text-[#10b981] border-[#10b981]/30 dark:border-slate-700 hover:bg-[#10b981]/10 dark:hover:bg-slate-700'}
              `}
            >
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Import Excel
            </button>
            <AddVendorDialog vendors={allVendors} onAdd={handleAddVendor} />
            <div className="flex flex-col gap-1 text-right">
              <div className="flex items-center justify-end gap-3">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Current Active vendors</span>
                <button
                  type="button"
                  onClick={handleToggleActiveVendors}
                  aria-pressed={includeActiveVendors}
                  aria-label={
                    includeActiveVendors
                      ? "Remove auto-added active vendor rows"
                      : "Add every active vendor row"
                  }
                  className={`relative h-6 w-12 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#10b981] ${
                    includeActiveVendors ? "bg-[#10b981] border-[#10b981]" : "bg-slate-200 border-slate-300"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      includeActiveVendors ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {vendorsLoading
                  ? "Loading active vendors..."
                  : includeActiveVendors
                    ? "Auto rows are added; toggle off to remove them."
                    : "Toggle to insert every active vendor into the sheet."}
              </p>
            </div>
            <div className="relative user-menu-container">
              <Button
                onClick={() => setShowUserMenu(!showUserMenu)}
                variant="ghost"
                className="flex items-center gap-2 px-3 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 aspect-square">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden md:block text-slate-900 dark:text-slate-200">
                  {userName}
                </span>
                <span className="material-icons text-lg leading-none text-slate-600 dark:text-slate-400">
                  {showUserMenu ? "expand_less" : "expand_more"}
                </span>
              </Button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{userName}</p>
                  </div>
                  <Button
                    onClick={() => { logout(); setShowUserMenu(false); }}
                    variant="ghost"
                    size="sm"
                    className="w-full flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <span className="material-icons text-lg leading-none">logout</span>
                    Log Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-end gap-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 shadow-sm flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Market Date</span>
            <input
              type="date"
              className="bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 font-medium outline-none cursor-pointer"
              value={currentMarketDate}
              onChange={(e) => handleMarketDateChange(e.target.value)}
            />
          </div>
        </div>

        {/* Invalid rows banner */}
        {invalidCount > 0 && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm font-medium">
            <AlertCircle size={16} className="shrink-0" />
            {invalidCount} row(s) have unrecognized vendor names. Edit the highlighted name(s) to match a vendor in the database before saving.
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="transactions-table w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-600 dark:text-slate-400 font-semibold">
                  <th className="px-4 py-4 min-w-[200px] sticky left-0 bg-slate-50 dark:bg-slate-900/50 z-10 border-r border-slate-200 dark:border-slate-700">Vendor Name</th>
                  <th className="px-3 py-4 w-20 text-center">Present</th>
                  <th className="px-3 py-4 w-24 text-center bg-[#10b981]/10">SNAP ($)</th>
                  <th className="px-3 py-4 w-24 text-center bg-[#10b981]/10">DUFB ($)</th>
                  <th className="px-3 py-4 w-24 text-center bg-[#10b981]/10">WDFM ($)</th>
                  <th className="px-3 py-4 w-24 text-center bg-[#10b981]/10">Voucher ($)</th>
                  <th className="px-4 py-4 w-32 text-right font-bold text-[#059669] bg-[#10b981]/10 border-x border-[#10b981]/20">Reimburse.</th>
                  <th className="px-4 py-4 w-32 text-right bg-amber-500/10 dark:bg-amber-500/5">Reported Sales</th>
                  <th className="px-4 py-4 w-32 text-right bg-emerald-500/10 dark:bg-emerald-500/5">Est. Produce</th>
                  <th className="px-4 py-4 w-24 text-center bg-slate-50 dark:bg-slate-900/30">Trans.</th>
                  <th className="px-4 py-4 w-16 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                <AnimatePresence initial={false}>
                  {records.map(record => (
                    <SalesRow 
                      key={record.id} 
                      record={record}
                      isEditing={editingId === record.id}
                      isInvalid={!!record.isInvalid}
                      onEdit={() => setEditingId(record.id)}
                      onSave={() => setEditingId(null)}
                      onDelete={() => handleDeleteRecord(record.id)}
                      onUpdate={(updates) => handleUpdateRecord(record.id, updates)}
                    />
                  ))}
                </AnimatePresence>
                {isLoadingTransactions && (
                  <tr>
                    <td colSpan={11} className="px-4 py-20 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin opacity-60" />
                        <p>Loading vendor transactions for {currentMarketDate}...</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoadingTransactions && records.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-20 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle size={32} className="opacity-20" />
                        <p>No vendor transactions found for {currentMarketDate}. Add a vendor or import an Excel sheet to start this market day.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save to Backend Button */}
        <div className="mt-8 flex justify-center">
          <Button
            variant="primary"
            onClick={handleSaveToBackend}
            disabled={isSaving || records.length === 0 || invalidCount > 0}
            className="flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Upload size={20} />
                {invalidCount > 0 ? `Fix ${invalidCount} invalid vendor(s) to save` : 'Upload Spreadsheet'}
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <ProtectedRoute>
      <TransactionsContent />
    </ProtectedRoute>
  );
}

interface SalesRowProps {
  record: SalesRecord;
  isEditing: boolean;
  isInvalid: boolean;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<SalesRecord>) => void;
}

function SalesRow({ record, isEditing, isInvalid, onEdit, onSave, onDelete, onUpdate }: SalesRowProps) {
  const snap = record.snap ?? 0;
  const dufb = record.dufb ?? 0;
  const wdfm_tokens = record.wdfm_tokens ?? 0;
  const voucher = record.voucher ?? 0;
  const reported_sales = record.reported_sales ?? 0;
  const reimbursement_due = record.reimbursement_due ?? 0;
  const est_produce_sales = record.est_produce_sales ?? 0;
  const est_num_transactions = record.est_num_transactions ?? 0;
  const present = record.present ?? false;

  const handleNumberChange = (field: keyof SalesRecord, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (!isNaN(numValue)) {
      onUpdate({ [field]: numValue });
    }
  };

  return (
    <motion.tr 
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => !isEditing && onEdit()}
      className={`
        group transition-colors cursor-pointer
        ${isInvalid ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-400 dark:border-l-red-500' : ''}
        ${isEditing && !isInvalid ? 'bg-[#10b981]/10 dark:bg-[#10b981]/15' : ''}
        ${!isEditing && !isInvalid ? 'hover:bg-slate-100 dark:hover:bg-slate-700/60' : ''}
      `}
    >
      {/* Vendor Name — always editable when invalid */}
      <td className="px-4 py-3 font-medium sticky left-0 bg-inherit z-10 border-r border-slate-100 dark:border-slate-700">
        {isEditing || isInvalid ? (
          <div>
            <input
              type="text"
              className={`w-full px-2 py-1 border rounded outline-none text-sm font-medium
                ${isInvalid
                  ? 'border-red-400 dark:border-red-500 bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500'
                  : 'border-[#10b981]/30 focus:ring-2 focus:ring-[#10b981]'
                }`}
              value={record.vendor_name}
              onChange={(e) => onUpdate({ vendor_name: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              placeholder="Enter valid vendor name..."
            />
            {isInvalid && (
              <p className="text-xs text-red-500 mt-1">Vendor not found — check spelling</p>
            )}
          </div>
        ) : (
          <span className="text-slate-900 dark:text-slate-100">{record.vendor_name}</span>
        )}
      </td>

      {/* Present Toggle */}
      <td className="px-3 py-3 text-center">
        <input 
          type="checkbox"
          className="w-4 h-4 accent-[#10b981] border-slate-300 dark:border-slate-600 rounded focus:ring-[#10b981]"
          checked={present}
          onChange={(e) => onUpdate({ present: e.target.checked })}
          onClick={(e) => e.stopPropagation()}
        />
      </td>

      {/* SNAP */}
      <td className="px-2 py-3">
        {isEditing ? (
          <input 
            type="number" step="0.01"
            className="w-full px-2 py-1 text-right border border-[#10b981]/30 dark:border-slate-600 rounded focus:ring-2 focus:ring-[#10b981] outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            value={snap === 0 && isEditing ? '' : snap}
            onChange={(e) => handleNumberChange('snap', e.target.value)}
            autoFocus
          />
        ) : (
          <div className="text-right text-slate-600 dark:text-slate-400 tabular-nums">{formatCurrency(snap)}</div>
        )}
      </td>

      {/* DUFB */}
      <td className="px-2 py-3">
        {isEditing ? (
          <input 
            type="number" step="0.01"
            className="w-full px-2 py-1 text-right border border-[#10b981]/30 dark:border-slate-600 rounded focus:ring-2 focus:ring-[#10b981] outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            value={dufb === 0 && isEditing ? '' : dufb}
            onChange={(e) => handleNumberChange('dufb', e.target.value)}
          />
        ) : (
          <div className="text-right text-slate-600 dark:text-slate-400 tabular-nums">{formatCurrency(dufb)}</div>
        )}
      </td>

      {/* WDFM */}
      <td className="px-2 py-3">
        {isEditing ? (
          <input 
            type="number" step="0.01"
            className="w-full px-2 py-1 text-right border border-[#10b981]/30 dark:border-slate-600 rounded focus:ring-2 focus:ring-[#10b981] outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            value={wdfm_tokens === 0 && isEditing ? '' : wdfm_tokens}
            onChange={(e) => handleNumberChange('wdfm_tokens', e.target.value)}
          />
        ) : (
          <div className="text-right text-slate-600 dark:text-slate-400 tabular-nums">{formatCurrency(wdfm_tokens)}</div>
        )}
      </td>

      {/* Voucher */}
      <td className="px-2 py-3">
        {isEditing ? (
          <input 
            type="number" step="0.01"
            className="w-full px-2 py-1 text-right border border-[#10b981]/30 dark:border-slate-600 rounded focus:ring-2 focus:ring-[#10b981] outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            value={voucher === 0 && isEditing ? '' : voucher}
            onChange={(e) => handleNumberChange('voucher', e.target.value)}
          />
        ) : (
          <div className="text-right text-slate-600 dark:text-slate-400 tabular-nums">{formatCurrency(voucher)}</div>
        )}
      </td>

      {/* Reimbursement Due */}
      <td className="px-4 py-3 bg-[#10b981]/10 border-x border-[#10b981]/20">
        {isEditing ? (
          <input 
            type="number" step="0.01"
            className="w-full px-2 py-1 text-right font-bold text-[#059669] dark:text-[#34d399] border border-[#10b981]/40 dark:border-slate-600 rounded focus:ring-2 focus:ring-[#10b981] outline-none text-sm bg-white dark:bg-slate-900"
            value={reimbursement_due === 0 && isEditing ? '' : reimbursement_due}
            onChange={(e) => handleNumberChange('reimbursement_due', e.target.value)}
          />
        ) : (
          <div className={`text-right font-bold tabular-nums ${reimbursement_due > 0 ? 'text-[#059669] dark:text-[#34d399]' : 'text-slate-300 dark:text-slate-500'}`}>
            {formatCurrency(reimbursement_due)}
          </div>
        )}
      </td>

      {/* Reported Sales */}
      <td className="px-2 py-3">
        {isEditing ? (
          <input 
            type="number" step="0.01"
            className="w-full px-2 py-1 text-right border border-amber-200 dark:border-slate-600 rounded focus:ring-2 focus:ring-amber-500 outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            value={reported_sales === 0 && isEditing ? '' : reported_sales}
            onChange={(e) => handleNumberChange('reported_sales', e.target.value)}
          />
        ) : (
          <div className="text-right font-semibold text-slate-700 dark:text-slate-300 tabular-nums">{formatCurrency(reported_sales)}</div>
        )}
      </td>

      {/* Est. Produce Sales */}
      <td className="px-2 py-3">
        {isEditing ? (
          <input 
            type="number" step="0.01"
            className="w-full px-2 py-1 text-right border border-emerald-200 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            value={est_produce_sales === 0 && isEditing ? '' : est_produce_sales}
            onChange={(e) => handleNumberChange('est_produce_sales', e.target.value)}
          />
        ) : (
          <div className="text-right text-emerald-700 dark:text-emerald-400 tabular-nums">{formatCurrency(est_produce_sales)}</div>
        )}
      </td>

      {/* Trans. */}
      <td className="px-2 py-3">
        {isEditing ? (
          <input 
            type="number"
            className="w-full px-2 py-1 text-center border border-slate-200 dark:border-slate-600 rounded focus:ring-2 focus:ring-[#10b981] outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            value={est_num_transactions === 0 && isEditing ? '' : est_num_transactions}
            onChange={(e) => handleNumberChange('est_num_transactions', e.target.value)}
          />
        ) : (
          <div className="text-center text-slate-500 dark:text-slate-400 tabular-nums">{est_num_transactions}</div>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-4 text-center">
        <div className="flex items-center justify-center">
          {isEditing ? (
            <button 
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              className="p-1 text-[#10b981] hover:bg-[#10b981]/15 rounded transition-colors"
              title="Save Row"
            >
              <Check size={18} />
            </button>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Delete Row"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}
