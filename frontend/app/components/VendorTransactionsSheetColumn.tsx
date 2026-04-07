"use client";

import {
  type GridAlignment,
  type GridColDef,
  type GridRenderEditCellParams,
  useGridApiContext,
} from '@mui/x-data-grid';
import { Checkbox, TextField, Box } from '@mui/material';
import { type VendorTransactionsSheetRowModel } from './VendorTransactionsSheetRow';

export type VendorTransactionsSheetColumnType = GridColDef<VendorTransactionsSheetRowModel>['type'];
export type VendorTransactionsSheetColumn = GridColDef<VendorTransactionsSheetRowModel>;

interface VendorTransactionsSheetColumnProps {
  field: string;
  headerName: string;
  type?: VendorTransactionsSheetColumnType;
  minWidth?: number;
  width?: number;
  flex?: number;
  editable?: boolean;
  align?: GridAlignment;
  headerAlign?: GridAlignment;
  valueGetter?: VendorTransactionsSheetColumn['valueGetter'];
  valueSetter?: VendorTransactionsSheetColumn['valueSetter'];
  valueFormatter?: VendorTransactionsSheetColumn['valueFormatter'];
  renderEditCell?: VendorTransactionsSheetColumn['renderEditCell'];
  cellClassName?: VendorTransactionsSheetColumn['cellClassName'];
  description?: string;
  preProcessEditCellProps?: VendorTransactionsSheetColumn['preProcessEditCellProps'];
}

const formatCurrency = (amount: number = 0) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

function VendorNameEditCell(params: GridRenderEditCellParams<VendorTransactionsSheetRowModel, string>) {
  const apiRef = useGridApiContext();
  const hasError = Boolean(params.row?.isInvalid || params.error);

  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', px: 1 }}>
      <TextField
        fullWidth
        autoFocus
        size="small"
        value={params.value ?? ''}
        error={hasError}
        onChange={(event) => {
          apiRef.current.setEditCellValue({
            id: params.id,
            field: params.field,
            value: event.target.value,
          });
        }}
        onFocus={(event) => event.currentTarget.querySelector('input')?.select()}
        sx={{
          '& .MuiInputBase-root': {
            fontSize: '0.875rem',
            bgcolor: 'white',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: hasError ? 'error.main' : 'rgba(148, 163, 184, 0.3)',
          },
          '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: hasError ? 'error.main' : '#10b981 !important',
            borderWidth: '2px',
          },
        }}
        placeholder="Enter value..."
      />
    </Box>
  );
}

function NumericEditCell(params: GridRenderEditCellParams<VendorTransactionsSheetRowModel, number | string>) {
  const apiRef = useGridApiContext();
  const hasError = Boolean(params.error);

  const displayValue = (params.value === null || params.value === undefined || Number.isNaN(params.value)) 
    ? '' 
    : params.value;

  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'flex-end', px: 1 }}>
      <TextField
        fullWidth
        type="number"
        autoFocus
        size="small"
        value={displayValue}
        error={hasError}
        onChange={(event) => {
          const val = event.target.value;
          apiRef.current.setEditCellValue({
            id: params.id,
            field: params.field,
            value: val === '' ? null : Number(val),
          });
        }}
        onFocus={(event) => event.currentTarget.querySelector('input')?.select()}
        slotProps={{
          htmlInput: {
            step: params.field === 'est_num_transactions' ? '1' : '0.01',
            style: { textAlign: 'right' }
          }
        }}
        sx={{
          '& .MuiInputBase-root': {
            fontSize: '0.875rem',
            bgcolor: 'white',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: hasError ? 'error.main' : 'rgba(148, 163, 184, 0.3)',
          },
          '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: hasError ? 'error.main' : '#10b981 !important',
            borderWidth: '2px',
          },
        }}
      />
    </Box>
  );
}

function BooleanEditCell(params: GridRenderEditCellParams<VendorTransactionsSheetRowModel, boolean>) {
  const apiRef = useGridApiContext();

  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <Checkbox
        checked={Boolean(params.value)}
        onChange={(event) => {
          apiRef.current.setEditCellValue({
            id: params.id,
            field: params.field,
            value: event.target.checked,
          });
        }}
        sx={{
          color: '#10b981',
          '&.Mui-checked': {
            color: '#10b981',
          },
        }}
      />
    </Box>
  );
}

export default function VendorTransactionsSheetColumn({
  field,
  headerName,
  type,
  minWidth,
  width,
  flex,
  editable,
  align,
  headerAlign,
  valueGetter,
  valueSetter,
  valueFormatter,
  renderEditCell,
  cellClassName,
  description,
  preProcessEditCellProps,
}: VendorTransactionsSheetColumnProps): VendorTransactionsSheetColumn {
  return {
    field,
    headerName,
    type,
    minWidth,
    width,
    flex,
    editable,
    align,
    headerAlign,
    valueGetter,
    valueSetter,
    valueFormatter,
    renderEditCell,
    cellClassName,
    description,
    preProcessEditCellProps,
  };
}

export const vendorTransactionsSheetFormatters = {
  currency: (value: unknown) => formatCurrency(Number(value ?? 0)),
};

export const vendorTransactionsSheetEditors = {
  text: (params: GridRenderEditCellParams<VendorTransactionsSheetRowModel, string>) => <VendorNameEditCell {...params} />,
  numeric: (params: GridRenderEditCellParams<VendorTransactionsSheetRowModel, number | string>) => (
    <NumericEditCell {...params} />
  ),
  boolean: (params: GridRenderEditCellParams<VendorTransactionsSheetRowModel, boolean>) => (
    <BooleanEditCell {...params} />
  ),
};
