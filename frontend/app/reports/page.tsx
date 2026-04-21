"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import SidebarNavigation from "../components/SidebarNavigation";
import Button from "../components/Button";
import { searchVendorTransactions, type VendorTransaction } from "@/lib/api/transactions";
import { getAllVendorDefaults, type VendorDefaults } from "@/lib/api/defaults";
import { getVendorCategoryLabels } from "@/lib/api/vendorLabels";
import { getLabelColors, type LabelColorStyle } from "@/lib/labelColors";
import {
  formatCurrency,
  REPORT_NUM_INTRO_MS,
  SmoothCurrencyValue,
  SmoothIntegerValue,
  TREND_REPORTED_SMOOTH_MS,
  useSmoothNumber,
} from "@/lib/smoothNumbers";
import { downloadFinancialReportPdf } from "@/lib/reportPdf";

type VendorLabelReportRow = {
  name: string;
  value: number;
  /** Same palette for chart, table, and filter chips */
  palette: LabelColorStyle;
};

type ReportType =
  | "comprehensive"
  | "category"
  | "vendorLabel"
  | "leaderboard"
  | "vendor"
  | "token";

const REPORT_TABS: { id: ReportType; label: string }[] = [
  { id: "comprehensive", label: "Comprehensive" },
  { id: "category", label: "Category" },
  { id: "vendorLabel", label: "Vendor Label" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "vendor", label: "By Vendor" },
  { id: "token", label: "Token (SNAP, DUFB, etc)" },
];

function monthRangeStrings(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    start: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    end: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
  };
}

function formatMarketDateLabel(isoDate: string) {
  try {
    const d = new Date(`${isoDate}T12:00:00`);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return isoDate;
  }
}

function PaymentShareRow({
  name,
  pct,
  fill,
  resetKey,
}: {
  name: string;
  pct: number;
  fill: string;
  resetKey: unknown;
}) {
  const smooth = useSmoothNumber(pct, resetKey, TREND_REPORTED_SMOOTH_MS, REPORT_NUM_INTRO_MS);
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold mb-1 uppercase tracking-wide text-slate-900 dark:text-slate-100">
        <span className="pr-2">{name}</span>
        <span style={{ fontFeatureSettings: '"tnum"' }}>{smooth.toFixed(1)}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, smooth)}%`, backgroundColor: fill }}
        />
      </div>
    </div>
  );
}

type LeaderboardListRowData = {
  vendorId: string;
  vendorName: string;
  rank: number;
  totalSales: number;
  transactionCount: number;
  pctOfTop: number;
};

function LeaderboardListRow({ row, resetKey }: { row: LeaderboardListRowData; resetKey: unknown }) {
  const smoothRank = useSmoothNumber(row.rank, resetKey, TREND_REPORTED_SMOOTH_MS, REPORT_NUM_INTRO_MS);
  const smoothSales = useSmoothNumber(row.totalSales, resetKey, TREND_REPORTED_SMOOTH_MS, REPORT_NUM_INTRO_MS);
  const smoothTx = useSmoothNumber(row.transactionCount, resetKey, TREND_REPORTED_SMOOTH_MS, REPORT_NUM_INTRO_MS);
  const smoothPctBar = useSmoothNumber(row.pctOfTop, resetKey, TREND_REPORTED_SMOOTH_MS, REPORT_NUM_INTRO_MS);
  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-green-50/80 dark:hover:bg-green-900/15 transition-colors">
      <div className="flex items-center gap-3 min-w-0 sm:w-44 shrink-0">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
            row.rank <= 3
              ? "bg-[#10b981]/15 text-[#10b981] ring-2 ring-[#10b981]/30"
              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          }`}
          aria-hidden
          style={{ fontFeatureSettings: '"tnum"' }}
        >
          {Math.round(smoothRank)}
        </span>
        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{row.vendorName}</span>
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <div className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#10b981]/90 transition-all"
            style={{ width: `${Math.min(100, smoothPctBar)}%` }}
          />
        </div>
        <div className="text-right shrink-0 w-28">
          <p className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm" style={{ fontFeatureSettings: '"tnum"' }}>
            {formatCurrency(smoothSales)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400" style={{ fontFeatureSettings: '"tnum"' }}>
            {Math.round(smoothTx)} trans
          </p>
        </div>
      </div>
    </li>
  );
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

function parsePct(s: string | undefined) {
  const n = parseFloat(s || "0");
  return Number.isFinite(n) ? n : 0;
}

function allocateReportedByCategory(
  reportedSales: number,
  defaults: VendorDefaults | undefined,
): Record<string, number> {
  if (!defaults) {
    return { Uncategorized: reportedSales };
  }
  const buckets: Record<string, number> = {
    Agricultural: parsePct(defaults.pctAgricultural),
    "Prepared food": parsePct(defaults.pctPreparedFood),
    Handmade: parsePct(defaults.pctHandmade),
    "Cottage goods": parsePct(defaults.pctCottageGoods),
    Manufactured: parsePct(defaults.pctManufactured),
  };
  const sum = Object.values(buckets).reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    return { Uncategorized: reportedSales };
  }
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(buckets)) {
    if (v > 0) {
      out[k] = reportedSales * (v / sum);
    }
  }
  return Object.keys(out).length ? out : { Uncategorized: reportedSales };
}

async function fetchTransactionsInRange(start: string, end: string): Promise<VendorTransaction[]> {
  const pageSize = 500;
  let page = 0;
  const all: VendorTransaction[] = [];
  let totalPages = 1;
  do {
    const res = await searchVendorTransactions({
      startMarketDate: start,
      endMarketDate: end,
      page,
      size: pageSize,
    });
    const chunk = res.data ?? [];
    all.push(...chunk);
    totalPages = res.totalPages ?? 1;
    page += 1;
  } while (page < totalPages);
  return all;
}

function ReportsContent() {
  const [reportType, setReportType] = useState<ReportType>("comprehensive");
  const { start: defaultStart, end: defaultEnd } = monthRangeStrings();
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [transactions, setTransactions] = useState<VendorTransaction[]>([]);
  const [defaultsByVendor, setDefaultsByVendor] = useState<Map<string, VendorDefaults>>(new Map());
  const [labelsByVendor, setLabelsByVendor] = useState<
    Map<string, { id: number; name: string; color?: string | null }[]>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [labelsLoading, setLabelsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** When true, vendor label chart/table show every label; when false, only names in `vendorLabelWhitelist`. */
  const [showAllVendorLabels, setShowAllVendorLabels] = useState(true);
  const [vendorLabelWhitelist, setVendorLabelWhitelist] = useState<Set<string>>(new Set());
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const comprehensiveTrendChartRef = useRef<HTMLDivElement | null>(null);
  const categoryAllocatedChartRef = useRef<HTMLDivElement | null>(null);
  const categoryTrendChartRef = useRef<HTMLDivElement | null>(null);
  const vendorTrendChartRef = useRef<HTMLDivElement | null>(null);
  const vendorTotalsChartRef = useRef<HTMLDivElement | null>(null);
  const vendorLabelChartRef = useRef<HTMLDivElement | null>(null);
  const tokenChartRef = useRef<HTMLDivElement | null>(null);

  const dateRangeKey = useMemo(() => `${startDate}|${endDate}`, [startDate, endDate]);

  const loadCore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tx, defaultsRes] = await Promise.all([
        fetchTransactionsInRange(startDate, endDate),
        getAllVendorDefaults(0, 1000),
      ]);
      setTransactions(tx);
      const map = new Map<string, VendorDefaults>();
      const list = defaultsRes.data ?? [];
      for (const d of list) {
        map.set(d.vendorId, d);
      }
      setDefaultsByVendor(map);
    } catch (e) {
      console.error(e);
      setError("Could not load financial data for this range. Try another date range or check your connection.");
      setTransactions([]);
      setDefaultsByVendor(new Map());
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadCore();
  }, [loadCore]);

  const vendorIds = useMemo(() => {
    const s = new Set<string>();
    for (const t of transactions) {
      s.add(t.vendorId);
    }
    return [...s];
  }, [transactions]);

  useEffect(() => {
    if (vendorIds.length === 0) {
      setLabelsByVendor(new Map());
      return;
    }
    let cancelled = false;
    setLabelsLoading(true);
    (async () => {
      const m = new Map<string, { id: number; name: string; color?: string | null }[]>();
      await Promise.all(
        vendorIds.map(async (vid) => {
          try {
            const labels = await getVendorCategoryLabels(vid);
            if (!cancelled) {
              m.set(
                vid,
                labels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
              );
            }
          } catch {
            if (!cancelled) m.set(vid, []);
          }
        }),
      );
      if (!cancelled) {
        setLabelsByVendor(m);
        setLabelsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vendorIds]);

  const comprehensive = useMemo(() => {
    let totalReported = 0;
    let totalReimbursement = 0;
    let totalSnap = 0;
    let totalDufb = 0;
    let totalWdfm = 0;
    let totalVoucher = 0;
    const byDate = new Map<string, number>();

    for (const t of transactions) {
      totalReported += t.reportedSales ?? 0;
      totalReimbursement += t.reimbursementDue ?? 0;
      totalSnap += t.snap ?? 0;
      totalDufb += t.dufb ?? 0;
      totalWdfm += t.wdfmTokens ?? 0;
      totalVoucher += t.voucher ?? 0;
      const d = t.marketDate;
      byDate.set(d, (byDate.get(d) ?? 0) + (t.reportedSales ?? 0));
    }

    const sortedDates = [...byDate.keys()].sort();
    const trend = sortedDates.map((date) => ({
      fullDate: date,
      date: date.slice(5),
      reported: Math.round((byDate.get(date) ?? 0) * 100) / 100,
    }));

    const tokenVolume = totalSnap + totalDufb + totalWdfm + totalVoucher;
    const nonTokenApprox = Math.max(0, totalReported - tokenVolume);
    const denom = totalReported || 1;
    const tokenShare = (tokenVolume / denom) * 100;
    const otherShare = (nonTokenApprox / denom) * 100;

    return {
      totalReported,
      totalReimbursement,
      totalSnap,
      totalDufb,
      totalWdfm,
      totalVoucher,
      tokenVolume,
      trend,
      paymentShare: [
        { name: "Token programs (SNAP, DUFB, WDFM, voucher)", pct: Math.min(100, tokenShare), fill: "#10b981" },
        { name: "Other reported sales", pct: Math.min(100, otherShare), fill: "#94a3b8" },
      ],
    };
  }, [transactions]);

  type TrendPoint = { fullDate: string; date: string; reported: number };

  type TrendFocusState = { current: TrendPoint };

  const [trendFocus, setTrendFocus] = useState<TrendFocusState | null>(null);

  const pendingTrendRowRef = useRef<TrendPoint | null>(null);
  const trendChartMoveRafRef = useRef(0);

  const syncTrendFocusToLatest = useCallback(() => {
    const t = comprehensive.trend;
    if (t.length === 0) {
      setTrendFocus(null);
      return;
    }
    const last = t[t.length - 1];
    setTrendFocus({ current: last });
  }, [comprehensive.trend]);

  useEffect(() => {
    syncTrendFocusToLatest();
  }, [syncTrendFocusToLatest]);

  const handleTrendChartMouseMove = useCallback(
    (state: { activeTooltipIndex?: number; activePayload?: { payload?: TrendPoint }[] }) => {
      const t = comprehensive.trend;
      const idx = state.activeTooltipIndex;
      const fromIndex = idx != null && idx >= 0 ? t[idx] : undefined;
      const fromPayload = state.activePayload?.[0]?.payload;
      const row: TrendPoint | undefined =
        fromIndex ??
        (fromPayload?.fullDate != null && typeof fromPayload.reported === "number" ? fromPayload : undefined);
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
    [comprehensive.trend],
  );

  const handleTrendChartMouseLeave = useCallback(() => {
    cancelAnimationFrame(trendChartMoveRafRef.current);
    trendChartMoveRafRef.current = 0;
    pendingTrendRowRef.current = null;
    syncTrendFocusToLatest();
  }, [syncTrendFocusToLatest]);

  const categoryRows = useMemo(() => {
    const agg: Record<string, number> = {};
    for (const t of transactions) {
      const def = defaultsByVendor.get(t.vendorId);
      const parts = allocateReportedByCategory(t.reportedSales ?? 0, def);
      for (const [k, v] of Object.entries(parts)) {
        agg[k] = (agg[k] ?? 0) + v;
      }
    }
    return Object.entries(agg)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, defaultsByVendor]);

  const categoryTrendColors = useMemo(
    () => ({
      Agricultural: "#10b981",
      "Prepared food": "#3b82f6",
      Handmade: "#f59e0b",
      "Cottage goods": "#ec4899",
      Manufactured: "#8b5cf6",
    }),
    [],
  );

  // Keep the category colors consistent across both charts.
  // Bar chart uses the dynamic `categoryRows` order, so we must color by category name (not array index).
  const getCategoryColor = (name: string) => {
    const color = (categoryTrendColors as Record<string, string>)[name];
    return color ?? "#94a3b8"; // fallback for unexpected/uncategorized values
  };

  const categoryTrend = useMemo(() => {
    const byDate = new Map<string, Record<string, number>>();
    for (const t of transactions) {
      const def = defaultsByVendor.get(t.vendorId);
      const parts = allocateReportedByCategory(t.reportedSales ?? 0, def);
      const d = t.marketDate;
      let row = byDate.get(d);
      if (!row) {
        row = {};
        byDate.set(d, row);
      }
      for (const [k, v] of Object.entries(parts)) {
        row[k] = (row[k] ?? 0) + v;
      }
    }

    const sortedDates = [...byDate.keys()].sort();
    const categoryKeys = Object.keys(categoryTrendColors);

    return sortedDates.map((date) => {
      const row = byDate.get(date) ?? {};
      const out: Record<string, number | string> = {
        fullDate: date,
        date: date.slice(5),
      };
      for (const k of categoryKeys) {
        out[k] = Math.round((row[k] ?? 0) * 100) / 100;
      }
      return out as {
        fullDate: string;
        date: string;
        [key: string]: number | string;
      };
    });
  }, [transactions, defaultsByVendor, categoryTrendColors]);

  const vendorLabelRowsFull = useMemo((): VendorLabelReportRow[] => {
    const colorByName = new Map<string, string | null | undefined>();
    for (const labels of labelsByVendor.values()) {
      for (const l of labels) {
        if (!colorByName.has(l.name)) {
          colorByName.set(l.name, l.color ?? null);
        }
      }
    }

    const agg: Record<string, number> = {};
    for (const t of transactions) {
      const sales = t.reportedSales ?? 0;
      const labels = labelsByVendor.get(t.vendorId) ?? [];
      if (labels.length === 0) {
        agg["Unlabeled"] = (agg["Unlabeled"] ?? 0) + sales;
        continue;
      }
      const share = sales / labels.length;
      for (const l of labels) {
        agg[l.name] = (agg[l.name] ?? 0) + share;
      }
    }
    return Object.entries(agg)
      .map(([name, value]) => {
        const apiColor = name === "Unlabeled" ? null : (colorByName.get(name) ?? null);
        return {
          name,
          value: Math.round(value * 100) / 100,
          palette: getLabelColors(name, apiColor),
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, labelsByVendor]);

  const vendorLabelRows = useMemo(() => {
    if (showAllVendorLabels) {
      return vendorLabelRowsFull;
    }
    return vendorLabelRowsFull.filter((r) => vendorLabelWhitelist.has(r.name));
  }, [vendorLabelRowsFull, showAllVendorLabels, vendorLabelWhitelist]);

  const toggleVendorLabelInWhitelist = (name: string, checked: boolean) => {
    setVendorLabelWhitelist((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(name);
      } else {
        next.delete(name);
      }
      return next;
    });
  };

  const handleShowAllVendorLabelsChange = (showAll: boolean) => {
    setShowAllVendorLabels(showAll);
    if (!showAll) {
      setVendorLabelWhitelist(new Set(vendorLabelRowsFull.map((r) => r.name)));
    }
  };

  const vendorLeaderboard = useMemo(() => {
    const byVendor = new Map<
      string,
      { vendorId: string; vendorName: string; totalSales: number; transactionCount: number }
    >();
    for (const t of transactions) {
      const id = t.vendorId;
      const sales = t.reportedSales ?? 0;
      const prev = byVendor.get(id);
      if (!prev) {
        byVendor.set(id, {
          vendorId: id,
          vendorName: t.vendorName,
          totalSales: sales,
          transactionCount: 1,
        });
      } else {
        prev.totalSales += sales;
        prev.transactionCount += 1;
      }
    }
    const sorted = [...byVendor.values()].sort((a, b) => b.totalSales - a.totalSales);
    const maxSales = sorted[0]?.totalSales ?? 0;
    return sorted.map((row, i) => ({
      ...row,
      rank: i + 1,
      totalSales: Math.round(row.totalSales * 100) / 100,
      pctOfTop: maxSales > 0 ? Math.round((row.totalSales / maxSales) * 1000) / 10 : 0,
    }));
  }, [transactions]);

  const vendorReportRows = useMemo(() => {
    const byVendor = new Map<
      string,
      {
        vendorId: string;
        vendorName: string;
        totalReported: number;
        totalReimbursement: number;
        tokenVolume: number;
        transactionCount: number;
      }
    >();

    for (const t of transactions) {
      const id = t.vendorId;
      const prev = byVendor.get(id);
      const reported = t.reportedSales ?? 0;
      const reimbursement = t.reimbursementDue ?? 0;
      const tokenVolume = (t.snap ?? 0) + (t.dufb ?? 0) + (t.wdfmTokens ?? 0) + (t.voucher ?? 0);

      if (!prev) {
        byVendor.set(id, {
          vendorId: id,
          vendorName: t.vendorName,
          totalReported: reported,
          totalReimbursement: reimbursement,
          tokenVolume,
          transactionCount: 1,
        });
      } else {
        prev.totalReported += reported;
        prev.totalReimbursement += reimbursement;
        prev.tokenVolume += tokenVolume;
        prev.transactionCount += 1;
      }
    }

    return [...byVendor.values()]
      .sort((a, b) => b.totalReported - a.totalReported)
      .map((r, i) => ({
        ...r,
        rank: i + 1,
        totalReported: Math.round(r.totalReported * 100) / 100,
        totalReimbursement: Math.round(r.totalReimbursement * 100) / 100,
        tokenVolume: Math.round(r.tokenVolume * 100) / 100,
      }));
  }, [transactions]);

  useEffect(() => {
    if (reportType !== "vendor") return;
    if (vendorReportRows.length === 0) {
      setSelectedVendorId("");
      return;
    }
    if (!selectedVendorId || !vendorReportRows.some((r) => r.vendorId === selectedVendorId)) {
      setSelectedVendorId(vendorReportRows[0].vendorId);
    }
  }, [reportType, vendorReportRows, selectedVendorId]);

  const selectedVendorRow = useMemo(() => {
    if (vendorReportRows.length === 0) return null;
    return vendorReportRows.find((r) => r.vendorId === selectedVendorId) ?? vendorReportRows[0];
  }, [vendorReportRows, selectedVendorId]);

  const vendorBarChartRows = useMemo(
    () =>
      vendorReportRows.slice(0, 12).map((r) => ({
        name: r.vendorName.length > 18 ? `${r.vendorName.slice(0, 18)}…` : r.vendorName,
        value: r.totalReported,
      })),
    [vendorReportRows],
  );

  type VendorTrendPoint = { fullDate: string; date: string; reported: number };
  type VendorTrendFocusState = { current: VendorTrendPoint };

  const [vendorTrendFocus, setVendorTrendFocus] = useState<VendorTrendFocusState | null>(null);
  const pendingVendorTrendRowRef = useRef<VendorTrendPoint | null>(null);
  const vendorTrendChartMoveRafRef = useRef(0);

  const vendorTrendResetKey = useMemo(() => `${selectedVendorId}|${startDate}|${endDate}`, [selectedVendorId, startDate, endDate]);

  const vendorTrend = useMemo(() => {
    if (!selectedVendorId) return [];
    const byDate = new Map<string, number>();
    for (const t of transactions) {
      if (t.vendorId !== selectedVendorId) continue;
      const d = t.marketDate;
      byDate.set(d, (byDate.get(d) ?? 0) + (t.reportedSales ?? 0));
    }

    const sortedDates = [...byDate.keys()].sort();
    return sortedDates.map((date) => {
      const v = byDate.get(date) ?? 0;
      return {
        fullDate: date,
        date: date.slice(5),
        reported: Math.round(v * 100) / 100,
      };
    });
  }, [transactions, selectedVendorId]);

  const syncVendorTrendFocusToLatest = useCallback(() => {
    if (vendorTrend.length === 0) {
      setVendorTrendFocus(null);
      return;
    }
    setVendorTrendFocus({
      current: vendorTrend[vendorTrend.length - 1],
    });
  }, [vendorTrend]);

  useEffect(() => {
    if (reportType === "vendor") {
      syncVendorTrendFocusToLatest();
    }
  }, [reportType, syncVendorTrendFocusToLatest]);

  const handleVendorTrendChartMouseMove = useCallback(
    (state: { activeTooltipIndex?: number; activePayload?: { payload?: VendorTrendPoint }[] }) => {
      const t = vendorTrend;
      const idx = state.activeTooltipIndex;
      const fromIndex = idx != null && idx >= 0 ? t[idx] : undefined;
      const fromPayload = state.activePayload?.[0]?.payload;
      const row: VendorTrendPoint | undefined =
        fromIndex ??
        (fromPayload?.fullDate != null && typeof fromPayload.reported === "number" ? fromPayload : undefined);

      if (!row) return;
      pendingVendorTrendRowRef.current = row;

      if (!vendorTrendChartMoveRafRef.current) {
        vendorTrendChartMoveRafRef.current = requestAnimationFrame(() => {
          vendorTrendChartMoveRafRef.current = 0;
          const r = pendingVendorTrendRowRef.current;
          if (r) {
            setVendorTrendFocus({ current: r });
          }
        });
      }
    },
    [vendorTrend],
  );

  const handleVendorTrendChartMouseLeave = useCallback(() => {
    cancelAnimationFrame(vendorTrendChartMoveRafRef.current);
    vendorTrendChartMoveRafRef.current = 0;
    pendingVendorTrendRowRef.current = null;
    syncVendorTrendFocusToLatest();
  }, [syncVendorTrendFocusToLatest]);

  const tokenRows = useMemo(
    () => [
      {
        name: "SNAP",
        amount: transactions.reduce((s, t) => s + (t.snap ?? 0), 0),
      },
      {
        name: "DUFB",
        amount: transactions.reduce((s, t) => s + (t.dufb ?? 0), 0),
      },
      {
        name: "WDFM tokens",
        amount: transactions.reduce((s, t) => s + (t.wdfmTokens ?? 0), 0),
      },
      {
        name: "Voucher",
        amount: transactions.reduce((s, t) => s + (t.voucher ?? 0), 0),
      },
    ],
    [transactions],
  );

  const tokenTotal = tokenRows.reduce((s, r) => s + r.amount, 0);

  const reportHeadline = useMemo(() => {
    switch (reportType) {
      case "comprehensive":
        return {
          title: "Market overview",
          subtitle:
            "Holistic view of reported sales, reimbursement, and program tokens across all vendors in the selected period.",
        };
      case "category":
        return {
          title: "Sales by product category",
          subtitle:
            "Reported sales allocated using each vendor’s default category percentages (agricultural, prepared food, handmade, cottage goods, manufactured).",
        };
      case "vendorLabel":
        return {
          title: "Sales by vendor label",
          subtitle:
            "Reported sales allocated to labels assigned to each vendor. When a vendor has multiple labels, sales are split evenly across them. Filter which labels appear in the chart and table.",
        };
      case "leaderboard":
        return {
          title: "Vendor sales leaderboard",
          subtitle:
            "Vendors ranked by total reported sales in the selected date range (summed across all market days).",
        };
      case "vendor":
        return {
          title: "Vendor reports",
          subtitle: "Choose a vendor to see reported sales by market date (scrub the chart).",
        };
      case "token":
        return {
          title: "Token & program totals",
          subtitle: "SNAP, DUFB, WDFM, and voucher amounts summed across all transactions in range.",
        };
      default:
        return { title: "", subtitle: "" };
    }
  }, [reportType]);

  const sortedTxForTable = useMemo(() => {
    return [...transactions].sort((a, b) => b.marketDate.localeCompare(a.marketDate));
  }, [transactions]);

  const chartSvgToPngDataUrl = useCallback(async (container: HTMLDivElement | null): Promise<string | null> => {
    if (!container) return null;
    const svg = container.querySelector("svg");
    if (!svg) return null;

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
    clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clonedSvg.setAttribute("width", String(width));
    clonedSvg.setAttribute("height", String(height));
    clonedSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const serialized = new XMLSerializer().serializeToString(clonedSvg);
    const svgBase64 = window.btoa(unescape(encodeURIComponent(serialized)));
    const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

    const image = new Image();
    image.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("chart image load failed"));
      image.src = svgDataUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/png", 0.92);
  }, []);

  const handleExportPdf = async () => {
    if (loading) return;
    setExportingPdf(true);
    try {
      const headline = reportHeadline;
      const base = {
        startDate,
        endDate,
        reportTitle: headline.title,
        reportSubtitle: headline.subtitle,
      };
      switch (reportType) {
        case "comprehensive":
          {
            const trendChart = await chartSvgToPngDataUrl(comprehensiveTrendChartRef.current);
          await downloadFinancialReportPdf({
            reportType: "comprehensive",
            ...base,
            comprehensive: {
              totalReported: comprehensive.totalReported,
              totalReimbursement: comprehensive.totalReimbursement,
              tokenVolume: comprehensive.tokenVolume,
              paymentShare: comprehensive.paymentShare,
            },
            sortedTxForTable,
            chartImages: trendChart
              ? [{ title: "Reported sales by market date", dataUrl: trendChart }]
              : [],
          });
          }
          break;
        case "category":
          {
            const [allocatedChart, trendChart] = await Promise.all([
              chartSvgToPngDataUrl(categoryAllocatedChartRef.current),
              chartSvgToPngDataUrl(categoryTrendChartRef.current),
            ]);
          await downloadFinancialReportPdf({
            reportType: "category",
            ...base,
            categoryRows,
            chartImages: [
              allocatedChart ? { title: "Allocated reported sales", dataUrl: allocatedChart } : null,
              trendChart ? { title: "Category trends by market date", dataUrl: trendChart } : null,
            ].filter((v): v is { title: string; dataUrl: string } => v != null),
          });
          }
          break;
        case "vendorLabel":
          {
            const labelChart = await chartSvgToPngDataUrl(vendorLabelChartRef.current);
          await downloadFinancialReportPdf({
            reportType: "vendorLabel",
            ...base,
            vendorLabelRows,
            chartImages: labelChart
              ? [{ title: "Allocated reported sales by label", dataUrl: labelChart }]
              : [],
          });
          }
          break;
        case "leaderboard":
          await downloadFinancialReportPdf({
            reportType: "leaderboard",
            ...base,
            vendorLeaderboard,
          });
          break;
        case "vendor":
          {
            const [trendChart, totalsChart] = await Promise.all([
              chartSvgToPngDataUrl(vendorTrendChartRef.current),
              chartSvgToPngDataUrl(vendorTotalsChartRef.current),
            ]);
          await downloadFinancialReportPdf({
            reportType: "vendor",
            ...base,
            selectedVendorRow,
            vendorReportRows,
            chartImages: [
              trendChart ? { title: "Reported sales by market date", dataUrl: trendChart } : null,
              totalsChart ? { title: "Reported sales by vendor", dataUrl: totalsChart } : null,
            ].filter((v): v is { title: string; dataUrl: string } => v != null),
          });
          }
          break;
        case "token":
          {
            const tokenTotalsChart = await chartSvgToPngDataUrl(tokenChartRef.current);
          await downloadFinancialReportPdf({
            reportType: "token",
            ...base,
            tokenRows,
            tokenTotal,
            sortedTxForTable,
            chartImages: tokenTotalsChart
              ? [{ title: "Combined token programs", dataUrl: tokenTotalsChart }]
              : [],
          });
          }
          break;
        default:
          break;
      }
    } catch (e) {
      console.error(e);
      alert("Could not generate the PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen flex transition-colors duration-300 print:bg-white">
      <div className="print:hidden">
        <SidebarNavigation activeItem="Reports" />
      </div>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Financial reports</h2>
            <p className="text-slate-700 dark:text-slate-400 text-sm mt-0.5">
              Summaries from vendor transactions
            </p>
          </div>
        </header>

        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="min-w-0 flex-1">
            <nav
              className="flex flex-wrap gap-x-6 gap-y-1 mb-4 border-b border-slate-200 dark:border-slate-700"
              aria-label="Report type"
            >
              {REPORT_TABS.map((tab) => {
                const active = reportType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setReportType(tab.id)}
                    className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                      active
                        ? "border-[#10b981] text-[#10b981]"
                        : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">{reportHeadline.title}</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              {reportHeadline.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0 print:hidden">
            <div className="flex items-center gap-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-sm">
              <label className="sr-only" htmlFor="report-start">
                Start date
              </label>
              <input
                id="report-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-sm font-medium outline-none w-[9.5rem]"
              />
              <span className="text-slate-400">–</span>
              <label className="sr-only" htmlFor="report-end">
                End date
              </label>
              <input
                id="report-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-sm font-medium outline-none w-[9.5rem]"
              />
            </div>
            <Button
              type="button"
              variant="primary"
              className="flex items-center gap-2 shadow-md"
              onClick={handleExportPdf}
              disabled={loading || exportingPdf}
            >
              <span className="material-icons text-lg leading-none">
                {exportingPdf ? "hourglass_empty" : "download"}
              </span>
              {exportingPdf ? "Generating PDF…" : "Export PDF"}
            </Button>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-600 dark:text-slate-400">
            <span className="material-icons animate-spin mr-2 leading-none">progress_activity</span>
            Loading report data…
          </div>
        ) : (
          <>
            {reportType === "comprehensive" && (
              <>
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                      Total reported sales
                    </p>
                    <SmoothCurrencyValue
                      value={comprehensive.totalReported}
                      resetKey={dateRangeKey}
                      className="block text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100"
                    />
                    <p className="text-xs text-slate-600 dark:text-slate-500 mt-2">Sum of reported sales in range</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                      Total reimbursement due
                    </p>
                    <SmoothCurrencyValue
                      value={comprehensive.totalReimbursement}
                      resetKey={dateRangeKey}
                      className="block text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100"
                    />
                    <p className="text-xs text-slate-600 dark:text-slate-500 mt-2">Across all vendors</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                      Program token volume
                    </p>
                    <SmoothCurrencyValue
                      value={comprehensive.tokenVolume}
                      resetKey={dateRangeKey}
                      className="block text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100"
                    />
                    <p className="text-xs text-slate-900 dark:text-slate-100 mt-2">
                      SNAP + DUFB + WDFM + voucher
                    </p>
                  </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h4 className="font-bold text-lg mb-1 text-slate-900 dark:text-slate-100">Reported sales by market date</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Daily totals in the selected range — move your cursor over the chart to see each day.
                    </p>
                    {comprehensive.trend.length === 0 ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400 py-8 text-center">No transactions in this range.</p>
                    ) : (
                      <>
                        <div className="mb-6 text-center sm:text-left">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                            Reported sales
                          </p>
                          {trendFocus != null ? (
                            <TrendReportedSalesValue
                              targetReported={trendFocus.current.reported}
                              resetKey={dateRangeKey}
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
                                  {formatMarketDateLabel(trendFocus.current.fullDate)}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500"> · </span>
                                <span className="text-slate-500">Market day</span>
                              </>
                            ) : null}
                          </p>
                        </div>
                        <div ref={comprehensiveTrendChartRef} className="h-56 sm:h-64 -mx-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={comprehensive.trend}
                              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                              onMouseMove={handleTrendChartMouseMove}
                              onMouseLeave={handleTrendChartMouseLeave}
                            >
                              <defs>
                                <linearGradient id="colorRep" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" className="dark:stroke-slate-600" />
                              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                              <YAxis
                                tick={{ fontSize: 11 }}
                                stroke="#94a3b8"
                                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                              />
                              <Tooltip
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
                                fill="url(#colorRep)"
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
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h4 className="font-bold text-lg mb-4 text-slate-900 dark:text-slate-100">Token share of reported sales</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                      Approximate split (token fields vs. remainder of reported sales). For a precise token report, use the
                      Token tab.
                    </p>
                    <div className="space-y-4">
                      {comprehensive.paymentShare.map((row) => (
                        <PaymentShareRow
                          key={row.name}
                          name={row.name}
                          pct={row.pct}
                          fill={row.fill}
                          resetKey={dateRangeKey}
                        />
                      ))}
                    </div>
                  </div>
                </section>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100">Transactions</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Newest first (up to{" "}
                      <SmoothIntegerValue
                        value={sortedTxForTable.length}
                        resetKey={dateRangeKey}
                        className="font-semibold text-slate-800 dark:text-slate-200"
                      />{" "}
                      rows loaded)
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        <tr>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Vendor</th>
                          <th className="px-6 py-3 text-right">Reported</th>
                          <th className="px-6 py-3 text-right">Reimbursement</th>
                          <th className="px-6 py-3 text-right">SNAP</th>
                          <th className="px-6 py-3 text-right">DUFB</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {sortedTxForTable.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                              No rows for this range.
                            </td>
                          </tr>
                        ) : (
                          sortedTxForTable.map((t) => (
                            <tr key={t.id} className="hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                              <td className="px-6 py-3 whitespace-nowrap">{t.marketDate}</td>
                              <td className="px-6 py-3 whitespace-nowrap">{t.vendorName}</td>
                              <td className="px-6 py-3 text-right font-mono">
                                <SmoothCurrencyValue
                                  value={t.reportedSales ?? 0}
                                  resetKey={dateRangeKey}
                                  className="font-mono"
                                />
                              </td>
                              <td className="px-6 py-3 text-right font-mono">
                                <SmoothCurrencyValue
                                  value={t.reimbursementDue ?? 0}
                                  resetKey={dateRangeKey}
                                  className="font-mono"
                                />
                              </td>
                              <td className="px-6 py-3 text-right font-mono">
                                <SmoothCurrencyValue value={t.snap ?? 0} resetKey={dateRangeKey} className="font-mono" />
                              </td>
                              <td className="px-6 py-3 text-right font-mono">
                                <SmoothCurrencyValue value={t.dufb ?? 0} resetKey={dateRangeKey} className="font-mono" />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {reportType === "category" && (
              <>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-8">
                  <h4 className="font-bold text-lg mb-6 text-slate-900 dark:text-slate-100">Allocated reported sales</h4>
                  {categoryRows.length === 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">No data for this range.</p>
                  ) : (
                    <div ref={categoryAllocatedChartRef} className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryRows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" className="dark:stroke-slate-600" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            stroke="#94a3b8"
                            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                          />
                          <Tooltip formatter={(v: number) => [formatCurrency(v), "Allocated"]} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {categoryRows.map((r) => (
                              <Cell key={r.name} fill={getCategoryColor(r.name)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                      Category trends by market date
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Allocated sales per category, per day.
                    </p>
                  </div>
                  {categoryTrend.length === 0 ? (
                    <p className="p-8 text-sm text-slate-600 dark:text-slate-400 text-center">No data for this range.</p>
                  ) : (
                    <div ref={categoryTrendChartRef} className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={categoryTrend}
                          margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" className="dark:stroke-slate-600" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            stroke="#94a3b8"
                            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                          />
                          <Tooltip
                            isAnimationActive={false}
                            formatter={(v: unknown, name: unknown) => {
                              const num = typeof v === "number" ? v : parseFloat(String(v));
                              return [formatCurrency(Number.isFinite(num) ? num : 0), String(name)];
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="Agricultural"
                            stroke={categoryTrendColors.Agricultural}
                            strokeWidth={2}
                            fill="none"
                            fillOpacity={0}
                            dot={false}
                          />
                          <Area
                            type="monotone"
                            dataKey="Prepared food"
                            stroke={categoryTrendColors["Prepared food"]}
                            strokeWidth={2}
                            fill="none"
                            fillOpacity={0}
                            dot={false}
                          />
                          <Area
                            type="monotone"
                            dataKey="Handmade"
                            stroke={categoryTrendColors.Handmade}
                            strokeWidth={2}
                            fill="none"
                            fillOpacity={0}
                            dot={false}
                          />
                          <Area
                            type="monotone"
                            dataKey="Cottage goods"
                            stroke={categoryTrendColors["Cottage goods"]}
                            strokeWidth={2}
                            fill="none"
                            fillOpacity={0}
                            dot={false}
                          />
                          <Area
                            type="monotone"
                            dataKey="Manufactured"
                            stroke={categoryTrendColors.Manufactured}
                            strokeWidth={2}
                            fill="none"
                            fillOpacity={0}
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-3 text-left">Category</th>
                        <th className="px-6 py-3 text-right">Allocated sales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {categoryRows.map((r) => (
                        <tr key={r.name}>
                          <td className="px-6 py-3">{r.name}</td>
                          <td className="px-6 py-3 text-right font-mono">
                            <SmoothCurrencyValue value={r.value} resetKey={dateRangeKey} className="font-mono" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {reportType === "vendor" && (
              <>
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="min-w-0">
                        <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100">Reported sales by market date</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Pick a vendor, then scrub the chart to see each day.
                        </p>
                      </div>
                      <label className="flex flex-col gap-1 w-full sm:w-72">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                          Vendor
                        </span>
                        <select
                          value={selectedVendorId}
                          onChange={(e) => setSelectedVendorId(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100"
                          disabled={vendorReportRows.length === 0}
                        >
                          {vendorReportRows.map((r) => (
                            <option key={r.vendorId} value={r.vendorId}>
                              {r.vendorName}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {vendorTrend.length === 0 ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400 py-10 text-center">No vendor data for this range.</p>
                    ) : (
                      <>
                        <div className="mt-6 mb-6 text-center sm:text-left">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                            Reported sales
                          </p>
                          {vendorTrendFocus != null ? (
                            <TrendReportedSalesValue
                              targetReported={vendorTrendFocus.current.reported}
                              resetKey={vendorTrendResetKey}
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
                            {vendorTrendFocus != null ? (
                              <>
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {formatMarketDateLabel(vendorTrendFocus.current.fullDate)}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500"> · </span>
                                <span className="text-slate-500">Market day</span>
                              </>
                            ) : null}
                          </p>
                        </div>

                        <div ref={vendorTrendChartRef} className="h-56 sm:h-64 -mx-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={vendorTrend}
                              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                              onMouseMove={handleVendorTrendChartMouseMove}
                              onMouseLeave={handleVendorTrendChartMouseLeave}
                            >
                              <defs>
                                <linearGradient id="colorVendorRep" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" className="dark:stroke-slate-600" />
                              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                              <YAxis
                                tick={{ fontSize: 11 }}
                                stroke="#94a3b8"
                                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                              />
                              <Tooltip
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
                                fill="url(#colorVendorRep)"
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

                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-slate-100">Vendor totals</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Range totals for the selected vendor.</p>
                    {selectedVendorRow == null ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400">No vendor data for this range.</p>
                    ) : (
                      <div className="space-y-5">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                            Total reported sales
                          </p>
                          <SmoothCurrencyValue
                            value={selectedVendorRow.totalReported}
                            resetKey={dateRangeKey}
                            className="text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                            Total reimbursement due
                          </p>
                          <SmoothCurrencyValue
                            value={selectedVendorRow.totalReimbursement}
                            resetKey={dateRangeKey}
                            className="text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                            Program token volume
                          </p>
                          <SmoothCurrencyValue
                            value={selectedVendorRow.tokenVolume}
                            resetKey={dateRangeKey}
                            className="text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100"
                          />
                          <p className="text-xs text-slate-900 dark:text-slate-100 mt-2">SNAP + DUFB + WDFM + voucher</p>
                        </div>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Transactions in range:{" "}
                            <SmoothIntegerValue
                              value={selectedVendorRow.transactionCount}
                              resetKey={dateRangeKey}
                              className="font-semibold text-slate-900 dark:text-slate-100"
                            />
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-8">
                  <h4 className="font-bold text-lg mb-6 text-slate-900 dark:text-slate-100">Reported sales by vendor</h4>
                  {vendorBarChartRows.length === 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">No vendor data for this range.</p>
                  ) : (
                    <div ref={vendorTotalsChartRef} className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={vendorBarChartRows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" className="dark:stroke-slate-600" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11 }}
                            stroke="#94a3b8"
                            interval={0}
                            angle={-25}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            stroke="#94a3b8"
                            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                          />
                          <Tooltip formatter={(v: number) => [formatCurrency(v), "Reported"]} />
                          <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {vendorReportRows.length > 12 ? (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">
                      Showing top 12 vendors by reported sales. Use the table below for the full list.
                    </p>
                  ) : null}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-3 text-left w-16">Rank</th>
                        <th className="px-6 py-3 text-left">Vendor</th>
                        <th className="px-6 py-3 text-right">Reported</th>
                        <th className="px-6 py-3 text-right">Reimbursement</th>
                        <th className="px-6 py-3 text-right">Tokens</th>
                        <th className="px-6 py-3 text-right">Trans</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {vendorReportRows.map((r) => (
                        <tr key={r.vendorId} className="hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                          <td className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">
                            <SmoothIntegerValue value={r.rank} resetKey={dateRangeKey} />
                          </td>
                          <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100">{r.vendorName}</td>
                          <td className="px-6 py-3 text-right font-mono">
                            <SmoothCurrencyValue value={r.totalReported} resetKey={dateRangeKey} className="font-mono" />
                          </td>
                          <td className="px-6 py-3 text-right font-mono">
                            <SmoothCurrencyValue
                              value={r.totalReimbursement}
                              resetKey={dateRangeKey}
                              className="font-mono"
                            />
                          </td>
                          <td className="px-6 py-3 text-right font-mono">
                            <SmoothCurrencyValue value={r.tokenVolume} resetKey={dateRangeKey} className="font-mono" />
                          </td>
                          <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">
                            <SmoothIntegerValue value={r.transactionCount} resetKey={dateRangeKey} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {reportType === "vendorLabel" && (
              <>
                {labelsLoading && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
                    <span className="material-icons animate-spin text-base leading-none">progress_activity</span>
                    Loading vendor labels…
                  </p>
                )}
                {vendorLabelRowsFull.length > 0 && (
                  <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Labels to display</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          Label colors match your catalog. Turn off &quot;Show all labels&quot; to filter the chart and
                          table.
                        </p>
                      </div>
                      <label className="flex shrink-0 items-center gap-2.5 cursor-pointer select-none rounded-lg border border-[#10b981]/25 bg-[#10b981]/10 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={showAllVendorLabels}
                          onChange={(e) => handleShowAllVendorLabelsChange(e.target.checked)}
                          className="rounded border-slate-300 text-[#10b981] focus:ring-[#10b981]"
                        />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Show all labels</span>
                      </label>
                    </div>
                    {!showAllVendorLabels && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                            Choose labels
                          </span>
                          <div className="ml-auto flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setVendorLabelWhitelist(new Set(vendorLabelRowsFull.map((r) => r.name)))}
                              className="text-xs font-semibold text-[#10b981] hover:underline"
                            >
                              Select all
                            </button>
                            <button
                              type="button"
                              onClick={() => setVendorLabelWhitelist(new Set())}
                              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                              Clear all
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {vendorLabelRowsFull.map((row) => {
                            const on = vendorLabelWhitelist.has(row.name);
                            const { palette } = row;
                            return (
                              <label
                                key={row.name}
                                className="group flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200/90 dark:border-slate-700 px-3 py-2.5 transition-all"
                                style={{
                                  borderLeftWidth: 4,
                                  borderLeftColor: palette.borderColor,
                                  backgroundColor: `color-mix(in srgb, ${palette.backgroundColor} ${on ? 18 : 12}%, transparent)`,
                                  ...(on
                                    ? {
                                        boxShadow: `0 0 0 2px color-mix(in srgb, ${palette.backgroundColor} 38%, transparent)`,
                                      }
                                    : {}),
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={(e) => toggleVendorLabelInWhitelist(row.name, e.target.checked)}
                                  className="rounded border-slate-300 text-[#10b981] focus:ring-[#10b981] shrink-0"
                                />
                                <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-slate-900 dark:text-slate-100">
                                  {row.name}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-8">
                  <h4 className="font-bold text-lg mb-6 text-slate-900 dark:text-slate-100">Allocated reported sales by label</h4>
                  {vendorLabelRowsFull.length === 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">No data for this range.</p>
                  ) : vendorLabelRows.length === 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      No labels selected. Turn on &quot;Show all labels&quot; or choose at least one label above.
                    </p>
                  ) : (
                    <div ref={vendorLabelChartRef} className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={vendorLabelRows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" className="dark:stroke-slate-600" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            stroke="#94a3b8"
                            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                          />
                          <Tooltip formatter={(v: number) => [formatCurrency(v), "Allocated"]} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {vendorLabelRows.map((row, i) => (
                              <Cell key={`${row.name}-${i}`} fill={row.palette.backgroundColor} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-3 text-left">Label</th>
                        <th className="px-6 py-3 text-right">Allocated sales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {vendorLabelRows.map((r) => (
                        <tr key={r.name} className="hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center gap-2.5">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: r.palette.backgroundColor,
                                  boxShadow: `0 0 0 1px ${r.palette.borderColor}`,
                                }}
                                aria-hidden
                              />
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {r.name}
                              </span>
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right font-mono">
                            <SmoothCurrencyValue value={r.value} resetKey={dateRangeKey} className="font-mono" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {reportType === "leaderboard" && (
              <>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100">Sales ranking</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Total reported sales per vendor (all transactions in range combined).
                    </p>
                  </div>
                  {vendorLeaderboard.length === 0 ? (
                    <p className="p-8 text-sm text-slate-600 dark:text-slate-400 text-center">No vendor data for this range.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                      {vendorLeaderboard.map((row) => (
                        <LeaderboardListRow key={row.vendorId} row={row} resetKey={dateRangeKey} />
                      ))}
                    </ul>
                  )}
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-3 text-left w-16">Rank</th>
                        <th className="px-6 py-3 text-left">Vendor</th>
                        <th className="px-6 py-3 text-right">Total reported sales</th>
                        <th className="px-6 py-3 text-right">Transactions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {vendorLeaderboard.map((row) => (
                        <tr key={row.vendorId} className="hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                          <td className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">
                            <SmoothIntegerValue value={row.rank} resetKey={dateRangeKey} />
                          </td>
                          <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100">{row.vendorName}</td>
                          <td className="px-6 py-3 text-right font-mono">
                            <SmoothCurrencyValue value={row.totalSales} resetKey={dateRangeKey} className="font-mono" />
                          </td>
                          <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">
                            <SmoothIntegerValue value={row.transactionCount} resetKey={dateRangeKey} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {reportType === "token" && (
              <>
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {tokenRows.map((r) => (
                    <div
                      key={r.name}
                      className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        {r.name}
                      </p>
                      <SmoothCurrencyValue
                        value={r.amount}
                        resetKey={dateRangeKey}
                        className="block text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  ))}
                </section>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-8">
                  <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-slate-100">Combined token programs</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Total across SNAP, DUFB, WDFM, and voucher fields</p>
                  <SmoothCurrencyValue
                    value={tokenTotal}
                    resetKey={dateRangeKey}
                    className="block text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100"
                  />
                  {tokenTotal > 0 && (
                    <div ref={tokenChartRef} className="h-72 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tokenRows} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" className="dark:stroke-slate-600" />
                          <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v: number) => [formatCurrency(v), "Amount"]} />
                          <Bar dataKey="amount" fill="#10b981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100">Per-transaction tokens</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        <tr>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Vendor</th>
                          <th className="px-6 py-3 text-right">SNAP</th>
                          <th className="px-6 py-3 text-right">DUFB</th>
                          <th className="px-6 py-3 text-right">WDFM</th>
                          <th className="px-6 py-3 text-right">Voucher</th>
                          <th className="px-6 py-3 text-right">Row total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {sortedTxForTable.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                              No rows for this range.
                            </td>
                          </tr>
                        ) : (
                          sortedTxForTable.map((t) => {
                            const rowTot =
                              (t.snap ?? 0) + (t.dufb ?? 0) + (t.wdfmTokens ?? 0) + (t.voucher ?? 0);
                            return (
                              <tr key={t.id} className="hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                                <td className="px-6 py-3 whitespace-nowrap">{t.marketDate}</td>
                                <td className="px-6 py-3 whitespace-nowrap">{t.vendorName}</td>
                                <td className="px-6 py-3 text-right font-mono">
                                  <SmoothCurrencyValue value={t.snap ?? 0} resetKey={dateRangeKey} className="font-mono" />
                                </td>
                                <td className="px-6 py-3 text-right font-mono">
                                  <SmoothCurrencyValue value={t.dufb ?? 0} resetKey={dateRangeKey} className="font-mono" />
                                </td>
                                <td className="px-6 py-3 text-right font-mono">
                                  <SmoothCurrencyValue
                                    value={t.wdfmTokens ?? 0}
                                    resetKey={dateRangeKey}
                                    className="font-mono"
                                  />
                                </td>
                                <td className="px-6 py-3 text-right font-mono">
                                  <SmoothCurrencyValue value={t.voucher ?? 0} resetKey={dateRangeKey} className="font-mono" />
                                </td>
                                <td className="px-6 py-3 text-right font-mono font-semibold">
                                  <SmoothCurrencyValue value={rowTot} resetKey={dateRangeKey} className="font-mono font-semibold" />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function ReportsPage() {
  return (
      <ReportsContent />
  );
}
