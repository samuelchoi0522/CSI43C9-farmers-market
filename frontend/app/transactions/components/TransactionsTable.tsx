"use client";

import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper
} from '@mui/material';
import { Loader2, AlertCircle } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import SalesRow from './SalesRow';
import { SalesRecord } from '../utils';

interface TransactionsTableProps {
  records: SalesRecord[];
  isLoading: boolean;
  currentMarketDate: string;
  editingId: string | null;
  onEdit: (id: string) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<SalesRecord>) => void;
}

export default function TransactionsTable({
  records,
  isLoading,
  currentMarketDate,
  editingId,
  onEdit,
  onSave,
  onDelete,
  onUpdate
}: TransactionsTableProps) {
  return (
    <TableContainer component={Paper} className="bg-white dark:bg-slate-800 shadow-sm rounded-xl">
      <Table>
        <TableHead>
          <TableRow className="bg-slate-50 dark:bg-slate-900/50">
            <TableCell className="text-slate-600 dark:text-slate-400 font-semibold uppercase">Vendor Name</TableCell>
            <TableCell align="center" className="text-slate-600 dark:text-slate-400 font-semibold uppercase">Present</TableCell>
            <TableCell align="right" className="text-slate-600 dark:text-slate-400 font-semibold uppercase bg-[#10b981]/10">SNAP ($)</TableCell>
            <TableCell align="right" className="text-slate-600 dark:text-slate-400 font-semibold uppercase bg-[#10b981]/10">DUFB ($)</TableCell>
            <TableCell align="right" className="text-slate-600 dark:text-slate-400 font-semibold uppercase bg-[#10b981]/10">WDFM ($)</TableCell>
            <TableCell align="right" className="text-slate-600 dark:text-slate-400 font-semibold uppercase bg-[#10b981]/10">Voucher ($)</TableCell>
            <TableCell align="right" className="text-[#059669] dark:text-[#34d399] font-bold uppercase bg-[#10b981]/10">Reimburse.</TableCell>
            <TableCell align="right" className="text-slate-600 dark:text-slate-400 font-semibold uppercase bg-amber-500/10 dark:bg-amber-500/5">Reported Sales</TableCell>
            <TableCell align="right" className="text-slate-600 dark:text-slate-400 font-semibold uppercase bg-emerald-500/10 dark:bg-emerald-500/5">Est. Produce</TableCell>
            <TableCell align="center" className="text-slate-600 dark:text-slate-400 font-semibold uppercase">Trans.</TableCell>
            <TableCell align="center"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <AnimatePresence initial={false}>
            {records.map(record => (
              <SalesRow 
                key={record.id} 
                record={record}
                isEditing={editingId === record.id}
                isInvalid={!!record.isInvalid}
                onEdit={() => onEdit(record.id)}
                onSave={onSave}
                onDelete={() => onDelete(record.id)}
                onUpdate={(updates) => onUpdate(record.id, updates)}
              />
            ))}
          </AnimatePresence>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={11} align="center" className="py-20 text-slate-500 dark:text-slate-400">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="animate-spin opacity-60" />
                  <p>Loading vendor transactions for {currentMarketDate}...</p>
                </div>
              </TableCell>
            </TableRow>
          )}
          {!isLoading && records.length === 0 && (
            <TableRow>
              <TableCell colSpan={11} align="center" className="py-20 text-slate-500 dark:text-slate-400">
                <div className="flex flex-col items-center gap-2">
                  <AlertCircle size={32} className="opacity-20" />
                  <p>No vendor transactions found for {currentMarketDate}. Add a vendor or import an Excel sheet to start this market day.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
