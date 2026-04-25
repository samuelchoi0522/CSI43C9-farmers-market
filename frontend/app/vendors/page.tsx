"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import SidebarNavigation from "../components/SidebarNavigation";
import Button from "../components/Button";
import { getAllVendorDefaults, VendorDefaults } from "@/lib/api/defaults";
import { getVendors, Vendor } from "@/lib/api/vendor";
import { EditVendorDialog } from "../components/EditVendorDialog";
import { cn } from "@/lib/utils";
import { SmoothIntegerValue } from "@/lib/smoothNumbers";
import { fetchAllDefaultsFromApi, fetchAllVendorsFromApi } from "@/lib/vendorDirectoryFetch";

interface VendorWithDefaults extends Vendor {
    defaults?: VendorDefaults;
}

function VendorsContent() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [vendors, setVendors] = useState<VendorWithDefaults[]>([]);
    const [allVendors, setAllVendors] = useState<VendorWithDefaults[]>([]); // All vendors for stats calculation
    const [vendorDefaults, setVendorDefaults] = useState<VendorDefaults[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // Edit Dialog state
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [vendorsResponse, defaultsResponse] = await Promise.all([
                getVendors(currentPage, pageSize, showInactive),
                getAllVendorDefaults(0, 100)
            ]);

            // Handle case where response might be an array directly or PagedResponse
            let vendorsList: Vendor[] = [];
            if (Array.isArray(vendorsResponse)) {
                vendorsList = vendorsResponse;
            } else if (vendorsResponse.data && Array.isArray(vendorsResponse.data)) {
                vendorsList = vendorsResponse.data;
                if (vendorsResponse.totalPages !== undefined) {
                    setTotalPages(vendorsResponse.totalPages);
                }
                if (vendorsResponse.totalElements !== undefined) {
                    setTotalElements(vendorsResponse.totalElements);
                }
            }

            // Handle defaults response
            let defaultsList: VendorDefaults[] = [];
            if (defaultsResponse) {
                if (Array.isArray(defaultsResponse)) {
                    defaultsList = defaultsResponse;
                } else if (defaultsResponse.data && Array.isArray(defaultsResponse.data)) {
                    defaultsList = defaultsResponse.data;
                }
            }

            setVendorDefaults(defaultsList);

            // Map vendor defaults to vendors
            const vendorsWithDefaults = vendorsList.map(vendor => {
                const defaults = defaultsList.find(d => d.vendorId === vendor.id);
                return { ...vendor, defaults };
            });
            
            setVendors(vendorsWithDefaults);
        } catch (error) {
            console.error('Error fetching vendor data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllVendors = async () => {
        try {
            const [allVendorsList, defaultsList] = await Promise.all([
                fetchAllVendorsFromApi(true), // Always fetch all for stats
                fetchAllDefaultsFromApi(),
            ]);

            const allVendorsWithDefaults = allVendorsList.map((vendor) => {
                const defaults = defaultsList.find((d) => d.vendorId === vendor.id);
                return { ...vendor, defaults };
            });

            setAllVendors(allVendorsWithDefaults);
        } catch (error) {
            console.error("Error fetching all vendors for stats:", error);
        }
    };
    // Fetch all vendors for stats calculation once on mount
    useEffect(() => {
        fetchAllVendors();
    }, []);

    // Fetch vendors and vendor defaults for current page
    useEffect(() => {
        fetchData();
    }, [currentPage, pageSize, showInactive]);

    const handleEditClick = (e: React.MouseEvent, vendor: Vendor) => {
        e.stopPropagation();
        setEditingVendor(vendor);
        setIsEditDialogOpen(true);
    };

    const handleEditSuccess = () => {
        fetchData();
        void fetchAllVendors();
    };

    // Reset paging when the search text changes (server mode or client search pages).
    useEffect(() => {
        setCurrentPage(0);
    }, [searchQuery]);

    // Search runs against the full vendor list; the table uses server paging when not searching.
    const filteredVendors = useMemo(() => {
        if (searchQuery.trim() === "") {
            return vendors;
        }
        const query = searchQuery.toLowerCase();
        return allVendors.filter(
            (vendor) =>
                vendor.vendorName?.toLowerCase().includes(query) ||
                vendor.pointPerson?.toLowerCase().includes(query) ||
                vendor.email?.toLowerCase().includes(query) ||
                vendor.location?.toLowerCase().includes(query) ||
                vendor.products?.toLowerCase().includes(query),
        );
    }, [searchQuery, vendors, allVendors]);

    const displayedVendors = useMemo(() => {
        if (searchQuery.trim() === "") {
            return filteredVendors;
        }
        const start = currentPage * pageSize;
        return filteredVendors.slice(start, start + pageSize);
    }, [searchQuery, filteredVendors, currentPage, pageSize]);

    const effectiveTotalPages = useMemo(() => {
        if (searchQuery.trim() === "") {
            return totalPages;
        }
        return Math.max(1, Math.ceil(filteredVendors.length / pageSize));
    }, [searchQuery, totalPages, filteredVendors.length, pageSize]);

    useEffect(() => {
        if (searchQuery.trim() === "") {
            return;
        }
        const maxPage = Math.max(0, Math.ceil(filteredVendors.length / pageSize) - 1);
        setCurrentPage((p) => Math.min(p, maxPage));
    }, [filteredVendors.length, searchQuery, pageSize]);

    const statsResetKey = `${showInactive}`;

    const vendorStats = useMemo(() => {
        const active = allVendors.filter((v) => v.isActive).length;
        return { active };
    }, [allVendors]);

    const totalVendorCount = allVendors.length;

    const subtitleCountValue = searchQuery.trim() === "" ? (showInactive ? allVendors.length : vendorStats.active) : filteredVendors.length;
    const subtitleResetKey =
        searchQuery.trim() === ""
            ? statsResetKey
            : `${statsResetKey}|search|${searchQuery.trim().toLowerCase()}`;

    const footerResetKey = `${statsResetKey}|p${currentPage}|s${pageSize}|te${totalElements}|sq${searchQuery}|vl${vendors.length}|fv${filteredVendors.length}|dv${displayedVendors.length}`;

    const getStatusBadge = (vendor: VendorWithDefaults) => {
        if (!vendor.isActive) {
            return (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-350">
                    Inactive
                </span>
            );
        }
        return (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-dashboard-primary/20 text-dashboard-primary">
                Active
            </span>
        );
    };

    const handleExportCSV = async () => {
        if (allVendors.length === 0) return;

        const headers = [
            "ID",
            "Vendor Name",
            "Is Active",
            "Point Person",
            "Email",
            "Location",
            "Miles",
            "Products",
            "Is Farmer",
            "Is Produce",
            "Woman Owned",
            "BIPOC Owned",
            "Veteran Owned",
            "% Handmade",
            "% Agricultural",
            "% Prepared Food",
            "% Cottage Goods",
            "% Manufactured"
        ];

        const csvContent = [
            headers.join(","),
            ...allVendors.map(vendor => [
                vendor.id,
                `"${(vendor.vendorName || "").replace(/"/g, '""')}"`,
                vendor.isActive ? "Yes" : "No",
                `"${(vendor.pointPerson || "").replace(/"/g, '""')}"`,
                `"${(vendor.email || "").replace(/"/g, '""')}"`,
                `"${(vendor.location || "").replace(/"/g, '""')}"`,
                vendor.miles ?? "",
                `"${(vendor.products || "").replace(/"/g, '""')}"`,
                vendor.defaults?.pctHandmade ? `${vendor.defaults.pctHandmade}%` : "",
                vendor.defaults?.pctAgricultural ? `${vendor.defaults.pctAgricultural}%` : "",
                vendor.defaults?.pctPreparedFood ? `${vendor.defaults.pctPreparedFood}%` : "",
                vendor.defaults?.pctCottageGoods ? `${vendor.defaults.pctCottageGoods}%` : "",
                vendor.defaults?.pctManufactured ? `${vendor.defaults.pctManufactured}%` : ""
            ].join(","))
        ].join("\n");

        const filename = `vendors_export_${new Date().toISOString().split('T')[0]}.csv`;

        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
            try {
                // @ts-ignore - Tauri plugins may not be installed in all environments
                const { save } = await import("@tauri-apps/plugin-dialog");
                // @ts-ignore - Tauri plugins may not be installed in all environments
                const { writeFile } = await import("@tauri-apps/plugin-fs");
                const filePath = await save({
                    filters: [{ name: 'CSV', extensions: ['csv'] }],
                    defaultPath: filename
                });
                if (filePath) {
                    await writeFile(filePath, new TextEncoder().encode(csvContent));
                }
            } catch (error) {
                console.error("Failed to save via Tauri:", error);
                triggerCSVDownload(csvContent, filename);
            }
        } else {
            triggerCSVDownload(csvContent, filename);
        }
    };

    const triggerCSVDownload = (content: string, filename: string) => {
        const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen flex transition-colors duration-300">
            <SidebarNavigation activeItem="Vendors" />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 animate-slide-up">
                    <div>
                        <h2 className="text-2xl font-bold animate-fade-in">Vendors</h2>
                        <p className="text-slate-700 dark:text-slate-400 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            Comprehensive list of all registered vendors (
                            <SmoothIntegerValue
                                value={subtitleCountValue}
                                resetKey={subtitleResetKey}
                                className="font-medium text-inherit"
                            />
                            {searchQuery.trim() === "" ? " total)" : " filtered)"}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            className="flex items-center gap-2"
                            onClick={handleExportCSV}
                        >
                            <span className="material-icons text-lg leading-none">download</span>
                            Export List
                        </Button>
                        <Button 
                            variant="primary" 
                            className="flex items-center gap-2"
                            onClick={() => router.push("/vendors/add")}
                        >
                            <span className="material-icons text-lg leading-none">add</span>
                            Add Vendor
                        </Button>
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-stagger">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover-lift transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-[#10b981]/10 text-[#10b981] p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110">
                                <span className="material-icons leading-none">store</span>
                            </div>
                        </div>
                        <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">Total Vendors</p>
                        <SmoothIntegerValue
                            value={totalVendorCount}
                            resetKey={statsResetKey}
                            className="block text-3xl font-bold mt-1 tabular-nums text-slate-900 dark:text-slate-100"
                        />
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover-lift transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div
                                className="text-pink-600 p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110"
                                style={{ backgroundColor: 'rgba(252, 231, 243, 0.5)' }}
                            >
                                <span className="material-icons leading-none">business</span>
                            </div>
                        </div>
                        <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">Active Vendors</p>
                        <SmoothIntegerValue
                            value={vendorStats.active}
                            resetKey={statsResetKey}
                            className="block text-3xl font-bold mt-1 tabular-nums text-slate-900 dark:text-slate-100"
                        />
                    </div>
                </div>

                {/* Vendors Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="font-bold text-lg">All Vendors</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 mr-2">
                                <span className="text-sm font-medium text-slate-600">Show Inactive</span>
                                <button
                                    type="button"
                                    onClick={() => setShowInactive(!showInactive)}
                                    className={cn(
                                        "relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:ring-offset-2",
                                        showInactive ? "bg-dashboard-primary" : "bg-slate-300"
                                    )}
                                >
                                    <span className={cn(
                                        "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                                        showInactive ? "translate-x-5.5" : "translate-x-1"
                                    )} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm leading-none">search</span>
                                    <input
                                        className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-[#10b981] focus:border-[#10b981] w-full md:w-64 outline-none"
                                        placeholder="Search vendors..."
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" size="sm" className="p-2 h-[42px] flex items-center justify-center">
                                    <span className="material-icons block leading-none">filter_list</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Vendor Name</th>
                                    <th className="px-6 py-4">Point Person</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Distance</th>
                                    <th className="px-6 py-4">Products</th>
                                    <th className="px-6 py-4">Product Defaults</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
                                            Loading vendors...
                                        </td>
                                    </tr>
                                ) : displayedVendors.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
                                            No vendors found
                                        </td>
                                    </tr>
                                ) : (
                                    displayedVendors.map((vendor) => (
                                        <tr
                                            key={vendor.id}
                                            className="hover:bg-green-50 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/vendor?id=${vendor.id}`)}
                                        >
                                        <td className="px-6 py-4">
                                            <span className="font-semibold">{vendor.vendorName}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{vendor.pointPerson || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{vendor.email || '-'}</td>
                                        <td className="px-6 py-4 text-sm">{vendor.location || '-'}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {vendor.miles != null ? (
                                                <span className="tabular-nums">
                                                    <SmoothIntegerValue
                                                        value={Math.round(Number(vendor.miles))}
                                                        resetKey={`${statsResetKey}|${vendor.id}|miles`}
                                                    />{" "}
                                                    mi
                                                </span>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm">{vendor.products || '-'}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {vendor.defaults ? (
                                                <div className="flex flex-col gap-1 text-xs">
                                                    {parseFloat(vendor.defaults.pctAgricultural || "0") > 0 && (
                                                        <span>
                                                            Agri:{" "}
                                                            <SmoothIntegerValue
                                                                value={Math.round(parseFloat(vendor.defaults.pctAgricultural || "0"))}
                                                                resetKey={`${statsResetKey}|${vendor.id}|pctAg`}
                                                            />
                                                            %
                                                        </span>
                                                    )}
                                                    {parseFloat(vendor.defaults.pctPreparedFood || "0") > 0 && (
                                                        <span>
                                                            Food:{" "}
                                                            <SmoothIntegerValue
                                                                value={Math.round(parseFloat(vendor.defaults.pctPreparedFood || "0"))}
                                                                resetKey={`${statsResetKey}|${vendor.id}|pctPf`}
                                                            />
                                                            %
                                                        </span>
                                                    )}
                                                    {parseFloat(vendor.defaults.pctHandmade || "0") > 0 && (
                                                        <span>
                                                            Handmade:{" "}
                                                            <SmoothIntegerValue
                                                                value={Math.round(parseFloat(vendor.defaults.pctHandmade || "0"))}
                                                                resetKey={`${statsResetKey}|${vendor.id}|pctHm`}
                                                            />
                                                            %
                                                        </span>
                                                    )}
                                                    {parseFloat(vendor.defaults.pctCottageGoods || "0") > 0 && (
                                                        <span>
                                                            Cottage:{" "}
                                                            <SmoothIntegerValue
                                                                value={Math.round(parseFloat(vendor.defaults.pctCottageGoods || "0"))}
                                                                resetKey={`${statsResetKey}|${vendor.id}|pctCg`}
                                                            />
                                                            %
                                                        </span>
                                                    )}
                                                    {parseFloat(vendor.defaults.pctManufactured || "0") > 0 && (
                                                        <span>
                                                            Mfg:{" "}
                                                            <SmoothIntegerValue
                                                                value={Math.round(parseFloat(vendor.defaults.pctManufactured || "0"))}
                                                                resetKey={`${statsResetKey}|${vendor.id}|pctMf`}
                                                            />
                                                            %
                                                        </span>
                                                    )}
                                                    {!vendor.defaults.pctAgricultural && !vendor.defaults.pctPreparedFood && 
                                                     !vendor.defaults.pctHandmade && !vendor.defaults.pctCottageGoods && 
                                                     !vendor.defaults.pctManufactured && (
                                                        <span className="text-slate-400">No defaults</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-xs">No defaults</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(vendor)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="p-1.5 hover:bg-dashboard-primary/10 hover:text-dashboard-primary text-slate-400"
                                                    onClick={(e) => handleEditClick(e, vendor)}
                                                    title="Edit Vendor"
                                                >
                                                    <span className="material-icons text-lg leading-none">edit</span>
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="p-1.5 hover:bg-dashboard-primary/10 hover:text-dashboard-primary text-slate-400"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/vendor?id=${vendor.id}`);
                                                    }}
                                                    title="View Details"
                                                >
                                                    <span className="material-icons text-lg leading-none">visibility</span>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-sm text-slate-700 dark:text-slate-500 inline-flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                            {searchQuery.trim() === "" ? (
                                <>
                                    <span>Showing</span>
                                    <SmoothIntegerValue
                                        value={vendors.length > 0 ? currentPage * pageSize + 1 : 0}
                                        resetKey={footerResetKey}
                                        className="font-medium tabular-nums text-inherit"
                                    />
                                    <span>to</span>
                                    <SmoothIntegerValue
                                        value={Math.min((currentPage + 1) * pageSize, totalElements)}
                                        resetKey={footerResetKey}
                                        className="font-medium tabular-nums text-inherit"
                                    />
                                    <span>of</span>
                                    <SmoothIntegerValue
                                        value={totalElements}
                                        resetKey={footerResetKey}
                                        className="font-medium tabular-nums text-inherit"
                                    />
                                    <span>vendors</span>
                                </>
                            ) : (
                                <>
                                    <span>Showing</span>
                                    <SmoothIntegerValue
                                        value={
                                            filteredVendors.length === 0
                                                ? 0
                                                : currentPage * pageSize + 1
                                        }
                                        resetKey={footerResetKey}
                                        className="font-medium tabular-nums text-inherit"
                                    />
                                    <span>to</span>
                                    <SmoothIntegerValue
                                        value={Math.min(
                                            (currentPage + 1) * pageSize,
                                            filteredVendors.length,
                                        )}
                                        resetKey={footerResetKey}
                                        className="font-medium tabular-nums text-inherit"
                                    />
                                    <span>of</span>
                                    <SmoothIntegerValue
                                        value={filteredVendors.length}
                                        resetKey={footerResetKey}
                                        className="font-medium tabular-nums text-inherit"
                                    />
                                    <span>matching vendors</span>
                                </>
                            )}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="p-1 px-3" 
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                            >
                                Previous
                            </Button>
                            {Array.from(
                                { length: Math.min(effectiveTotalPages, 5) },
                                (_, i) => {
                                    let pageNum: number;
                                    if (effectiveTotalPages <= 5) {
                                        pageNum = i;
                                    } else if (currentPage < 3) {
                                        pageNum = i;
                                    } else if (currentPage > effectiveTotalPages - 4) {
                                        pageNum = effectiveTotalPages - 5 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "primary" : "outline"}
                                            size="sm"
                                            className="p-1 px-3"
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum + 1}
                                        </Button>
                                    );
                                },
                            )}
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="p-1 px-3"
                                disabled={currentPage >= effectiveTotalPages - 1}
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(effectiveTotalPages - 1, prev + 1),
                                    )
                                }
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>

                {editingVendor && (
                    <EditVendorDialog
                        vendor={editingVendor}
                        isOpen={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                        onSuccess={handleEditSuccess}
                    />
                )}
            </main>
        </div>
    );
}

export default function VendorsPage() {
    return (
        <VendorsContent />
    );
}
