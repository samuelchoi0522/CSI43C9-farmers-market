"use client";

import React, { useState, useRef } from 'react';
import { 
  Table as TableIcon, 
  Trash2, 
  Loader2,
  AlertCircle,
  Check,
  Upload,
  Download
} from 'lucide-react';
import { AddVendorDialog } from '../components/AddVendorDialog'
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'sonner';
import * as XLSX from 'xlsx';

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
}

// --- Mock Data ---
const ALL_VENDORS: Vendor[] = [
];

const initialRecords: SalesRecord[] = [
];

// Helper to get the most recent Saturday
const getMostRecentSaturday = () => {
  const d = new Date();
  const day = d.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = (day + 1) % 7;
  const result = new Date(d);
  result.setDate(d.getDate() - diff);
  return result.toISOString().split('T')[0];
};

// Helper to format currency
const formatCurrency = (amount: number = 0) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export default function App() {
  const [currentMarketDate, setCurrentMarketDate] = useState(getMostRecentSaturday());
  const [records, setRecords] = useState<SalesRecord[]>(() => {
    const saturday = getMostRecentSaturday();
    return initialRecords.map(r => ({ ...r, market_date: saturday }));
  });
  const [isImporting, setIsImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync all records when market date changes
  const handleMarketDateChange = (newDate: string) => {
    setCurrentMarketDate(newDate);
    setRecords(prev => prev.map(r => ({ ...r, market_date: newDate })));
  };

  // --- Handlers ---

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
        
        // Use header: 1 to get raw array of arrays, then slice(1) to skip the first row (header)
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        const dataRows = rows.slice(1);

        if (dataRows.length === 0) {
          toast.error("The file appears to be empty.");
          setIsImporting(false);
          return;
        }

        const importedRecords: SalesRecord[] = dataRows.filter(row => row.length > 0).map((row) => {
          // Positional mapping based on Excel format:
          // Col 0: Vendor Name
          // Col 1: Present? (Y/N)
          // Col 2: SNAP Voucher
          // Col 3: DUFB Voucher
          // Col 4: WDFM Tokens
          // Col 5: Voucher
          // Col 6: Reported Sales
          
          const vendorName = row[0]?.toString() || 'Unknown Vendor';
          
          // Handle Y/N format for Present column
          const presentValue = row[1]?.toString().trim().toUpperCase();
          const isPresent = presentValue === 'Y' || presentValue === 'YES' || presentValue === 'TRUE' || presentValue === true;
          
          const snap = parseFloat(row[2] || 0);
          const dufb = parseFloat(row[3] || 0);
          const wdfm = parseFloat(row[4] || 0);
          const voucher = parseFloat(row[5] || 0);
          const reportedSales = parseFloat(row[6] || 0);

          // Find matching vendor ID if possible
          const matchedVendor = ALL_VENDORS.find(v => v.name.toLowerCase() === vendorName.toLowerCase());

          return {
            id: Math.random().toString(36).substr(2, 9),
            vendor_id: matchedVendor?.id || 'unknown',
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
          };
        });

        setRecords(prev => [...importedRecords, ...prev]);
        toast.success(`Successfully imported ${importedRecords.length} records from ${file.name}`);
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
    };

    setRecords(prev => [newRecord, ...prev]);
    setTimeout(() => {
        setEditingId(newRecord.id);
    }, 50);
    toast.success(`Added ${vendor.name}`);
  };

  const handleUpdateRecord = (id: string, updates: Partial<SalesRecord>) => {
    setRecords(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, ...updates };
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

    setIsSaving(true);

    try {
      const API_ENDPOINT = 'http://localhost:8080/api/vendor-transaction/batch';

      const payload = records.map((record) => ({
        vendorId: record.vendor_id,
        vendorName: record.vendor_name,
        marketDate: record.market_date, // "YYYY-MM-DD" string is OK for LocalDate
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

      // We may change where we store jwt token
      const token = localStorage.getItem('accessToken');

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      toast.success(`Successfully saved ${records.length} sales records!`);
      console.log('Server response:', data);
    } catch (error) {
      console.error('Error saving to backend:', error);
      toast.error('Failed to save data. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      <style dangerouslySetInnerHTML={{ __html: `
        /* Remove arrows from number inputs */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}} />
      <Toaster position="top-right" />
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <TableIcon size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Farmer's Market Transactions</h1>
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
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                  : 'bg-white text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300'}
              `}
            >
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Import Excel
            </button>
            <AddVendorDialog vendors={ALL_VENDORS} onAdd={handleAddVendor} />
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sales Spreadsheet</h2>
            <p className="text-gray-500 mt-1">Manage vendor sales data, reimbursements, and produce estimates.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Market Date</span>
            <input 
              type="date"
              className="bg-transparent border-none focus:ring-0 text-gray-900 font-medium outline-none cursor-pointer"
              value={currentMarketDate}
              onChange={(e) => handleMarketDateChange(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                  <th className="px-4 py-4 min-w-[180px] sticky left-0 bg-gray-50 z-10 border-r border-gray-200">Vendor Name</th>
                  <th className="px-3 py-4 w-20 text-center">Present</th>
                  <th className="px-3 py-4 w-24 text-center bg-blue-50/50">SNAP ($)</th>
                  <th className="px-3 py-4 w-24 text-center bg-blue-50/50">DUFB ($)</th>
                  <th className="px-3 py-4 w-24 text-center bg-blue-50/50">WDFM ($)</th>
                  <th className="px-3 py-4 w-24 text-center bg-blue-50/50">Voucher ($)</th>
                  <th className="px-4 py-4 w-32 text-right font-bold text-blue-800 bg-blue-50 border-x border-blue-100">Reimburse.</th>
                  <th className="px-4 py-4 w-32 text-right bg-orange-50/30">Reported Sales</th>
                  <th className="px-4 py-4 w-32 text-right bg-green-50/30">Est. Produce</th>
                  <th className="px-4 py-4 w-24 text-center bg-gray-50/50">Trans.</th>
                  <th className="px-4 py-4 w-16 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence initial={false}>
                  {records.map(record => (
                    <SalesRow 
                      key={record.id} 
                      record={record} 
                      isEditing={editingId === record.id}
                      onEdit={() => setEditingId(record.id)}
                      onSave={() => setEditingId(null)}
                      onDelete={() => handleDeleteRecord(record.id)}
                      onUpdate={(updates) => handleUpdateRecord(record.id, updates)}
                    />
                  ))}
                </AnimatePresence>
                {records.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-20 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle size={32} className="opacity-20" />
                        <p>No sales records added yet. Click "Add Vendor" to begin or import Excel Sheet.</p>
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
          <button
            onClick={handleSaveToBackend}
            disabled={isSaving || records.length === 0}
            className={`
              flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-base transition-all shadow-lg
              ${isSaving || records.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl transform hover:scale-105'
              }
            `}
          >
            {isSaving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Upload size={20} />
                Upload Spreadsheet
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

interface SalesRowProps {
  record: SalesRecord;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<SalesRecord>) => void;
}

function SalesRow({ record, isEditing, onEdit, onSave, onDelete, onUpdate }: SalesRowProps) {
  const snap = record.snap ?? 0;
  const dufb = record.dufb ?? 0;
  const wdfm_tokens = record.wdfm_tokens ?? 0;
  const voucher = record.voucher ?? 0;
  const reported_sales = record.reported_sales ?? 0;
  const reimbursement_due = record.reimbursement_due ?? 0;
  const est_produce_sales = record.est_produce_sales ?? 0;
  const est_num_transactions = record.est_num_transactions ?? 0;
  const market_date = record.market_date ?? "";
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
        ${isEditing ? 'bg-blue-50/50' : 'hover:bg-gray-50/80'}
      `}
    >
      {/* Vendor Name */}
      <td className="px-4 py-4 font-medium text-gray-900 sticky left-0 bg-inherit z-10 border-r border-gray-100">
        {record.vendor_name}
      </td>

      {/* Present Toggle */}
      <td className="px-3 py-3 text-center">
        <input 
          type="checkbox"
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          checked={present}
          onChange={(e) => onUpdate({ present: e.target.checked })}
          onClick={(e) => e.stopPropagation()}
        />
      </td>

      {/* Inputs Group: Reimbursements */}
      <td className="px-2 py-3">
        {isEditing ? (
          <input 
            type="number" 
            step="0.01"
            className="w-full px-2 py-1 text-right border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={snap === 0 && isEditing ? '' : snap}
            onChange={(e) => handleNumberChange('snap', e.target.value)}
            autoFocus
          />
        ) : (
          <div className="text-right text-gray-600 tabular-nums">{formatCurrency(snap)}</div>
        )}
      </td>
      <td className="px-2 py-3">
        {isEditing ? (
          <input 
            type="number" 
            step="0.01"
            className="w-full px-2 py-1 text-right border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={dufb === 0 && isEditing ? '' : dufb}
            onChange={(e) => handleNumberChange('dufb', e.target.value)}
          />
        ) : (
          <div className="text-right text-gray-600 tabular-nums">{formatCurrency(dufb)}</div>
        )}
      </td>
      <td className="px-2 py-3">
        {isEditing ? (
          <input 
            type="number" 
            step="0.01"
            className="w-full px-2 py-1 text-right border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={wdfm_tokens === 0 && isEditing ? '' : wdfm_tokens}
            onChange={(e) => handleNumberChange('wdfm_tokens', e.target.value)}
          />
        ) : (
          <div className="text-right text-gray-600 tabular-nums">{formatCurrency(wdfm_tokens)}</div>
        )}
      </td>
      <td className="px-2 py-3">
        {isEditing ? (
          <input 
            type="number" 
            step="0.01"
            className="w-full px-2 py-1 text-right border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={voucher === 0 && isEditing ? '' : voucher}
            onChange={(e) => handleNumberChange('voucher', e.target.value)}
          />
        ) : (
          <div className="text-right text-gray-600 tabular-nums">{formatCurrency(voucher)}</div>
        )}
      </td>

      {/* Editable Field: Reimbursement Due */}
      <td className="px-4 py-3 bg-blue-50/30 border-x border-blue-100">
        {isEditing ? (
          <input 
            type="number" 
            step="0.01"
            className="w-full px-2 py-1 text-right font-bold text-blue-800 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={reimbursement_due === 0 && isEditing ? '' : reimbursement_due}
            onChange={(e) => handleNumberChange('reimbursement_due', e.target.value)}
          />
        ) : (
          <div className={`text-right font-bold tabular-nums ${reimbursement_due > 0 ? 'text-blue-700' : 'text-gray-300'}`}>
            {formatCurrency(reimbursement_due)}
          </div>
        )}
      </td>

      {/* Reported Sales */}
      <td className="px-2 py-3">
        {isEditing ? (
          <input 
            type="number" 
            step="0.01"
            className="w-full px-2 py-1 text-right border border-orange-200 rounded focus:ring-2 focus:ring-orange-500 outline-none text-sm"
            value={reported_sales === 0 && isEditing ? '' : reported_sales}
            onChange={(e) => handleNumberChange('reported_sales', e.target.value)}
          />
        ) : (
          <div className="text-right font-semibold text-gray-700 tabular-nums">{formatCurrency(reported_sales)}</div>
        )}
      </td>

      {/* Est. Produce Sales */}
      <td className="px-2 py-3">
        {isEditing ? (
          <input 
            type="number" 
            step="0.01"
            className="w-full px-2 py-1 text-right border border-green-200 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm"
            value={est_produce_sales === 0 && isEditing ? '' : est_produce_sales}
            onChange={(e) => handleNumberChange('est_produce_sales', e.target.value)}
          />
        ) : (
          <div className="text-right text-green-700 tabular-nums">{formatCurrency(est_produce_sales)}</div>
        )}
      </td>

      {/* Trans. */}
      <td className="px-2 py-3">
        {isEditing ? (
          <input 
            type="number" 
            className="w-full px-2 py-1 text-center border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={est_num_transactions === 0 && isEditing ? '' : est_num_transactions}
            onChange={(e) => handleNumberChange('est_num_transactions', e.target.value)}
          />
        ) : (
          <div className="text-center text-gray-500 tabular-nums">{est_num_transactions}</div>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-4 text-center">
        <div className="flex items-center justify-center">
          {isEditing ? (
            <button 
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
              title="Save Row"
            >
              <Check size={18} />
            </button>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
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