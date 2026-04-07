"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Doughnut } from "react-chartjs-2";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from "recharts";
import SidebarNavigation from "@/app/components/SidebarNavigation";
import Button from "@/app/components/Button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Vendor, getVendor } from "@/lib/api/vendor";
import {
    getVendorTransactionsByVendor,
    type VendorTransaction,
} from "@/lib/api/transactions";
import {
    CategoryLabel,
    getAllCategoryLabels,
    getVendorCategoryLabels,
    addLabelsToVendor,
    removeLabelFromVendor,
    createCategoryLabel,
    updateCategoryLabel,
    deleteCategoryLabel,
} from "@/lib/api/vendorLabels";
import LabelPickerDialog from "../../components/LabelPickerDialog";
import { EditVendorDialog } from "@/app/components/EditVendorDialog";
import { getLabelColors } from "@/lib/labelColors";
import { SmoothCurrencyValue } from "@/lib/smoothNumbers";

export function generateStaticParams() {
  return [{ uuid: 'template' }];
}

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

// Set Chart.js defaults for consistent light-mode styling
if (typeof window !== "undefined") {
    ChartJS.defaults.color = "#64748b";
    ChartJS.defaults.font.family = "Inter, sans-serif";
}

async function fetchAllVendorTransactions(vendorId: string): Promise<VendorTransaction[]> {
    const pageSize = 500;
    let page = 0;
    const all: VendorTransaction[] = [];
    let totalPages = 1;
    do {
        const res = await getVendorTransactionsByVendor(vendorId, page, pageSize);
        const chunk = res.data ?? [];
        all.push(...chunk);
        totalPages = res.totalPages ?? 1;
        page += 1;
    } while (page < totalPages);
    return all;
}

function formatMarketTableDate(isoDate: string) {
    try {
        return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return isoDate;
    }
}

function TrendReportedSalesValue({
    targetReported,
    resetKey,
}: {
    targetReported: number;
    resetKey: unknown;
}) {
    return (
        <SmoothCurrencyValue
            value={targetReported}
            resetKey={resetKey}
            className="inline-flex flex-wrap items-baseline justify-center gap-0 sm:justify-start text-4xl sm:text-5xl font-bold tabular-nums tracking-tight leading-none min-h-[3.25rem] sm:min-h-[4rem] text-slate-900 dark:text-slate-100"
        />
    );
}

type TrendPoint = { fullDate: string; date: string; reported: number };

interface MarketSession {
    id: string;
    marketDate: string;
    present: boolean;
    snapVoucher: number | null;
    dufbVoucher: number | null;
    wdfmTokens: number | null;
    reimbDue: number | null;
    reportedSales: number | null;
    produceDollar: number | null;
}

interface VendorAnalytics {
    attendanceRate: number;
    avgDailySales: number;
    topSellingMonth: string;
    snapTotal: number;
    salesTrend: TrendPoint[];
    paymentBreakdown: {
        cashCard: number;
        snapVouchers: number;
        marketTokens: number;
    };
    marketHistory: MarketSession[];
}

function aggregateVendorAnalytics(txs: VendorTransaction[]): VendorAnalytics {
    if (txs.length === 0) {
        return {
            attendanceRate: 0,
            avgDailySales: 0,
            topSellingMonth: "—",
            snapTotal: 0,
            salesTrend: [],
            paymentBreakdown: { cashCard: 0, snapVouchers: 0, marketTokens: 0 },
            marketHistory: [],
        };
    }

    const sorted = [...txs].sort((a, b) => b.marketDate.localeCompare(a.marketDate));

    const marketHistory: MarketSession[] = sorted.slice(0, 100).map((t) => ({
        id: t.id,
        marketDate: formatMarketTableDate(t.marketDate),
        present: t.present,
        snapVoucher: t.snap ?? null,
        dufbVoucher: t.dufb ?? null,
        wdfmTokens: t.wdfmTokens ?? null,
        reimbDue: t.reimbursementDue ?? null,
        reportedSales: t.reportedSales ?? null,
        produceDollar: t.estProduceSales ?? null,
    }));

    let totalReported = 0;
    let totalSnap = 0;
    let totalDufb = 0;
    let totalWdfm = 0;
    let totalVoucher = 0;
    let presentCount = 0;
    let daysWithSales = 0;

    for (const t of txs) {
        const rep = t.reportedSales ?? 0;
        const sn = t.snap ?? 0;
        const du = t.dufb ?? 0;
        const wf = t.wdfmTokens ?? 0;
        const vo = t.voucher ?? 0;
        totalReported += rep;
        totalSnap += sn;
        totalDufb += du;
        totalWdfm += wf;
        totalVoucher += vo;
        if (t.present) presentCount += 1;
        if (rep > 0) daysWithSales += 1;
    }

    const tokenLike = totalDufb + totalWdfm + totalVoucher;
    const cashCard = Math.max(0, totalReported - totalSnap - totalDufb - totalWdfm - totalVoucher);

    const attendanceRate =
        txs.length > 0 ? Math.round((presentCount / txs.length) * 1000) / 10 : 0;

    const avgDailySales =
        daysWithSales > 0 ? Math.round((totalReported / daysWithSales) * 100) / 100 : 0;

    const byDate = new Map<string, number>();
    for (const t of txs) {
        const d = t.marketDate;
        byDate.set(d, (byDate.get(d) ?? 0) + (t.reportedSales ?? 0));
    }
    const sortedDates = [...byDate.keys()].sort();
    const salesTrend = sortedDates.map((date) => ({
        fullDate: date,
        date: date.slice(5),
        reported: Math.round((byDate.get(date) ?? 0) * 100) / 100,
    }));

    const byMonth = new Map<string, number>();
    for (const t of txs) {
        const ym = t.marketDate.slice(0, 7);
        byMonth.set(ym, (byMonth.get(ym) ?? 0) + (t.reportedSales ?? 0));
    }
    let topYm = "";
    let topVal = 0;
    for (const [ym, v] of byMonth) {
        if (v > topVal) {
            topVal = v;
            topYm = ym;
        }
    }
    const topSellingMonth =
        topYm !== ""
            ? new Date(`${topYm}-01T12:00:00`).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
              })
            : "—";

    return {
        attendanceRate,
        avgDailySales,
        topSellingMonth,
        snapTotal: Math.round(totalSnap * 100) / 100,
        salesTrend,
        paymentBreakdown: {
            cashCard: Math.round(cashCard * 100) / 100,
            snapVouchers: Math.round(totalSnap * 100) / 100,
            marketTokens: Math.round(tokenLike * 100) / 100,
        },
        marketHistory,
    };
}

function VendorDetailContent() {
    const params = useParams();
    const uuid = params.uuid as string;
    const { user, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [transactions, setTransactions] = useState<VendorTransaction[]>([]);
    const [pageError, setPageError] = useState<string | null>(null);
    const [txError, setTxError] = useState<string | null>(null);

    const [allLabels, setAllLabels] = useState<CategoryLabel[]>([]);
    const [vendorLabels, setVendorLabels] = useState<CategoryLabel[]>([]);
    const [labelsLoading, setLabelsLoading] = useState(false);
    const [labelError, setLabelError] = useState<string | null>(null);
    const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const analytics = useMemo(() => aggregateVendorAnalytics(transactions), [transactions]);

    type TrendFocusState = { current: TrendPoint };
    const [trendFocus, setTrendFocus] = useState<TrendFocusState | null>(null);
    const pendingTrendRowRef = useRef<TrendPoint | null>(null);
    const trendChartMoveRafRef = useRef(0);

    const syncTrendFocusToLatest = useCallback(() => {
        const t = analytics.salesTrend;
        if (t.length === 0) {
            setTrendFocus(null);
            return;
        }
        const last = t[t.length - 1];
        setTrendFocus({ current: last });
    }, [analytics.salesTrend]);

    useEffect(() => {
        syncTrendFocusToLatest();
    }, [syncTrendFocusToLatest]);

    const handleTrendChartMouseMove = useCallback(
        (state: { activeTooltipIndex?: number; activePayload?: { payload?: TrendPoint }[] }) => {
            const t = analytics.salesTrend;
            const idx = state.activeTooltipIndex;
            const fromIndex = idx != null && idx >= 0 ? t[idx] : undefined;
            const fromPayload = state.activePayload?.[0]?.payload;
            const row: TrendPoint | undefined =
                fromIndex ??
                (fromPayload?.fullDate != null && typeof fromPayload.reported === "number"
                    ? fromPayload
                    : undefined);
            if (!row) {
                return;
            }
            pendingTrendRowRef.current = row;
            if (!trendChartMoveRafRef.current) {
                trendChartMoveRafRef.current = requestAnimationFrame(() => {
                    trendChartMoveRafRef.current = 0;
                    const r = pendingTrendRowRef.current;
                    if (r) {
                        setTrendFocus({ current: r });
                    }
                });
            }
        },
        [analytics.salesTrend],
    );

    const handleTrendChartMouseLeave = useCallback(() => {
        cancelAnimationFrame(trendChartMoveRafRef.current);
        trendChartMoveRafRef.current = 0;
        pendingTrendRowRef.current = null;
        syncTrendFocusToLatest();
    }, [syncTrendFocusToLatest]);

    const normalizeLabelName = (name: string) => name.trim().toLowerCase();

    useEffect(() => {
        const fetchVendorAndLabels = async () => {
            setLabelsLoading(true);
            setLabelError(null);
            setPageError(null);
            setTxError(null);
            setVendor(null);
            setTransactions([]);
            try {
                const [vendorResp, allLabelsResp, vendorLabelsResp, txs] = await Promise.all([
                    getVendor(uuid),
                    getAllCategoryLabels(),
                    getVendorCategoryLabels(uuid),
                    fetchAllVendorTransactions(uuid).catch((err) => {
                        console.error("Vendor transactions:", err);
                        setTxError("Could not load transaction history.");
                        return [] as VendorTransaction[];
                    }),
                ]);

                setVendor(vendorResp);
                setTransactions(txs);
                setAllLabels(allLabelsResp);
                setVendorLabels(vendorLabelsResp);
            } catch (err) {
                console.error("Error loading vendor or labels:", err);
                setPageError("Failed to load this vendor. It may have been removed.");
                setLabelError("Failed to load vendor labels.");
            } finally {
                setLabelsLoading(false);
            }
        };

        fetchVendorAndLabels();
    }, [uuid]);

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

    const formatCurrency = (value: number | null) => {
        if (value === null) return "-";
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
    };

    const formatNumber = (value: number | null) => {
        if (value === null) return "-";
        return value.toLocaleString("en-US");
    };

    // Payment Breakdown Chart Data
    const paymentBreakdownData = {
        labels: ["Other (est.)", "SNAP", "DUFB+WDFM+Voucher"],
        datasets: [
            {
                data: [
                    analytics.paymentBreakdown.cashCard,
                    analytics.paymentBreakdown.snapVouchers,
                    analytics.paymentBreakdown.marketTokens,
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

    if (labelsLoading && !vendor) {
        return (
            <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen flex transition-colors duration-300">
                <SidebarNavigation activeItem="Vendors" />
                <main className="flex-1 flex items-center justify-center p-8">
                    <p className="text-slate-500 dark:text-slate-400">Loading vendor…</p>
                </main>
            </div>
        );
    }

    if (pageError && !vendor) {
        return (
            <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen flex transition-colors duration-300">
                <SidebarNavigation activeItem="Vendors" />
                <main className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                    <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">{pageError}</p>
                    <Link
                        href="/vendors"
                        className="text-sm font-semibold text-[#10b981] hover:underline"
                    >
                        Back to vendors
                    </Link>
                </main>
            </div>
        );
    }

    if (!vendor) {
        return null;
    }

    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen flex transition-colors duration-300">
            <SidebarNavigation activeItem="Vendors" />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-[1440px] mx-auto px-6 py-8">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div>
                            <nav className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider transition-colors duration-300">
                                <Link
                                    href="/vendors"
                                    className="hover:text-[#10b981] transition-colors duration-300"
                                >
                                    Vendors
                                </Link>
                                <span className="material-icons text-xs transition-colors duration-300">
                                    chevron_right
                                </span>
                                <span className="text-slate-400 dark:text-slate-300 transition-colors duration-300">
                                    {vendor.vendorName}
                                </span>
                            </nav>
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-bold">{vendor.vendorName}</h1>
                                {vendor.isActive ? (
                                    <span 
                                        className="px-3 py-1 rounded-full text-xs font-bold text-[#10b981]"
                                        style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                                    >
                                        ACTIVE
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-200">
                                        INACTIVE
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                {vendor.pointPerson ? `Contact: ${vendor.pointPerson}` : ""}
                            </p>
                            {vendor.products ? (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                    Products: {vendor.products}
                                </p>
                            ) : null}
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
                                onClick={() => setIsEditDialogOpen(true)}
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
                                    <span className="text-sm font-medium hidden md:block text-slate-900 dark:text-slate-100 transition-colors duration-300">
                                        {userName}
                                    </span>
                                    <span className="material-icons text-lg leading-none text-slate-600">
                                        {showUserMenu ? "expand_less" : "expand_more"}
                                    </span>
                                </Button>
                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                                        <div className="px-4 py-2 border-b border-slate-200">
                                            <p className="text-sm font-semibold text-slate-900">
                                                {userName}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleLogout}
                                            variant="ghost"
                                            size="sm"
                                            className="w-full flex items-center gap-2 text-red-600 hover:bg-red-50"
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

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Reported sales by market date */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                            <h4 className="font-bold text-lg mb-1 text-slate-900 dark:text-slate-100">
                                Reported sales by market date
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                Daily totals for this vendor — move your cursor over the chart to see each day.
                            </p>
                            {txError ? (
                                <p className="text-sm text-amber-700 dark:text-amber-300 py-8 text-center">
                                    {txError}
                                </p>
                            ) : analytics.salesTrend.length === 0 ? (
                                <p className="text-sm text-slate-600 dark:text-slate-400 py-8 text-center">
                                    No transactions yet — chart will populate when market days are recorded.
                                </p>
                            ) : (
                                <>
                                    <div className="mb-6 text-center sm:text-left">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                            Reported sales
                                        </p>
                                        {trendFocus != null ? (
                                            <TrendReportedSalesValue
                                                targetReported={trendFocus.current.reported}
                                                resetKey={uuid}
                                            />
                                        ) : (
                                            <p
                                                className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100 leading-none"
                                                style={{ fontFeatureSettings: '"tnum"' }}
                                            >
                                                —
                                            </p>
                                        )}
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 min-h-[1.25rem]">
                                            {trendFocus != null ? (
                                                <>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                        {formatMarketTableDate(trendFocus.current.fullDate)}
                                                    </span>
                                                    <span className="text-slate-400 dark:text-slate-500"> · </span>
                                                    <span className="text-slate-500">Market day</span>
                                                </>
                                            ) : null}
                                        </p>
                                    </div>
                                    <div className="h-56 sm:h-64 -mx-1">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={analytics.salesTrend}
                                                margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                                                onMouseMove={handleTrendChartMouseMove}
                                                onMouseLeave={handleTrendChartMouseLeave}
                                            >
                                                <defs>
                                                    <linearGradient
                                                        id="colorVendorDetailRep"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1"
                                                    >
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid
                                                    strokeDasharray="4 4"
                                                    stroke="#e2e8f0"
                                                    className="dark:stroke-slate-600"
                                                />
                                                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                                <YAxis
                                                    tick={{ fontSize: 11 }}
                                                    stroke="#94a3b8"
                                                    tickFormatter={(v) =>
                                                        `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                                                    }
                                                />
                                                <RechartsTooltip
                                                    cursor={{ stroke: "#10b981", strokeWidth: 1 }}
                                                    content={() => null}
                                                    isAnimationActive={false}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="reported"
                                                    stroke="#10b981"
                                                    strokeWidth={2}
                                                    fillOpacity={1}
                                                    fill="url(#colorVendorDetailRep)"
                                                    activeDot={{
                                                        r: 6,
                                                        stroke: "#ffffff",
                                                        strokeWidth: 2,
                                                        fill: "#10b981",
                                                    }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Payment Breakdown Chart */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-bold mb-1">Payment Breakdown</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Reported sales split: remainder after SNAP, DUFB, WDFM, and voucher fields (all-time).
                            </p>
                            <div className="h-64 flex items-center justify-center mb-6">
                                {analytics.paymentBreakdown.cashCard +
                                    analytics.paymentBreakdown.snapVouchers +
                                    analytics.paymentBreakdown.marketTokens <=
                                0 ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center px-4">
                                        No payment totals to chart yet.
                                    </p>
                                ) : (
                                    <Doughnut
                                        data={paymentBreakdownData}
                                        options={paymentBreakdownOptions}
                                    />
                                )}
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-[#10b981]"></span>
                                        <span>Other / cash-card (est.)</span>
                                    </div>
                                    <span className="font-bold">
                                        {formatCurrency(analytics.paymentBreakdown.cashCard)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                        <span>SNAP</span>
                                    </div>
                                    <span className="font-bold">
                                        {formatCurrency(analytics.paymentBreakdown.snapVouchers)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                        <span>DUFB + WDFM + Voucher</span>
                                    </div>
                                    <span className="font-bold">
                                        {formatCurrency(analytics.paymentBreakdown.marketTokens)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vendor Labels + Summary Cards */}
                    <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Vendor Labels spanning height */}
                        <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                            <div>
                                <h2 className="text-base font-semibold">Vendor Labels</h2>
                                <p className="text-xs text-slate-500">
                                    Manage category labels assigned to this vendor.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsLabelDialogOpen(true)}
                                    >
                                        Manage Labels
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {vendorLabels.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic">
                                            No labels applied to this vendor.
                                        </p>
                                    ) : (
                                        vendorLabels.map((label) => {
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
                                {labelsLoading ? (
                                    <p className="text-sm text-slate-500">
                                        Loading labels...
                                    </p>
                                ) : labelError ? (
                                    <p className="text-sm text-red-500">{labelError}</p>
                                ) : null}
                            </div>
                        </div>

                        {/* Right: Summary cards in 2x2 grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Top Selling Month */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                <div
                                    className="text-purple-600 p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110"
                                    style={{ backgroundColor: 'rgba(243, 232, 255, 0.5)' }}
                                >
                                        <span className="material-icons leading-none">trending_up</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">
                                    Top Selling Month
                                </p>
                                <h3 className="text-lg font-bold mt-1">
                                    {analytics.topSellingMonth}
                                </h3>
                            </div>

                            {/* SNAP Transactions */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                <div
                                    className="text-pink-600 p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110"
                                    style={{ backgroundColor: 'rgba(252, 231, 243, 0.5)' }}
                                >
                                        <span className="material-icons leading-none">receipt_long</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    Total SNAP (reported)
                                </p>
                                <h3 className="text-lg font-bold mt-1">
                                    {formatCurrency(analytics.snapTotal)}
                                </h3>
                            </div>

                            {/* Attendance Rate */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                <div
                                    className="text-blue-600 p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110"
                                    style={{ backgroundColor: 'rgba(219, 234, 254, 0.5)' }}
                                >
                                        <span className="material-icons leading-none">calendar_today</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    Attendance rate
                                </p>
                                <h3 className="text-lg font-bold mt-1">
                                    {analytics.attendanceRate}%
                                </h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                    Present ÷ transaction rows (all-time)
                                </p>
                            </div>

                            {/* Avg Daily Sales */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="bg-[#10b981]/10 text-[#10b981] p-2 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110">
                                        <span className="material-icons leading-none">payments</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    Avg. reported sales / market day
                                </p>
                                <h3 className="text-lg font-bold mt-1">
                                    {formatCurrency(analytics.avgDailySales)}
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* Market History Recap Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">
                                Market History Recap
                            </h2>
                            <div className="relative">
                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                                    search
                                </span>
                                    <input
                                        className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm w-64 text-slate-700 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-[#10b981] focus:border-[#10b981] transition-colors duration-300"
                                        placeholder="Search sessions..."
                                        type="text"
                                    />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
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
                                    {txError ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-amber-700 dark:text-amber-300 text-sm">
                                                {txError}
                                            </td>
                                        </tr>
                                    ) : analytics.marketHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-slate-500 text-sm">
                                                No market days on file for this vendor.
                                            </td>
                                        </tr>
                                    ) : null}
                                    {!txError &&
                                        analytics.marketHistory.map((session) => (
                                        <tr
                                            key={session.id}
                                            className="hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
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
                        <div className="p-4 bg-slate-50 flex justify-center">
                            <button className="text-sm font-bold text-[#10b981] hover:underline">
                                View All Sessions
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <EditVendorDialog
                vendor={vendor}
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onSuccess={async () => {
                    try {
                        const [v, txs] = await Promise.all([
                            getVendor(uuid),
                            fetchAllVendorTransactions(uuid),
                        ]);
                        setVendor(v);
                        setTransactions(txs);
                    } catch (e) {
                        console.error(e);
                    }
                }}
            />

            <LabelPickerDialog
                isOpen={isLabelDialogOpen}
                onOpenChange={setIsLabelDialogOpen}
                title="Labels"
                description="Assign labels to this vendor"
                labels={allLabels}
                checkedIds={vendorLabels.map((label) => label.id)}
                loading={labelsLoading}
                error={labelError}
                onToggle={async (label, nextChecked) => {
                    if (!vendor) return;
                    try {
                        if (nextChecked) {
                            await addLabelsToVendor(vendor.id, [label.id]);
                            setVendorLabels((prev) =>
                                prev.find((item) => item.id === label.id)
                                    ? prev
                                    : [...prev, label],
                            );
                        } else {
                            await removeLabelFromVendor(vendor.id, label.id);
                            setVendorLabels((prev) => prev.filter((item) => item.id !== label.id));
                        }
                        setLabelError(null);
                    } catch (err) {
                        console.error("Error updating label:", err);
                        setLabelError("Failed to update label.");
                    }
                }}
                onCreate={async (name, color) => {
                    if (!vendor) return;
                    const trimmed = name.trim();
                    if (!trimmed) return;

                    const existingGlobal = allLabels.find(
                        (label) => normalizeLabelName(label.name) === normalizeLabelName(trimmed),
                    );
                    if (existingGlobal) {
                        const vendorHas = vendorLabels.some(
                            (label) =>
                                normalizeLabelName(label.name) ===
                                normalizeLabelName(existingGlobal.name),
                        );
                        if (!vendorHas) {
                            await addLabelsToVendor(vendor.id, [existingGlobal.id]);
                            setVendorLabels((prev) =>
                                prev.find((item) => item.id === existingGlobal.id)
                                    ? prev
                                    : [...prev, existingGlobal],
                            );
                        } else {
                            setLabelError("That label name is already applied.");
                        }
                        return;
                    }

                    const created = await createCategoryLabel(trimmed, color);
                    const normalized = color ? { ...created, color } : created;
                    setAllLabels((prev) => [...prev, normalized]);
                    await addLabelsToVendor(vendor.id, [created.id]);
                    setVendorLabels((prev) =>
                        prev.find((item) => item.id === created.id)
                            ? prev
                            : [...prev, normalized],
                    );
                }}
                onEdit={async (label, name, color) => {
                    const trimmed = name.trim();
                    if (!trimmed) return;
                    const updated = await updateCategoryLabel(label.id, trimmed, color);
                    const normalized = color ? { ...updated, color } : updated;
                    setAllLabels((prev) =>
                        prev.map((item) => (item.id === normalized.id ? normalized : item)),
                    );
                    setVendorLabels((prev) =>
                        prev.map((item) => (item.id === normalized.id ? normalized : item)),
                    );
                }}
                onDelete={async (label) => {
                    await deleteCategoryLabel(label.id);
                    setAllLabels((prev) => prev.filter((item) => item.id !== label.id));
                    setVendorLabels((prev) => prev.filter((item) => item.id !== label.id));
                }}
            />
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
