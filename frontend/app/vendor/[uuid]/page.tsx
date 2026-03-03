"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import SidebarNavigation from "@/app/components/SidebarNavigation";
import Button from "@/app/components/Button";
import DarkModeToggle from "@/app/components/DarkModeToggle";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Set Chart.js defaults for dark mode support
if (typeof window !== "undefined") {
    ChartJS.defaults.color = "#94a3b8";
    ChartJS.defaults.font.family = "Inter, sans-serif";
}

interface MarketSession {
    marketDate: string;
    present: boolean;
    snapVoucher: number | null;
    dufbVoucher: number | null;
    wdfmTokens: number | null;
    reimbDue: number | null;
    reportedSales: number | null;
    produceDollar: number | null;
}

interface VendorData {
    id: string;
    name: string;
    vendorId: string;
    owner: string;
    isActive: boolean;
    attendanceRate: number;
    attendanceChange: number;
    avgDailySales: number;
    topSellingMonth: string;
    snapTransactions: number;
    salesTrends: {
        labels: string[];
        data: number[];
    };
    paymentBreakdown: {
        cashCard: number;
        snapVouchers: number;
        marketTokens: number;
    };
    marketHistory: MarketSession[];
}

function VendorDetailContent() {
    const params = useParams();
    const uuid = params.uuid as string;
    const { user, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Mock vendor data - in a real app, this would come from an API
    const vendorData: VendorData = {
        id: uuid,
        name: "Bonnet Farm",
        vendorId: "V-4429",
        owner: "Monika Eckert",
        isActive: true,
        attendanceRate: 94.2,
        attendanceChange: 4,
        avgDailySales: 1150.0,
        topSellingMonth: "June 2024",
        snapTransactions: 114.0,
        salesTrends: {
            labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
            data: [8200, 11500, 9400, 10200, 8800, 11500],
        },
        paymentBreakdown: {
            cashCard: 850.0,
            snapVouchers: 17.0,
            marketTokens: 97.0,
        },
        marketHistory: [
            {
                marketDate: "Oct 12, 2024",
                present: true,
                snapVoucher: 17.0,
                dufbVoucher: 77.0,
                wdfmTokens: 20.0,
                reimbDue: 114.0,
                reportedSales: 1150.0,
                produceDollar: 1150,
            },
            {
                marketDate: "Oct 05, 2024",
                present: true,
                snapVoucher: 12.0,
                dufbVoucher: 65.0,
                wdfmTokens: 15.0,
                reimbDue: 92.0,
                reportedSales: 980.0,
                produceDollar: 980,
            },
            {
                marketDate: "Sep 28, 2024",
                present: false,
                snapVoucher: null,
                dufbVoucher: null,
                wdfmTokens: null,
                reimbDue: null,
                reportedSales: null,
                produceDollar: null,
            },
            {
                marketDate: "Sep 21, 2024",
                present: true,
                snapVoucher: 25.0,
                dufbVoucher: 102.0,
                wdfmTokens: 30.0,
                reimbDue: 157.0,
                reportedSales: 1420.0,
                produceDollar: 1420,
            },
        ],
    };

    useEffect(() => {
        const checkDarkMode = () => {
            const isDark = document.documentElement.classList.contains("dark");
            setIsDarkMode(isDark);
            // Update Chart.js defaults when dark mode changes
            ChartJS.defaults.color = isDark ? "#94a3b8" : "#64748b";
        };

        checkDarkMode();

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
            if (showUserMenu && !target.closest(".user-menu-container")) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showUserMenu]);

    const handleLogout = () => {
        logout();
    };

    const userName = user?.username || "Admin User";

    // Sales Trends Chart Data
    const salesTrendData = {
        labels: vendorData.salesTrends.labels,
        datasets: [
            {
                label: "Sales Revenue",
                data: vendorData.salesTrends.data,
                borderColor: "#10b981",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: "#10b981",
                pointBorderColor: "#fff",
                pointHoverRadius: 6,
            },
        ],
    };

    const salesTrendOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: "rgba(148, 163, 184, 0.1)" },
                ticks: {
                    callback: function (value: string | number) {
                        return "$" + value;
                    },
                },
            },
            x: {
                grid: { display: false },
            },
        },
    };

    // Payment Breakdown Chart Data
    const paymentBreakdownData = {
        labels: ["Cash/Card", "SNAP", "Tokens"],
        datasets: [
            {
                data: [
                    vendorData.paymentBreakdown.cashCard,
                    vendorData.paymentBreakdown.snapVouchers,
                    vendorData.paymentBreakdown.marketTokens,
                ],
                backgroundColor: ["#10b981", "#3b82f6", "#f59e0b"],
                borderWidth: 0,
                hoverOffset: 10,
            },
        ],
    };

    const paymentBreakdownOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "75%",
        plugins: {
            legend: { display: false },
        },
    };

    const formatCurrency = (value: number | null) => {
        if (value === null) return "-";
        return `$${value.toFixed(2)}`;
    };

    const formatNumber = (value: number | null) => {
        if (value === null) return "-";
        return value.toString();
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen flex transition-colors duration-300">
            <DarkModeToggle position="fixed" className="bottom-6 right-6 top-auto" />

            <SidebarNavigation activeItem="Vendors" />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-[1440px] mx-auto px-6 py-8">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div>
                            <nav className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                                <Link href="/vendors" className="hover:text-[#10b981] transition-colors">
                                    Vendors
                                </Link>
                                <span className="material-icons text-xs">chevron_right</span>
                                <span className="text-slate-400 dark:text-slate-300">
                                    {vendorData.name}
                                </span>
                            </nav>
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-bold">{vendorData.name}</h1>
                                {vendorData.isActive ? (
                                    <span 
                                        className="px-3 py-1 rounded-full text-xs font-bold text-[#10b981] dark:bg-green-900/30 dark:text-green-400"
                                        style={{ 
                                            backgroundColor: isDarkMode ? undefined : 'rgba(16, 185, 129, 0.1)' 
                                        }}
                                    >
                                        ACTIVE
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-800">
                                        INACTIVE
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Vendor ID: {vendorData.vendorId} • Owner: {vendorData.owner}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="flex items-center gap-2"
                                onClick={() => {
                                    // Export report functionality
                                    console.log("Export report");
                                }}
                            >
                                <span className="material-icons text-xl">download</span>
                                Export Report
                            </Button>
                            <Button
                                variant="primary"
                                className="flex items-center gap-2"
                                onClick={() => {
                                    // Edit profile functionality
                                    console.log("Edit profile");
                                }}
                            >
                                <span className="material-icons text-xl">edit</span>
                                Edit Profile
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
                                            color: isDarkMode
                                                ? "rgb(203, 213, 225)"
                                                : "rgb(0, 0, 0)",
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
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {userName}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleLogout}
                                            variant="ghost"
                                            size="sm"
                                            className="w-full flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <span className="material-icons text-lg leading-none">
                                                logout
                                            </span>
                                            Log Out
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div
                                    className="dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110"
                                    style={{ backgroundColor: isDarkMode ? undefined : 'rgba(219, 234, 254, 0.5)' }}
                                >
                                    <span className="material-icons leading-none">calendar_today</span>
                                </div>
                                <span 
                                    className="text-xs font-bold text-[#10b981] dark:text-green-400 flex items-center dark:bg-green-900/20 px-2 py-1 rounded-full"
                                    style={{ 
                                        backgroundColor: isDarkMode ? undefined : 'rgba(16, 185, 129, 0.1)' 
                                    }}
                                >
                                    +{vendorData.attendanceChange}%
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Attendance Rate
                            </p>
                            <h3 className="text-2xl font-bold mt-1">
                                {vendorData.attendanceRate}%
                            </h3>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-[#10b981]/10 text-[#10b981] p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110">
                                    <span className="material-icons leading-none">payments</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Avg. Daily Sales
                            </p>
                            <h3 className="text-2xl font-bold mt-1">
                                {formatCurrency(vendorData.avgDailySales)}
                            </h3>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div
                                    className="dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110"
                                    style={{ backgroundColor: isDarkMode ? undefined : 'rgba(243, 232, 255, 0.5)' }}
                                >
                                    <span className="material-icons leading-none">trending_up</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Top Selling Month
                            </p>
                            <h3 className="text-2xl font-bold mt-1">
                                {vendorData.topSellingMonth}
                            </h3>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div
                                    className="dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110"
                                    style={{ backgroundColor: isDarkMode ? undefined : 'rgba(252, 231, 243, 0.5)' }}
                                >
                                    <span className="material-icons leading-none">receipt_long</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                SNAP Transactions
                            </p>
                            <h3 className="text-2xl font-bold mt-1">
                                {vendorData.snapTransactions.toFixed(2)} Units
                            </h3>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Sales Trends Chart */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-bold">Sales Trends</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Net revenue over the last 6 months
                                    </p>
                                </div>
                                <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm font-medium focus:ring-[#10b981] px-3 py-2">
                                    <option>Last 6 Months</option>
                                    <option>Last Year</option>
                                </select>
                            </div>
                            <div className="h-80 w-full">
                                <Line data={salesTrendData} options={salesTrendOptions} />
                            </div>
                        </div>

                        {/* Payment Breakdown Chart */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h2 className="text-lg font-bold mb-1">Payment Breakdown</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Distribution of currency types
                            </p>
                            <div className="h-64 flex items-center justify-center mb-6">
                                <Doughnut
                                    data={paymentBreakdownData}
                                    options={paymentBreakdownOptions}
                                />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-[#10b981]"></span>
                                        <span>Cash/Card</span>
                                    </div>
                                    <span className="font-bold">
                                        {formatCurrency(vendorData.paymentBreakdown.cashCard)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                        <span>SNAP Vouchers</span>
                                    </div>
                                    <span className="font-bold">
                                        {formatCurrency(
                                            vendorData.paymentBreakdown.snapVouchers
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                        <span>Market Tokens</span>
                                    </div>
                                    <span className="font-bold">
                                        {formatCurrency(vendorData.paymentBreakdown.marketTokens)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Market History Recap Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h2 
                                className="text-lg font-bold dark:text-slate-100"
                                style={{ 
                                    color: isDarkMode ? undefined : 'rgb(15, 23, 42)' 
                                }}
                            >
                                Market History Recap
                            </h2>
                            <div className="relative">
                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                                    search
                                </span>
                                <input
                                    className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm w-64 focus:ring-[#10b981] focus:border-[#10b981] dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                                    placeholder="Search sessions..."
                                    type="text"
                                    style={{ 
                                        color: isDarkMode ? undefined : 'rgb(51, 65, 85)' 
                                    }}
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Market Date</th>
                                        <th className="px-6 py-4 text-center">Present?</th>
                                        <th className="px-6 py-4">SNAP Voucher</th>
                                        <th className="px-6 py-4">DUFB Voucher</th>
                                        <th className="px-6 py-4">WDFM Tokens</th>
                                        <th className="px-6 py-4">Reimb. Due</th>
                                        <th className="px-6 py-4">Reported Sales</th>
                                        <th className="px-6 py-4">Produce $$</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {vendorData.marketHistory.map((session, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 font-medium">
                                                {session.marketDate}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {session.present ? (
                                                    <span className="material-icons text-green-500">
                                                        check_circle
                                                    </span>
                                                ) : (
                                                    <span className="material-icons text-red-400">
                                                        cancel
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {formatCurrency(session.snapVoucher)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {formatCurrency(session.dufbVoucher)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {formatCurrency(session.wdfmTokens)}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-[#10b981]">
                                                {formatCurrency(session.reimbDue)}
                                            </td>
                                            <td className="px-6 py-4 font-bold">
                                                {formatCurrency(session.reportedSales)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {formatNumber(session.produceDollar)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-center">
                            <button className="text-sm font-bold text-[#10b981] hover:underline">
                                View All Sessions
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function VendorDetailPage() {
    return (
        <ProtectedRoute>
            <VendorDetailContent />
        </ProtectedRoute>
    );
}

