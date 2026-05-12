"use client";

import { useEffect, useMemo, useState } from "react";
import SidebarNavigation from "./components/SidebarNavigation";
import CategorySalesChart from "./components/CategorySalesChart";
import MarketGoalsWidget from "./components/MarketGoalsWidget";
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
import { fetchAllDefaultsFromApi, fetchAllVendorsFromApi } from "@/lib/vendorDirectoryFetch";

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
    const [allVendors, setAllVendors] = useState<VendorWithDefaults[]>([]);
    const [allVendorsLoading, setAllVendorsLoading] = useState(true);
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
            .map(([category, sales]) => ({
                category,
                sales: Math.round(sales * 100) / 100,
            }))
            .sort((a, b) => b.sales - a.sales);
    }, [transactions, defaultsByVendor]);

    const vendorsForAlerts = allVendors.length > 0 ? allVendors : vendors;

    const dashboardAlerts = useMemo(() => {
        const alerts: { tone: "amber" | "slate"; title: string; detail: string }[] = [];
        if (transactions.length === 0 && !txError) {
            alerts.push({
                tone: "slate",
                title: "No transactions this market day",
                detail: `No vendor transaction rows for ${marketDayLabel}. Data will appear once transactions are recorded for that Saturday.`,
            });
        }
        const inactiveWithTx = vendorsForAlerts.filter(
            (v) => !v.isActive && (vendorTxTotals.get(v.id)?.reported ?? 0) > 0,
        );
        for (const v of inactiveWithTx.slice(0, 2)) {
            alerts.push({
                tone: "amber",
                title: `Inactive vendor with sales: ${v.vendorName}`,
                detail: "This vendor has reported sales on this market day but is marked inactive.",
            });
        }
        const activeNoSales = vendorsForAlerts.filter(
            (v) => v.isActive && (vendorTxTotals.get(v.id)?.reported ?? 0) === 0,
        );
        for (const v of activeNoSales.slice(0, 3)) {
            alerts.push({
                tone: "slate",
                title: `No sales recorded: ${v.vendorName}`,
                detail: "Active vendor with no reported sales on this market day.",
            });
        }
        return alerts.slice(0, 5);
    }, [transactions.length, txError, marketDayLabel, vendorsForAlerts, vendorTxTotals]);

    const filteredVendors = useMemo(() => {
        if (searchQuery.trim() === "") {
            return vendors;
        }
        const q = searchQuery.trim().toLowerCase();
        return allVendors.filter(
            (v) =>
                v.vendorName?.toLowerCase().includes(q) ||
                v.pointPerson?.toLowerCase().includes(q) ||
                v.email?.toLowerCase().includes(q) ||
                v.location?.toLowerCase().includes(q) ||
                v.products?.toLowerCase().includes(q),
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

    const categorySalesTotal = useMemo(
        () => categoryChartData.reduce((s, r) => s + r.sales, 0),
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

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setAllVendorsLoading(true);
            try {
                const [vendorsList, defaultsList] = await Promise.all([
                    fetchAllVendorsFromApi(false),
                    fetchAllDefaultsFromApi(),
                ]);
                if (cancelled) {
                    return;
                }
                const merged = vendorsList.map((v) => ({
                    ...v,
                    defaults: defaultsList.find((d) => d.vendorId === v.id),
                }));
                setAllVendors(merged);
            } catch (e) {
                console.error("Error loading full vendor list for dashboard search:", e);
            } finally {
                if (!cancelled) {
                    setAllVendorsLoading(false);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [marketSaturday]);

    useEffect(() => {
        setCurrentPage(0);
    }, [searchQuery]);

    useEffect(() => {
        if (searchQuery.trim() === "") {
            return;
        }
        const maxPage = Math.max(0, Math.ceil(filteredVendors.length / pageSize) - 1);
        setCurrentPage((p) => Math.min(p, maxPage));
    }, [filteredVendors.length, searchQuery, pageSize]);

    const tableLoading =
        loading || (searchQuery.trim() !== "" && allVendorsLoading);

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
                                className="font-semibold text-inherit"
                            />
                            <span>transaction rows</span>
                        </p>
                    </div>
                </div>

                <CategorySalesChart data={categoryChartData} />

                <MarketGoalsWidget />

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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tableLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                            Loading vendors...
                                        </td>
                                    </tr>
                                ) : vendors.length === 0 && searchQuery.trim() === "" ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                            No vendors found
                                        </td>
                                    </tr>
                                ) : displayedVendors.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                            No vendors match your search.
                                        </td>
                                    </tr>
                                ) : (
                                    displayedVendors.map((vendor) => (
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
                                    Showing{" "}
                                    {filteredVendors.length === 0
                                        ? 0
                                        : currentPage * pageSize + 1}{" "}
                                    to{" "}
                                    {Math.min((currentPage + 1) * pageSize, filteredVendors.length)} of{" "}
                                    {filteredVendors.length} matching vendors
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
                                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                            >
                                Previous
                            </Button>
                            {Array.from({ length: Math.min(effectiveTotalPages, 5) }, (_, i) => {
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
                            })}
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
            </main>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <DashboardContent />
    );
}
