import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { VendorTransaction } from "@/lib/api/transactions";
import { formatCurrency } from "@/lib/smoothNumbers";

export type FinancialReportType =
  | "comprehensive"
  | "category"
  | "vendorLabel"
  | "leaderboard"
  | "vendor"
  | "token";

type PdfChartImage = { title: string; dataUrl: string };

const MARGIN_MM = 14;
const ACCENT: [number, number, number] = [16, 185, 129];
const MUTED: [number, number, number] = [100, 116, 139];

function formatRangeLabel(start: string, end: string): string {
  try {
    const a = new Date(`${start}T12:00:00`);
    const b = new Date(`${end}T12:00:00`);
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    return `${a.toLocaleDateString("en-US", opts)} – ${b.toLocaleDateString("en-US", opts)}`;
  } catch {
    return `${start} – ${end}`;
  }
}

async function loadLogoForPdf(): Promise<{ dataUrl: string; widthMm: number; heightMm: number } | null> {
  try {
    const res = await fetch("/marketos-icon.png", { cache: "force-cache" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("read"));
      reader.readAsDataURL(blob);
    });
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("img"));
      img.src = dataUrl;
    });
    const aspect = img.naturalWidth / Math.max(1, img.naturalHeight);
    const heightMm = 14;
    const widthMm = Math.min(36, heightMm * aspect);
    return { dataUrl, widthMm, heightMm };
  } catch {
    return null;
  }
}

function addBrandedHeader(
  doc: jsPDF,
  opts: {
    reportTitle: string;
    reportSubtitle: string;
    rangeLabel: string;
    logo: { dataUrl: string; widthMm: number; heightMm: number } | null;
  },
): number {
  const pageW = doc.internal.pageSize.getWidth();
  let y = MARGIN_MM;
  const textLeft = opts.logo ? MARGIN_MM + opts.logo.widthMm + 4 : MARGIN_MM;

  if (opts.logo) {
    doc.addImage(opts.logo.dataUrl, "PNG", MARGIN_MM, y, opts.logo.widthMm, opts.logo.heightMm);
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("MarketOS", textLeft, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(opts.reportTitle, textLeft, y + 11);

  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const subLines = doc.splitTextToSize(opts.reportSubtitle, pageW - textLeft - MARGIN_MM);
  doc.text(subLines, textLeft, y + 16);

  const rangeW = doc.getTextWidth(opts.rangeLabel);
  doc.setFontSize(9);
  doc.text(opts.rangeLabel, pageW - MARGIN_MM - rangeW, y + 6);

  y += Math.max(opts.logo?.heightMm ?? 0, 12 + subLines.length * 3.6) + 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN_MM, y, pageW - MARGIN_MM, y);
  return y + 8;
}

function addFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageH = doc.internal.pageSize.getHeight();
  const generated = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`MarketOS · Generated ${generated}`, MARGIN_MM, pageH - 8);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - MARGIN_MM - 28, pageH - 8);
  }
}

const tableDefaults = {
  styles: { fontSize: 8, cellPadding: 2.5, textColor: [15, 23, 42] as [number, number, number] },
  headStyles: {
    fillColor: ACCENT,
    textColor: 255,
    fontStyle: "bold" as const,
  },
  alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
  margin: { left: MARGIN_MM, right: MARGIN_MM },
  theme: "striped" as const,
};

export type DownloadFinancialReportPdfArgs =
  | {
      reportType: "comprehensive";
      startDate: string;
      endDate: string;
      reportTitle: string;
      reportSubtitle: string;
      comprehensive: {
        totalReported: number;
        totalReimbursement: number;
        tokenVolume: number;
        paymentShare: { name: string; pct: number }[];
      };
      sortedTxForTable: VendorTransaction[];
      chartImages?: PdfChartImage[];
    }
  | {
      reportType: "category";
      startDate: string;
      endDate: string;
      reportTitle: string;
      reportSubtitle: string;
      categoryRows: { name: string; value: number }[];
      chartImages?: PdfChartImage[];
    }
  | {
      reportType: "vendorLabel";
      startDate: string;
      endDate: string;
      reportTitle: string;
      reportSubtitle: string;
      vendorLabelRows: { name: string; value: number }[];
      chartImages?: PdfChartImage[];
    }
  | {
      reportType: "leaderboard";
      startDate: string;
      endDate: string;
      reportTitle: string;
      reportSubtitle: string;
      vendorLeaderboard: {
        rank: number;
        vendorName: string;
        totalSales: number;
        transactionCount: number;
      }[];
      chartImages?: PdfChartImage[];
    }
  | {
      reportType: "vendor";
      startDate: string;
      endDate: string;
      reportTitle: string;
      reportSubtitle: string;
      selectedVendorRow: {
        vendorName: string;
        totalReported: number;
        totalReimbursement: number;
        tokenVolume: number;
        transactionCount: number;
      } | null;
      vendorReportRows: {
        rank: number;
        vendorName: string;
        totalReported: number;
        totalReimbursement: number;
        tokenVolume: number;
        transactionCount: number;
      }[];
      chartImages?: PdfChartImage[];
    }
  | {
      reportType: "token";
      startDate: string;
      endDate: string;
      reportTitle: string;
      reportSubtitle: string;
      tokenRows: { name: string; amount: number }[];
      tokenTotal: number;
      sortedTxForTable: VendorTransaction[];
      chartImages?: PdfChartImage[];
    };

export async function downloadFinancialReportPdf(args: DownloadFinancialReportPdfArgs): Promise<void> {
  const logo = await loadLogoForPdf();
  const rangeLabel = formatRangeLabel(args.startDate, args.endDate);
  const doc = new jsPDF({ unit: "mm", format: "letter", compress: true });

  let y = addBrandedHeader(doc, {
    reportTitle: args.reportTitle,
    reportSubtitle: args.reportSubtitle,
    rangeLabel,
    logo,
  });

  const addSectionTitle = (title: string, startY: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(title, MARGIN_MM, startY);
    return startY + 6;
  };

  const ensureSpace = (neededHeight: number, currentY: number) => {
    const pageH = doc.internal.pageSize.getHeight();
    const maxY = pageH - 18;
    if (currentY + neededHeight > maxY) {
      doc.addPage();
      return addBrandedHeader(doc, {
        reportTitle: args.reportTitle,
        reportSubtitle: args.reportSubtitle,
        rangeLabel,
        logo,
      });
    }
    return currentY;
  };

  const addChartImages = (startY: number, images: PdfChartImage[] | undefined) => {
    if (!images || images.length === 0) return startY;
    let nextY = startY;
    const pageW = doc.internal.pageSize.getWidth();
    const maxChartW = pageW - 2 * MARGIN_MM;
    const maxChartH = 74;

    nextY = addSectionTitle("Charts", nextY);

    for (const image of images) {
      nextY = ensureSpace(10 + maxChartH, nextY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(image.title, MARGIN_MM, nextY);
      nextY += 3;

      const props = doc.getImageProperties(image.dataUrl);
      const ratio = props.width / Math.max(1, props.height);
      let drawW = maxChartW;
      let drawH = drawW / Math.max(0.1, ratio);
      if (drawH > maxChartH) {
        drawH = maxChartH;
        drawW = drawH * ratio;
      }
      const x = MARGIN_MM + (maxChartW - drawW) / 2;
      const yPos = nextY + 2;
      doc.addImage(image.dataUrl, "PNG", x, yPos, drawW, drawH);
      nextY = yPos + drawH + 7;
    }

    return nextY;
  };

  switch (args.reportType) {
    case "comprehensive": {
      y = addChartImages(y, args.chartImages);
      y = addSectionTitle("Summary", y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(`Total reported sales: ${formatCurrency(args.comprehensive.totalReported)}`, MARGIN_MM, y);
      y += 5;
      doc.text(`Total reimbursement due: ${formatCurrency(args.comprehensive.totalReimbursement)}`, MARGIN_MM, y);
      y += 5;
      doc.text(`Program token volume: ${formatCurrency(args.comprehensive.tokenVolume)}`, MARGIN_MM, y);
      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Token share of reported sales (approximate)", MARGIN_MM, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      for (const row of args.comprehensive.paymentShare) {
        doc.text(`${row.name}: ${row.pct.toFixed(1)}%`, MARGIN_MM, y);
        y += 4.5;
      }
      y += 4;
      y = addSectionTitle("Transactions", y);
      autoTable(doc, {
        ...tableDefaults,
        startY: y,
        head: [["Date", "Vendor", "Reported", "Reimbursement", "SNAP", "DUFB"]],
        body:
          args.sortedTxForTable.length === 0
            ? [["—", "No transactions in range", "", "", "", ""]]
            : args.sortedTxForTable.map((t) => [
                t.marketDate,
                t.vendorName,
                formatCurrency(t.reportedSales ?? 0),
                formatCurrency(t.reimbursementDue ?? 0),
                formatCurrency(t.snap ?? 0),
                formatCurrency(t.dufb ?? 0),
              ]),
      });
      break;
    }
    case "category": {
      y = addChartImages(y, args.chartImages);
      y = addSectionTitle("Allocated reported sales by category", y);
      autoTable(doc, {
        ...tableDefaults,
        startY: y,
        head: [["Category", "Allocated sales"]],
        body:
          args.categoryRows.length === 0
            ? [["—", "No data for this range"]]
            : args.categoryRows.map((r) => [r.name, formatCurrency(r.value)]),
      });
      break;
    }
    case "vendorLabel": {
      y = addChartImages(y, args.chartImages);
      y = addSectionTitle("Allocated reported sales by label", y);
      autoTable(doc, {
        ...tableDefaults,
        startY: y,
        head: [["Label", "Allocated sales"]],
        body:
          args.vendorLabelRows.length === 0
            ? [["—", "No data for this range"]]
            : args.vendorLabelRows.map((r) => [r.name, formatCurrency(r.value)]),
      });
      break;
    }
    case "leaderboard": {
      y = addChartImages(y, args.chartImages);
      y = addSectionTitle("Vendor sales ranking", y);
      autoTable(doc, {
        ...tableDefaults,
        startY: y,
        head: [["Rank", "Vendor", "Total reported sales", "Transactions"]],
        body:
          args.vendorLeaderboard.length === 0
            ? [["—", "No vendor data for this range", "", ""]]
            : args.vendorLeaderboard.map((r) => [
                String(r.rank),
                r.vendorName,
                formatCurrency(r.totalSales),
                String(r.transactionCount),
              ]),
      });
      break;
    }
    case "vendor": {
      y = addChartImages(y, args.chartImages);
      if (args.selectedVendorRow) {
        y = addSectionTitle(`Selected vendor: ${args.selectedVendorRow.vendorName}`, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text(`Total reported: ${formatCurrency(args.selectedVendorRow.totalReported)}`, MARGIN_MM, y);
        y += 5;
        doc.text(`Total reimbursement: ${formatCurrency(args.selectedVendorRow.totalReimbursement)}`, MARGIN_MM, y);
        y += 5;
        doc.text(`Token volume: ${formatCurrency(args.selectedVendorRow.tokenVolume)}`, MARGIN_MM, y);
        y += 5;
        doc.text(`Transactions: ${args.selectedVendorRow.transactionCount}`, MARGIN_MM, y);
        y += 10;
      }
      y = addSectionTitle("All vendors (range totals)", y);
      autoTable(doc, {
        ...tableDefaults,
        startY: y,
        head: [["Rank", "Vendor", "Reported", "Reimbursement", "Tokens", "Trans"]],
        body:
          args.vendorReportRows.length === 0
            ? [["—", "No vendor data", "", "", "", ""]]
            : args.vendorReportRows.map((r) => [
                String(r.rank),
                r.vendorName,
                formatCurrency(r.totalReported),
                formatCurrency(r.totalReimbursement),
                formatCurrency(r.tokenVolume),
                String(r.transactionCount),
              ]),
      });
      break;
    }
    case "token": {
      y = addChartImages(y, args.chartImages);
      y = addSectionTitle("Program totals", y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      for (const r of args.tokenRows) {
        doc.text(`${r.name}: ${formatCurrency(r.amount)}`, MARGIN_MM, y);
        y += 5;
      }
      y += 2;
      doc.setFont("helvetica", "bold");
      doc.text(`Combined: ${formatCurrency(args.tokenTotal)}`, MARGIN_MM, y);
      y += 10;
      y = addSectionTitle("Per-transaction tokens", y);
      autoTable(doc, {
        ...tableDefaults,
        startY: y,
        head: [["Date", "Vendor", "SNAP", "DUFB", "WDFM", "Voucher", "Row total"]],
        body:
          args.sortedTxForTable.length === 0
            ? [["—", "No rows for this range", "", "", "", "", ""]]
            : args.sortedTxForTable.map((t) => {
                const rowTot =
                  (t.snap ?? 0) + (t.dufb ?? 0) + (t.wdfmTokens ?? 0) + (t.voucher ?? 0);
                return [
                  t.marketDate,
                  t.vendorName,
                  formatCurrency(t.snap ?? 0),
                  formatCurrency(t.dufb ?? 0),
                  formatCurrency(t.wdfmTokens ?? 0),
                  formatCurrency(t.voucher ?? 0),
                  formatCurrency(rowTot),
                ];
              }),
      });
      break;
    }
    default:
      break;
  }

  addFooters(doc);

  const safeType = args.reportType;
  const vendorNamePart =
    args.reportType === "vendor" && args.selectedVendorRow?.vendorName
      ? `-${args.selectedVendorRow.vendorName}`
      : "";
  const filename = `MarketOS-report-${safeType}${vendorNamePart}-${args.startDate}-to-${args.endDate}.pdf`.replace(
    /[^\w.\-]+/g,
    "_",
  );

  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeFile } = await import("@tauri-apps/plugin-fs");
      const filePath = await save({
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        defaultPath: filename
      });
      if (filePath) {
        const pdfArrayBuffer = doc.output('arraybuffer');
        await writeFile(filePath, new Uint8Array(pdfArrayBuffer));
      }
    } catch (error) {
      console.error("Failed to save via Tauri:", error);
      doc.save(filename);
    }
  } else {
    doc.save(filename);
  }
}

function formatTransactionsDateSpan(transactions: VendorTransaction[]): string {
  if (transactions.length === 0) {
    return "No sessions";
  }
  const dates = [...new Set(transactions.map((t) => t.marketDate))].sort();
  const first = dates[0];
  const last = dates[dates.length - 1];
  return formatRangeLabel(first, last);
}

export type DownloadVendorProfilePdfArgs = {
  vendorName: string;
  vendorStatus: string;
  contactLine: string;
  productsLine: string;
  attendanceRate: number;
  avgDailySales: number;
  topSellingMonth: string;
  snapTotal: number;
  paymentBreakdown: {
    cashCard: number;
    snapVouchers: number;
    marketTokens: number;
  };
  transactions: VendorTransaction[];
  chartImages?: PdfChartImage[];
};

export async function downloadVendorProfilePdf(args: DownloadVendorProfilePdfArgs): Promise<void> {
  const logo = await loadLogoForPdf();
  const spanLabel = formatTransactionsDateSpan(args.transactions);
  const rangeLabel = `${args.transactions.length} session(s) · ${spanLabel}`;
  const doc = new jsPDF({ unit: "mm", format: "letter", compress: true });

  const subtitle = [
    args.vendorStatus,
    args.contactLine,
    args.productsLine,
  ]
    .filter(Boolean)
    .join(" · ");

  let y = addBrandedHeader(doc, {
    reportTitle: "Vendor profile report",
    reportSubtitle: args.vendorName,
    rangeLabel,
    logo,
  });

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    const pageW = doc.internal.pageSize.getWidth();
    const subLines = doc.splitTextToSize(subtitle, pageW - 2 * MARGIN_MM);
    doc.text(subLines, MARGIN_MM, y);
    y += subLines.length * 3.6 + 4;
  }

  const addSectionTitle = (title: string, startY: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(title, MARGIN_MM, startY);
    return startY + 6;
  };

  const ensureSpace = (neededHeight: number, currentY: number) => {
    const pageH = doc.internal.pageSize.getHeight();
    const maxY = pageH - 18;
    if (currentY + neededHeight > maxY) {
      doc.addPage();
      return addBrandedHeader(doc, {
        reportTitle: "Vendor profile report",
        reportSubtitle: args.vendorName,
        rangeLabel,
        logo,
      });
    }
    return currentY;
  };

  const addChartImages = (startY: number, images: PdfChartImage[] | undefined) => {
    if (!images || images.length === 0) return startY;
    let nextY = startY;
    const pageW = doc.internal.pageSize.getWidth();
    const maxChartW = pageW - 2 * MARGIN_MM;
    const maxChartH = 74;

    nextY = addSectionTitle("Charts", nextY);

    for (const image of images) {
      nextY = ensureSpace(10 + maxChartH, nextY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(image.title, MARGIN_MM, nextY);
      nextY += 3;

      const props = doc.getImageProperties(image.dataUrl);
      const ratio = props.width / Math.max(1, props.height);
      let drawW = maxChartW;
      let drawH = drawW / Math.max(0.1, ratio);
      if (drawH > maxChartH) {
        drawH = maxChartH;
        drawW = drawH * ratio;
      }
      const x = MARGIN_MM + (maxChartW - drawW) / 2;
      const yPos = nextY + 2;
      doc.addImage(image.dataUrl, "PNG", x, yPos, drawW, drawH);
      nextY = yPos + drawH + 7;
    }

    return nextY;
  };

  y = addChartImages(y, args.chartImages);

  y = addSectionTitle("Summary (all-time)", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Attendance rate: ${args.attendanceRate}%`, MARGIN_MM, y);
  y += 5;
  doc.text(`Avg. reported sales / market day: ${formatCurrency(args.avgDailySales)}`, MARGIN_MM, y);
  y += 5;
  doc.text(`Top-selling month: ${args.topSellingMonth}`, MARGIN_MM, y);
  y += 5;
  doc.text(`SNAP total: ${formatCurrency(args.snapTotal)}`, MARGIN_MM, y);
  y += 5;
  doc.text(
    `Payment split (est.): Other ${formatCurrency(args.paymentBreakdown.cashCard)} · SNAP ${formatCurrency(args.paymentBreakdown.snapVouchers)} · DUFB/WDFM/voucher ${formatCurrency(args.paymentBreakdown.marketTokens)}`,
    MARGIN_MM,
    y,
  );
  y += 10;

  y = addSectionTitle("Market sessions", y);
  autoTable(doc, {
    ...tableDefaults,
    startY: y,
    head: [
      [
        "Date",
        "Present",
        "SNAP",
        "DUFB",
        "WDFM",
        "Reimb.",
        "Reported",
        "Produce est.",
      ],
    ],
    body:
      args.transactions.length === 0
        ? [["—", "No sessions on file", "", "", "", "", "", ""]]
        : [...args.transactions]
            .sort((a, b) => b.marketDate.localeCompare(a.marketDate))
            .map((t) => [
              t.marketDate,
              t.present ? "Yes" : "No",
              formatCurrency(t.snap ?? 0),
              formatCurrency(t.dufb ?? 0),
              formatCurrency(t.wdfmTokens ?? 0),
              formatCurrency(t.reimbursementDue ?? 0),
              formatCurrency(t.reportedSales ?? 0),
              t.estProduceSales != null ? String(t.estProduceSales) : "—",
            ]),
  });

  addFooters(doc);

  const safeName = args.vendorName.replace(/[^\w.\-]+/g, "_").slice(0, 80);
  const filename = `MarketOS-vendor-${safeName}.pdf`;

  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeFile } = await import("@tauri-apps/plugin-fs");
      const filePath = await save({
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        defaultPath: filename
      });
      if (filePath) {
        const pdfArrayBuffer = doc.output('arraybuffer');
        await writeFile(filePath, new Uint8Array(pdfArrayBuffer));
      }
    } catch (error) {
      console.error("Failed to save via Tauri:", error);
      doc.save(filename);
    }
  } else {
    doc.save(filename);
  }
}
