"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import {
  DataGrid,
  GridRowSelectionModel,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  type GridRenderCellParams,
} from '@mui/x-data-grid';
import { AlertCircle, Loader2, Sparkles, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Button from './Button';
import MarketDatePicker from './MarketDatePicker';
import { VendorDefaultsDialog } from './VendorDefaultsDialog';
import VendorTransactionsSheetColumn, {
  vendorTransactionsSheetEditors,
  vendorTransactionsSheetFormatters,
} from './VendorTransactionsSheetColumn';
import VendorTransactionsSheetRow, {
  type VendorTransactionsSheetRowModel,
  vendorTransactionsSheetRowSx,
} from './VendorTransactionsSheetRow';
import { type Vendor as ApiVendor } from '@/lib/api/vendor';
import { getVendorDefaultsByVendorId, type VendorDefaults } from '@/lib/api/defaults';
import { type CustomColumnMetadata } from '@/lib/api/customColumns';

export type VendorTransactionsSheetRow = VendorTransactionsSheetRowModel;

type VendorWithDefaults = ApiVendor & {
  defaults?: VendorDefaults & { avgSaleAmount?: string };
};

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
  vendorsWithDefaults: VendorWithDefaults[];
  customColumns?: CustomColumnMetadata[];
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
  vendorsWithDefaults,
  customColumns = [],
}: VendorTransactionsSheetProps) {
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
  const handleApplyDefaults = (rowId: string, data: {
    pctHandmade: number;
    pctAgricultural: number;
    pctPreparedFood: number;
    pctCottageGoods: number;
    pctManufactured: number;
    avgSaleAmount: number;
  }) => {
    const targetRow = rows.find((row) => row.id === rowId);
    if (!targetRow) return;

    const sales = targetRow.reported_sales || 0;
    const produceSales = (sales * (data.pctAgricultural + data.pctPreparedFood)) / 100;
    const estTransactions = data.avgSaleAmount > 0 ? Math.round(sales / data.avgSaleAmount) : 0;

    const updatedRow = normalizeRow({
      ...targetRow,
      est_produce_sales: Math.round(produceSales * 100) / 100,
      est_num_transactions: estTransactions,
      defaults_applied: true,
      pct_handmade: data.pctHandmade,
      pct_agricultural: data.pctAgricultural,
      pct_prepared_food: data.pctPreparedFood,
      pct_cottage_goods: data.pctCottageGoods,
      pct_manufactured: data.pctManufactured,
    });

    onRowsChange(rows.map((row) => (row.id === rowId ? updatedRow : row)));
    toast.success(`Applied defaults for ${updatedRow.vendor_name}.`);
  };
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isPersistedTransactionId = (value: string) => UUID_PATTERN.test(value);

  const isDefaultsRequired = (row: VendorTransactionsSheetRow) => {
    const vendor = vendorsWithDefaults.find(
      (item) =>
        item.id === row.vendor_id ||
        item.vendorName?.toLowerCase() === row.vendor_name.trim().toLowerCase()
    );
    return Boolean(vendor?.defaults);
  };

  // Helper: returns true only when all five percentage fields are absent (null/undefined)
  // Used when deciding whether to auto-apply vendor defaults (we intentionally
  // only auto-apply when the row has no percentage data at all).
  const arePercentagesMissing = (row: VendorTransactionsSheetRow) => {
    return (
      row.pct_handmade == null &&
      row.pct_agricultural == null &&
      row.pct_prepared_food == null &&
      row.pct_cottage_goods == null &&
      row.pct_manufactured == null
    );
  };

  // Custom handler for marking defaults red with enhanced validation.
  // Rules:
  // - If vendor has no defaults configured, don't mark red.
  // - If all percentages are missing → invalid (red).
  // - If some percentages are set and some are null → invalid (incomplete).
  // - If all five percentages are set, validate they sum to ~100 (tolerance 0.01).
  const shouldMarkDefaultsRed = (row: VendorTransactionsSheetRow) => {
    // First check if vendor requires defaults
    if (!isDefaultsRequired(row)) return false;

    // If all percentages are missing, mark red
    if (arePercentagesMissing(row)) return true;

    // Check if percentages are partially set but invalid
    const percentages = [
      row.pct_handmade,
      row.pct_agricultural,
      row.pct_prepared_food,
      row.pct_cottage_goods,
      row.pct_manufactured
    ];

    const setPercentages = percentages.filter(p => p != null);
    const nullPercentages = percentages.filter(p => p == null);

    // If some percentages are set and some are null, mark red (incomplete)
    if (setPercentages.length > 0 && nullPercentages.length > 0) return true;

    // If all percentages are set, check if they sum to 100%
    if (setPercentages.length === 5) {
      const total = setPercentages.reduce((sum, p) => sum + (p || 0), 0);
      // Allow for small floating point errors
      return Math.abs(total - 100) > 0.01;
    }

    return false;
  };
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

  const handleApplyDefaultsToAll = () => {
    // Find rows that require defaults and currently have no percentages set.
    // We intentionally avoid overwriting partially-entered percentages.
    const rowsNeedingDefaults = rows.filter((row) => {
      const vendor = vendorsWithDefaults.find(
        (item) =>
          item.id === row.vendor_id ||
          item.vendorName?.toLowerCase() === row.vendor_name.trim().toLowerCase()
      );
      return vendor?.defaults && arePercentagesMissing(row);
    });

    if (rowsNeedingDefaults.length === 0) {
      toast.info('All rows that require percentages already have them applied.');
      return;
    }

    const updatedRows = rows.map((row) => {
      const vendor = vendorsWithDefaults.find(
        (item) =>
          item.id === row.vendor_id ||
          item.vendorName?.toLowerCase() === row.vendor_name.trim().toLowerCase()
      );

      if (!vendor?.defaults || !arePercentagesMissing(row)) {
        return row;
      }

      const sales = row.reported_sales || 0;
      const defaults = vendor.defaults;
      const avgSaleAmount = parseFloat(defaults.avgSaleAmount || '0');
      const produceSales =
        (sales * (parseFloat(defaults.pctAgricultural || '0') + parseFloat(defaults.pctPreparedFood || '0'))) / 100;
      const estTransactions = avgSaleAmount > 0 ? Math.round(sales / avgSaleAmount) : 0;

      return normalizeRow({
        ...row,
        est_produce_sales: Math.round(produceSales * 100) / 100,
        est_num_transactions: estTransactions,
        defaults_applied: true,
        pct_handmade: parseFloat(defaults.pctHandmade || '0'),
        pct_agricultural: parseFloat(defaults.pctAgricultural || '0'),
        pct_prepared_food: parseFloat(defaults.pctPreparedFood || '0'),
        pct_cottage_goods: parseFloat(defaults.pctCottageGoods || '0'),
        pct_manufactured: parseFloat(defaults.pctManufactured || '0'),
      });
    });

    onRowsChange(updatedRows);
    toast.success(`Applied defaults to ${rowsNeedingDefaults.length} vendor(s).`);
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
        field: 'defaults',
        headerName: 'Item Percentages',
        width: 120,
        align: 'center',
        headerAlign: 'center',
        editable: false,
        cellClassName: (params) => {
          const row = params.row as VendorTransactionsSheetRow;
          return shouldMarkDefaultsRed(row)
            ? 'bg-red-50 font-bold text-red-600'
            : '';
        },
        renderCell: (params: GridRenderCellParams) => (
          <VendorDefaultsCell
            row={params.row as VendorTransactionsSheetRow}
            vendorsWithDefaults={vendorsWithDefaults}
            onApply={handleApplyDefaults}
          />
        ),
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
      ...customColumns
        .filter((col) => col.id !== undefined)
        .map((col) => {
          const columnId = col.id!;
          const fieldName = `custom_${columnId}`;
          return VendorTransactionsSheetColumn({
            field: fieldName,
            headerName: `${col.name}${col.isRequired ? ' *' : ''}`,
            type: col.type === 'boolean' ? 'boolean' : col.type === 'text' ? 'string' : 'number',
            editable: true,
            width: 150,
            align: col.type === 'boolean' ? 'center' : col.type === 'text' ? 'left' : 'right',
            headerAlign: col.type === 'boolean' ? 'center' : col.type === 'text' ? 'left' : 'right',
            renderEditCell:
              col.type === 'boolean'
                ? vendorTransactionsSheetEditors.boolean
                : col.type === 'text'
                ? vendorTransactionsSheetEditors.text
                : vendorTransactionsSheetEditors.numeric,
            valueFormatter: col.type === 'usd' ? vendorTransactionsSheetFormatters.currency : undefined,
            valueGetter: (_value, row) => row.customData?.[columnId],
            valueSetter: (value, row) => {
              return {
                ...row,
                customData: {
                  ...(row.customData || {}),
                  [columnId]: col.type === 'number' || col.type === 'usd' ? Number(value) : value,
                },
              };
            },
            preProcessEditCellProps: (params) => {
              const hasError =
                col.isRequired &&
                (params.props.value === null || params.props.value === undefined || params.props.value === '');
              return { ...params.props, error: hasError };
            },
            cellClassName: (params) => {
              const value = params.row.customData?.[columnId];
              const hasError = col.isRequired && (value === null || value === undefined || value === '');
              return hasError ? 'bg-red-50 font-bold text-red-600' : '';
            },
          });
        }),
    ],
    [customColumns, vendorsWithDefaults, handleApplyDefaults]
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
          onClick={() => {
            // Confirm that the user wants to bulk-apply defaults.
            // Note: this only applies defaults to rows that have no percentages set.
            const ok = window.confirm(
              "This will apply default percentages to all vendors without percentages already applied."
            );
            if (ok) handleApplyDefaultsToAll();
          }}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            'border border-dashboard-primary/30 bg-white text-dashboard-primary hover:bg-dashboard-primary/10'
          }`}
        >
          <Sparkles size={16} />
          Apply All Defaults
        </button>
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
              '& .MuiDataGrid-cell--editing': {
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                boxShadow: 'inset 0 0 0 2px rgba(5, 150, 105, 0.45)',
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

interface VendorDefaultsCellProps {
  row: VendorTransactionsSheetRow;
  vendorsWithDefaults: VendorWithDefaults[];
  onApply: (rowId: string, data: {
    pctHandmade: number;
    pctAgricultural: number;
    pctPreparedFood: number;
    pctCottageGoods: number;
    pctManufactured: number;
    avgSaleAmount: number;
  }) => void;
}

function VendorDefaultsCell({ row, vendorsWithDefaults, onApply }: VendorDefaultsCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(false);
  const [localDefaults, setLocalDefaults] = useState<VendorDefaults | null>(null);
  const vendor = useMemo(
    () =>
      vendorsWithDefaults.find((item) =>
        item.id === row.vendor_id ||
        item.vendorName?.toLowerCase() === row.vendor_name.trim().toLowerCase()
      ),
    [vendorsWithDefaults, row.vendor_id, row.vendor_name]
  );

  useEffect(() => {
    if (!vendor) return;
    if (vendor.defaults) {
      setLocalDefaults(vendor.defaults);
    }
  }, [vendor]);

  const resolvedVendor = vendor
    ? {
        ...vendor,
        defaults: localDefaults ?? vendor.defaults,
      }
    : undefined;
  // Whether this transaction row already contains any percentage values.
  // Used to pre-populate the dialog so the user can edit existing percentages
  // instead of overwriting them with vendor defaults.
  const hasTransactionPercentages =
    row.pct_handmade !== null && row.pct_handmade !== undefined ||
    row.pct_agricultural !== null && row.pct_agricultural !== undefined ||
    row.pct_prepared_food !== null && row.pct_prepared_food !== undefined ||
    row.pct_cottage_goods !== null && row.pct_cottage_goods !== undefined ||
    row.pct_manufactured !== null && row.pct_manufactured !== undefined;

  const handleOpen = async () => {
    if (!resolvedVendor) {
      toast.error('Vendor not found for this row.');
      return;
    }

    // If defaults are already available locally, open dialog immediately.
    if (resolvedVendor.defaults) {
      setIsOpen(true);
      return;
    }

    setIsLoadingDefaults(true);
    try {
      const defaults = await getVendorDefaultsByVendorId(resolvedVendor.id);
      if (defaults) {
        setLocalDefaults(defaults);
        setIsOpen(true);
      } else {
        toast.error(`No vendor good type percentages saved for ${resolvedVendor.vendorName}.`);
      }
    } catch (error) {
      console.error('Failed to load vendor good type percentages:', error);
      toast.error('Unable to load vendor good type percentages.');
    } finally {
      setIsLoadingDefaults(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={`rounded-full p-1.5 transition-all hover:scale-110 active:scale-95 ${
          resolvedVendor
            ? 'text-[#10b981] hover:bg-[#10b981]/15'
            : 'text-slate-300 cursor-not-allowed'
        } ${isLoadingDefaults ? 'opacity-60 pointer-events-none' : ''}`}
        title={
          resolvedVendor
            ? resolvedVendor.defaults
              ? 'Use Vendor Good Type Percentages'
              : 'Load Vendor Good Type Percentages'
            : 'Vendor not found'
        }
        type="button"
        disabled={!resolvedVendor}
      >
        <Sparkles size={18} />
      </button>
      {resolvedVendor?.defaults && (
        <VendorDefaultsDialog
          vendor={resolvedVendor}
          reportedSales={row.reported_sales || 0}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          initialPercentages={
            hasTransactionPercentages
              ? {
                  pctHandmade: row.pct_handmade ?? 0,
                  pctAgricultural: row.pct_agricultural ?? 0,
                  pctPreparedFood: row.pct_prepared_food ?? 0,
                  pctCottageGoods: row.pct_cottage_goods ?? 0,
                  pctManufactured: row.pct_manufactured ?? 0,
                }
              : undefined
          }
          onApply={(data) => onApply(row.id, data)}
        />
      )}
    </>
  );
}
