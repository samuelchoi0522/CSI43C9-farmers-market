"use client";

import React, { useState, useMemo } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, Sparkles, Calculator, Check } from 'lucide-react';
import Button from './Button';
import { Vendor } from '@/lib/api/vendor';
import { cn } from '@/lib/utils';

interface VendorDefaultsDialogProps {
    vendor: Vendor | undefined;
    reportedSales: number;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onApply: (data: {
        pctHandmade: number;
        pctAgricultural: number;
        pctPreparedFood: number;
        pctCottageGoods: number;
        pctManufactured: number;
        avgSaleAmount: number;
    }) => void;
}

export function VendorDefaultsDialog({ vendor, reportedSales, isOpen, onOpenChange, onApply }: VendorDefaultsDialogProps) {
    if (!vendor || !vendor.defaults) return null;

    const defaults = vendor.defaults;

    const calculations = useMemo(() => {
        const sales = reportedSales || 0;
        const avgSale = parseFloat(defaults.avgSaleAmount || "0");
        return {
            handmade: (sales * parseFloat(defaults.pctHandmade || "0")) / 100,
            agricultural: (sales * parseFloat(defaults.pctAgricultural || "0")) / 100,
            prepared: (sales * parseFloat(defaults.pctPreparedFood || "0")) / 100,
            cottage: (sales * parseFloat(defaults.pctCottageGoods || "0")) / 100,
            manufactured: (sales * parseFloat(defaults.pctManufactured || "0")) / 100,
            estimatedTransactions: avgSale > 0 ? Math.round(sales / avgSale) : 0
        };
    }, [reportedSales, defaults]);

    const handleApply = () => {
        onApply({
            pctHandmade: parseFloat(defaults.pctHandmade || "0"),
            pctAgricultural: parseFloat(defaults.pctAgricultural || "0"),
            pctPreparedFood: parseFloat(defaults.pctPreparedFood || "0"),
            pctCottageGoods: parseFloat(defaults.pctCottageGoods || "0"),
            pctManufactured: parseFloat(defaults.pctManufactured || "0"),
            avgSaleAmount: parseFloat(defaults.avgSaleAmount || "0"),
        });
        onOpenChange(false);
    };

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" />
                <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl duration-200 sm:rounded-2xl overflow-hidden flex flex-col">
                    
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2 text-dashboard-primary">
                            <Sparkles size={20} />
                            <DialogPrimitive.Title className="text-lg font-bold text-slate-900 dark:text-white">
                                Vendor Defaults
                            </DialogPrimitive.Title>
                        </div>
                        <DialogPrimitive.Description className="sr-only">
                            Apply default product category percentages for this vendor.
                        </DialogPrimitive.Description>
                        <DialogPrimitive.Close asChild>
                            <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400">
                                <X size={18} />
                            </button>
                        </DialogPrimitive.Close>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendor</p>
                            <p className="text-base font-bold text-slate-900 dark:text-white">{vendor.vendorName}</p>
                        </div>

                        <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Handmade</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{defaults.pctHandmade}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Agricultural</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{defaults.pctAgricultural}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Prepared Food</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{defaults.pctPreparedFood}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Cottage Goods</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{defaults.pctCottageGoods}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Manufactured</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{defaults.pctManufactured}%</span>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
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
                        <Button 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handleApply}
                            className="flex items-center gap-2"
                        >
                            <Check size={18} />
                            Apply Defaults
                        </Button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
