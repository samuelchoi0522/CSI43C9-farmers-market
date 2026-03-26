import { type VendorTransaction } from '@/lib/api/transactions';

export interface Vendor {
  id: string;
  name: string;
}

export interface SalesRecord {
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

export const mapTransactionToSalesRecord = (transaction: VendorTransaction): SalesRecord => ({
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

export const getMostRecentSaturday = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = (day + 1) % 7;
  const result = new Date(d);
  result.setDate(d.getDate() - diff);
  return result.toISOString().split('T')[0];
};

export const formatCurrency = (amount: number = 0) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};
