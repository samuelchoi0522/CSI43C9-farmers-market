import { searchVendorTransactions, type VendorTransaction } from "@/lib/api/transactions";
import type { VendorDefaults } from "@/lib/api/defaults";

export function monthRangeStrings(d = new Date()) {
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

/**
 * Single calendar day (YYYY-MM-DD) for the most recent Saturday in local time.
 * If today is Saturday, returns today; otherwise the prior Saturday.
 */
export function mostRecentSaturdayDate(d = new Date()): string {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = local.getDay();
  const daysBack = (day + 1) % 7;
  local.setDate(local.getDate() - daysBack);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`;
}

/** start/end both set to {@link mostRecentSaturdayDate} for API range queries. */
export function mostRecentSaturdayRange(d = new Date()) {
  const date = mostRecentSaturdayDate(d);
  return { start: date, end: date };
}

function parsePct(s: string | undefined) {
  const n = parseFloat(s || "0");
  return Number.isFinite(n) ? n : 0;
}

export function allocateReportedByCategory(
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

export async function fetchTransactionsInRange(start: string, end: string): Promise<VendorTransaction[]> {
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
