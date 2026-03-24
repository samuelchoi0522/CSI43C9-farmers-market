"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridRenderEditCellParams,
  GridRowId,
  GridRowModes,
  GridRowModesModel,
  useGridApiContext,
} from '@mui/x-data-grid';
import { 
  Trash2, 
  Loader2,
  AlertCircle,
  Pencil,
  Save,
  X,
  Upload,
  Download
} from 'lucide-react';
import SidebarNavigation from '../components/SidebarNavigation';
import Button from '../components/Button';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { AddVendorDialog } from '../components/AddVendorDialog'
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

const parseNumericValue = (value: unknown) => {
  if (value === '' || value === null || value === undefined) return 0;

  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

function VendorNameEditCell(params: GridRenderEditCellParams<SalesRecord, string>) {
  const apiRef = useGridApiContext();
  const hasError = Boolean(params.error);

  return (
    <div className="flex h-full w-full items-center px-2 py-1">
      <input
        type="text"
        value={params.value ?? ''}
        onChange={(event) => {
          apiRef.current.setEditCellValue({
            id: params.id,
            field: params.field,
            value: event.target.value,
          });
        }}
        className={`w-full rounded border bg-white px-2 py-1 text-sm text-slate-900 outline-none dark:bg-slate-900 dark:text-slate-100 ${
          hasError
            ? 'border-red-400 text-red-700 focus:ring-2 focus:ring-red-300 dark:border-red-500 dark:text-red-400 dark:focus:ring-red-500'
            : 'border-[#10b981]/30 focus:ring-2 focus:ring-[#10b981]'
        }`}
        placeholder="Enter valid vendor name..."
      />
    </div>
  );
}

function NumericEditCell(params: GridRenderEditCellParams<SalesRecord, number | string>) {
  const apiRef = useGridApiContext();

  return (
    <div className="flex h-full w-full items-center justify-end px-2 py-1">
      <input
        type="number"
        step={params.field === 'est_num_transactions' ? '1' : '0.01'}
        value={params.value ?? ''}
        onChange={(event) => {
          apiRef.current.setEditCellValue({
            id: params.id,
            field: params.field,
            value: event.target.value,
          });
        }}
        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-right text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#10b981] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      />
    </div>
  );
}

function TransactionsContent() {
  const [currentMarketDate, setCurrentMarketDate] = useState(getMostRecentSaturday());
  const [records, setRecords] = useState<SalesRecord[]>(() => {
    const saturday = getMostRecentSaturday();
    return initialRecords.map(r => ({ ...r, market_date: saturday }));
  });
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [highlightedRowId, setHighlightedRowId] = useState<GridRowId | null>(null);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const userName = user?.username || "Admin User";

  const getMatchedVendor = (vendorName: string) =>
    allVendors.find(v => v.name.toLowerCase() === vendorName.trim().toLowerCase());

  const normalizeRecord = (record: SalesRecord): SalesRecord => {
    const matchedVendor = getMatchedVendor(record.vendor_name);
    const snap = parseNumericValue(record.snap);
    const dufb = parseNumericValue(record.dufb);
    const wdfm = parseNumericValue(record.wdfm_tokens);
    const voucher = parseNumericValue(record.voucher);

    return {
      ...record,
      vendor_name: record.vendor_name.trim(),
      vendor_id: matchedVendor?.id ?? '',
      present: Boolean(record.present),
      snap,
      dufb,
      wdfm_tokens: wdfm,
      voucher,
      reimbursement_due: parseNumericValue(record.reimbursement_due || snap + dufb + wdfm + voucher),
      reported_sales: parseNumericValue(record.reported_sales),
      est_produce_sales: parseNumericValue(record.est_produce_sales),
      est_num_transactions: parseNumericValue(record.est_num_transactions),
      isInvalid: !matchedVendor,
    };
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) setShowUserMenu(false);
    };
    if (showUserMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  useEffect(() => {
    getVendors(0, 100)
      .then(res => {
        console.log('Vendors response:', res);
        setAllVendors(res.data.map((v: ApiVendor) => ({ id: v.id, name: v.vendorName })));
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
        setHighlightedRowId(null);
        setRowModesModel({});
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
        
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
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
          
          const snap = parseNumericValue(row[2]);
          const dufb = parseNumericValue(row[3]);
          const wdfm = parseNumericValue(row[4]);
          const voucher = parseNumericValue(row[5]);
          const reportedSales = parseNumericValue(row[6]);

          return normalizeRecord({
            id: Math.random().toString(36).substr(2, 9),
            vendor_id: '',
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
            isInvalid: false,
          });
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
    setRowModesModel(prev => ({
      ...prev,
      [newRecord.id]: { mode: GridRowModes.Edit, fieldToFocus: 'snap' },
    }));
    toast.success(`Added ${vendor.name}`);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    setHighlightedRowId(prev => (prev === id ? null : prev));
    setRowModesModel(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    toast.info('Row removed');
  };

  const handleEditClick = (id: GridRowId) => () => {
    setHighlightedRowId(id);
    setRowModesModel(prev => ({ ...prev, [id]: { mode: GridRowModes.Edit } }));
  };

  const handleRowClick = (params: GridRowParams<SalesRecord>) => {
    setHighlightedRowId(params.id);
  };

  const handleSaveClick = (id: GridRowId) => () => {
    setRowModesModel(prev => ({ ...prev, [id]: { mode: GridRowModes.View } }));
  };

  const handleCancelClick = (id: GridRowId) => () => {
    setRowModesModel(prev => ({
      ...prev,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    }));
  };

  const processRowUpdate = (updatedRow: SalesRecord) => {
    const normalized = normalizeRecord({
      ...updatedRow,
      market_date: currentMarketDate,
      reimbursement_due:
        parseNumericValue(updatedRow.snap) +
        parseNumericValue(updatedRow.dufb) +
        parseNumericValue(updatedRow.wdfm_tokens) +
        parseNumericValue(updatedRow.voucher),
    });

    setRecords(prev => prev.map(record => (record.id === normalized.id ? normalized : record)));
    return normalized;
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

  const columns: GridColDef<SalesRecord>[] = [
    {
      field: 'vendor_name',
      headerName: 'Vendor Name',
      minWidth: 240,
      flex: 1.2,
      editable: true,
      preProcessEditCellProps: (params) => {
        const hasError = !getMatchedVendor(String(params.props.value ?? ''));
        return { ...params.props, error: hasError };
      },
      renderEditCell: (params) => <VendorNameEditCell {...params} />,
      cellClassName: (params) => (params.row.isInvalid ? '!text-red-700 dark:!text-red-400 font-medium' : ''),
    },
    {
      field: 'present',
      headerName: 'Present',
      type: 'boolean',
      editable: true,
      width: 110,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'snap',
      headerName: 'SNAP ($)',
      type: 'number',
      editable: true,
      width: 120,
      align: 'right',
      headerAlign: 'right',
      valueParser: parseNumericValue,
      valueFormatter: (value) => formatCurrency(Number(value ?? 0)),
      renderEditCell: (params) => <NumericEditCell {...params} />,
    },
    {
      field: 'dufb',
      headerName: 'DUFB ($)',
      type: 'number',
      editable: true,
      width: 120,
      align: 'right',
      headerAlign: 'right',
      valueParser: parseNumericValue,
      valueFormatter: (value) => formatCurrency(Number(value ?? 0)),
      renderEditCell: (params) => <NumericEditCell {...params} />,
    },
    {
      field: 'wdfm_tokens',
      headerName: 'WDFM ($)',
      type: 'number',
      editable: true,
      width: 125,
      align: 'right',
      headerAlign: 'right',
      valueParser: parseNumericValue,
      valueFormatter: (value) => formatCurrency(Number(value ?? 0)),
      renderEditCell: (params) => <NumericEditCell {...params} />,
    },
    {
      field: 'voucher',
      headerName: 'Voucher ($)',
      type: 'number',
      editable: true,
      width: 130,
      align: 'right',
      headerAlign: 'right',
      valueParser: parseNumericValue,
      valueFormatter: (value) => formatCurrency(Number(value ?? 0)),
      renderEditCell: (params) => <NumericEditCell {...params} />,
    },
    {
      field: 'reimbursement_due',
      headerName: 'Reimburse.',
      type: 'number',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (_, row) => row.snap + row.dufb + row.wdfm_tokens + row.voucher,
      valueFormatter: (value) => formatCurrency(Number(value ?? 0)),
      cellClassName: 'font-semibold !text-[#059669] dark:!text-[#34d399]',
    },
    {
      field: 'reported_sales',
      headerName: 'Reported Sales',
      type: 'number',
      editable: true,
      width: 150,
      align: 'right',
      headerAlign: 'right',
      valueParser: parseNumericValue,
      valueFormatter: (value) => formatCurrency(Number(value ?? 0)),
      renderEditCell: (params) => <NumericEditCell {...params} />,
    },
    {
      field: 'est_produce_sales',
      headerName: 'Est. Produce',
      type: 'number',
      editable: true,
      width: 145,
      align: 'right',
      headerAlign: 'right',
      valueParser: parseNumericValue,
      valueFormatter: (value) => formatCurrency(Number(value ?? 0)),
      renderEditCell: (params) => <NumericEditCell {...params} />,
    },
    {
      field: 'est_num_transactions',
      headerName: 'Trans.',
      type: 'number',
      editable: true,
      width: 100,
      align: 'center',
      headerAlign: 'center',
      valueParser: parseNumericValue,
      renderEditCell: (params) => <NumericEditCell {...params} />,
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const isEditing = rowModesModel[params.id]?.mode === GridRowModes.Edit;

        if (isEditing) {
          return (
            <div className="flex items-center gap-1">
              <Tooltip title="Save row">
                <IconButton size="small" onClick={handleSaveClick(params.id)}>
                  <Save size={16} className="text-[#10b981]" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel">
                <IconButton size="small" onClick={handleCancelClick(params.id)}>
                  <X size={16} className="text-slate-500 dark:text-slate-400" />
                </IconButton>
              </Tooltip>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-1">
            <Tooltip title="Edit row">
              <IconButton size="small" onClick={handleEditClick(params.id)}>
                <Pencil size={16} className="text-slate-500 dark:text-slate-300" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete row">
              <IconButton size="small" onClick={() => handleDeleteRecord(String(params.id))}>
                <Trash2 size={16} className="text-red-500" />
              </IconButton>
            </Tooltip>
          </div>
        );
      },
    },
  ];

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
          <Box
            sx={{
              height: 640,
              '& .MuiDataGrid-root': { border: 'none' },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'rgba(148, 163, 184, 0.08)',
                borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
              },
              '& .MuiDataGrid-cell': {
                borderColor: 'rgba(148, 163, 184, 0.12)',
              },
              '& .MuiDataGrid-row.invalid-row': {
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
              },
              '& .MuiDataGrid-row.invalid-row:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
              },
              '& .MuiDataGrid-row.highlighted-row': {
                backgroundColor: 'rgba(16, 185, 129, 0.10)',
              },
              '& .MuiDataGrid-row.highlighted-row:hover': {
                backgroundColor: 'rgba(16, 185, 129, 0.14)',
              },
              '& .MuiDataGrid-row.invalid-row.highlighted-row': {
                backgroundColor: 'rgba(239, 68, 68, 0.14)',
              },
              '& .MuiDataGrid-row.invalid-row.highlighted-row:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.18)',
              },
              '& .MuiDataGrid-row.Mui-selected': {
                backgroundColor: 'transparent',
              },
            }}
          >
            <DataGrid
              rows={records}
              columns={columns}
              editMode="row"
              loading={isLoadingTransactions}
              onRowClick={handleRowClick}
              rowModesModel={rowModesModel}
              onRowModesModelChange={setRowModesModel}
              processRowUpdate={processRowUpdate}
              onProcessRowUpdateError={() => {
                toast.error('Please fix the invalid row before saving.');
              }}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25, page: 0 },
                },
              }}
              checkboxSelection
              getRowClassName={(params) => {
                const classes = [];

                if (params.row.isInvalid) classes.push('invalid-row');
                if (params.id === highlightedRowId) classes.push('highlighted-row');

                return classes.join(' ');
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-overlay': {
                  backgroundColor: 'transparent',
                },
              }}
              slotProps={{
                loadingOverlay: {
                  variant: 'linear-progress',
                  noRowsVariant: 'linear-progress',
                },
              }}
            />
          </Box>
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
