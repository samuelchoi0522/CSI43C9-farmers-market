"use client";

import React, { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import {
  DataGrid,
  GridRowSelectionModel,
  GridToolbarContainer,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';
import { AlertCircle, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Button from './Button';
import MarketDatePicker from './MarketDatePicker';
import VendorTransactionsSheetColumn, {
  vendorTransactionsSheetEditors,
  vendorTransactionsSheetFormatters,
} from './VendorTransactionsSheetColumn';
import VendorTransactionsSheetRow, {
  type VendorTransactionsSheetRowModel,
  vendorTransactionsSheetRowSx,
} from './VendorTransactionsSheetRow';

export type VendorTransactionsSheetRow = VendorTransactionsSheetRowModel;

interface VendorTransactionsSheetProps {
  currentMarketDate: string;
  onCurrentMarketDateChange: (value: string) => void;
  rows: VendorTransactionsSheetRow[];
  isLoading: boolean;
  isSaving: boolean;
  invalidCount: number;
  normalizeRow: (row: VendorTransactionsSheetRow) => VendorTransactionsSheetRow;
  onRowsChange: (rows: VendorTransactionsSheetRow[]) => void;
  onSave: () => void;
}

export default function VendorTransactionsSheet({
  currentMarketDate,
  onCurrentMarketDateChange,
  rows,
  isLoading,
  isSaving,
  invalidCount,
  normalizeRow,
  onRowsChange,
  onSave,
}: VendorTransactionsSheetProps) {
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
  const selectedRowIds = useMemo(() => {
    if (rowSelectionModel.type === 'exclude') {
      return rows
        .map(row => row.id)
        .filter(id => !rowSelectionModel.ids.has(id));
    }

    return Array.from(rowSelectionModel.ids).filter(id => rows.some(row => row.id === id));
  }, [rowSelectionModel, rows]);
  const effectiveRowSelectionModel = useMemo(
    () => {
      if (rowSelectionModel.type === 'exclude') {
        const validExclusions = Array.from(rowSelectionModel.ids).filter(id => rows.some(row => row.id === id));
        return { ...rowSelectionModel, ids: new Set(validExclusions) };
      }

      return { ...rowSelectionModel, ids: new Set(selectedRowIds) };
    },
    [rowSelectionModel, selectedRowIds, rows]
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
    const normalizedRow = normalizeRow(updatedRow);
    const nextRows = rows.map(row => (row.id === normalizedRow.id ? normalizedRow : row));
    onRowsChange(nextRows);
    return normalizedRow;
  };
  const columns = useMemo(
    () => [
      VendorTransactionsSheetColumn({
        field: 'vendor_name',
        headerName: 'Vendor Name',
        minWidth: 240,
        flex: 1.2,
        editable: true,
        renderEditCell: vendorTransactionsSheetEditors.text,
      }),
      VendorTransactionsSheetColumn({
        field: 'present',
        headerName: 'Present',
        type: 'boolean',
        editable: true,
        width: 110,
        align: 'center',
        headerAlign: 'center',
      }),
      VendorTransactionsSheetColumn({
        field: 'snap',
        headerName: 'SNAP ($)',
        type: 'number',
        editable: true,
        width: 120,
        align: 'right',
        headerAlign: 'right',
        renderEditCell: vendorTransactionsSheetEditors.numeric,
        valueFormatter: vendorTransactionsSheetFormatters.currency,
      }),
      VendorTransactionsSheetColumn({
        field: 'dufb',
        headerName: 'DUFB ($)',
        type: 'number',
        editable: true,
        width: 120,
        align: 'right',
        headerAlign: 'right',
        renderEditCell: vendorTransactionsSheetEditors.numeric,
        valueFormatter: vendorTransactionsSheetFormatters.currency,
      }),
      VendorTransactionsSheetColumn({
        field: 'wdfm_tokens',
        headerName: 'WDFM ($)',
        type: 'number',
        editable: true,
        width: 130,
        align: 'right',
        headerAlign: 'right',
        renderEditCell: vendorTransactionsSheetEditors.numeric,
        valueFormatter: vendorTransactionsSheetFormatters.currency,
      }),
      VendorTransactionsSheetColumn({
        field: 'voucher',
        headerName: 'Voucher ($)',
        type: 'number',
        editable: true,
        width: 130,
        align: 'right',
        headerAlign: 'right',
        renderEditCell: vendorTransactionsSheetEditors.numeric,
        valueFormatter: vendorTransactionsSheetFormatters.currency,
      }),
      VendorTransactionsSheetColumn({
        field: 'reimbursement_due',
        headerName: 'Reimburse.',
        type: 'number',
        width: 145,
        align: 'right',
        headerAlign: 'right',
        valueGetter: (_, row) => row.snap + row.dufb + row.wdfm_tokens + row.voucher,
        valueFormatter: vendorTransactionsSheetFormatters.currency,
        cellClassName: 'font-semibold !text-[#059669]',
      }),
      VendorTransactionsSheetColumn({
        field: 'reported_sales',
        headerName: 'Reported Sales',
        type: 'number',
        editable: true,
        width: 150,
        align: 'right',
        headerAlign: 'right',
        renderEditCell: vendorTransactionsSheetEditors.numeric,
        valueFormatter: vendorTransactionsSheetFormatters.currency,
      }),
      VendorTransactionsSheetColumn({
        field: 'est_produce_sales',
        headerName: 'Est. Produce',
        type: 'number',
        editable: true,
        width: 145,
        align: 'right',
        headerAlign: 'right',
        renderEditCell: vendorTransactionsSheetEditors.numeric,
        valueFormatter: vendorTransactionsSheetFormatters.currency,
      }),
      VendorTransactionsSheetColumn({
        field: 'est_num_transactions',
        headerName: 'Trans.',
        type: 'number',
        editable: true,
        width: 100,
        align: 'center',
        headerAlign: 'center',
        renderEditCell: vendorTransactionsSheetEditors.numeric,
      }),
    ],
    []
  );

  const Toolbar = () => (
    <GridToolbarContainer className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
      <div className="flex shrink-0 items-start">
        <MarketDatePicker
          value={currentMarketDate}
          onChange={onCurrentMarketDateChange}
          compact
        />
      </div>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
        <div className="text-sm text-slate-600">
          {selectedRowIds.length > 0 ? `${selectedRowIds.length} row(s) selected` : 'Search by any value...'}
        </div>
        <GridToolbarQuickFilter
          debounceMs={250}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1"
        />
        <button
          onClick={handleDeleteSelected}
          disabled={selectedRowIds.length === 0}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            selectedRowIds.length === 0
              ? 'cursor-not-allowed border border-slate-200 bg-white text-slate-400'
              : 'border border-red-200 bg-white text-red-600 hover:bg-red-50'
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
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm text-slate-600">{rows.length} total row(s)</div>
        <div className="text-sm text-slate-600">{selectedRowIds.length} selected</div>
      </div>

      {invalidCount > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          {invalidCount} row(s) have vendor names that do not match the vendor list. Update those names before saving.
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Box sx={{ height: 660 }}>
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
            localeText={{
              noRowsLabel: `No vendor transactions for ${currentMarketDate}. Import a spreadsheet or add a vendor to get started.`,
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'rgba(148, 163, 184, 0.08)',
                borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
              },
              '& .MuiDataGrid-cell': {
                borderColor: 'rgba(148, 163, 184, 0.12)',
              },
              '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-overlay': {
                backgroundColor: 'transparent',
              },
              ...vendorTransactionsSheetRowSx,
            }}
            slotProps={{
              loadingOverlay: {
                variant: 'linear-progress',
                noRowsVariant: 'linear-progress',
              },
            }}
            slots={{
              toolbar: Toolbar,
              row: VendorTransactionsSheetRow,
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
