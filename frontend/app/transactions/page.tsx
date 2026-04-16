"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import SidebarNavigation from '../components/SidebarNavigation';
import Button from '../components/Button';
import { AddVendorDialog } from '../components/AddVendorDialog';
import VendorTransactionsSheet from '../components/VendorTransactionsSheet';
import { type VendorTransactionsSheetRowModel as VendorTransactionsSheetRow } from '../components/VendorTransactionsSheetRow';
import { toast, Toaster } from 'sonner';
import * as XLSX from 'xlsx';
import ActiveVendorAddButton from "../components/ActiveVendorAddButton";
import {
  bulkCreateVendorTransactions,
  searchVendorTransactions,
  updateVendorTransaction,
  type CreateVendorTransactionRequest,
  type VendorTransaction,
} from '@/lib/api/transactions';
import { getVendors, type Vendor as ApiVendor } from '@/lib/api/vendor';
import { getAllVendorDefaults, type VendorDefaults } from '@/lib/api/defaults';
import { downloadVendorTransactionsTemplate } from '@/lib/transactionsTemplate';
import { getActiveCustomColumns, type CustomColumnMetadata } from '@/lib/api/customColumns';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface Vendor {
  id: string;
  name: string;
}

type VendorWithDefaults = ApiVendor & {
  defaults?: VendorDefaults & { avgSaleAmount?: string };
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TRANSACTION_ID_HEADERS = new Set(['vendor transaction id', 'transaction id', 'uuid']);

const getMostRecentSaturday = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = (day + 1) % 7;
  const saturday = new Date(date);
  saturday.setDate(date.getDate() - diff);
  return saturday.toISOString().split("T")[0];
};

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

function TransactionsContent() {
  const [currentMarketDate, setCurrentMarketDate] = useState(getMostRecentSaturday());
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

      let pctHandmade: number | null;
      let pctAgricultural: number | null;
      let pctPreparedFood: number | null;
      let pctCottageGoods: number | null;
      let pctManufactured: number | null;
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

        // Only mark defaults as applied if percentages were explicitly set
        defaultsApplied = pctHandmade != null || pctAgricultural != null ||
          pctPreparedFood != null || pctCottageGoods != null ||
          pctManufactured != null;

        // Only calculate produce sales if defaults/percentages were applied
        if (defaultsApplied) {
          const defaultProduceSales =
            (reportedSales * ((pctAgricultural ?? 0) + (pctPreparedFood ?? 0))) / 100;
          estProduceSales = Math.round(defaultProduceSales * 100) / 100;
          estNumTransactions =
            vendorDefaults && parseFloat(vendorDefaults.avgSaleAmount || '0') > 0
              ? Math.round(reportedSales / parseFloat(vendorDefaults.avgSaleAmount || '0'))
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

  useEffect(() => {
    let isMounted = true;

    const loadMetadata = async () => {
      setVendorsLoading(true);

      try {
        const [vendorResponse, columnsResponse, defaultsResponse] = await Promise.all([
          getVendors(0, 1000, true),
          getActiveCustomColumns(),
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
  }, []);

  useEffect(() => {
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
  }, [currentMarketDate, fetchTransactionsForDate]);

  const invalidCount = records.filter((record) => record.isInvalid).length;
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
    if (records.length === 0) {
      toast.error("No records to save. Add vendors or import a spreadsheet first.");
      return;
    }

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

    if (rowsToCreate.length === 0 && rowsToUpdate.length === 0) {
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
      ]);

      const refreshedRecords = await fetchTransactionsForDate(currentMarketDate);
      setRecords(refreshedRecords);
      persistedPayloadsRef.current = buildPersistedPayloadSnapshot(refreshedRecords);

      if (rowsToCreate.length > 0 && rowsToUpdate.length > 0) {
        toast.success(
          `Saved ${rowsToCreate.length} new and ${rowsToUpdate.length} existing vendor transaction row(s).`
        );
      } else if (rowsToCreate.length > 0) {
        toast.success(`Successfully saved ${rowsToCreate.length} vendor transaction row(s).`);
      } else {
        toast.success(`Successfully updated ${rowsToUpdate.length} vendor transaction row(s).`);
      }
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
              Import rows, add vendors manually, review mismatches, and remove multiple rows at once.
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
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-all ${
                isImporting
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  : "border-[#10b981]/30 bg-white text-[#10b981] hover:bg-[#10b981]/10"
              }`}
            >
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Import Excel
            </button>
            <button
              onClick={handleDownloadTemplate}
              disabled={isDownloadingTemplate}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-all ${
                isDownloadingTemplate
                  ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                  : 'border-[#10b981]/30 bg-white text-[#10b981] hover:bg-[#10b981]/10'
              }`}
            >
              {isDownloadingTemplate ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
              Download Template
            </button>
            <AddVendorDialog vendors={allVendors} onAdd={handleAddVendor} />
            <ActiveVendorAddButton
              activeVendors={activeVendors}
              vendorsLoading={vendorsLoading}
              currentMarketDate={currentMarketDate}
              rows={records}
              onRowsChange={setRecords}
            />
          </div>
        </header>

        <VendorTransactionsSheet
          currentMarketDate={currentMarketDate}
          onCurrentMarketDateChange={setCurrentMarketDate}
          rows={records}
          isLoading={isLoadingTransactions}
          isSaving={isSaving}
          invalidCount={invalidCount}
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
