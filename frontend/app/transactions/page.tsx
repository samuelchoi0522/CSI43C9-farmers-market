"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Loader2, MoreHorizontal, Plus, Users } from 'lucide-react';
import SidebarNavigation from '../components/SidebarNavigation';
import { AddVendorDialog } from '../components/AddVendorDialog';
import VendorTransactionsSheet, { type VendorTransactionsSheetRow as VendorTransactionsSheetType } from '../components/VendorTransactionsSheet';
import { type VendorTransactionsSheetRowModel as VendorTransactionsSheetRow } from '../components/VendorTransactionsSheetRow';
import { toast, Toaster } from 'sonner';
import * as XLSX from 'xlsx';
import ActiveVendorPreviewDialog from '../components/ActiveVendorPreviewDialog';
import {
  bulkCreateVendorTransactions,
  deleteVendorTransaction,
  getVendorTransactionMarketDates,
  searchVendorTransactions,
  updateVendorTransaction,
  type CreateVendorTransactionRequest,
  type VendorTransaction,
} from '@/lib/api/transactions';
import { getVendors, type Vendor as ApiVendor } from '@/lib/api/vendor';
import { getAllVendorDefaults, type VendorDefaults } from '@/lib/api/defaults';
import { downloadVendorTransactionsTemplate } from '@/lib/transactionsTemplate';
import { getActiveCustomColumns, type CustomColumnMetadata } from '@/lib/api/customColumns';
import { mostRecentSaturdayDate } from '@/lib/dashboardAggregates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/figma/dropdown-menu';

interface Vendor {
  id: string;
  name: string;
}

type VendorWithDefaults = ApiVendor & {
  defaults?: VendorDefaults & { avgSaleAmount?: string };
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TRANSACTION_ID_HEADERS = new Set(['vendor transaction id', 'transaction id', 'uuid']);

const parseNumericValue = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

const createLocalId = () => Math.random().toString(36).slice(2, 11);
const isPersistedTransactionId = (value: string) => UUID_PATTERN.test(value);
const normalizeHeader = (value: unknown) => String(value ?? '').trim().toLowerCase();

const mapTransactionToSalesRecord = (
  transaction: VendorTransaction
): VendorTransactionsSheetRow => {
  // If any percentage field is present on the transaction, treat the row as
  // having defaults applied. This is used to preserve `defaults_applied` when
  // loading persisted transactions from the backend.
  const hasPercentages =
    (transaction.pctHandmade !== null && transaction.pctHandmade !== undefined) ||
    (transaction.pctAgricultural !== null && transaction.pctAgricultural !== undefined) ||
    (transaction.pctPreparedFood !== null && transaction.pctPreparedFood !== undefined) ||
    (transaction.pctCottageGoods !== null && transaction.pctCottageGoods !== undefined) ||
    (transaction.pctManufactured !== null && transaction.pctManufactured !== undefined);

  return {
    id: transaction.id,
    vendor_id: transaction.vendorId,
    vendor_name: transaction.vendorName,
    market_date: transaction.marketDate,
    present: transaction.present,
    snap: transaction.snap,
    dufb: transaction.dufb,
    wdfm_tokens: transaction.wdfmTokens,
    voucher: transaction.voucher,
    reported_sales: transaction.reportedSales,
    reimbursement_due: transaction.reimbursementDue,
    est_produce_sales: transaction.estProduceSales,
    est_num_transactions: transaction.estNumTransactions,
    pct_handmade: transaction.pctHandmade ?? null,
    pct_agricultural: transaction.pctAgricultural ?? null,
    pct_prepared_food: transaction.pctPreparedFood ?? null,
    pct_cottage_goods: transaction.pctCottageGoods ?? null,
    pct_manufactured: transaction.pctManufactured ?? null,
    avg_sale_amount: transaction.avgSaleAmount ?? null,
    customData: transaction.customData ?? {},
    defaults_applied: hasPercentages,
    isInvalid: false,
  };
};

const buildTransactionPayload = (
  record: VendorTransactionsSheetRow
): CreateVendorTransactionRequest => {
  const payload: CreateVendorTransactionRequest = {
    vendorId: record.vendor_id,
    vendorName: record.vendor_name,
    marketDate: record.market_date,
    present: record.present,
    snap: record.snap,
    dufb: record.dufb,
    wdfmTokens: record.wdfm_tokens,
    voucher: record.voucher,
    reimbursementDue: record.reimbursement_due,
    reportedSales: record.reported_sales,
    estProduceSales: record.est_produce_sales,
    estNumTransactions: record.est_num_transactions,
    customData: record.customData,
    // Always include percentage fields explicitly as numbers or `null` so the
    // backend can distinguish "no value provided" vs an explicit 0.
    pctHandmade: record.pct_handmade ?? null,
    pctAgricultural: record.pct_agricultural ?? null,
    pctPreparedFood: record.pct_prepared_food ?? null,
    pctCottageGoods: record.pct_cottage_goods ?? null,
    pctManufactured: record.pct_manufactured ?? null,
    avgSaleAmount: record.avg_sale_amount ?? null,
  };

  return payload;
};

const normalizeComparableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(normalizeComparableValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, normalizeComparableValue(nestedValue)])
    );
  }

  return value;
};

const serializeTransactionPayload = (record: VendorTransactionsSheetRow) =>
  JSON.stringify(normalizeComparableValue(buildTransactionPayload(record)));

const buildPersistedPayloadSnapshot = (rows: VendorTransactionsSheetRow[]) =>
  Object.fromEntries(
    rows
      .filter((record) => isPersistedTransactionId(record.id))
      .map((record) => [record.id, serializeTransactionPayload(record)])
  );

const appendMissingMarketDate = (marketDates: string[], marketDate: string) =>
  marketDates.includes(marketDate) ? marketDates : [marketDate, ...marketDates];

const getAdjacentMarketDates = (marketDates: string[], currentMarketDate: string) => {
  if (marketDates.length === 0) {
    return { previousMarketDate: null, nextMarketDate: null };
  }

  const isAscending = marketDates[0] <= marketDates[marketDates.length - 1];
  const currentIndex = marketDates.indexOf(currentMarketDate);

  if (currentIndex >= 0) {
    return {
      previousMarketDate:
        currentIndex > 0 ? marketDates[currentIndex - 1] : null,
      nextMarketDate:
        currentIndex < marketDates.length - 1 ? marketDates[currentIndex + 1] : null,
    };
  }

  const earlierDates = marketDates.filter((date) => date < currentMarketDate);
  const laterDates = marketDates.filter((date) => date > currentMarketDate);

  if (isAscending) {
    return {
      previousMarketDate:
        earlierDates.length > 0 ? earlierDates[earlierDates.length - 1] : null,
      nextMarketDate: laterDates.length > 0 ? laterDates[0] : null,
    };
  }

  return {
    previousMarketDate: laterDates.length > 0 ? laterDates[laterDates.length - 1] : null,
    nextMarketDate: earlierDates.length > 0 ? earlierDates[0] : null,
  };
};

function TransactionsContent() {
  const defaultMarketDate = mostRecentSaturdayDate();
  const [currentMarketDate, setCurrentMarketDate] = useState(defaultMarketDate);
  const [availableMarketDates, setAvailableMarketDates] = useState<string[]>([]);
  const [records, setRecords] = useState<VendorTransactionsSheetRow[]>([]);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [activeVendors, setActiveVendors] = useState<ApiVendor[]>([]);
  const [vendorDetails, setVendorDetails] = useState<VendorWithDefaults[]>([]);
  const [customColumns, setCustomColumns] = useState<CustomColumnMetadata[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isAddVendorDialogOpen, setIsAddVendorDialogOpen] = useState(false);
  const [pendingActiveVendors, setPendingActiveVendors] = useState<ApiVendor[]>([]);
  const [isActiveVendorPreviewOpen, setIsActiveVendorPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const persistedPayloadsRef = useRef<Record<string, string>>({});

  const getMatchedVendor = useCallback(
    (vendorName: string) =>
      allVendors.find((vendor) => vendor.name.toLowerCase() === vendorName.trim().toLowerCase()),
    [allVendors]
  );

  const buildRecord = useCallback(
    (
      record: Partial<VendorTransactionsSheetRow> &
        Pick<VendorTransactionsSheetRow, "id" | "vendor_name">
    ): VendorTransactionsSheetRow => {
      const vendorName = record.vendor_name.trim();
      const matchedVendor = getMatchedVendor(vendorName);
      const snap = parseNumericValue(record.snap);
      const dufb = parseNumericValue(record.dufb);
      const wdfmTokens = parseNumericValue(record.wdfm_tokens);
      const voucher = parseNumericValue(record.voucher);
      const reportedSales = parseNumericValue(record.reported_sales);

      const vendorDefaults = matchedVendor
        ? vendorDetails.find((vendor) => vendor.id === matchedVendor.id)?.defaults
        : undefined;

      // Distinguish between newly-created rows (local IDs) and persisted
      // transactions (UUID). For new rows we must NOT auto-apply vendor defaults
      // — only use percentages that were explicitly entered or applied by the
      // user in the dialog. For persisted rows we preserve whatever was
      // previously stored in the database.
      const isNewTransaction = !isPersistedTransactionId(record.id);
      const hasExplicitPercentages =
        record.pct_handmade != null ||
        record.pct_agricultural != null ||
        record.pct_prepared_food != null ||
        record.pct_cottage_goods != null ||
        record.pct_manufactured != null;

      // Preserve null vs numeric values. `parseNumericValue` maps undefined/''
      // to 0, so only convert when value is not null/undefined.
      const parsePercentageValue = (value: number | null | undefined) =>
        value == null ? null : parseNumericValue(value);
      const parseAvgSaleAmountValue = (value: number | null | undefined) =>
        value == null ? null : parseNumericValue(value);

      let pctHandmade: number | null;
      let pctAgricultural: number | null;
      let pctPreparedFood: number | null;
      let pctCottageGoods: number | null;
      let pctManufactured: number | null;
      let avgSaleAmount: number | null;
      let defaultsApplied: boolean;
      let estProduceSales: number;
      let estNumTransactions: number;

      if (isNewTransaction) {
        // For new transactions, keep percentages as explicitly set only
        // (don't auto-apply vendor defaults). If any percentage is provided
        // on the row it is treated as an explicit edit.
        pctHandmade = parsePercentageValue(record.pct_handmade);
        pctAgricultural = parsePercentageValue(record.pct_agricultural);
        pctPreparedFood = parsePercentageValue(record.pct_prepared_food);
        pctCottageGoods = parsePercentageValue(record.pct_cottage_goods);
        pctManufactured = parsePercentageValue(record.pct_manufactured);
        avgSaleAmount = parseAvgSaleAmountValue(record.avg_sale_amount);

        // Only mark defaults as applied if percentages were explicitly set
        defaultsApplied = pctHandmade != null || pctAgricultural != null ||
          pctPreparedFood != null || pctCottageGoods != null ||
          pctManufactured != null;

        // Only calculate produce sales if defaults/percentages were applied
        if (defaultsApplied) {
          const defaultProduceSales =
            (reportedSales * ((pctAgricultural ?? 0) + (pctPreparedFood ?? 0))) / 100;
          estProduceSales = Math.round(defaultProduceSales * 100) / 100;
          const vendorDefaultAvgSaleAmount =
            vendorDefaults ? parseFloat(vendorDefaults.avgSaleAmount || '0') : 0;
          const resolvedAvgSaleAmount =
            avgSaleAmount != null && avgSaleAmount > 0
              ? avgSaleAmount
              : Number.isFinite(vendorDefaultAvgSaleAmount) && vendorDefaultAvgSaleAmount > 0
              ? vendorDefaultAvgSaleAmount
              : null;
          estNumTransactions =
            resolvedAvgSaleAmount != null
              ? Math.round(reportedSales / resolvedAvgSaleAmount)
              : parseNumericValue(record.est_num_transactions);
        } else {
          estProduceSales = parseNumericValue(record.est_produce_sales);
          estNumTransactions = parseNumericValue(record.est_num_transactions);
        }
      } else {
        // For persisted transactions, preserve the stored percentages exactly.
        pctHandmade = parsePercentageValue(record.pct_handmade);
        pctAgricultural = parsePercentageValue(record.pct_agricultural);
        pctPreparedFood = parsePercentageValue(record.pct_prepared_food);
        pctCottageGoods = parsePercentageValue(record.pct_cottage_goods);
        pctManufactured = parsePercentageValue(record.pct_manufactured);
        avgSaleAmount = parseAvgSaleAmountValue(record.avg_sale_amount);

        // Only mark defaults as applied if percentages are actually stored
        defaultsApplied = pctHandmade != null || pctAgricultural != null ||
          pctPreparedFood != null || pctCottageGoods != null ||
          pctManufactured != null;
        estProduceSales = parseNumericValue(record.est_produce_sales);
        estNumTransactions = parseNumericValue(record.est_num_transactions);
      }
      

      return {
        id: record.id,
        vendor_id: matchedVendor?.id ?? "",
        vendor_name: vendorName,
        market_date: record.market_date ?? currentMarketDate,
        present: Boolean(record.present),
        snap,
        dufb,
        wdfm_tokens: wdfmTokens,
        voucher,
        reported_sales: reportedSales,
        reimbursement_due: snap + dufb + wdfmTokens + voucher,
        est_produce_sales: estProduceSales,
        est_num_transactions: estNumTransactions,
        pct_handmade: pctHandmade,
        pct_agricultural: pctAgricultural,
        pct_prepared_food: pctPreparedFood,
        pct_cottage_goods: pctCottageGoods,
        pct_manufactured: pctManufactured,
        avg_sale_amount: avgSaleAmount,
        customData: record.customData ?? {},
        defaults_applied: defaultsApplied,
        isInvalid: !matchedVendor,
      };
    },
    [currentMarketDate, getMatchedVendor, vendorDetails]
  );

  const fetchTransactionsForDate = useCallback(
    async (marketDate: string) => {
      const response = await searchVendorTransactions({
        marketDate,
        page: 0,
        size: 500,
      });

      return response.data.map((transaction) =>
        buildRecord(mapTransactionToSalesRecord(transaction))
      );
    },
    [buildRecord]
  );

  const loadAvailableMarketDates = useCallback(async () => {
    const marketDates = appendMissingMarketDate(
      await getVendorTransactionMarketDates(),
      defaultMarketDate
    );
    setAvailableMarketDates(marketDates);
    return marketDates;
  }, [defaultMarketDate]);

  useEffect(() => {
    let isMounted = true;

    const loadMetadata = async () => {
      setVendorsLoading(true);

      try {
        const [vendorResponse, columnsResponse, marketDates, defaultsResponse] = await Promise.all([
          getVendors(0, 1000, true),
          getActiveCustomColumns(),
          loadAvailableMarketDates(),
          getAllVendorDefaults(0, 2000),
        ]);

        if (!isMounted) return;

        const vendorList: ApiVendor[] = Array.isArray(vendorResponse) ? vendorResponse : vendorResponse?.data ?? vendorResponse?.content ?? [];
        const defaultsList: VendorDefaults[] = Array.isArray(defaultsResponse)
          ? defaultsResponse
          : defaultsResponse?.data ?? defaultsResponse?.content ?? [];
        const defaultsByVendorId = new Map(defaultsList.map((defaults) => [defaults.vendorId, defaults]));
        // Attach vendor defaults to the vendor objects. Ensure `avgSaleAmount` is
        // always present so callers can safely parse it.
        const vendorWithDefaults: VendorWithDefaults[] = vendorList.map((vendor) => {
          const defaults = defaultsByVendorId.get(vendor.id);
          return {
            ...vendor,
            defaults: defaults ? { ...defaults, avgSaleAmount: defaults.avgSaleAmount ?? "0" } : undefined,
          };
        });

        setAllVendors(
          vendorList
            .map((vendor) => ({ id: vendor.id, name: vendor.vendorName }))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        setVendorDetails(vendorWithDefaults);
        setActiveVendors(
          vendorList
            .filter((vendor) => vendor.isActive)
            .sort((a, b) => a.vendorName.localeCompare(b.vendorName))
        );
        setCustomColumns(columnsResponse);
        setAvailableMarketDates(marketDates);
      } catch (error) {
        console.error("Failed to load metadata:", error);
        toast.error("Failed to load vendors or custom columns.");
      } finally {
        if (isMounted) {
          setVendorsLoading(false);
        }
      }
    };

    loadMetadata();

    return () => {
      isMounted = false;
    };
  }, [loadAvailableMarketDates]);

  useEffect(() => {
    if (vendorsLoading) {
      return;
    }

    let isActive = true;

    const loadTransactions = async () => {
      setIsLoadingTransactions(true);

      try {
        const nextRecords = await fetchTransactionsForDate(currentMarketDate);

        if (!isActive) return;
        setRecords(nextRecords);
        persistedPayloadsRef.current = buildPersistedPayloadSnapshot(nextRecords);
      } catch (error) {
        console.error("Failed to load transactions:", error);
        if (!isActive) return;

        setRecords([]);
        persistedPayloadsRef.current = {};
        toast.error("Failed to load transactions for the selected market date.");
      } finally {
        if (isActive) {
          setIsLoadingTransactions(false);
        }
      }
    };

    loadTransactions();

    return () => {
      isActive = false;
    };
  }, [currentMarketDate, fetchTransactionsForDate, vendorsLoading]);

  const invalidCount = records.filter((record) => record.isInvalid).length;
  const isSheetLoading = vendorsLoading || isLoadingTransactions;
  const hasPendingDeletions = Object.keys(persistedPayloadsRef.current).some(
    (persistedId) => !records.some((record) => record.id === persistedId)
  );
  const { previousMarketDate, nextMarketDate } = getAdjacentMarketDates(
    availableMarketDates,
    currentMarketDate
  );

  const handlePreviousMarketDate = useCallback(() => {
    if (previousMarketDate) {
      setCurrentMarketDate(previousMarketDate);
    }
  }, [previousMarketDate]);

  const handleNextMarketDate = useCallback(() => {
    if (nextMarketDate) {
      setCurrentMarketDate(nextMarketDate);
    }
  }, [nextMarketDate]);
  const defaultsMissingCount = records.filter((record) => {
    const vendor = vendorDetails.find(
      (item) =>
        item.id === record.vendor_id ||
        item.vendorName?.toLowerCase() === record.vendor_name.trim().toLowerCase()
    );
    if (!vendor?.defaults) return false;

    // Enhanced validation: mark red if missing/invalid percentages
    const percentages = [
      record.pct_handmade,
      record.pct_agricultural,
      record.pct_prepared_food,
      record.pct_cottage_goods,
      record.pct_manufactured
    ];

    // If all percentages are missing, invalid
    const allMissing = percentages.every(p => p == null);
    if (allMissing) return true;

    // If some percentages are set and some are null, invalid (incomplete)
    const setPercentages = percentages.filter(p => p != null);
    const nullPercentages = percentages.filter(p => p == null);
    if (setPercentages.length > 0 && nullPercentages.length > 0) return true;

    // If all percentages are set, check if they sum to 100%
    if (setPercentages.length === 5) {
      const total = setPercentages.reduce((sum, p) => sum + (p || 0), 0);
      return Math.abs(total - 100) > 0.01;
    }

    return false;
  }).length;

  const normalizeRows = (rows: VendorTransactionsSheetRow[]) => rows.map((row) => buildRecord(row));

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      await downloadVendorTransactionsTemplate(currentMarketDate);
      toast.success('Downloaded transaction template with active custom columns.');
    } catch (error) {
      console.error('Failed to download transaction template:', error);
      toast.error('Unable to download template. Please try again.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleAddVendor = (vendor: Vendor) => {
    if (records.some((record) => record.vendor_id === vendor.id)) {
      toast.error(`${vendor.name} is already in the list.`);
      return;
    }

    const nextRecord = buildRecord({
      id: createLocalId(),
      vendor_name: vendor.name,
      market_date: currentMarketDate,
      present: true,
      snap: 0,
      dufb: 0,
      wdfm_tokens: 0,
      voucher: 0,
      reported_sales: 0,
      est_produce_sales: 0,
      est_num_transactions: 0,
      customData: {},
    });

    setRecords((previous) => [nextRecord, ...previous]);
    toast.success(`Added ${vendor.name}`);
  };

  const handleOpenActiveVendorPreview = () => {
    if (vendorsLoading) {
      toast.info("Active vendor list is still loading.");
      return;
    }

    if (activeVendors.length === 0) {
      toast.info("No active vendors are available.");
      return;
    }

    const existingVendorIds = new Set(records.map((row) => row.vendor_id));
    const missingActiveVendors = activeVendors.filter(
      (vendor) => !existingVendorIds.has(vendor.id)
    );

    if (missingActiveVendors.length === 0) {
      toast.info("All active vendors are already present.");
      return;
    }

    setPendingActiveVendors(missingActiveVendors);
    setIsActiveVendorPreviewOpen(true);
  };

  const handleActiveVendorPreviewOpenChange = (open: boolean) => {
    setIsActiveVendorPreviewOpen(open);
    if (!open) {
      setPendingActiveVendors([]);
    }
  };

  const handleConfirmAddActiveVendors = () => {
    if (pendingActiveVendors.length === 0) {
      setIsActiveVendorPreviewOpen(false);
      return;
    }

    const newRows: VendorTransactionsSheetType[] = pendingActiveVendors.map((vendor) => ({
      id: createLocalId(),
      vendor_id: vendor.id,
      vendor_name: vendor.vendorName,
      market_date: currentMarketDate,
      present: false,
      snap: 0,
      dufb: 0,
      wdfm_tokens: 0,
      voucher: 0,
      reimbursement_due: 0,
      reported_sales: 0,
      est_produce_sales: 0,
      est_num_transactions: 0,
      isInvalid: false,
    }));

    setRecords([...newRows, ...records]);
    setIsActiveVendorPreviewOpen(false);
    setPendingActiveVendors([]);
    toast.success(`Added ${newRows.length} active vendor${newRows.length === 1 ? "" : "s"}.`);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const data = loadEvent.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][];
        const headers = rows[0] as string[];
        const dataRows = rows.slice(1).filter((row) => row.length > 0);
        const transactionIdIndex = headers.findIndex((header) =>
          TRANSACTION_ID_HEADERS.has(normalizeHeader(header))
        );

        if (dataRows.length === 0) {
          toast.error("The file appears to be empty.");
          return;
        }

        const imported = dataRows.map((row) => {
          const vendorName = row[0]?.toString().trim() || "Unknown Vendor";
          const presentValue = row[1]?.toString().trim().toUpperCase();

          const customData: Record<string, unknown> = {};
          // Attempt to map remaining columns to custom fields if headers match
          customColumns.filter(col => col.id !== undefined).forEach((col) => {
            const columnId = col.id!;
            const headerIndex = headers.findIndex(h => h?.toLowerCase().includes(col.name.toLowerCase()));
            if (headerIndex !== -1 && row[headerIndex] !== undefined) {
              const val = row[headerIndex];
              if (col.type === 'number' || col.type === 'usd') {
                customData[columnId] = parseNumericValue(val);
              } else if (col.type === 'boolean') {
                const s = String(val).toUpperCase();
                customData[columnId] = s === 'Y' || s === 'YES' || s === 'TRUE';
              } else {
                customData[columnId] = String(val);
              }
            }
          });

          return buildRecord({
            id:
              transactionIdIndex >= 0 && row[transactionIdIndex]
                ? String(row[transactionIdIndex]).trim()
                : createLocalId(),
            vendor_name: vendorName,
            market_date: currentMarketDate,
            present: presentValue === "Y" || presentValue === "YES" || presentValue === "TRUE",
            snap: parseNumericValue(row[2]),
            dufb: parseNumericValue(row[3]),
            wdfm_tokens: parseNumericValue(row[4]),
            voucher: parseNumericValue(row[5]),
            reported_sales: parseNumericValue(row[6]),
            est_produce_sales: parseNumericValue(row[7]),
            est_num_transactions: parseNumericValue(row[8]),
            customData,
          });
        });

        const dedupedImported = Array.from(
          new Map(imported.map((record) => [record.id, record])).values()
        );

        setRecords((previous) => {
          const importedById = new Map(dedupedImported.map((record) => [record.id, record]));
          const existingIds = new Set(previous.map((record) => record.id));
          const importedNewRows = dedupedImported.filter((record) => !existingIds.has(record.id));
          const updatedExistingRows = previous.map(
            (record) => importedById.get(record.id) ?? record
          );

          return [...importedNewRows, ...updatedExistingRows];
        });

        const invalidImportedCount = dedupedImported.filter((record) => record.isInvalid).length;
        if (invalidImportedCount > 0) {
          toast.warning(
            `${invalidImportedCount} vendor name(s) could not be matched. Review the highlighted rows.`
          );
        } else {
          toast.success(`Imported ${dedupedImported.length} transaction row(s) from ${file.name}.`);
        }
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error("Failed to process the file. Please use a valid Excel or CSV file.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.onerror = () => {
      toast.error("Error reading file.");
      setIsImporting(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleSaveToBackend = async () => {
    if (invalidCount > 0) {
      toast.error(`Please fix ${invalidCount} invalid vendor name(s) before saving.`);
      return;
    }
    if (defaultsMissingCount > 0) {
      toast.error(`Please apply item percentages to ${defaultsMissingCount} vendor(s) before saving.`);
      return;
    }

    // Custom data validation for required fields
    const missingRequired = records.some(record =>
      customColumns.some(col => col.id !== undefined && col.isRequired && (record.customData?.[col.id] === undefined || record.customData?.[col.id] === ""))
    );

    if (missingRequired) {
      toast.error("Some required custom columns are missing values. Please fill them before saving.");
      return;
    }

    const rowsToCreate = records.filter((record) => !isPersistedTransactionId(record.id));
    const rowsToUpdate = records.filter((record) => {
      if (!isPersistedTransactionId(record.id)) {
        return false;
      }

      const previousPayload = persistedPayloadsRef.current[record.id];
      return previousPayload === undefined || previousPayload !== serializeTransactionPayload(record);
    });
    const rowsToDelete = Object.keys(persistedPayloadsRef.current).filter(
      (persistedId) => !records.some((record) => record.id === persistedId)
    );

    if (records.length === 0 && rowsToDelete.length === 0) {
      toast.error("No records to save. Add vendors or import a spreadsheet first.");
      return;
    }

    if (rowsToCreate.length === 0 && rowsToUpdate.length === 0 && rowsToDelete.length === 0) {
      toast.info("No changes to save.");
      return;
    }

    setIsSaving(true);

    // Debugging: log outgoing payloads to inspect percentage values
    try {
      const createPayloads = rowsToCreate.map((r) => buildTransactionPayload(r));
      const updatePayloads = rowsToUpdate.map((r) => ({ id: r.id, payload: buildTransactionPayload(r) }));
      console.debug('[Transactions Save] rowsToCreate payloads:', createPayloads);
      console.debug('[Transactions Save] rowsToUpdate payloads:', updatePayloads);
      // Also log a compact, stringified summary of percentage fields to avoid collapsed object inspection issues
      try {
        console.debug('[Transactions Save] rowsToCreate pct summary:', JSON.stringify(createPayloads.map(p => ({ vendorName: p.vendorName, pctHandmade: p.pctHandmade, pctAgricultural: p.pctAgricultural, pctPreparedFood: p.pctPreparedFood, pctCottageGoods: p.pctCottageGoods, pctManufactured: p.pctManufactured })), null, 2));
        console.debug('[Transactions Save] rowsToUpdate pct summary:', JSON.stringify(updatePayloads.map(u => ({ id: u.id, vendorName: u.payload.vendorName, pctHandmade: u.payload.pctHandmade, pctAgricultural: u.payload.pctAgricultural, pctPreparedFood: u.payload.pctPreparedFood, pctCottageGoods: u.payload.pctCottageGoods, pctManufactured: u.payload.pctManufactured })), null, 2));
      } catch (e) {
        // ignore stringify errors
      }

      await Promise.all([
        rowsToCreate.length > 0
          ? bulkCreateVendorTransactions(rowsToCreate.map(buildTransactionPayload))
          : Promise.resolve([]),
        rowsToUpdate.length > 0
          ? Promise.all(
              rowsToUpdate.map((record) =>
                updateVendorTransaction(record.id, buildTransactionPayload(record))
              )
            )
          : Promise.resolve([]),
        rowsToDelete.length > 0
          ? Promise.all(rowsToDelete.map((id) => deleteVendorTransaction(id)))
          : Promise.resolve([]),
      ]);

      const refreshedRecords = await fetchTransactionsForDate(currentMarketDate);
      await loadAvailableMarketDates();
      setRecords(refreshedRecords);
      persistedPayloadsRef.current = buildPersistedPayloadSnapshot(refreshedRecords);

      const successParts = [
        rowsToCreate.length > 0 ? `${rowsToCreate.length} new` : null,
        rowsToUpdate.length > 0 ? `${rowsToUpdate.length} updated` : null,
        rowsToDelete.length > 0 ? `${rowsToDelete.length} deleted` : null,
      ].filter(Boolean);

      toast.success(`Successfully saved changes: ${successParts.join(', ')} vendor transaction row(s).`);
    } catch (error) {
      console.error("Error saving transactions:", error);
      toast.error("Failed to save data. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 transition-colors duration-300">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            input::-webkit-outer-spin-button,
            input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            input[type=number] { -moz-appearance: textfield; }
          `,
        }}
      />
      <Toaster position="top-right" />
      <SidebarNavigation activeItem="Transactions" />

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Vendor Transactions</h2>
            <p className="mt-1 text-slate-700">
              Edit and save transactions per Market Date.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-lg border border-[#10b981] bg-[#10b981] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:border-[#059669] hover:bg-[#059669] focus:outline-none focus:ring-2 focus:ring-[#10b981]">
                  <MoreHorizontal size={16} />
                  Actions
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-slate-200 bg-white text-slate-900">
                <DropdownMenuItem
                  onSelect={handleImportClick}
                  disabled={isImporting}
                  className="gap-3 py-2 text-slate-700 focus:bg-[#10b981]/10 focus:text-[#059669]"
                >
                  <span className="flex w-4 shrink-0 justify-center">
                    {isImporting ? <Loader2 className="animate-spin text-[#10b981]" /> : <Download className="text-[#10b981]" />}
                  </span>
                  <span>Import Excel</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => void handleDownloadTemplate()}
                  disabled={isDownloadingTemplate}
                  className="gap-3 py-2 text-slate-700 focus:bg-[#10b981]/10 focus:text-[#059669]"
                >
                  <span className="flex w-4 shrink-0 justify-center">
                    {isDownloadingTemplate ? <Loader2 className="animate-spin text-[#10b981]" /> : <FileSpreadsheet className="text-[#10b981]" />}
                  </span>
                  <span>Download Template</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-0.5" />
                <DropdownMenuItem
                  onSelect={() => setIsAddVendorDialogOpen(true)}
                  className="gap-3 py-2 text-slate-700 focus:bg-[#10b981]/10 focus:text-[#059669]"
                >
                  <span className="flex w-4 shrink-0 justify-center">
                    <Plus className="text-[#10b981]" />
                  </span>
                  <span>Add Vendor</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={handleOpenActiveVendorPreview}
                  disabled={vendorsLoading || activeVendors.length === 0}
                  className="gap-3 py-2 text-slate-700 focus:bg-[#10b981]/10 focus:text-[#059669]"
                >
                  <span className="flex w-4 shrink-0 justify-center">
                    <Users className="text-[#10b981]" />
                  </span>
                  <span>Add Active Vendors</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <AddVendorDialog
          vendors={allVendors}
          onAdd={handleAddVendor}
          open={isAddVendorDialogOpen}
          onOpenChange={setIsAddVendorDialogOpen}
          hideTrigger
        />
        <ActiveVendorPreviewDialog
          open={isActiveVendorPreviewOpen}
          pendingVendors={pendingActiveVendors}
          onOpenChange={handleActiveVendorPreviewOpenChange}
          onConfirm={handleConfirmAddActiveVendors}
          formatCurrency={(amount) =>
            new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
          }
        />

        <VendorTransactionsSheet
          currentMarketDate={currentMarketDate}
          onCurrentMarketDateChange={setCurrentMarketDate}
          rows={records}
          isLoading={isSheetLoading}
          isSaving={isSaving}
          invalidCount={invalidCount}
          hasPendingDeletions={hasPendingDeletions}
          onPreviousMarketDate={previousMarketDate ? handlePreviousMarketDate : undefined}
          onNextMarketDate={nextMarketDate ? handleNextMarketDate : undefined}
          normalizeRow={buildRecord}
          onRowsChange={(nextRows) => setRecords(nextRows)}
          onSave={handleSaveToBackend}
          vendorsWithDefaults={vendorDetails}
          customColumns={customColumns}
        />
      </main>
    </div>
  );
}

export default function TransactionsPage() {
  return (
      <TransactionsContent />
  );
}
