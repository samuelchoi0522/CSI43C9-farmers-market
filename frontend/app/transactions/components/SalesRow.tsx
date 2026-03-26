"use client";

import React from 'react';
import { TableRow, TableCell, TextField, Checkbox, IconButton } from '@mui/material';
import { Check, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { SalesRecord, formatCurrency } from '../utils';

const MotionTableRow = motion(TableRow);

interface SalesRowProps {
  record: SalesRecord;
  isEditing: boolean;
  isInvalid: boolean;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<SalesRecord>) => void;
}

export default function SalesRow({ record, isEditing, isInvalid, onEdit, onSave, onDelete, onUpdate }: SalesRowProps) {
  const snap = record.snap ?? 0;
  const dufb = record.dufb ?? 0;
  const wdfm_tokens = record.wdfm_tokens ?? 0;
  const voucher = record.voucher ?? 0;
  const reported_sales = record.reported_sales ?? 0;
  const reimbursement_due = record.reimbursement_due ?? 0;
  const est_produce_sales = record.est_produce_sales ?? 0;
  const est_num_transactions = record.est_num_transactions ?? 0;
  const present = record.present ?? false;

  const handleNumberChange = (field: keyof SalesRecord, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (!isNaN(numValue)) {
      onUpdate({ [field]: numValue });
    }
  };

  return (
    <MotionTableRow 
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => !isEditing && onEdit()}
      className={`
        group transition-colors cursor-pointer
        ${isInvalid ? 'bg-red-50 dark:bg-red-900/20' : ''}
        ${isEditing && !isInvalid ? 'bg-[#10b981]/10 dark:bg-[#10b981]/15' : ''}
        ${!isEditing && !isInvalid ? 'hover:bg-slate-100 dark:hover:bg-slate-700/60' : ''}
      `}
    >
      <TableCell className="font-medium">
        {isEditing || isInvalid ? (
          <TextField
            size="small"
            error={isInvalid}
            helperText={isInvalid ? "Vendor not found" : ""}
            value={record.vendor_name}
            onChange={(e) => onUpdate({ vendor_name: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="Enter valid vendor name..."
            fullWidth
          />
        ) : (
          <span className="text-slate-900 dark:text-slate-100">{record.vendor_name}</span>
        )}
      </TableCell>

      <TableCell align="center">
        <Checkbox
          checked={present}
          onChange={(e) => onUpdate({ present: e.target.checked })}
          onClick={(e) => e.stopPropagation()}
          sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }}
        />
      </TableCell>

      <TableCell align="right">
        {isEditing ? (
          <TextField 
            type="number"
            size="small"
            value={snap === 0 && isEditing ? '' : snap}
            onChange={(e) => handleNumberChange('snap', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            inputProps={{ step: "0.01", style: { textAlign: 'right' } }}
            autoFocus
          />
        ) : (
          <span className="text-slate-600 dark:text-slate-400 tabular-nums">{formatCurrency(snap)}</span>
        )}
      </TableCell>

      <TableCell align="right">
        {isEditing ? (
          <TextField 
            type="number"
            size="small"
            value={dufb === 0 && isEditing ? '' : dufb}
            onChange={(e) => handleNumberChange('dufb', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            inputProps={{ step: "0.01", style: { textAlign: 'right' } }}
          />
        ) : (
          <span className="text-slate-600 dark:text-slate-400 tabular-nums">{formatCurrency(dufb)}</span>
        )}
      </TableCell>

      <TableCell align="right">
        {isEditing ? (
          <TextField 
            type="number"
            size="small"
            value={wdfm_tokens === 0 && isEditing ? '' : wdfm_tokens}
            onChange={(e) => handleNumberChange('wdfm_tokens', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            inputProps={{ step: "0.01", style: { textAlign: 'right' } }}
          />
        ) : (
          <span className="text-slate-600 dark:text-slate-400 tabular-nums">{formatCurrency(wdfm_tokens)}</span>
        )}
      </TableCell>

      <TableCell align="right">
        {isEditing ? (
          <TextField 
            type="number"
            size="small"
            value={voucher === 0 && isEditing ? '' : voucher}
            onChange={(e) => handleNumberChange('voucher', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            inputProps={{ step: "0.01", style: { textAlign: 'right' } }}
          />
        ) : (
          <span className="text-slate-600 dark:text-slate-400 tabular-nums">{formatCurrency(voucher)}</span>
        )}
      </TableCell>

      <TableCell align="right" className="bg-[#10b981]/10">
        {isEditing ? (
          <TextField 
            type="number"
            size="small"
            value={reimbursement_due === 0 && isEditing ? '' : reimbursement_due}
            onChange={(e) => handleNumberChange('reimbursement_due', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            inputProps={{ step: "0.01", style: { textAlign: 'right', fontWeight: 'bold', color: '#059669' } }}
          />
        ) : (
          <span className={`font-bold tabular-nums ${reimbursement_due > 0 ? 'text-[#059669] dark:text-[#34d399]' : 'text-slate-300 dark:text-slate-500'}`}>
            {formatCurrency(reimbursement_due)}
          </span>
        )}
      </TableCell>

      <TableCell align="right">
        {isEditing ? (
          <TextField 
            type="number"
            size="small"
            value={reported_sales === 0 && isEditing ? '' : reported_sales}
            onChange={(e) => handleNumberChange('reported_sales', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            inputProps={{ step: "0.01", style: { textAlign: 'right' } }}
          />
        ) : (
          <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">{formatCurrency(reported_sales)}</span>
        )}
      </TableCell>

      <TableCell align="right">
        {isEditing ? (
          <TextField 
            type="number"
            size="small"
            value={est_produce_sales === 0 && isEditing ? '' : est_produce_sales}
            onChange={(e) => handleNumberChange('est_produce_sales', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            inputProps={{ step: "0.01", style: { textAlign: 'right' } }}
          />
        ) : (
          <span className="text-emerald-700 dark:text-emerald-400 tabular-nums">{formatCurrency(est_produce_sales)}</span>
        )}
      </TableCell>

      <TableCell align="center">
        {isEditing ? (
          <TextField 
            type="number"
            size="small"
            value={est_num_transactions === 0 && isEditing ? '' : est_num_transactions}
            onChange={(e) => handleNumberChange('est_num_transactions', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            inputProps={{ style: { textAlign: 'center' } }}
          />
        ) : (
          <span className="text-slate-500 dark:text-slate-400 tabular-nums">{est_num_transactions}</span>
        )}
      </TableCell>

      <TableCell align="center">
        {isEditing ? (
          <IconButton 
            onClick={(e) => { e.stopPropagation(); onSave(); }}
            sx={{ color: '#10b981', '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.15)' } }}
          >
            <Check size={20} />
          </IconButton>
        ) : (
          <IconButton 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' } }}
          >
            <Trash2 size={20} />
          </IconButton>
        )}
      </TableCell>
    </MotionTableRow>
  );
}
