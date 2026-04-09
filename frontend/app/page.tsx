"use client";

import { useEffect, useMemo, useState } from "react";
import SidebarNavigation from "./components/SidebarNavigation";
import CategoryRevenueChart from "./components/CategoryRevenueChart";
import Button from "./components/Button";
import { getAllVendorDefaults, VendorDefaults } from "@/lib/api/defaults";
import { getVendors, Vendor } from "@/lib/api/vendor";
import type { VendorTransaction } from "@/lib/api/transactions";
import {
    allocateReportedByCategory,
    fetchTransactionsInRange,
    mostRecentSaturdayDate,
    mostRecentSaturdayRange,
} from "@/lib/dashboardAggregates";
import { SmoothCurrencyValue, SmoothIntegerValue } from "@/lib/smoothNumbers";
import { getCurrentWindow } from '@tauri-apps/api/window';

interface VendorWithDefaults extends Vendor {
    defaults?: VendorDefaults;
}

function formatMarketSaturdayLabel(isoDate: string) {
    try {
        const d = new Date(`${isoDate}T12:00:00`);
        return d.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return isoDate;
    }
}

function DashboardContent() {
    const [vendors, setVendors] = useState<VendorWithDefaults[]>([]);
    const [transactions, setTransactions] = useState<VendorTransaction[]>([]);
    const [defaultsByVendor, setDefaultsByVendor] = useState<Map<string, VendorDefaults>>(new Map());
    const [loading, setLoading] = useState(true);
    const [txError, setTxError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    const marketSaturday = mostRecentSaturdayDate();
    const metricsResetKey = marketSaturday;
    const marketDayLabel = formatMarketSaturdayLabel(marketSaturday);

    const vendorTxTotals = useMemo(() => {
        const map = new Map<string, { reported: number; reimbursement: number }>();
        for (const t of transactions) {
            const id = t.vendorId;
            const prev = map.get(id) ?? { reported: 0, reimbursement: 0 };
            prev.reported += t.reportedSales ?? 0;
            prev.reimbursement += t.reimbursementDue ?? 0;
            map.set(id, prev);
        }
        return map;
    }, [transactions]);

    const marketDayTotals = useMemo(() => {
        let totalReported = 0;
        let totalReimbursement = 0;
        let tokenVolume = 0;
        for (const t of transactions) {
            totalReported += t.reportedSales ?? 0;
            totalReimbursement += t.reimbursementDue ?? 0;
            tokenVolume +=
                (t.snap ?? 0) + (t.dufb ?? 0) + (t.wdfmTokens ?? 0) + (t.voucher ?? 0);
        }
        return {
            totalReported,
            totalReimbursement,
            tokenVolume,
            transactionRows: transactions.length,
        };
    }, [transactions]);

    const categoryChartData = useMemo(() => {
        const agg: Record<string, number> = {};
        for (const t of transactions) {
            const def = defaultsByVendor.get(t.vendorId);
            const parts = allocateReportedByCategory(t.reportedSales ?? 0, def);
            for (const [k, v] of Object.entries(parts)) {
                agg[k] = (agg[k] ?? 0) + v;
            }
        }
        return Object.entries(agg)
            .map(([category, revenue]) => ({
                category,
                revenue: Math.round(revenue * 100) / 100,
            }))
            .sort((a, b) => b.revenue - a.revenue);
    }, [transactions, defaultsByVendor]);

    const dashboardAlerts = useMemo(() => {
        const alerts: { tone: "amber" | "slate"; title: string; detail: string }[] = [];
        if (transactions.length === 0 && !txError) {
            alerts.push({
                tone: "slate",
                title: "No transactions this market day",
                detail: `No vendor transaction rows for ${marketDayLabel}. Data will appear once transactions are recorded for that Saturday.`,
            });
        }
        const inactiveWithTx = vendors.filter((v) => !v.isActive && (vendorTxTotals.get(v.id)?.reported ?? 0) > 0);
        for (const v of inactiveWithTx.slice(0, 2)) {
            alerts.push({
                tone: "amber",
                title: `Inactive vendor with sales: ${v.vendorName}`,
                detail: "This vendor has reported sales on this market day but is marked inactive.",
            });
        }
        const activeNoSales = vendors.filter(
            (v) => v.isActive && (vendorTxTotals.get(v.id)?.reported ?? 0) === 0,
        );
        for (const v of activeNoSales.slice(0, 3)) {
            alerts.push({
                tone: "slate",
                title: `No sales recorded: ${v.vendorName}`,
                detail: "Active vendor with no reported sales on this market day (on this page).",
            });
        }
        return alerts.slice(0, 5);
    }, [transactions.length, txError, marketDayLabel, vendors, vendorTxTotals]);

    const filteredVendors = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return vendors;
        return vendors.filter((v) => v.vendorName.toLowerCase().includes(q));
    }, [vendors, searchQuery]);

    const categoryRevenueTotal = useMemo(
        () => categoryChartData.reduce((s, r) => s + r.revenue, 0),
        [categoryChartData],
    );

    const categoryBarColors = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#94a3b8"];


    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setTxError(null);
                const range = mostRecentSaturdayRange();

                const [vendorsResponse, defaultsResponse, txList] = await Promise.all([
                    getVendors(currentPage, pageSize),
                    getAllVendorDefaults(0, 1000),
                    fetchTransactionsInRange(range.start, range.end).catch((e) => {
                        console.error(e);
                        setTxError("Could not load transaction totals for the latest market day.");
                        return [] as VendorTransaction[];
                    }),
                ]);

                if (!vendorsResponse) {
                    return;
                }

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
                } else {
                    return;
                }

                let defaultsList: VendorDefaults[] = [];
                if (defaultsResponse) {
                    if (Array.isArray(defaultsResponse)) {
                        defaultsList = defaultsResponse;
                    } else if (defaultsResponse.data && Array.isArray(defaultsResponse.data)) {
                        defaultsList = defaultsResponse.data;
                    }
                }

                const defMap = new Map<string, VendorDefaults>();
                for (const d of defaultsList) {
                    defMap.set(d.vendorId, d);
                }
                setDefaultsByVendor(defMap);
                setTransactions(txList);

                const vendorsWithDefaults = vendorsList.map((vendor) => {
                    const defaults = defaultsList.find((d) => d.vendorId === vendor.id);
                    return { ...vendor, defaults };
                });
                setVendors(vendorsWithDefaults);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentPage, pageSize, marketSaturday]);

    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen flex transition-colors duration-300">
            <SidebarNavigation activeItem="Dashboard" />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 animate-slide-up">
                    <div>
                        <h2 className="text-2xl font-bold animate-fade-in">Dashboard</h2>
                        <p className="text-slate-700 dark:text-slate-400 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            Transaction totals for the most recent Saturday ({marketDayLabel})
                        </p>
                    </div>
                </header>

                {txError && (
                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                        {txError}
                    </div>
                )}

                {/* Stats Cards — latest Saturday only, from vendor transactions API */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-stagger">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover-lift transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div
                                className="text-blue-600 p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110"
                                style={{ backgroundColor: 'rgba(219, 234, 254, 0.5)' }}
                            >
                                <span className="material-icons leading-none">credit_card</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Market day</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">Total reported sales</p>
                        <SmoothCurrencyValue
                            value={marketDayTotals.totalReported}
                            resetKey={metricsResetKey}
                            className="block text-3xl font-bold mt-1 tabular-nums text-slate-900 dark:text-slate-100"
                        />
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover-lift transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-[#10b981]/10 text-[#10b981] p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110">
                                <span className="material-icons leading-none">attach_money</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Market day</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">Total reimbursement due</p>
                        <SmoothCurrencyValue
                            value={marketDayTotals.totalReimbursement}
                            resetKey={metricsResetKey}
                            className="block text-3xl font-bold mt-1 tabular-nums text-slate-900 dark:text-slate-100"
                        />
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover-lift transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div
                                className="text-amber-600 p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110"
                                style={{ backgroundColor: 'rgba(254, 243, 199, 0.5)' }}
                            >
                                <span className="material-icons leading-none">account_balance_wallet</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Market day</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">Program token volume</p>
                        <SmoothCurrencyValue
                            value={marketDayTotals.tokenVolume}
                            resetKey={metricsResetKey}
                            className="block text-3xl font-bold mt-1 tabular-nums text-slate-900 dark:text-slate-100"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                            <SmoothIntegerValue
                                value={marketDayTotals.transactionRows}
                                resetKey={metricsResetKey}
                                className="font-semibold text-slate-600 dark:text-slate-300"
                            />
                            <span>transaction rows</span>
                        </p>
                    </div>
                </div>

                <CategoryRevenueChart data={categoryChartData} />

                {/* Vendor Tracking Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="font-bold text-lg">Vendor Tracking</h3>
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

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Vendor Name</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Product Defaults</th>
                                    <th className="px-6 py-4">Reimbursement due</th>
                                    <th className="px-6 py-4">Reported Sales</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
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
                                ) : filteredVendors.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                            No vendors match your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVendors.map((vendor) => (
                                        <tr
                                            key={vendor.id}
                                            className="hover:bg-green-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-semibold">{vendor.vendorName}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {vendor.isActive ? (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#10b981]/20 text-[#10b981]">Active</span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#8f8f8f] text-[#454545]">Inactive</span>
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
                                            <td className="px-6 py-4 font-mono text-sm">
                                                <SmoothCurrencyValue
                                                    value={vendorTxTotals.get(vendor.id)?.reimbursement ?? 0}
                                                    resetKey={`${metricsResetKey}|${vendor.id}`}
                                                    className="font-mono text-sm"
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-mono text-sm">
                                                <SmoothCurrencyValue
                                                    value={vendorTxTotals.get(vendor.id)?.reported ?? 0}
                                                    resetKey={`${metricsResetKey}|${vendor.id}`}
                                                    className="font-mono text-sm"
                                                />
                                            </td>
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
                            {searchQuery.trim() ? (
                                <>
                                    {filteredVendors.length} match{filteredVendors.length !== 1 ? "es" : ""} on this page
                                    {filteredVendors.length < vendors.length ? ` (of ${vendors.length} shown)` : null}
                                </>
                            ) : (
                                <>
                                    Showing {vendors.length > 0 ? currentPage * pageSize + 1 : 0} to{" "}
                                    {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} vendors
                                </>
                            )}
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


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h4 className="font-bold mb-1 text-slate-900 dark:text-slate-100">Allocated revenue by category</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                            Same allocation rules as Reports → Category (vendor defaults %).
                        </p>
                        {categoryChartData.length === 0 ? (
                            <p className="text-sm text-slate-600 dark:text-slate-400">No category breakdown for this market day.</p>
                        ) : (
                            <div className="space-y-4">
                                {categoryChartData.map((row, i) => {
                                    const pct =
                                        categoryRevenueTotal > 0
                                            ? Math.round((row.revenue / categoryRevenueTotal) * 1000) / 10
                                            : 0;
                                    const barPct =
                                        categoryRevenueTotal > 0
                                            ? Math.min(100, (row.revenue / categoryRevenueTotal) * 100)
                                            : 0;
                                    return (
                                        <div key={row.category}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>{row.category}</span>
                                                <span className="font-bold tabular-nums inline-flex items-baseline gap-1 flex-wrap justify-end">
                                                    <SmoothCurrencyValue
                                                        value={row.revenue}
                                                        resetKey={`${metricsResetKey}|${row.category}`}
                                                        className="font-bold tabular-nums text-slate-900 dark:text-slate-100"
                                                    />
                                                    <span className="text-slate-500 font-medium">({pct}%)</span>
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${barPct}%`,
                                                        backgroundColor: categoryBarColors[i % categoryBarColors.length],
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h4 className="font-bold mb-1 text-slate-900 dark:text-slate-100">At a glance</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                            Derived from this market day&apos;s transactions and the vendors on this page.
                        </p>
                        <div className="space-y-4">
                            {dashboardAlerts.length === 0 ? (
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Nothing flagged for vendors on this page.
                                </p>
                            ) : (
                                dashboardAlerts.map((a, idx) => (
                                    <div key={idx} className="flex gap-4 items-start">
                                        <div
                                            className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                                                a.tone === "amber" ? "bg-amber-500" : "bg-slate-400 dark:bg-slate-500"
                                            }`}
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.title}</p>
                                            <p className="text-xs text-slate-600 dark:text-slate-500">{a.detail}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <DashboardContent />
    );
}
