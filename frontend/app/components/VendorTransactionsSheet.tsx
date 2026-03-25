"use client";

import React, { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderEditCellParams,
  GridRowSelectionModel,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  useGridApiContext,
} from '@mui/x-data-grid';
import { AlertCircle, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Button from './Button';

export interface VendorTransactionsSheetRow {
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
  isInvalid: boolean;
}

interface VendorTransactionsSheetProps {
  currentMarketDate: string;
  rows: VendorTransactionsSheetRow[];
  isLoading: boolean;
  isSaving: boolean;
  invalidCount: number;
  onRowsChange: (rows: VendorTransactionsSheetRow[]) => void;
  onSave: () => void;
}

const formatCurrency = (amount: number = 0) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

function VendorNameEditCell(params: GridRenderEditCellParams<VendorTransactionsSheetRow, string>) {
  const apiRef = useGridApiContext();
  const hasError = Boolean(params.row?.isInvalid);

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
            : 'border-slate-300 focus:ring-2 focus:ring-[#10b981] dark:border-slate-600'
        }`}
        placeholder="Enter vendor name..."
      />
    </div>
  );
}

function NumericEditCell(params: GridRenderEditCellParams<VendorTransactionsSheetRow, number | string>) {
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

export default function VendorTransactionsSheet({
  currentMarketDate,
  rows,
  isLoading,
  isSaving,
  invalidCount,
  onRowsChange,
  onSave,
}: VendorTransactionsSheetProps) {
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
  const selectedRowIds = useMemo(
    () => Array.from(rowSelectionModel.ids).filter(id => rows.some(row => row.id === id)),
    [rowSelectionModel, rows]
  );
  const effectiveRowSelectionModel = useMemo(
    () => ({ ...rowSelectionModel, ids: new Set(selectedRowIds) }),
    [rowSelectionModel, selectedRowIds]
  );

  const handleDeleteSelected = () => {
    if (selectedRowIds.length === 0) {
      toast.error('Select at least one row to delete.');
      return;
    }

    const selectedIds = new Set(selectedRowIds);
    onRowsChange(rows.filter(row => !selectedIds.has(row.id)));
    setRowSelectionModel({ type: 'include', ids: new Set() });
    toast.success(`Deleted ${selectedRowIds.length} row(s).`);
  };

  const processRowUpdate = (updatedRow: VendorTransactionsSheetRow) => {
    const nextRows = rows.map(row => (row.id === updatedRow.id ? updatedRow : row));
    onRowsChange(nextRows);
    return updatedRow;
  };

  const columns: GridColDef<VendorTransactionsSheetRow>[] = [
    {
      field: 'vendor_name',
      headerName: 'Vendor Name',
      minWidth: 240,
      flex: 1.2,
      editable: true,
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
      renderEditCell: (params) => <NumericEditCell {...params} />,
      valueFormatter: (value) => formatCurrency(Number(value ?? 0)),
    },
    {
      field: 'dufb',
      headerName: 'DUFB ($)',
      type: 'number',
      editable: true,
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderEditCell: (params) => <NumericEditCell {...params} />,
      valueFormatter: (value) => formatCurrency(Number(value ?? 0)),
    },
    {
      field: 'wdfm_tokens',
      headerName: 'WDFM ($)',
      type: 'number',
      editable: true,
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderEditCell: (params) => <NumericEditCell {...params} />,
      valueFormatter: (value) => formatCurrency(Number(value ?? 0)),
    },
    {
      field: 'voucher',
      headerName: 'Voucher ($)',
      type: 'number',
      editable: true,
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderEditCell: (params) => <NumericEditCell {...params} />,
      valueFormatter: (value) => formatCurrency(Number(value ?? 0)),
    },
    {
      field: 'reimbursement_due',
      headerName: 'Reimburse.',
      type: 'number',
      width: 145,
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
      renderEditCell: (params) => <NumericEditCell {...params} />,
      valueFormatter: (value) => formatCurrency(Number(value ?? 0)),
    },
    {
      field: 'est_produce_sales',
      headerName: 'Est. Produce',
      type: 'number',
      editable: true,
      width: 145,
      align: 'right',
      headerAlign: 'right',
      renderEditCell: (params) => <NumericEditCell {...params} />,
      valueFormatter: (value) => formatCurrency(Number(value ?? 0)),
    },
    {
      field: 'est_num_transactions',
      headerName: 'Trans.',
      type: 'number',
      editable: true,
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderEditCell: (params) => <NumericEditCell {...params} />,
    },
  ];

  const Toolbar = () => (
    <GridToolbarContainer className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
      <div className="text-sm text-slate-600 dark:text-slate-400">
        {selectedRowIds.length > 0 ? `${selectedRowIds.length} row(s) selected` : 'Select rows with the checkboxes to delete them'}
      </div>
      <div className="flex items-center gap-3">
        <GridToolbarQuickFilter
          debounceMs={250}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-900"
        />
        <button
          onClick={handleDeleteSelected}
          disabled={selectedRowIds.length === 0}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            selectedRowIds.length === 0
              ? 'cursor-not-allowed border border-slate-200 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500'
              : 'border border-red-200 bg-white text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20'
          }`}
        >
          <Trash2 size={16} />
          Delete Selected
        </button>
      </div>
    </GridToolbarContainer>
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="text-sm text-slate-600 dark:text-slate-400">{rows.length} total row(s)</div>
        <div className="text-sm text-slate-600 dark:text-slate-400">{selectedRowIds.length} selected</div>
      </div>

      {invalidCount > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          {invalidCount} row(s) have vendor names that do not match the vendor list. Update those names before saving.
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <Box
          sx={{
            height: 660,
            '& .MuiDataGrid-root': { border: 'none' },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'rgba(148, 163, 184, 0.08)',
              borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
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
          }}
        >
          <DataGrid
            rows={rows}
            columns={columns}
            loading={isLoading}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={() => toast.error('Unable to update that row.')}
            checkboxSelection
            showToolbar
            disableRowSelectionOnClick
            rowSelectionModel={effectiveRowSelectionModel}
            onRowSelectionModelChange={setRowSelectionModel}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25, page: 0 },
              },
            }}
            getRowClassName={(params) => (params.row.isInvalid ? 'invalid-row' : '')}
            localeText={{
              noRowsLabel: `No vendor transactions for ${currentMarketDate}. Import a spreadsheet or add a vendor to get started.`,
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
            slots={{
              toolbar: Toolbar,
            }}
          />
        </Box>
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          variant="primary"
          onClick={onSave}
          disabled={isSaving || rows.length === 0 || invalidCount > 0}
          className="flex items-center gap-3 rounded-xl px-8 py-4 text-base font-semibold shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        >
          {isSaving ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Upload size={20} />
              {invalidCount > 0 ? `Fix ${invalidCount} invalid vendor(s) to save` : 'Save Transactions'}
            </>
          )}
        </Button>
      </div>
    </>
  );
}
