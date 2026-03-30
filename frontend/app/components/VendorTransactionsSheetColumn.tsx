"use client";

import React from 'react';
import {
  type GridAlignment,
  type GridColDef,
  type GridRenderEditCellParams,
  useGridApiContext,
} from '@mui/x-data-grid';
import { type VendorTransactionsSheetRowModel } from './VendorTransactionsSheetRow';

export type VendorTransactionsSheetColumnType = GridColDef<VendorTransactionsSheetRowModel>['type'];
export type VendorTransactionsSheetColumn = GridColDef<VendorTransactionsSheetRowModel>;

interface VendorTransactionsSheetColumnProps {
  field: keyof VendorTransactionsSheetRowModel;
  headerName: string;
  type?: VendorTransactionsSheetColumnType;
  minWidth?: number;
  width?: number;
  flex?: number;
  editable?: boolean;
  align?: GridAlignment;
  headerAlign?: GridAlignment;
  valueGetter?: VendorTransactionsSheetColumn['valueGetter'];
  valueFormatter?: VendorTransactionsSheetColumn['valueFormatter'];
  renderEditCell?: VendorTransactionsSheetColumn['renderEditCell'];
  cellClassName?: VendorTransactionsSheetColumn['cellClassName'];
}

const formatCurrency = (amount: number = 0) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

function VendorNameEditCell(params: GridRenderEditCellParams<VendorTransactionsSheetRowModel, string>) {
  const apiRef = useGridApiContext();
  const hasError = Boolean(params.row?.isInvalid);

  return (
    <div className="flex h-full w-full items-center px-2 py-1">
      <input
        type="text"
        autoFocus
        value={params.value ?? ''}
        onChange={(event) => {
          apiRef.current.setEditCellValue({
            id: params.id,
            field: params.field,
            value: event.target.value,
          });
        }}
        onFocus={(event) => event.currentTarget.select()}
        className={`w-full rounded border bg-white px-2 py-1 text-sm text-slate-900 outline-none ${
          hasError
            ? 'border-red-400 text-red-700 focus:ring-2 focus:ring-red-300'
            : 'border-slate-300 focus:ring-2 focus:ring-[#10b981]'
        }`}
        placeholder="Enter vendor name..."
      />
    </div>
  );
}

function NumericEditCell(params: GridRenderEditCellParams<VendorTransactionsSheetRowModel, number | string>) {
  const apiRef = useGridApiContext();

  return (
    <div className="flex h-full w-full items-center justify-end px-2 py-1">
      <input
        type="number"
        step={params.field === 'est_num_transactions' ? '1' : '0.01'}
        autoFocus
        value={params.value ?? ''}
        onChange={(event) => {
          apiRef.current.setEditCellValue({
            id: params.id,
            field: params.field,
            value: event.target.value,
          });
        }}
        onFocus={(event) => event.currentTarget.select()}
        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-right text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#10b981]"
      />
    </div>
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
  valueFormatter,
  renderEditCell,
  cellClassName,
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
    valueFormatter,
    renderEditCell,
    cellClassName,
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
};
