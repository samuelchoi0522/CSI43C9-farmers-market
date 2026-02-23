"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import DarkModeToggle from "../components/DarkModeToggle";
import SidebarNavigation from "../components/SidebarNavigation";
import Button from "../components/Button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

interface Vendor {
    id: string;
    name: string;
    pointPerson: string;
    email: string;
    location: string;
    miles: number;
    products: string;
    isActive: boolean;
    isFarmer: boolean;
    isProduce: boolean;
    womanOwned: boolean;
    bipocOwned: boolean;
    veteranOwned: boolean;
}

function VendorsContent() {
    const router = useRouter();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === "undefined") return false;
        return document.documentElement.classList.contains("dark");
    });
    const [searchQuery, setSearchQuery] = useState("");
    const { user, logout } = useAuth();
    const userName = user?.username || "Admin User";

    // Mock vendor data - moved outside component to avoid recreation on each render
    const mockVendors: Vendor[] = useMemo(() => [
        {
            id: "1",
            name: "Alba's Pupusas",
            pointPerson: "Maria Alba",
            email: "maria@albaspupusas.com",
            location: "Downtown Plaza",
            miles: 5,
            products: "Ready-to-Eat",
            isActive: true,
            isFarmer: false,
            isProduce: false,
            womanOwned: true,
            bipocOwned: true,
            veteranOwned: false,
        },
        {
            id: "2",
            name: "Around the World Bakery",
            pointPerson: "John Smith",
            email: "john@atwbakery.com",
            location: "Main Street",
            miles: 12,
            products: "Bakery Goods",
            isActive: true,
            isFarmer: false,
            isProduce: false,
            womanOwned: false,
            bipocOwned: false,
            veteranOwned: false,
        },
        {
            id: "3",
            name: "Ary Land & Cattle",
            pointPerson: "Robert Ary",
            email: "robert@aryland.com",
            location: "Rural Route 7",
            miles: 45,
            products: "Fresh Meat",
            isActive: true,
            isFarmer: true,
            isProduce: false,
            womanOwned: false,
            bipocOwned: false,
            veteranOwned: true,
        },
        {
            id: "4",
            name: "Bonnet Farm",
            pointPerson: "Sarah Bonnet",
            email: "sarah@bonnetfarm.com",
            location: "Countryside",
            miles: 28,
            products: "Produce/Plant",
            isActive: true,
            isFarmer: true,
            isProduce: true,
            womanOwned: true,
            bipocOwned: false,
            veteranOwned: false,
        },
        {
            id: "5",
            name: "Broken Grain Bakery",
            pointPerson: "David Chen",
            email: "david@brokengrain.com",
            location: "Artisan District",
            miles: 8,
            products: "Bakery Specialty",
            isActive: true,
            isFarmer: false,
            isProduce: false,
            womanOwned: false,
            bipocOwned: true,
            veteranOwned: false,
        },
        {
            id: "6",
            name: "Green Valley Organics",
            pointPerson: "Emily Green",
            email: "emily@greenvalley.com",
            location: "Valley View",
            miles: 35,
            products: "Produce/Plant",
            isActive: true,
            isFarmer: true,
            isProduce: true,
            womanOwned: true,
            bipocOwned: false,
            veteranOwned: false,
        },
        {
            id: "7",
            name: "Honeycomb Apiary",
            pointPerson: "Michael Brown",
            email: "michael@honeycomb.com",
            location: "Meadow Lane",
            miles: 22,
            products: "Specialty Items",
            isActive: true,
            isFarmer: true,
            isProduce: false,
            womanOwned: false,
            bipocOwned: false,
            veteranOwned: true,
        },
        {
            id: "8",
            name: "Mountain View Dairy",
            pointPerson: "Lisa Johnson",
            email: "lisa@mountainview.com",
            location: "Mountain Road",
            miles: 50,
            products: "Dairy Products",
            isActive: true,
            isFarmer: true,
            isProduce: false,
            womanOwned: true,
            bipocOwned: false,
            veteranOwned: false,
        },
        {
            id: "9",
            name: "Sunrise Coffee Roasters",
            pointPerson: "James Wilson",
            email: "james@sunrisecoffee.com",
            location: "Downtown Plaza",
            miles: 3,
            products: "Beverages",
            isActive: true,
            isFarmer: false,
            isProduce: false,
            womanOwned: false,
            bipocOwned: false,
            veteranOwned: false,
        },
        {
            id: "10",
            name: "Urban Garden Co-op",
            pointPerson: "Patricia Martinez",
            email: "patricia@urbangarden.com",
            location: "City Center",
            miles: 2,
            products: "Produce/Plant",
            isActive: true,
            isFarmer: true,
            isProduce: true,
            womanOwned: true,
            bipocOwned: true,
            veteranOwned: false,
        },
        {
            id: "11",
            name: "Wildflower Soaps",
            pointPerson: "Jennifer Lee",
            email: "jennifer@wildflower.com",
            location: "Crafts District",
            miles: 15,
            products: "Artisan Crafts",
            isActive: true,
            isFarmer: false,
            isProduce: false,
            womanOwned: true,
            bipocOwned: true,
            veteranOwned: false,
        },
        {
            id: "12",
            name: "Heritage Breads",
            pointPerson: "Thomas Anderson",
            email: "thomas@heritagebreads.com",
            location: "Historic Quarter",
            miles: 6,
            products: "Bakery Goods",
            isActive: true,
            isFarmer: false,
            isProduce: false,
            womanOwned: false,
            bipocOwned: false,
            veteranOwned: true,
        },
    ], []);

    // Compute filtered vendors based on search query
    const filteredVendors = useMemo(() => {
        if (searchQuery.trim() === "") {
            return mockVendors;
        }
        const query = searchQuery.toLowerCase();
        return mockVendors.filter(
            (vendor) =>
                vendor.name.toLowerCase().includes(query) ||
                vendor.pointPerson.toLowerCase().includes(query) ||
                vendor.email.toLowerCase().includes(query) ||
                vendor.location.toLowerCase().includes(query) ||
                vendor.products.toLowerCase().includes(query)
        );
    }, [searchQuery, mockVendors]);

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

    const getStatusBadge = (vendor: Vendor) => {
        if (!vendor.isActive) {
            return (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    Inactive
                </span>
            );
        }
        return (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#10b981]/20 text-[#10b981]">
                Active
            </span>
        );
    };

    const getOwnershipBadges = (vendor: Vendor) => {
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
                            Comprehensive list of all registered vendors ({filteredVendors.length} total)
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
                        <p className="text-3xl font-bold mt-1">{mockVendors.length}</p>
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
                        <p className="text-3xl font-bold mt-1">{mockVendors.filter(v => v.isFarmer).length}</p>
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
                        <p className="text-3xl font-bold mt-1">{mockVendors.filter(v => v.isProduce).length}</p>
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
                        <p className="text-3xl font-bold mt-1">{mockVendors.filter(v => v.isActive).length}</p>
                    </div>
                </div>

                {/* Vendors Table */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="font-bold text-lg">All Vendors</h3>
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
                            <Button variant="outline" size="sm" className="p-2">
                                <span className="material-icons block leading-none">filter_list</span>
                            </Button>
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
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Ownership</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredVendors.map((vendor) => (
                                    <tr
                                        key={vendor.id}
                                        className="transition-all duration-200 ease-out dark:hover:bg-slate-700/50 hover-lift"
                                        onMouseEnter={(e) => {
                                            const isDark = document.documentElement.classList.contains("dark");
                                            if (!isDark) {
                                                e.currentTarget.style.backgroundColor = 'rgba(248, 250, 252, 0.5)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            const isDark = document.documentElement.classList.contains("dark");
                                            if (!isDark) {
                                                e.currentTarget.style.removeProperty('background-color');
                                            }
                                        }}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-semibold">{vendor.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{vendor.pointPerson}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{vendor.email}</td>
                                        <td className="px-6 py-4 text-sm">{vendor.location}</td>
                                        <td className="px-6 py-4 text-sm">{vendor.miles} mi</td>
                                        <td className="px-6 py-4 text-sm">{vendor.products}</td>
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
                                                <Button variant="ghost" size="sm" className="p-1.5 hover:bg-[#10b981]/10 hover:text-[#10b981] text-slate-400">
                                                    <span className="material-icons text-lg leading-none">edit</span>
                                                </Button>
                                                <Button variant="ghost" size="sm" className="p-1.5 hover:bg-[#10b981]/10 hover:text-[#10b981] text-slate-400">
                                                    <span className="material-icons text-lg leading-none">visibility</span>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-sm text-slate-700 dark:text-slate-500">
                            Showing {filteredVendors.length} of {mockVendors.length} vendors
                        </span>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="sm" className="p-1 px-3" disabled>Previous</Button>
                            <Button variant="primary" size="sm" className="p-1 px-3">1</Button>
                            <Button variant="outline" size="sm" className="p-1 px-3">2</Button>
                            <Button variant="outline" size="sm" className="p-1 px-3">Next</Button>
                        </div>
                    </div>
                </div>
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

