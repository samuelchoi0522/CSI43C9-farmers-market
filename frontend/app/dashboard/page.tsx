"use client";

import { useEffect, useState } from "react";
import SidebarNavigation from "../components/SidebarNavigation";
import CategoryRevenueChart from "../components/CategoryRevenueChart";
import Button from "../components/Button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { getAllVendorDefaults, VendorDefaults } from "@/lib/api/defaults";
import { getVendors, Vendor } from "@/lib/api/vendor";

interface VendorWithDefaults extends Vendor {
    defaults?: VendorDefaults;
}

function DashboardContent() {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [vendors, setVendors] = useState<VendorWithDefaults[]>([]);
    const [vendorDefaults, setVendorDefaults] = useState<VendorDefaults[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const { user, logout } = useAuth();
    const userName = user?.username || "Admin User";

    useEffect(() => {
        // Close user menu when clicking outside
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


    // Fetch vendors and vendor defaults
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [vendorsResponse, defaultsResponse] = await Promise.all([
                    getVendors(currentPage, pageSize),
                    getAllVendorDefaults(0, 100)
                ]);

                console.log('Vendors response:', vendorsResponse);
                console.log('Defaults response:', defaultsResponse);

                // Check if responses are valid
                if (!vendorsResponse) {
                    console.error('Vendors response is null or undefined');
                    return;
                }

                // Handle case where response might be an array directly or PagedResponse
                let vendorsList: Vendor[] = [];
                if (Array.isArray(vendorsResponse)) {
                    vendorsList = vendorsResponse;
                    console.log('Response is an array, using directly');
                } else if (vendorsResponse.data && Array.isArray(vendorsResponse.data)) {
                    vendorsList = vendorsResponse.data;
                    console.log('Response has data array');
                    // Update pagination info
                    if (vendorsResponse.totalPages !== undefined) {
                        setTotalPages(vendorsResponse.totalPages);
                    }
                    if (vendorsResponse.totalElements !== undefined) {
                        setTotalElements(vendorsResponse.totalElements);
                    }
                } else {
                    console.error('Invalid vendors response structure:', vendorsResponse);
                    return;
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
                
                console.log('Setting vendors:', vendorsWithDefaults);
                setVendors(vendorsWithDefaults);
            } catch (error) {
                console.error('Error fetching vendor data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentPage, pageSize]);

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen flex transition-colors duration-300">
            <SidebarNavigation activeItem="Dashboard" />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 animate-slide-up">
                    <div>
                        <h2 className="text-2xl font-bold animate-fade-in">Dashboard</h2>
                        <p className="text-slate-700 dark:text-slate-400 animate-fade-in" style={{ animationDelay: '0.1s' }}>Market Performance for {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-3">
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
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-stagger">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover-lift transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div
                                className="dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110"
                                style={{ backgroundColor: 'rgba(219, 234, 254, 0.5)' }}
                            >
                                <span className="material-icons leading-none">credit_card</span>
                            </div>
                            <span className="text-xs font-bold text-[#10b981] flex items-center gap-1">
                                <span className="material-icons text-sm leading-none">trending_up</span> +12%
                            </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">Gross Market Revenue</p>
                        <p className="text-3xl font-bold mt-1">$18,432.50</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover-lift transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-[#10b981]/10 text-[#10b981] p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110">
                                <span className="material-icons leading-none">attach_money</span>
                            </div>
                            <span className="text-xs font-bold text-[#10b981] flex items-center gap-1">
                                <span className="material-icons text-sm leading-none">trending_up</span> +12%
                            </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">Total Fees Collected</p>
                        <p className="text-3xl font-bold mt-1">$2,840.00</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover-lift transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div
                                className="dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110"
                                style={{ backgroundColor: 'rgba(254, 243, 199, 0.5)' }}
                            >
                                <span className="material-icons leading-none">folder</span>
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-500 uppercase">4 Outstanding</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">Unpaid Vendor Fees</p>
                        <p className="text-3xl font-bold mt-1">$420.00</p>
                    </div>
                </div>

                {/* Category Revenue Chart */}
                <CategoryRevenueChart />

                {/* Vendor Tracking Table */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="font-bold text-lg">Vendor Tracking</h3>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm leading-none">search</span>
                                <input
                                    className="pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-[#10b981] focus:border-[#10b981] w-full md:w-64 outline-none"
                                    placeholder="Search vendors..."
                                    type="text"
                                />
                            </div>
                            <Button variant="outline" size="sm" className="p-2 h-[42px] flex items-center justify-center">
                                <span className="material-icons block leading-none">filter_list</span>
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Vendor Name</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Product Defaults</th>
                                    <th className="px-6 py-4">Reimbursement due</th>
                                    <th className="px-6 py-4">Reported Sales</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                            Loading vendors...
                                        </td>
                                    </tr>
                                ) : vendors.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                            No vendors found
                                        </td>
                                    </tr>
                                ) : (
                                    vendors.map((vendor) => (
                                        <tr
                                            key={vendor.id}
                                            className="hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-semibold">{vendor.vendorName}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {vendor.isActive ? (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#10b981]/20 text-[#10b981]">Active</span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#8f8f8f] text-[#454545] dark:bg-slate-700 dark:text-slate-200">Inactive</span>
                                                )}
                                            </td>
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
                                            <td className="px-6 py-4 font-mono text-sm">-</td>
                                            <td className="px-6 py-4 font-mono text-sm">-</td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" className="p-1.5 hover:bg-[#10b981]/10 hover:text-[#10b981] text-slate-400">
                                                    <span className="material-icons text-lg leading-none">description</span>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-sm text-slate-700 dark:text-slate-500">
                            Showing {vendors.length > 0 ? currentPage * pageSize + 1 : 0} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} vendors
                        </span>
                        <div className="flex items-center gap-1">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="p-1 px-3" 
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                            >
                                Previous
                            </Button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                            })}
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="p-1 px-3"
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>


                {/* Bottom Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h4 className="font-bold mb-4">Revenue by Category</h4>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Fresh Produce</span>
                                    <span className="font-bold">$8,240 (45%)</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div className="bg-[#10b981] h-full" style={{ width: '45%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Ready-to-Eat</span>
                                    <span className="font-bold">$5,120 (28%)</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full" style={{ width: '28%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Artisan Crafts</span>
                                    <span className="font-bold">$3,072 (17%)</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div className="bg-amber-500 h-full" style={{ width: '17%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold">Financial Alerts</h4>
                            <span className="text-xs text-[#10b981] font-bold cursor-pointer hover:underline">Auditor View</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-4 items-start">
                                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                                <div>
                                    <p className="text-sm font-semibold">Unreported Sales: Ary Land &amp; Cattle</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-500">Market day 06/23 sales data not yet submitted for commission.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                                <div>
                                    <p className="text-sm font-semibold">Partial Payment: Alba&apos;s Pupusas</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-500">Booth fee balance of $45.00 overdue from morning check-in.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="w-2 h-2 rounded-full bg-[#10b981] mt-2 shrink-0"></div>
                                <div>
                                    <p className="text-sm font-semibold">Deposit Successful</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-500">Electronic deposit for 06/21 batch confirmed by bank ($12,403.00).</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}
