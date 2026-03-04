"use client";

import React, { useState, useEffect, useMemo } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, Save, AlertCircle } from 'lucide-react';
import Button from './Button';
import { Vendor, updateVendor, deleteVendor } from '@/lib/api/vendor';
import { VendorDefaults, updateVendorDefaults, createVendorDefaults, getVendorDefaultsByVendorId } from '@/lib/api/defaults';
import { cn } from '@/lib/utils';

interface EditVendorDialogProps {
    vendor: Vendor;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface VendorFormData {
    vendorName: string;
    pointPerson: string;
    email: string;
    location: string;
    miles: string;
    products: string;
    isActive: boolean;
    isFarmer: boolean;
    isProduce: boolean;
    womanOwned: boolean;
    bipocOwned: boolean;
    veteranOwned: boolean;
    pctHandmade: string;
    pctAgricultural: string;
    pctPreparedFood: string;
    pctCottageGoods: string;
    pctManufactured: string;
}

export function EditVendorDialog({ vendor, isOpen, onOpenChange, onSuccess }: EditVendorDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [existingDefaults, setExistingDefaults] = useState<VendorDefaults | null>(null);
    const [loadingDefaults, setLoadingDefaults] = useState(false);

    const [formData, setFormData] = useState<VendorFormData>({
        vendorName: vendor.vendorName || "",
        pointPerson: vendor.pointPerson || "",
        email: vendor.email || "",
        location: vendor.location || "",
        miles: vendor.miles?.toString() || "0",
        products: vendor.products || "",
        isActive: vendor.isActive ?? true,
        isFarmer: vendor.isFarmer ?? false,
        isProduce: vendor.isProduce ?? false,
        womanOwned: vendor.womanOwned ?? false,
        bipocOwned: vendor.bipocOwned ?? false,
        veteranOwned: vendor.veteranOwned ?? false,
        pctHandmade: "0",
        pctAgricultural: "0",
        pctPreparedFood: "0",
        pctCottageGoods: "0",
        pctManufactured: "0",
    });

    useEffect(() => {
        if (isOpen && vendor.id) {
            const fetchDefaults = async () => {
                setLoadingDefaults(true);
                try {
                    const defaults = await getVendorDefaultsByVendorId(vendor.id);
                    if (defaults) {
                        setExistingDefaults(defaults);
                        setFormData(prev => ({
                            ...prev,
                            pctHandmade: defaults.pctHandmade || "0",
                            pctAgricultural: defaults.pctAgricultural || "0",
                            pctPreparedFood: defaults.pctPreparedFood || "0",
                            pctCottageGoods: defaults.pctCottageGoods || "0",
                            pctManufactured: defaults.pctManufactured || "0",
                        }));
                    }
                } catch (error) {
                    console.error("Error fetching vendor defaults:", error);
                } finally {
                    setLoadingDefaults(false);
                }
            };
            fetchDefaults();
        }
    }, [isOpen, vendor.id]);

    const hasNonZeroPercentage = useMemo(() => {
        return [
            formData.pctHandmade,
            formData.pctAgricultural,
            formData.pctPreparedFood,
            formData.pctCottageGoods,
            formData.pctManufactured,
        ].some(pct => parseFloat(pct) !== 0);
    }, [formData]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleToggle = (name: keyof VendorFormData) => {
        setFormData((prev) => ({
            ...prev,
            [name]: !prev[name],
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.vendorName.trim()) {
            newErrors.vendorName = "Vendor name is required";
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (formData.miles && (isNaN(Number(formData.miles)) || Number(formData.miles) < 0)) {
            newErrors.miles = "Miles must be a valid positive number";
        }

        const percentageFieldKeys = [
            'pctHandmade', 'pctAgricultural', 'pctPreparedFood',
            'pctCottageGoods', 'pctManufactured'
        ] as const;
        
        let sumPercentages = 0;

        percentageFieldKeys.forEach(key => {
            const value = parseFloat(formData[key] || "0");
            if (isNaN(value) || value < 0 || value > 100) {
                newErrors[key] = "Must be between 0 and 100";
            } else {
                sumPercentages += value;
            }
        });

        sumPercentages = Math.round(sumPercentages * 100) / 100;

        if (Object.keys(newErrors).length === 0) {
            if (hasNonZeroPercentage && sumPercentages !== 100) {
                newErrors.percentageSum = `Sum must be exactly 100. Current: ${sumPercentages}%`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const milesNumber = formData.miles ? parseInt(formData.miles, 10) : undefined;

            await updateVendor(vendor.id, {
                vendorName: formData.vendorName,
                pointPerson: formData.pointPerson || undefined,
                email: formData.email || undefined,
                location: formData.location || undefined,
                miles: milesNumber,
                products: formData.products || undefined,
                isFarmer: formData.isFarmer,
                isProduce: formData.isProduce,
                isActive: formData.isActive,
                womanOwned: formData.womanOwned,
                bipocOwned: formData.bipocOwned,
                veteranOwned: formData.veteranOwned,
            });

            if (hasNonZeroPercentage) {
                const defaultsPayload = {
                    vendorId: vendor.id,
                    pctHandmade: formData.pctHandmade,
                    pctAgricultural: formData.pctAgricultural,
                    pctPreparedFood: formData.pctPreparedFood,
                    pctCottageGoods: formData.pctCottageGoods,
                    pctManufactured: formData.pctManufactured,
                };

                if (existingDefaults) {
                    await updateVendorDefaults(existingDefaults.id, defaultsPayload);
                } else {
                    await createVendorDefaults(defaultsPayload);
                }
            } else if (existingDefaults) {
                // If they cleared all percentages but defaults existed before, 
                // we might want to delete them or just leave them. 
                // For now, let's keep the existing ones if they are zeroed out in form but not submitted.
                // Or better, let's update them to zero if the backend allows (though sum check might fail).
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating vendor:", error);
            setErrors({ submit: "Failed to update vendor. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeactivate = async () => {
        if (!vendor.id) return;
        
        const confirmed = window.confirm(`Are you sure you want to deactivate ${vendor.vendorName}? This will hide them from default active lists.`);
        if (!confirmed) return;

        setIsSubmitting(true);
        try {
            await deleteVendor(vendor.id);
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error deactivating vendor:", error);
            setErrors({ submit: "Failed to deactivate vendor. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleActivate = async () => {
        if (!vendor.id) return;
        
        const confirmed = window.confirm(`Are you sure you want to reactivate ${vendor.vendorName}?`);
        if (!confirmed) return;

        setIsSubmitting(true);
        try {
            const milesNumber = formData.miles ? parseInt(formData.miles, 10) : undefined;
            await updateVendor(vendor.id, {
                vendorName: formData.vendorName,
                pointPerson: formData.pointPerson || undefined,
                email: formData.email || undefined,
                location: formData.location || undefined,
                miles: milesNumber,
                products: formData.products || undefined,
                isFarmer: formData.isFarmer,
                isProduce: formData.isProduce,
                isActive: true,
                womanOwned: formData.womanOwned,
                bipocOwned: formData.bipocOwned,
                veteranOwned: formData.veteranOwned,
            });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error activating vendor:", error);
            setErrors({ submit: "Failed to activate vendor. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const percentageFields = [
        { key: 'pctHandmade', label: 'Handmade (%)' },
        { key: 'pctAgricultural', label: 'Agricultural (%)' },
        { key: 'pctPreparedFood', label: 'Prepared Food (%)' },
        { key: 'pctCottageGoods', label: 'Cottage Goods (%)' },
        { key: 'pctManufactured', label: 'Manufactured (%)' },
    ] as const;

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-300" />
                <DialogPrimitive.Content 
                    className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl duration-200 sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    onPointerDownOutside={(e) => {
                        if ((e.target as HTMLElement).closest('.dark-mode-toggle')) {
                            e.preventDefault();
                        }
                    }}
                >
                    
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 shrink-0">
                        <div>
                            <DialogPrimitive.Title className="text-xl font-bold text-slate-900 dark:text-white">
                                Edit Vendor
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Description className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Update information for {vendor.vendorName}
                            </DialogPrimitive.Description>
                        </div>
                        <DialogPrimitive.Close asChild>
                            <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400">
                                <X size={20} />
                            </button>
                        </DialogPrimitive.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Basic Info Section */}
                        <section className="space-y-4">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-dashboard-primary flex items-center gap-2">
                                <span className="material-icons text-lg">info</span>
                                Basic Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="vendorName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Vendor Name *
                                    </label>
                                    <input
                                        id="vendorName"
                                        name="vendorName"
                                        value={formData.vendorName}
                                        onChange={handleInputChange}
                                        className={cn(
                                            "w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-dashboard-primary outline-none transition-all text-slate-900 dark:text-white",
                                            errors.vendorName ? "border-red-500" : "border-slate-200 dark:border-slate-700"
                                        )}
                                    />
                                    {errors.vendorName && <p className="text-xs text-red-500">{errors.vendorName}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="pointPerson" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Point Person
                                    </label>
                                    <input
                                        id="pointPerson"
                                        name="pointPerson"
                                        value={formData.pointPerson}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-dashboard-primary outline-none transition-all text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={cn(
                                            "w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-dashboard-primary outline-none transition-all text-slate-900 dark:text-white",
                                            errors.email ? "border-red-500" : "border-slate-200 dark:border-slate-700"
                                        )}
                                    />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="miles" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Miles from Market
                                    </label>
                                    <input
                                        type="number"
                                        id="miles"
                                        name="miles"
                                        value={formData.miles}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-dashboard-primary outline-none transition-all text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label htmlFor="location" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Location
                                    </label>
                                    <input
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-dashboard-primary outline-none transition-all text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label htmlFor="products" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Products
                                    </label>
                                    <textarea
                                        id="products"
                                        name="products"
                                        value={formData.products}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-dashboard-primary outline-none transition-all resize-none text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Classifications Section */}
                        <section className="space-y-4">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-dashboard-primary flex items-center gap-2">
                                <span className="material-icons text-lg">category</span>
                                Vendor Classifications
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                                {[
                                    { key: 'isFarmer', label: 'Is Farmer' },
                                    { key: 'isProduce', label: 'Is Produce' },
                                    { key: 'womanOwned', label: 'Woman Owned' },
                                    { key: 'bipocOwned', label: 'BIPOC Owned' },
                                    { key: 'veteranOwned', label: 'Veteran Owned' },
                                ].map(({ key, label }) => (
                                    <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleToggle(key as keyof VendorFormData)}
                                            className={cn(
                                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:ring-offset-2",
                                                formData[key as keyof VendorFormData] ? "bg-dashboard-primary" : "bg-slate-300 dark:bg-slate-600"
                                            )}
                                        >
                                            <span className={cn(
                                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                                formData[key as keyof VendorFormData] ? "translate-x-6" : "translate-x-1"
                                            )} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Percentages Section */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-dashboard-primary flex items-center gap-2">
                                    <span className="material-icons text-lg">pie_chart</span>
                                    Product Defaults
                                </h4>
                                {loadingDefaults && <span className="text-xs animate-pulse text-slate-400">Loading...</span>}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Percentages must sum to 100% or all be 0% to skip.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {percentageFields.map(({ key, label }) => (
                                    <div key={key} className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</label>
                                        <input
                                            type="number"
                                            name={key}
                                            value={formData[key]}
                                            onChange={handleInputChange}
                                            className={cn(
                                                "w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-dashboard-primary outline-none transition-all text-sm text-slate-900 dark:text-white",
                                                errors[key] ? "border-red-500" : "border-slate-200 dark:border-slate-700"
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>
                            {errors.percentageSum && (
                                <div className="flex items-center gap-2 text-red-500 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <AlertCircle size={16} />
                                    <p className="text-xs font-medium">{errors.percentageSum}</p>
                                </div>
                            )}
                        </section>

                        {errors.submit && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle size={18} />
                                {errors.submit}
                            </div>
                        )}
                    </form>

                    <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
                        {formData.isActive ? (
                            <Button 
                                variant="ghost" 
                                onClick={handleDeactivate}
                                disabled={isSubmitting}
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                                <span className="material-icons text-lg">block</span>
                                Deactivate Vendor
                            </Button>
                        ) : (
                            <Button 
                                variant="ghost" 
                                onClick={handleActivate}
                                disabled={isSubmitting}
                                className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2"
                            >
                                <span className="material-icons text-lg">check_circle</span>
                                Activate Vendor
                            </Button>
                        )}
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={handleSubmit}
                                disabled={isSubmitting || loadingDefaults}
                                className="flex items-center gap-2 min-w-30 justify-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="material-icons animate-spin text-lg">sync</span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
