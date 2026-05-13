"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Calculator, Check, Sparkles, X } from 'lucide-react';
import Button from './Button';
import { type Vendor } from '@/lib/api/vendor';
import { type VendorDefaults } from '@/lib/api/defaults';

type VendorWithDefaults = Vendor & {
  defaults?: VendorDefaults & { avgSaleAmount?: string };
};

interface VendorDefaultsDialogProps {
  vendor: VendorWithDefaults | undefined;
  reportedSales: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialPercentages?: {
    pctHandmade: number;
    pctAgricultural: number;
    pctPreparedFood: number;
    pctCottageGoods: number;
    pctManufactured: number;
  };
  initialAvgSaleAmount?: number | null;
  onApply: (data: {
    pctHandmade: number;
    pctAgricultural: number;
    pctPreparedFood: number;
    pctCottageGoods: number;
    pctManufactured: number;
    avgSaleAmount: number;
  }) => void;
}

export function VendorDefaultsDialog({
  vendor,
  reportedSales,
  isOpen,
  onOpenChange,
  initialPercentages,
  initialAvgSaleAmount,
  onApply,
}: VendorDefaultsDialogProps) {
  const defaults = vendor?.defaults;
  const [pctHandmade, setPctHandmade] = useState('0');
  const [pctAgricultural, setPctAgricultural] = useState('0');
  const [pctPreparedFood, setPctPreparedFood] = useState('0');
  const [pctCottageGoods, setPctCottageGoods] = useState('0');
  const [pctManufactured, setPctManufactured] = useState('0');
  const [avgSaleAmount, setAvgSaleAmount] = useState('0');

  const initializeFields = useCallback(() => {
    if (!defaults) return;

    if (initialPercentages) {
      setPctHandmade(String(initialPercentages.pctHandmade ?? 0));
      setPctAgricultural(String(initialPercentages.pctAgricultural ?? 0));
      setPctPreparedFood(String(initialPercentages.pctPreparedFood ?? 0));
      setPctCottageGoods(String(initialPercentages.pctCottageGoods ?? 0));
      setPctManufactured(String(initialPercentages.pctManufactured ?? 0));
    } else {
      setPctHandmade(defaults.pctHandmade || '0');
      setPctAgricultural(defaults.pctAgricultural || '0');
      setPctPreparedFood(defaults.pctPreparedFood || '0');
      setPctCottageGoods(defaults.pctCottageGoods || '0');
      setPctManufactured(defaults.pctManufactured || '0');
    }

    if (initialAvgSaleAmount != null) {
      setAvgSaleAmount(String(initialAvgSaleAmount));
    } else {
      setAvgSaleAmount(defaults.avgSaleAmount || '0');
    }
  }, [defaults, initialPercentages, initialAvgSaleAmount]);

  // Reinitialize fields whenever dialog opens or initial values change
  useEffect(() => {
    if (isOpen) {
      initializeFields();
    }
  }, [isOpen, initialPercentages, initialAvgSaleAmount, initializeFields]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  // Calculate the dollar amount represented by a percentage of `reportedSales`.
  const calcAmount = (pct: string) =>
    ((reportedSales || 0) * (parseFloat(pct || '0') || 0)) / 100;
  const amounts = useMemo(
    () => ({
      handmade: calcAmount(pctHandmade),
      agricultural: calcAmount(pctAgricultural),
      prepared: calcAmount(pctPreparedFood),
      cottage: calcAmount(pctCottageGoods),
      manufactured: calcAmount(pctManufactured),
    }),
    [reportedSales, pctHandmade, pctAgricultural, pctPreparedFood, pctCottageGoods, pctManufactured]
  );
  const totalPct =
    (parseFloat(pctHandmade || '0') || 0) +
    (parseFloat(pctAgricultural || '0') || 0) +
    (parseFloat(pctPreparedFood || '0') || 0) +
    (parseFloat(pctCottageGoods || '0') || 0) +
    (parseFloat(pctManufactured || '0') || 0);
  const totalDiff = Math.abs(totalPct - 100);
  const isOverTotal = totalPct > 100;
  const isTotalValid = totalDiff < 0.01;

  // Convert the edited percentage strings to numbers and pass back to caller.
  // The parent code is responsible for rounding/storing these values.
  const handleApply = () => {
    onApply({
      pctHandmade: parseFloat(pctHandmade || "0"),
      pctAgricultural: parseFloat(pctAgricultural || "0"),
      pctPreparedFood: parseFloat(pctPreparedFood || "0"),
      pctCottageGoods: parseFloat(pctCottageGoods || "0"),
      pctManufactured: parseFloat(pctManufactured || "0"),
      avgSaleAmount: parseFloat(avgSaleAmount || "0"),
    });
    onOpenChange(false);
  };

  // Dialog expects a vendor with `defaults` loaded. If not available, render nothing.
  // `VendorDefaults` values are strings (from the API); the dialog converts these
  // to numeric strings for editing and then to numbers when applying.
  if (!vendor || !defaults) return null;

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl duration-200 sm:rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-dashboard-primary">
              <Sparkles size={20} />
              <DialogPrimitive.Title className="text-lg font-bold text-slate-900 dark:text-white">
                Vendor Good Type Percentages
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Description className="sr-only">
              Apply vendor good type percentages for this vendor.
            </DialogPrimitive.Description>
            <DialogPrimitive.Close asChild>
              <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400" type="button">
                <X size={18} />
              </button>
            </DialogPrimitive.Close>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendor</p>
              <p className="text-base font-bold text-slate-900 dark:text-white">{vendor.vendorName}</p>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="min-w-[130px] text-slate-600 dark:text-slate-400">Handmade</span>
                <div className="flex items-center gap-3">
                  <div className="flex w-[90px] items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-1">
                  <input
                    type="number"
                    step="1.0"
                    min="0"
                    className="w-full bg-transparent text-right text-slate-900 dark:text-white outline-none text-sm"
                    value={pctHandmade}
                    onChange={(event) => setPctHandmade(event.target.value)}
                  />
                    <span className="ml-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">%</span>
                  </div>
                  <span className="w-[90px] text-right font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(amounts.handmade)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="min-w-[130px] text-slate-600 dark:text-slate-400">Agricultural</span>
                <div className="flex items-center gap-3">
                  <div className="flex w-[90px] items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-1">
                  <input
                    type="number"
                    step="1.0"
                    min="0"
                    className="w-full bg-transparent text-right text-slate-900 dark:text-white outline-none text-sm"
                    value={pctAgricultural}
                    onChange={(event) => setPctAgricultural(event.target.value)}
                  />
                    <span className="ml-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">%</span>
                  </div>
                  <span className="w-[90px] text-right font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(amounts.agricultural)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="min-w-[130px] text-slate-600 dark:text-slate-400">Prepared Food</span>
                <div className="flex items-center gap-3">
                  <div className="flex w-[90px] items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-1">
                  <input
                    type="number"
                    step="1.0"
                    min="0"
                    className="w-full bg-transparent text-right text-slate-900 dark:text-white outline-none text-sm"
                    value={pctPreparedFood}
                    onChange={(event) => setPctPreparedFood(event.target.value)}
                  />
                    <span className="ml-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">%</span>
                  </div>
                  <span className="w-[90px] text-right font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(amounts.prepared)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="min-w-[130px] text-slate-600 dark:text-slate-400">Cottage Goods</span>
                <div className="flex items-center gap-3">
                  <div className="flex w-[90px] items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-1">
                  <input
                    type="number"
                    step="1.0"
                    min="0"
                    className="w-full bg-transparent text-right text-slate-900 dark:text-white outline-none text-sm"
                    value={pctCottageGoods}
                    onChange={(event) => setPctCottageGoods(event.target.value)}
                  />
                    <span className="ml-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">%</span>
                  </div>
                  <span className="w-[90px] text-right font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(amounts.cottage)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="min-w-[130px] text-slate-600 dark:text-slate-400">Manufactured</span>
                <div className="flex items-center gap-3">
                  <div className="flex w-[90px] items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-1">
                  <input
                    type="number"
                    step="1.0"
                    min="0"
                    className="w-full bg-transparent text-right text-slate-900 dark:text-white outline-none text-sm"
                    value={pctManufactured}
                    onChange={(event) => setPctManufactured(event.target.value)}
                  />
                    <span className="ml-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">%</span>
                  </div>
                  <span className="w-[90px] text-right font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(amounts.manufactured)}
                  </span>
                </div>
              </div>
              <div className="flex items-end justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Total</span>
                <span className={isOverTotal ? 'text-red-500' : 'text-slate-900 dark:text-white'}>
                  {totalPct.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Average Sale Amount</p>
                <div className="flex items-center gap-3">
                  <div className="flex w-[140px] items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1">
                    <span className="text-sm text-slate-500 dark:text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full bg-transparent text-right text-slate-900 dark:text-white outline-none text-sm"
                      value={avgSaleAmount}
                      onChange={(event) => setAvgSaleAmount(event.target.value)}
                    />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Est. transactions:{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {(() => {
                        const parsed = parseFloat(avgSaleAmount || '0');
                        return parsed > 0 ? Math.round((reportedSales || 0) / parsed) : 0;
                      })()}
                    </strong>
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Overrides the vendor default for this transaction only.
                </p>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Calculator size={16} />
                <span className="text-sm font-semibold">Autopopulate Logic</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                This will apply the percentages above to the <strong>${reportedSales.toFixed(2)}</strong> reported sales to calculate estimated product breakdowns for this transaction.
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApply}
              className="flex items-center gap-2"
              disabled={!isTotalValid}
              title={isTotalValid ? 'Apply Percentages' : 'Percentages must total 100%'}
            >
              <Check size={18} />
              Apply Percentages
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
