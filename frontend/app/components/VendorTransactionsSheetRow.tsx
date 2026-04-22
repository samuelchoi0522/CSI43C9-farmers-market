"use client";

import React from 'react';
import { type SxProps, type Theme } from '@mui/material/styles';
import { GridRow, type GridRowProps } from '@mui/x-data-grid';

export interface VendorTransactionsSheetRowModel {
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
  pct_handmade?: number | null;
  pct_agricultural?: number | null;
  pct_prepared_food?: number | null;
  pct_cottage_goods?: number | null;
  pct_manufactured?: number | null;
  avg_sale_amount?: number | null;
  isInvalid: boolean;
  customData?: Record<string, unknown>;
  defaults_applied?: boolean;
}

const INVALID_ROW_CLASS = 'vendor-transactions-sheet-row--invalid';

const getRowClassName = (className?: string, isInvalid?: boolean) =>
  [className, isInvalid ? INVALID_ROW_CLASS : ''].filter(Boolean).join(' ');

export const vendorTransactionsSheetRowSx: SxProps<Theme> = {
  '& .MuiDataGrid-row.MuiDataGrid-row--editable:hover': {
    backgroundColor: 'transparent',
  },
  '& .MuiDataGrid-row.MuiDataGrid-row--editable:hover .MuiDataGrid-cell': {
    backgroundColor: 'inherit',
  },
  [`& .MuiDataGrid-row.${INVALID_ROW_CLASS} .MuiDataGrid-cell`]: {
    backgroundColor: 'rgba(254, 226, 226, 0.95) !important',
  },
  [`& .MuiDataGrid-row.${INVALID_ROW_CLASS}:hover .MuiDataGrid-cell`]: {
    backgroundColor: 'rgba(254, 202, 202, 0.98) !important',
  },
  [`& .MuiDataGrid-row.${INVALID_ROW_CLASS} .MuiDataGrid-cell[data-field="vendor_name"]`]: {
    boxShadow: 'inset 4px 0 0 rgb(239, 68, 68)',
    color: 'rgb(185, 28, 28)',
    fontWeight: 600,
  },
  [`& .MuiDataGrid-row.${INVALID_ROW_CLASS}:hover .MuiDataGrid-cell[data-field="vendor_name"]`]: {
    color: 'rgb(185, 28, 28)',
  },
};

const VendorTransactionsSheetRow = React.forwardRef<HTMLDivElement, GridRowProps>(function VendorTransactionsSheetRow(
  props,
  ref
) {
  const { className, row, ...rest } = props;
  const typedRow = row as VendorTransactionsSheetRowModel;

  return (
    <GridRow
      ref={ref}
      className={getRowClassName(className, typedRow.isInvalid)}
      row={row}
      {...rest}
    />
  );
});

export default VendorTransactionsSheetRow;
