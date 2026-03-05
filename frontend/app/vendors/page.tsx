"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import DarkModeToggle from "../components/DarkModeToggle";
import SidebarNavigation from "../components/SidebarNavigation";
import Button from "../components/Button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { getAllVendorDefaults, VendorDefaults } from "@/lib/api/defaults";
import { getVendors, Vendor } from "@/lib/api/vendor";
import { EditVendorDialog } from "../components/EditVendorDialog";
import { cn } from "@/lib/utils";

interface VendorWithDefaults extends Vendor {
    defaults?: VendorDefaults;
}

function VendorsContent() {
    const router = useRouter();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === "undefined") return false;
        return document.documentElement.classList.contains("dark");
    });
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
    const { user, logout } = useAuth();
    const userName = user?.username || "Admin User";

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
            const [allVendorsResponse, defaultsResponse] = await Promise.all([
                getVendors(0, 1000, showInactive), // Fetch a large number to get all vendors for stats
                getAllVendorDefaults(0, 100)
            ]);

            // Handle defaults response
            let defaultsList: VendorDefaults[] = [];
            if (defaultsResponse) {
                if (Array.isArray(defaultsResponse)) {
                    defaultsList = defaultsResponse;
                } else if (defaultsResponse.data && Array.isArray(defaultsResponse.data)) {
                    defaultsList = defaultsResponse.data;
                }
            }

            // Handle all vendors response for stats
            let allVendorsList: Vendor[] = [];
            if (allVendorsResponse) {
                if (Array.isArray(allVendorsResponse)) {
                    allVendorsList = allVendorsResponse;
                } else if (allVendorsResponse.data && Array.isArray(allVendorsResponse.data)) {
                    allVendorsList = allVendorsResponse.data;
                }
            }

            // Map vendor defaults to all vendors
            const allVendorsWithDefaults = allVendorsList.map(vendor => {
                const defaults = defaultsList.find(d => d.vendorId === vendor.id);
                return { ...vendor, defaults };
            });
            
            setAllVendors(allVendorsWithDefaults);
        } catch (error) {
            console.error('Error fetching all vendors for stats:', error);
        }
    };
    // Fetch all vendors for stats calculation
    useEffect(() => {
        fetchAllVendors();
    }, [showInactive]);

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
    };

    // Reset to first page when search query changes
    useEffect(() => {
        if (searchQuery.trim() !== "") {
            setCurrentPage(0);
        }
    }, [searchQuery]);

    // Compute filtered vendors based on search query
    const filteredVendors = useMemo(() => {
        if (searchQuery.trim() === "") {
            return vendors;
        }
        const query = searchQuery.toLowerCase();
        return vendors.filter(
            (vendor) =>
                vendor.vendorName?.toLowerCase().includes(query) ||
                vendor.pointPerson?.toLowerCase().includes(query) ||
                vendor.email?.toLowerCase().includes(query) ||
                vendor.location?.toLowerCase().includes(query) ||
                vendor.products?.toLowerCase().includes(query)
        );
    }, [searchQuery, vendors]);

    useEffect(() => {
        const checkDarkMode = () => {
            const isDark = document.documentElement.classList.contains("dark");
            setIsDarkMode(isDark);
        };

        // Initial state is already set via useState initializer, so we don't need to set it here
        // Just set up the observer and event listener

        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        window.addEventListener("darkModeChange", checkDarkMode);

        return () => {
            observer.disconnect();
            window.removeEventListener("darkModeChange", checkDarkMode);
        };
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

    const handleLogout = () => {
        logout();
    };

    const getStatusBadge = (vendor: VendorWithDefaults) => {
        if (!vendor.isActive) {
            return (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-350 dark:bg-slate-700 dark:text-slate-200">
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

    const getOwnershipBadges = (vendor: VendorWithDefaults) => {
        const badges = [];
        if (vendor.womanOwned) {
            badges.push(
                <span key="woman" className="px-2 py-0.5 rounded text-xs font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400">
                    Woman-Owned
                </span>
            );
        }
        if (vendor.bipocOwned) {
            badges.push(
                <span key="bipoc" className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                    BIPOC-Owned
                </span>
            );
        }
        if (vendor.veteranOwned) {
            badges.push(
                <span key="veteran" className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                    Veteran-Owned
                </span>
            );
        }
        return badges;
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen flex transition-colors duration-300">
            <DarkModeToggle position="fixed" className="bottom-6 right-6 top-auto" />

            <SidebarNavigation activeItem="Vendors" />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 animate-slide-up">
                    <div>
                        <h2 className="text-2xl font-bold animate-fade-in">Vendors</h2>
                        <p className="text-slate-700 dark:text-slate-400 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            Comprehensive list of all registered vendors {searchQuery.trim() === "" ? `(${totalElements > 0 ? totalElements : allVendors.length} total)` : `(${filteredVendors.length} filtered)`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="flex items-center gap-2">
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
                        {/* User Menu */}
                        <div className="relative user-menu-container">
                            <Button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                variant="ghost"
                                className="flex items-center gap-2 px-3 cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 aspect-square">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <span
                                    className="text-sm font-medium hidden md:block"
                                    style={{
                                        color: isDarkMode ? 'rgb(203, 213, 225)' : 'rgb(0, 0, 0)'
                                    }}
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
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-stagger">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover-lift transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-[#10b981]/10 text-[#10b981] p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110">
                                <span className="material-icons leading-none">store</span>
                            </div>
                        </div>
                        <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">Total Vendors</p>
                        <p className="text-3xl font-bold mt-1">{totalElements > 0 ? totalElements : allVendors.length}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover-lift transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div
                                className="dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110"
                                style={{ backgroundColor: isDarkMode ? undefined : 'rgba(219, 234, 254, 0.5)' }}
                            >
                                <span className="material-icons leading-none">agriculture</span>
                            </div>
                        </div>
                        <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">Farmers</p>
                        <p className="text-3xl font-bold mt-1">{allVendors.filter(v => v.isFarmer).length}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover-lift transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div
                                className="dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110"
                                style={{ backgroundColor: isDarkMode ? undefined : 'rgba(243, 232, 255, 0.5)' }}
                            >
                                <span className="material-icons leading-none">eco</span>
                            </div>
                        </div>
                        <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">Produce Vendors</p>
                        <p className="text-3xl font-bold mt-1">{allVendors.filter(v => v.isProduce).length}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover-lift transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div
                                className="dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110"
                                style={{ backgroundColor: isDarkMode ? undefined : 'rgba(252, 231, 243, 0.5)' }}
                            >
                                <span className="material-icons leading-none">business</span>
                            </div>
                        </div>
                        <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">Active Vendors</p>
                        <p className="text-3xl font-bold mt-1">{allVendors.filter(v => v.isActive).length}</p>
                    </div>
                </div>

                {/* Vendors Table */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="font-bold text-lg">All Vendors</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 mr-2">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Show Inactive</span>
                                <button
                                    type="button"
                                    onClick={() => setShowInactive(!showInactive)}
                                    className={cn(
                                        "relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:ring-offset-2",
                                        showInactive ? "bg-dashboard-primary" : "bg-slate-300 dark:bg-slate-600"
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
                                        className="pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-[#10b981] focus:border-[#10b981] w-full md:w-64 outline-none"
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
                                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Vendor Name</th>
                                    <th className="px-6 py-4">Point Person</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Distance</th>
                                    <th className="px-6 py-4">Products</th>
                                    <th className="px-6 py-4">Product Defaults</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Ownership</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
                                            Loading vendors...
                                        </td>
                                    </tr>
                                ) : filteredVendors.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
                                            No vendors found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVendors.map((vendor) => (
                                        <tr
                                            key={vendor.id}
                                            className="hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/vendor/${vendor.id}`)}
                                        >
                                        <td className="px-6 py-4">
                                            <span className="font-semibold">{vendor.vendorName}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{vendor.pointPerson || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{vendor.email || '-'}</td>
                                        <td className="px-6 py-4 text-sm">{vendor.location || '-'}</td>
                                        <td className="px-6 py-4 text-sm">{vendor.miles ? `${vendor.miles} mi` : '-'}</td>
                                        <td className="px-6 py-4 text-sm">{vendor.products || '-'}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {vendor.defaults ? (
                                                <div className="flex flex-col gap-1 text-xs">
                                                    {parseFloat(vendor.defaults.pctAgricultural || '0') > 0 && (
                                                        <span>Agri: {parseFloat(vendor.defaults.pctAgricultural).toFixed(0)}%</span>
                                                    )}
                                                    {parseFloat(vendor.defaults.pctPreparedFood || '0') > 0 && (
                                                        <span>Food: {parseFloat(vendor.defaults.pctPreparedFood).toFixed(0)}%</span>
                                                    )}
                                                    {parseFloat(vendor.defaults.pctHandmade || '0') > 0 && (
                                                        <span>Handmade: {parseFloat(vendor.defaults.pctHandmade).toFixed(0)}%</span>
                                                    )}
                                                    {parseFloat(vendor.defaults.pctCottageGoods || '0') > 0 && (
                                                        <span>Cottage: {parseFloat(vendor.defaults.pctCottageGoods).toFixed(0)}%</span>
                                                    )}
                                                    {parseFloat(vendor.defaults.pctManufactured || '0') > 0 && (
                                                        <span>Mfg: {parseFloat(vendor.defaults.pctManufactured).toFixed(0)}%</span>
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
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {getOwnershipBadges(vendor).length > 0 ? (
                                                    getOwnershipBadges(vendor)
                                                ) : (
                                                    <span className="text-xs text-slate-500">-</span>
                                                )}
                                            </div>
                                        </td>
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
                                                        router.push(`/vendor/${vendor.id}`);
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
                        <span className="text-sm text-slate-700 dark:text-slate-500">
                            {searchQuery.trim() === "" ? (
                                <>Showing {vendors.length > 0 ? currentPage * pageSize + 1 : 0} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} vendors</>
                            ) : (
                                <>Showing {filteredVendors.length} of {vendors.length} vendors (filtered)</>
                            )}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="p-1 px-3" 
                                disabled={currentPage === 0 || searchQuery.trim() !== ""}
                                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                            >
                                Previous
                            </Button>
                            {searchQuery.trim() === "" ? (
                                Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    // Show page numbers around current page
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i;
                                    } else if (currentPage < 3) {
                                        pageNum = i;
                                    } else if (currentPage > totalPages - 4) {
                                        pageNum = totalPages - 5 + i;
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
                                })
                            ) : (
                                <Button variant="primary" size="sm" className="p-1 px-3">1</Button>
                            )}
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="p-1 px-3"
                                disabled={currentPage >= totalPages - 1 || searchQuery.trim() !== ""}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
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
        <ProtectedRoute>
            <VendorsContent />
        </ProtectedRoute>
    );
}

