"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import SidebarNavigation from "../../components/SidebarNavigation";
import Button from "../../components/Button";
import LabelPickerDialog from "../../components/LabelPickerDialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { createVendor, createVendorDefaults } from "@/lib/api";
import {
    CategoryLabel,
    createCategoryLabel,
    getAllCategoryLabels,
    addLabelsToVendor,
    updateCategoryLabel,
    deleteCategoryLabel,
} from "@/lib/api/vendorLabels";
import { getLabelColors } from "@/lib/labelColors";

interface VendorFormData {
    vendorName: string;
    pointPerson: string;
    email: string;
    location: string;
    miles: string;
    products: string;
    productDetails: string;
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

function AddVendorContent() {
    const router = useRouter();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    const [showOverview, setShowOverview] = useState(false);
    const { user, logout } = useAuth();
    const userName = user?.username || "Admin User";
    const animationFrameRef = useRef<number | null>(null);

    const [allLabels, setAllLabels] = useState<CategoryLabel[]>([]);
    const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
    const [labelsLoading, setLabelsLoading] = useState(false);
    const [labelError, setLabelError] = useState<string | null>(null);
    const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);

    const [formData, setFormData] = useState<VendorFormData>({
        vendorName: "",
        pointPerson: "",
        email: "",
        location: "",
        miles: "0",
        products: "",
        productDetails: "",
        isActive: true,
        isFarmer: false,
        isProduce: false,
        womanOwned: false,
        bipocOwned: false,
        veteranOwned: false,
        pctHandmade: "0",
        pctAgricultural: "0",
        pctPreparedFood: "0",
        pctCottageGoods: "0",
        pctManufactured: "0",
    });

    const normalizeLabelName = (name: string) => name.trim().toLowerCase();

    const hasNonZeroPercentage = useMemo(() => {
        return [
            formData.pctHandmade,
            formData.pctAgricultural,
            formData.pctPreparedFood,
            formData.pctCottageGoods,
            formData.pctManufactured,
        ].some(pct => parseFloat(pct) !== 0);
    }, [formData]);

    // Calculate profile completion percentage
    const profileCompletion = useMemo(() => {
        let completed = 0;
        let total = 0;

        // Basic Info (5 fields)
        // Vendor Name is required, so it counts double
        total += 6; // 2 for vendorName, 1 each for others
        if (formData.vendorName.trim()) completed += 2; // Required field counts double
        if (formData.pointPerson.trim()) completed++;
        if (formData.email.trim()) completed++;
        if (formData.location.trim()) completed++;
        if (formData.miles.trim() && formData.miles !== "0") completed++;

        // Products (2 fields)
        total += 2;
        if (formData.products.trim()) completed++;
        if (formData.productDetails.trim()) completed++;

        // Classifications (5 fields, treated as booleans)
        total += 5;
        if (formData.isFarmer) completed++;
        if (formData.isProduce) completed++;
        if (formData.womanOwned) completed++;
        if (formData.bipocOwned) completed++;
        if (formData.veteranOwned) completed++;

        // Vendor Defaults (5 fields, plus a total check)
        if (hasNonZeroPercentage) {
            total += 6; // 1 for each field + 1 for the sum validation
            const percentageFieldKeys = [
                'pctHandmade', 'pctAgricultural', 'pctPreparedFood',
                'pctCottageGoods', 'pctManufactured'
            ];
            let sumPercentages = 0;
            let allPercentagesValid = true;

            percentageFieldKeys.forEach(field => {
                const value = parseFloat(formData[field as keyof VendorFormData] as string);
                if (!isNaN(value) && value >= 0 && value <= 100) {
                    completed++;
                    sumPercentages += value;
                } else {
                    allPercentagesValid = false;
                }
            });

            // Round to 2 decimal places to avoid floating point precision issues
            sumPercentages = Math.round(sumPercentages * 100) / 100;

            if (allPercentagesValid && sumPercentages === 100) {
                completed++; // +1 for the valid sum
            }
        }

        // Calculate percentage, ensuring it doesn't exceed 100%
        const percentage = Math.round((completed / total) * 100);
        return Math.min(percentage, 100);
    }, [formData, hasNonZeroPercentage]);

    // Animate percentage counter
    useEffect(() => {
        const duration = 800; // Animation duration in ms
        const startValue = animatedPercentage;
        const endValue = profileCompletion;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            
            const currentValue = Math.round(startValue + (endValue - startValue) * easeOutCubic);
            setAnimatedPercentage(currentValue);

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        if (startValue !== endValue) {
            animationFrameRef.current = requestAnimationFrame(animate);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [profileCompletion, animatedPercentage]);

    useEffect(() => {
        const fetchLabels = async () => {
            setLabelsLoading(true);
            setLabelError(null);
            try {
                const labels = await getAllCategoryLabels();
                setAllLabels(labels);
            } catch (err) {
                console.error("Error loading labels:", err);
                setLabelError("Failed to load labels.");
            } finally {
                setLabelsLoading(false);
            }
        };

        fetchLabels();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showUserMenu && !target.closest('.user-menu-container')) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        // Clear error for this field when user starts typing
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

    const formatText = (command: string) => {
        const textarea = document.getElementById('productDetails') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = formData.productDetails.substring(start, end);
        let formattedText = '';

        switch (command) {
            case 'bold':
                formattedText = `**${selectedText || 'bold text'}**`;
                break;
            case 'italic':
                formattedText = `*${selectedText || 'italic text'}*`;
                break;
            case 'list':
                formattedText = selectedText ? selectedText.split('\n').map(line => `- ${line}`).join('\n') : '- ';
                break;
            case 'link':
                formattedText = `[${selectedText || 'link text'}](url)`;
                break;
            default:
                return;
        }

        const newText = formData.productDetails.substring(0, start) + formattedText + formData.productDetails.substring(end);
        setFormData((prev) => ({ ...prev, productDetails: newText }));
        
        // Restore focus and selection
        setTimeout(() => {
            textarea.focus();
            const newStart = start + formattedText.length;
            textarea.setSelectionRange(newStart, newStart);
        }, 0);
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
        ];
        let sumPercentages = 0;

        percentageFieldKeys.forEach(key => {
            const value = parseFloat(formData[key as keyof VendorFormData] as string);
            if (isNaN(value) || value < 0 || value > 100) {
                newErrors[key] = `${key.replace('pct', 'Percentage ')} must be a number between 0 and 100.`;
            } else {
                sumPercentages += value;
            }
        });

        // Round to 2 decimal places to avoid floating point precision issues
        sumPercentages = Math.round(sumPercentages * 100) / 100;

        if (Object.keys(newErrors).length === 0) {
            const hasNonZeroPercentage = percentageFieldKeys.some(key => parseFloat(formData[key as keyof VendorFormData] as string) !== 0);

            if (hasNonZeroPercentage && sumPercentages !== 100) {
                newErrors.percentageSum = `The sum of all percentages must be exactly 100. Current total: ${sumPercentages}.`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setShowOverview(true);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // Combine products and productDetails for the products field
            const productsText = [
                formData.products,
                formData.productDetails
            ].filter(Boolean).join('\n\n');

            // Convert miles from string to number
            const milesNumber = formData.miles && formData.miles !== "0" 
                ? parseInt(formData.miles, 10) 
                : undefined;

            const newVendor = await createVendor({
                vendorName: formData.vendorName,
                pointPerson: formData.pointPerson || undefined,
                email: formData.email || undefined,
                location: formData.location || undefined,
                miles: milesNumber,
                products: productsText || undefined,
                isFarmer: formData.isFarmer,
                isProduce: formData.isProduce,
                isActive: formData.isActive,
                womanOwned: formData.womanOwned,
                bipocOwned: formData.bipocOwned,
                veteranOwned: formData.veteranOwned,
            });

            if (!newVendor || !newVendor.id) {
                throw new Error("Invalid response from server when creating vendor");
            }

            // Only create vendor defaults if any percentage is non-zero
            if (hasNonZeroPercentage) {
                await createVendorDefaults({
                    vendorId: newVendor.id,
                    pctHandmade: formData.pctHandmade,
                    pctAgricultural: formData.pctAgricultural,
                    pctPreparedFood: formData.pctPreparedFood,
                    pctCottageGoods: formData.pctCottageGoods,
                    pctManufactured: formData.pctManufactured,
                });
            }

            if (selectedLabelIds.length > 0) {
                await addLabelsToVendor(newVendor.id, selectedLabelIds);
            }

            // Redirect to vendors list
            router.push("/vendors");
        } catch (error) {
            console.error("Error creating vendor:", error);
            setErrors({ submit: "Failed to create vendor. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    type PercentageKeys = 'pctHandmade' | 'pctAgricultural' | 'pctPreparedFood' | 'pctCottageGoods' | 'pctManufactured';
    interface PercentageField {
        key: PercentageKeys;
        label: string;
    }
    const percentageFields: PercentageField[] = [
        { key: 'pctHandmade', label: 'Handmade (%)' },
        { key: 'pctAgricultural', label: 'Agricultural (%)' },
        { key: 'pctPreparedFood', label: 'Prepared Food (%)' },
        { key: 'pctCottageGoods', label: 'Cottage Goods (%)' },
        { key: 'pctManufactured', label: 'Manufactured (%)' },
    ];

    return (
        <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen flex transition-colors duration-300">
            <SidebarNavigation activeItem="Vendors" />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 animate-slide-up">
                    <div>
                        <h2 className="text-2xl font-bold animate-fade-in">Add New Vendor</h2>
                        <p className="text-slate-700 dark:text-slate-400 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            Register a new vendor in the farmers market system
                        </p>
                    </div>
                    {/* User Menu */}
                    <div className="relative user-menu-container">
                        <Button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            variant="ghost"
                            className="flex items-center gap-2 px-3 cursor-pointer"
                        >
                            <div className="w-8 h-8 rounded-full bg-dashboard-primary flex items-center justify-center text-white text-sm font-semibold shrink-0 aspect-square">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <span
                                className="text-sm font-medium hidden md:block"
                                style={{ color: 'rgb(0, 0, 0)' }}
                            >
                                {userName}
                            </span>
                            <span className="material-icons text-lg leading-none text-slate-600 dark:text-slate-400">
                                {showUserMenu ? "expand_less" : "expand_more"}
                            </span>
                        </Button>
                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{userName}</p>
                                </div>
                                <Button
                                    onClick={handleLogout}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <span className="material-icons text-lg leading-none">logout</span>
                                    Log Out
                                </Button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Profile Completion Bar - Only show on form, not overview */}
                {!showOverview && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-lg font-bold">Profile Completion</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Complete all fields to finish vendor registration
                            </p>
                        </div>
                        <div className="text-right">
                            <p 
                                className="text-2xl font-bold text-dashboard-primary animate-percentage-change"
                                key={`percentage-${animatedPercentage}`}
                            >
                                {animatedPercentage}%
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Complete</p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden relative">
                        <div
                            className="bg-dashboard-primary h-full rounded-full transition-all duration-800 ease-out relative overflow-hidden"
                            style={{ width: `${animatedPercentage}%` }}
                        >
                            {/* Animated shimmer effect */}
                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </div>
                    </div>
                </div>
                )}

                {/* Overview or Form */}
                {showOverview ? (
                    /* Overview Section */
                    <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-6">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-lg">Review Vendor Information</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Please review the information before creating the vendor</p>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Basic Information Review */}
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Basic Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Vendor Name</p>
                                            <p className="text-sm font-medium">{formData.vendorName ? formData.vendorName : <span className="text-slate-400 italic">Not provided</span>}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Point Person</p>
                                            <p className="text-sm font-medium">{formData.pointPerson ? formData.pointPerson : <span className="text-slate-400 italic">Not provided</span>}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Email Address</p>
                                            <p className="text-sm font-medium">{formData.email ? formData.email : <span className="text-slate-400 italic">Not provided</span>}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Location</p>
                                            <p className="text-sm font-medium">{formData.location ? formData.location : <span className="text-slate-400 italic">Not provided</span>}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Miles from Market</p>
                                            <p className="text-sm font-medium">{formData.miles || "0"} mi</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Product Details Review */}
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Product Details</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Product Category</p>
                                            <p className="text-sm font-medium">{formData.products ? formData.products : <span className="text-slate-400 italic">Not provided</span>}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Product List</p>
                                            <div className="text-sm bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">
                                                {formData.productDetails ? formData.productDetails : <span className="text-slate-400 italic">Not provided</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Classifications Review */}
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Vendor Classifications</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {formData.isFarmer && (
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                                Farmer
                                            </span>
                                        )}
                                        {formData.isProduce && (
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                Produce Vendor
                                            </span>
                                        )}
                                        {formData.womanOwned && (
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400">
                                                Woman-Owned
                                            </span>
                                        )}
                                        {formData.bipocOwned && (
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                                                BIPOC-Owned
                                            </span>
                                        )}
                                        {formData.veteranOwned && (
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                                Veteran-Owned
                                            </span>
                                        )}
                                        {!formData.isFarmer && !formData.isProduce && !formData.womanOwned && !formData.bipocOwned && !formData.veteranOwned && (
                                            <span className="text-sm text-slate-400 italic">No classifications selected</span>
                                        )}
                                    </div>
                                </div>

                                {/* Vendor Defaults Review */}
                                {hasNonZeroPercentage && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Product Category Percentages</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {percentageFields.map(({ key, label }) => (
                                                <div key={key}>
                                                    <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">{label}</p>
                                                    <p className="text-sm font-medium">{formData[key] || "0"}%</p>
                                                </div>
                                            ))}
                                        </div>
                                        {errors.percentageSum && (
                                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                                <p className="text-sm text-red-600 dark:text-red-400">{errors.percentageSum}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* Error Message */}
                        {errors.submit && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
                            </div>
                        )}

                        {/* Overview Actions */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowOverview(false)}
                                disabled={isSubmitting}
                                className="flex items-center gap-2"
                            >
                                <span className="material-icons text-lg leading-none">arrow_back</span>
                                Back to Edit
                            </Button>
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push("/vendors")}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2"
                                >
                                    <span className="material-icons text-lg leading-none">close</span>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="material-icons text-lg leading-none animate-spin">refresh</span>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons text-lg leading-none">check</span>
                                            Create Vendor
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Form Section */
                    <form onSubmit={handleNextStep} className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="space-y-6">
                            {/* Basic Information */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                    <h3 className="font-bold text-lg">Basic Information</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label htmlFor="vendorName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Vendor Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="vendorName"
                                            name="vendorName"
                                            value={formData.vendorName}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-dashboard-primary focus:border-dashboard-primary outline-none transition-colors text-slate-900 dark:text-white ${
                                                errors.vendorName
                                                    ? "border-red-500 dark:border-red-500"
                                                    : "border-slate-200 dark:border-slate-700"
                                            }`}
                                            placeholder="e.g. Green Valley Orchards"
                                        />
                                        {errors.vendorName && (
                                            <p className="mt-1 text-sm text-red-500">{errors.vendorName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="pointPerson" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Point Person
                                        </label>
                                        <input
                                            type="text"
                                            id="pointPerson"
                                            name="pointPerson"
                                            value={formData.pointPerson}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-dashboard-primary focus:border-dashboard-primary outline-none transition-colors text-slate-900 dark:text-white"
                                            placeholder="Name of primary contact"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-dashboard-primary focus:border-dashboard-primary outline-none transition-colors text-slate-900 dark:text-white ${
                                                errors.email
                                                    ? "border-red-500 dark:border-red-500"
                                                    : "border-slate-200 dark:border-slate-700"
                                            }`}
                                            placeholder="contact@farm.com"
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="location" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            id="location"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-dashboard-primary focus:border-dashboard-primary outline-none transition-colors text-slate-900 dark:text-white"
                                            placeholder="e.g. Downtown Plaza, Main Street"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="miles" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Miles from Market
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                id="miles"
                                                name="miles"
                                                value={formData.miles}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.1"
                                                className={`w-full px-4 py-2 pr-12 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-dashboard-primary focus:border-dashboard-primary outline-none transition-colors text-slate-900 dark:text-white ${
                                                    errors.miles
                                                        ? "border-red-500 dark:border-red-500"
                                                        : "border-slate-200 dark:border-slate-700"
                                                }`}
                                                placeholder="0"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-sm">mi</span>
                                        </div>
                                        {errors.miles && (
                                            <p className="mt-1 text-sm text-red-500">{errors.miles}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Product Details */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                    <h3 className="font-bold text-lg">Product Details</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label htmlFor="products" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Product Category
                                        </label>
                                        <input
                                            type="text"
                                            id="products"
                                            name="products"
                                            value={formData.products}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-dashboard-primary focus:border-dashboard-primary outline-none transition-colors text-slate-900 dark:text-white"
                                            placeholder="e.g., Ready-to-Eat, Produce/Plant, Bakery Goods"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="productDetails" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            List of Products
                                        </label>
                                        {/* Formatting Toolbar */}
                                        <div className="flex items-center gap-2 mb-2 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-t-lg">
                                            <button
                                                type="button"
                                                onClick={() => formatText('bold')}
                                                className="p-1.5 hover:bg-dashboard-primary/10 dark:hover:bg-slate-700 rounded transition-colors"
                                                title="Bold"
                                            >
                                                <span className="material-icons text-sm leading-none">format_bold</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => formatText('italic')}
                                                className="p-1.5 hover:bg-dashboard-primary/10 dark:hover:bg-slate-700 rounded transition-colors"
                                                title="Italic"
                                            >
                                                <span className="material-icons text-sm leading-none">format_italic</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => formatText('list')}
                                                className="p-1.5 hover:bg-dashboard-primary/10 dark:hover:bg-slate-700 rounded transition-colors"
                                                title="Unordered List"
                                            >
                                                <span className="material-icons text-sm leading-none">format_list_bulleted</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => formatText('link')}
                                                className="p-1.5 hover:bg-dashboard-primary/10 dark:hover:bg-slate-700 rounded transition-colors"
                                                title="Link"
                                            >
                                                <span className="material-icons text-sm leading-none">link</span>
                                            </button>
                                        </div>
                                        <textarea
                                            id="productDetails"
                                            name="productDetails"
                                            value={formData.productDetails}
                                            onChange={handleInputChange}
                                            rows={6}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-t-0 rounded-b-lg focus:ring-2 focus:ring-dashboard-primary focus:border-dashboard-primary outline-none transition-colors resize-y text-slate-900 dark:text-white"
                                            placeholder="the items this vendor will be selling (e.g. Heirloom tomatoes, honey, organic)"
                                        />
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Providing a detailed list helps with market variety balancing.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Vendor Classifications */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                    <h3 className="font-bold text-lg">Vendor Classifications</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    {/* Toggle Switch Component */}
                                    {[
                                        { key: 'isFarmer', label: 'Is Farmer', description: 'Primary producer of raw goods' },
                                        { key: 'isProduce', label: 'Is Produce', description: 'Fruits, vegetables, or nuts' },
                                        { key: 'womanOwned', label: 'Woman Owned', description: 'At least 51% ownership' },
                                        { key: 'bipocOwned', label: 'BIPOC Owned', description: 'Minority enterprise status' },
                                        { key: 'veteranOwned', label: 'Veteran Owned', description: 'Owner served in armed forces' },
                                    ].map(({ key, label, description }) => (
                                        <div key={key} className="flex items-center justify-between py-2">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleToggle(key as keyof VendorFormData)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:ring-offset-2 ${
                                                    formData[key as keyof VendorFormData]
                                                        ? 'bg-dashboard-primary'
                                                        : 'bg-slate-300 dark:bg-slate-600'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        formData[key as keyof VendorFormData] ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Vendor Labels */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg">Vendor Labels</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                            Apply existing labels or create a new one for this vendor.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsLabelDialogOpen(true)}
                                        className="text-sm"
                                    >
                                        Manage Labels
                                    </Button>
                                </div>
                                <div className="p-6 space-y-4">
                                    {labelsLoading ? (
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Loading labels...
                                        </p>
                                    ) : labelError ? (
                                        <p className="text-sm text-red-500">
                                            {labelError}
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedLabelIds.length === 0 ? (
                                                <p className="text-sm text-slate-400 italic">
                                                    No labels applied.
                                                </p>
                                            ) : (
                                                selectedLabelIds
                                                    .map((id) => allLabels.find((label) => label.id === id))
                                                    .filter((label): label is CategoryLabel => !!label)
                                                    .map((label) => {
                                                        const colors = getLabelColors(label.name, label.color);
                                                        return (
                                                            <span
                                                                key={label.id}
                                                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border"
                                                                style={{
                                                                    backgroundColor: colors.backgroundColor,
                                                                    color: colors.color,
                                                                    borderColor: colors.borderColor,
                                                                }}
                                                            >
                                                                {label.name}
                                                            </span>
                                                        );
                                                    })
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Vendor Defaults Percentages */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                    <h3 className="font-bold text-lg">Product Category Percentages (Optional)</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        Define the percentage breakdown of products sold by this vendor. The total must equal 100%.
                                    </p>
                                </div>
                                <div className="p-6 space-y-4">
                                    {percentageFields.map(({ key, label }) => (
                                        <div key={key}>
                                            <label htmlFor={key} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                {label}
                                            </label>
                                            <input
                                                type="number"
                                                id={key}
                                                name={key}
                                                value={formData[key]}
                                                onChange={handleInputChange}
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                className={`w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-dashboard-primary focus:border-dashboard-primary outline-none transition-colors text-slate-900 dark:text-white ${
                                                    errors[key]
                                                        ? "border-red-500 dark:border-red-500"
                                                        : "border-slate-200 dark:border-slate-700"
                                                }`}
                                                placeholder="0.00"
                                            />
                                            {errors[key] && (
                                                <p className="mt-1 text-sm text-red-500">{errors[key]}</p>
                                            )}
                                        </div>
                                    ))}
                                    {errors.percentageSum && (
                                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                            <p className="text-sm text-red-600 dark:text-red-400">{errors.percentageSum}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                    </div>

                    {/* Error Message */}
                    {errors.submit && (
                        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/vendors")}
                            disabled={isSubmitting}
                            className="flex items-center gap-2"
                        >
                            <span className="material-icons text-lg leading-none">close</span>
                            Cancel & Exit
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting}
                            className="flex items-center gap-2"
                        >
                            Next Step
                            <span className="material-icons text-lg leading-none">arrow_forward</span>
                        </Button>
                    </div>
                </form>
                )}
            </main>

            <LabelPickerDialog
                isOpen={isLabelDialogOpen}
                onOpenChange={setIsLabelDialogOpen}
                title="Labels"
                description="Select labels for this vendor"
                labels={allLabels}
                checkedIds={selectedLabelIds}
                loading={labelsLoading}
                error={labelError}
                onToggle={(label, nextChecked) => {
                    setSelectedLabelIds((prev) =>
                        nextChecked
                            ? prev.includes(label.id)
                                ? prev
                                : [...prev, label.id]
                            : prev.filter((id) => id !== label.id),
                    );
                    setLabelError(null);
                }}
                            onCreate={async (name, color) => {
                                const trimmed = name.trim();
                                if (!trimmed) return;

                    const existing = allLabels.find(
                        (label) =>
                            normalizeLabelName(label.name) === normalizeLabelName(trimmed),
                    );
                    if (existing) {
                        const selectedNames = selectedLabelIds
                            .map((id) => allLabels.find((label) => label.id === id))
                            .filter((label): label is CategoryLabel => !!label)
                            .map((label) => normalizeLabelName(label.name));

                        if (selectedNames.includes(normalizeLabelName(existing.name))) {
                            setLabelError("A label with that name already exists.");
                            return;
                        }

                        setSelectedLabelIds((prev) =>
                            prev.includes(existing.id) ? prev : [...prev, existing.id],
                        );
                        setLabelError(null);
                        return;
                    }

                                const created = await createCategoryLabel(trimmed, color);
                                const normalized = color ? { ...created, color } : created;
                                setAllLabels((prev) => [...prev, normalized]);
                                setSelectedLabelIds((prev) =>
                                    prev.includes(created.id) ? prev : [...prev, created.id],
                                );
                                setLabelError(null);
                            }}
                            onEdit={async (label, name, color) => {
                                const trimmed = name.trim();
                                if (!trimmed) return;
                                const updated = await updateCategoryLabel(label.id, trimmed, color);
                                const normalized = color ? { ...updated, color } : updated;
                                setAllLabels((prev) =>
                                    prev.map((item) => (item.id === normalized.id ? normalized : item)),
                                );
                            }}
                            onDelete={async (label) => {
                                await deleteCategoryLabel(label.id);
                                setAllLabels((prev) => prev.filter((item) => item.id !== label.id));
                                setSelectedLabelIds((prev) =>
                                    prev.filter((id) => id !== label.id),
                                );
                            }}
                        />
        </div>
    );
}

export default function AddVendorPage() {
    return (
        <ProtectedRoute>
            <AddVendorContent />
        </ProtectedRoute>
    );
}
