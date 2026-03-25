"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import SidebarNavigation from '../components/SidebarNavigation';
import Button from '../components/Button';
import MarketDatePicker from '../components/MarketDatePicker';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { AddVendorDialog } from '../components/AddVendorDialog';
import VendorTransactionsSheet, { type VendorTransactionsSheetRow } from '../components/VendorTransactionsSheet';
import { toast, Toaster } from 'sonner';
import * as XLSX from 'xlsx';
import {
  bulkCreateVendorTransactions,
  searchVendorTransactions,
  type CreateVendorTransactionRequest,
  type VendorTransaction,
} from '@/lib/api/transactions';
import { getVendors, type Vendor as ApiVendor } from '@/lib/api/vendor';

interface Vendor {
  id: string;
  name: string;
}

const getMostRecentSaturday = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = (day + 1) % 7;
  const saturday = new Date(date);
  saturday.setDate(date.getDate() - diff);
  return saturday.toISOString().split('T')[0];
};

const parseNumericValue = (value: unknown) => {
  if (value === '' || value === null || value === undefined) return 0;
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

const createLocalId = () => Math.random().toString(36).slice(2, 11);

const mapTransactionToSalesRecord = (transaction: VendorTransaction): VendorTransactionsSheetRow => ({
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

function TransactionsContent() {
  const [currentMarketDate, setCurrentMarketDate] = useState(getMostRecentSaturday());
  const [records, setRecords] = useState<VendorTransactionsSheetRow[]>([]);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuth();
  const userName = user?.username || 'Admin User';

  const getMatchedVendor = (vendorName: string) =>
    allVendors.find(v => v.name.toLowerCase() === vendorName.trim().toLowerCase());

  const buildRecord = (
    record: Partial<VendorTransactionsSheetRow> & Pick<VendorTransactionsSheetRow, 'id' | 'vendor_name'>
  ): VendorTransactionsSheetRow => {
    const vendorName = record.vendor_name.trim();
    const matchedVendor = getMatchedVendor(vendorName);
    const snap = parseNumericValue(record.snap);
    const dufb = parseNumericValue(record.dufb);
    const wdfmTokens = parseNumericValue(record.wdfm_tokens);
    const voucher = parseNumericValue(record.voucher);

    return {
      id: record.id,
      vendor_id: matchedVendor?.id ?? '',
      vendor_name: vendorName,
      market_date: record.market_date ?? currentMarketDate,
      present: Boolean(record.present),
      snap,
      dufb,
      wdfm_tokens: wdfmTokens,
      voucher,
      reported_sales: parseNumericValue(record.reported_sales),
      reimbursement_due: snap + dufb + wdfmTokens + voucher,
      est_produce_sales: parseNumericValue(record.est_produce_sales),
      est_num_transactions: parseNumericValue(record.est_num_transactions),
      isInvalid: !matchedVendor,
    };
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  useEffect(() => {
    getVendors(0, 100)
      .then(response => {
        setAllVendors(response.data.map((vendor: ApiVendor) => ({
          id: vendor.id,
          name: vendor.vendorName,
        })));
      })
      .catch(error => {
        console.error('Failed to load vendors:', error);
        toast.error('Failed to load vendors.');
      });
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

  const invalidCount = records.filter(record => record.isInvalid).length;

  const normalizeRows = (rows: VendorTransactionsSheetRow[]) => rows.map(row => buildRecord(row));

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleAddVendor = (vendor: Vendor) => {
    if (records.some(record => record.vendor_id === vendor.id)) {
      toast.error(`${vendor.name} is already in the list.`);
      return;
    }

    const nextRecord = buildRecord({
      id: createLocalId(),
      vendor_name: vendor.name,
      market_date: currentMarketDate,
      present: true,
      snap: 0,
      dufb: 0,
      wdfm_tokens: 0,
      voucher: 0,
      reported_sales: 0,
      est_produce_sales: 0,
      est_num_transactions: 0,
    });

    setRecords(prev => [nextRecord, ...prev]);
    toast.success(`Added ${vendor.name}`);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const data = loadEvent.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][];
        const dataRows = rows.slice(1).filter(row => row.length > 0);

        if (dataRows.length === 0) {
          toast.error('The file appears to be empty.');
          return;
        }

        const imported = dataRows.map((row) => {
          const vendorName = row[0]?.toString().trim() || 'Unknown Vendor';
          const presentValue = row[1]?.toString().trim().toUpperCase();

          return buildRecord({
            id: createLocalId(),
            vendor_name: vendorName,
            market_date: currentMarketDate,
            present: presentValue === 'Y' || presentValue === 'YES' || presentValue === 'TRUE',
            snap: parseNumericValue(row[2]),
            dufb: parseNumericValue(row[3]),
            wdfm_tokens: parseNumericValue(row[4]),
            voucher: parseNumericValue(row[5]),
            reported_sales: parseNumericValue(row[6]),
            est_produce_sales: parseNumericValue(row[7]),
            est_num_transactions: parseNumericValue(row[8]),
          });
        });

        setRecords(prev => [...imported, ...prev]);

        const invalidImportedCount = imported.filter(record => record.isInvalid).length;
        if (invalidImportedCount > 0) {
          toast.warning(`${invalidImportedCount} vendor name(s) could not be matched. Review the highlighted rows.`);
        } else {
          toast.success(`Imported ${imported.length} transaction row(s) from ${file.name}.`);
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Failed to process the file. Please use a valid Excel or CSV file.');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      toast.error('Error reading file.');
      setIsImporting(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleSaveToBackend = async () => {
    if (records.length === 0) {
      toast.error('No records to save. Add vendors or import a spreadsheet first.');
      return;
    }

    if (invalidCount > 0) {
      toast.error(`Please fix ${invalidCount} invalid vendor name(s) before saving.`);
      return;
    }

    setIsSaving(true);

    try {
      const payload: CreateVendorTransactionRequest[] = records.map(record => ({
        vendorId: record.vendor_id,
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
      toast.success(`Successfully saved ${records.length} vendor transaction row(s).`);
    } catch (error) {
      console.error('Error saving transactions:', error);
      toast.error('Failed to save data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-900 dark:text-slate-100">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            input::-webkit-outer-spin-button,
            input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            input[type=number] { -moz-appearance: textfield; }
          `,
        }}
      />
      <Toaster position="top-right" />
      <SidebarNavigation activeItem="Transactions" />

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Vendor Transactions</h2>
            <p className="mt-1 text-slate-700 dark:text-slate-400">
              Import rows, add vendors manually, review mismatches, and remove multiple rows at once.
            </p>
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
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-all ${
                isImporting
                  ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800'
                  : 'border-[#10b981]/30 bg-white text-[#10b981] hover:bg-[#10b981]/10 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'
              }`}
            >
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Import Excel
            </button>
            <AddVendorDialog vendors={allVendors} onAdd={handleAddVendor} />
            <div className="relative user-menu-container">
              <Button
                onClick={() => setShowUserMenu(!showUserMenu)}
                variant="ghost"
                className="flex cursor-pointer items-center gap-2 px-3"
              >
                <div className="flex h-8 w-8 aspect-square flex-shrink-0 items-center justify-center rounded-full bg-[#10b981] text-sm font-semibold text-white">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden text-sm font-medium text-slate-900 dark:text-slate-200 md:block">
                  {userName}
                </span>
                <span className="material-icons text-lg leading-none text-slate-600 dark:text-slate-400">
                  {showUserMenu ? 'expand_less' : 'expand_more'}
                </span>
              </Button>
              {showUserMenu && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <div className="border-b border-slate-200 px-4 py-2 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{userName}</p>
                  </div>
                  <Button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    variant="ghost"
                    size="sm"
                    className="w-full items-center gap-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <span className="material-icons text-lg leading-none">logout</span>
                    Log Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mb-6">
          <MarketDatePicker
            value={currentMarketDate}
            onChange={setCurrentMarketDate}
            className="lg:inline-block"
          />
        </div>

        <VendorTransactionsSheet
          currentMarketDate={currentMarketDate}
          rows={records}
          isLoading={isLoadingTransactions}
          isSaving={isSaving}
          invalidCount={invalidCount}
          onRowsChange={(nextRows) => setRecords(normalizeRows(nextRows))}
          onSave={handleSaveToBackend}
        />
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
