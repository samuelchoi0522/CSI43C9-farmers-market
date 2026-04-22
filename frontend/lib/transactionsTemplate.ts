import ExcelJS from 'exceljs';
import { getVendors } from '@/lib/api/vendor';
import { getActiveCustomColumns, type CustomColumnMetadata } from '@/lib/api/customColumns';

const BASE_HEADERS = [
  'Vendor Name',
  'Present?',
  'SNAP Voucher',
  'DUFB Voucher',
  'WDFM Tokens',
  'Voucher',
  'Reimb. Due',
  'Reported Sales',
  'FMPP Est',
  'Est # of',
] as const;

const SUMMARY_FIELDS = [
  'Number of Vendors',
  'Total Reported Sales',
  '',
  'Number of Vendors Reporting',
  '% Reporting',
  'Est Total Market Sales',
  'Average Vendor Sales',
  '',
  '# of SNAP Token Transactions',
  '$$ SNAP Tokens purchased',
  '$$ SNAP Tokens redeemed',
  'SNAP Redemption Rate',
  '# of DUFB Token Transactions',
  '$$ DUFB Tokens Distributed',
  '$$ DUFB Tokens redeemed',
  'DUFB Redemption Rate',
  '# of WDFM Token Transactions',
  '$$ WDFM Tokens purchased',
  'Gift Cards Redeemed for Tokens',
  '$$$ WDFM Tokens for Market Meals',
  'TOTAL Tokens Distributed',
  '$$ WDFM Tokens redeemed',
  'WDFM Token Redemption Rate',
  '',
  '',
  'Total Tokens/Vouchers Reimbursed',
  '',
  'Total Cash Booth Fees',
  'Other Fees',
  'Donations',
  'Cash Merch Sales',
  'Tokens Reimbursed with Cash',
  'Staff Lunch (Cash)',
  'Volunteer Lunches',
  'Net Collected',
  'Petty Cash',
  'Fees Not Paid',
  'Cash Held by Market Manager',
  '',
  'Weekly Wellness Attendance',
] as const;

const toSafeDate = (marketDate: string) => {
  const parsed = new Date(`${marketDate}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatTemplateFilename = (marketDate: string) => {
  const date = toSafeDate(marketDate);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}_${day}_${year} Trans Report.xlsx`;
};

const createCustomHeader = (column: CustomColumnMetadata) => column.name;
const TEMPLATE_MAX_ROWS = 5000;

const buildTemplateRows = (vendorNames: string[], customColumns: CustomColumnMetadata[]) => {
  const headers = [...BASE_HEADERS, ...customColumns.map(createCustomHeader)];

  const dataRows = vendorNames.map((vendorName) => {
    const base = [
      vendorName,
      'No',
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ];

    const customDefaults = customColumns.map((column) => {
      if (column.type === 'number') return 0;
      return '';
    });

    return [...base, ...customDefaults];
  });

  return [headers, ...dataRows];
};

const columnLetter = (colNumber: number) => {
  let n = colNumber;
  let result = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
};

const applyDataValidations = (
  worksheet: ExcelJS.Worksheet,
  customColumns: CustomColumnMetadata[],
  rangeEnd: number
) => {
  for (let row = 2; row <= rangeEnd; row += 1) {
    worksheet.getCell(`A${row}`).dataValidation = {
      type: 'custom',
      allowBlank: false,
      formulae: [`AND(A${row}<>"",ISTEXT(A${row}))`],
      showErrorMessage: true,
      errorTitle: 'Invalid Vendor Name',
      error: 'Vendor Name is required and must be text.',
    };

    worksheet.getCell(`B${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Yes,No,Y,N,True,False,1,0"'],
      showErrorMessage: true,
      errorTitle: 'Invalid Boolean',
      error: 'Use Yes/No, Y/N, True/False, or 1/0.',
    };

    for (const col of ['C', 'D', 'E', 'F', 'G', 'H', 'I']) {
      worksheet.getCell(`${col}${row}`).dataValidation = {
        type: 'custom',
        allowBlank: true,
        formulae: [`OR(${col}${row}="",ISNUMBER(${col}${row}))`],
        showErrorMessage: true,
        errorTitle: 'Invalid Number',
        error: 'This column requires a numeric value.',
      };
    }

    worksheet.getCell(`J${row}`).dataValidation = {
      type: 'custom',
      allowBlank: true,
      formulae: [`OR(J${row}="",AND(ISNUMBER(J${row}),INT(J${row})=J${row}))`],
      showErrorMessage: true,
      errorTitle: 'Invalid Integer',
      error: 'This column requires an integer value.',
    };

    customColumns.forEach((column, customIndex) => {
      const excelCol = columnLetter(11 + customIndex);
      const required = column.isRequired;
      const isNumber = column.type === 'number';
      const formula = isNumber
        ? (required
          ? `AND(${excelCol}${row}<>"",ISNUMBER(${excelCol}${row}))`
          : `OR(${excelCol}${row}="",ISNUMBER(${excelCol}${row}))`)
        : (required
          ? `AND(${excelCol}${row}<>"",ISTEXT(${excelCol}${row}))`
          : `OR(${excelCol}${row}="",ISTEXT(${excelCol}${row}))`);

      worksheet.getCell(`${excelCol}${row}`).dataValidation = {
        type: 'custom',
        allowBlank: !required,
        formulae: [formula],
        showErrorMessage: true,
        errorTitle: `Invalid ${isNumber ? 'Number' : 'Text'}`,
        error: isNumber
          ? `${column.name} must be ${required ? 'a required number' : 'a number or blank'}.`
          : `${column.name} must be ${required ? 'required text' : 'text or blank'}.`,
      };
    });
  }
};

const addSummaryTable = (worksheet: ExcelJS.Worksheet) => {
  const labelColumn = 1;
  const inputColumn = 2;
  const startRow = 2;
  const inputColumnLetter = columnLetter(inputColumn);
  const inputCellByLabel = new Map<string, string>();

  SUMMARY_FIELDS.forEach((field, index) => {
    const row = startRow + index;
    worksheet.getCell(row, labelColumn).value = field;

    if (field) {
      const inputCell = worksheet.getCell(row, inputColumn);
      inputCell.value = '';
      inputCellByLabel.set(field, `${inputColumnLetter}${row}`);
      inputCell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    }
  });

  //TODO: FIX THE FORMULAS HERE!!!!

  // setFormula('Number of Vendors', `COUNTA(${mainRange('A')})`);
  // setFormula('Total Reported Sales', `SUM(${mainRange('H')})`);
  // setFormula('Number of Vendors Reporting', `COUNTIF(${mainRange('H')},">0")`);
  // setFormula('% Reporting', `${inputCellByLabel.get('Number of Vendors Reporting')}/${inputCellByLabel.get('Number of Vendors')}`);
  // setFormula('Est Total Market Sales', `${inputCellByLabel.get('Total Reported Sales')}/${inputCellByLabel.get('% Reporting')}`);
  // setFormula('Average Vendor Sales', `${inputCellByLabel.get('Est Total Market Sales')}/${inputCellByLabel.get('Number of Vendors')}`);

  // setValue('# of SNAP Token Transactions', 3);
  // setValue('$$ SNAP Tokens purchased', 50);
  // setFormula('$$ SNAP Tokens redeemed', `SUM(${mainRange('C')})`);
  // setFormula('SNAP Redemption Rate', `${inputCellByLabel.get('$$ SNAP Tokens redeemed')}/${inputCellByLabel.get('$$ SNAP Tokens purchased')}`);
  // setValue('# of DUFB Token Transactions', 3);
  // setValue('$$ DUFB Tokens Distributed', 50);
  // setFormula('$$ DUFB Tokens redeemed', `SUM(${mainRange('D')})`);
  // setFormula('DUFB Redemption Rate', `${inputCellByLabel.get('$$ DUFB Tokens redeemed')}/${inputCellByLabel.get('$$ DUFB Tokens Distributed')}`);
  // setValue('# of WDFM Token Transactions', 16);
  // setValue('$$ WDFM Tokens purchased', 203);
  // setValue('Gift Cards Redeemed for Tokens', 5);
  // setValue('$$$ WDFM Tokens for Market Meals', 60);
  // setFormula(
  //   'TOTAL Tokens Distributed',
  //   `${inputCellByLabel.get('$$ SNAP Tokens purchased')}+${inputCellByLabel.get('$$ DUFB Tokens Distributed')}+${inputCellByLabel.get('$$ WDFM Tokens purchased')}`
  // );
  // setFormula('$$ WDFM Tokens redeemed', `SUM(${mainRange('E')})`);
  // setFormula('WDFM Token Redemption Rate', `${inputCellByLabel.get('$$ WDFM Tokens redeemed')}/${inputCellByLabel.get('TOTAL Tokens Distributed')}`);

  // setFormula('Total Tokens/Vouchers Reimbursed', `SUM(${mainRange('G')})`);

  // setValue('Other Fees', -6);
  // setValue('Donations', '-');
  // setValue('Cash Merch Sales', 40);
  // setValue('Tokens Reimbursed with Cash', -85);
  // setFormula('Net Collected', `SUM(${inputCellByLabel.get('Total Cash Booth Fees')}:${inputCellByLabel.get('Volunteer Lunches')})`);
  // setValue('Petty Cash', 200);
  // setFormula('Fees Not Paid', `SUM(${mainRange('I')})`);
  // setFormula(
  //   'Cash Held by Market Manager',
  //   `${inputCellByLabel.get('Net Collected')}+${inputCellByLabel.get('Petty Cash')}+${inputCellByLabel.get('Fees Not Paid')}`
  // );

  // setValue('Weekly Wellness Attendance', 'n/a');
};

export async function downloadVendorTransactionsTemplate(marketDate: string): Promise<void> {
  const [vendorsResponse, customColumns] = await Promise.all([
    getVendors(0, 1000, false),
    getActiveCustomColumns(),
  ]);

  const vendorNames = vendorsResponse.data
    .map((vendor) => vendor.vendorName.trim())
    .filter((name) => name.length > 0)
    .sort((a, b) => a.localeCompare(b));

  const workbook = new ExcelJS.Workbook();
  const rows = buildTemplateRows(vendorNames, customColumns);
  const worksheet = workbook.addWorksheet('Transactions');
  rows.forEach((row) => worksheet.addRow(row));
  const firstDataRow = 2;
  const lastDataRow = Math.max(vendorNames.length + 1, firstDataRow);
  const additionalValuesSheet = workbook.addWorksheet('Additional Values');
  addSummaryTable(additionalValuesSheet);
  const hasDataRows = vendorNames.length > 0;

  if (hasDataRows) {
    for (let row = firstDataRow; row <= lastDataRow; row += 1) {
      worksheet.getCell(`G${row}`).value = { formula: `SUM(C${row}:F${row})` };
    }
  }

  const rangeEnd = Math.max(vendorNames.length + 200, TEMPLATE_MAX_ROWS);
  applyDataValidations(worksheet, customColumns, rangeEnd);

  const metadataSheet = workbook.addWorksheet('Custom Column Metadata');
  metadataSheet.addRow(['id', 'name', 'type', 'is_required']);
  customColumns.forEach((column) => {
    metadataSheet.addRow([column.id, column.name, column.type, column.isRequired ? 1 : 0]);
  });
  metadataSheet.state = 'hidden';

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = formatTemplateFilename(marketDate);

  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeFile } = await import("@tauri-apps/plugin-fs");
      const filePath = await save({
        filters: [{ name: 'Excel', extensions: ['xlsx'] }],
        defaultPath: filename
      });
      if (filePath) {
        await writeFile(filePath, new Uint8Array(buffer));
      }
    } catch (error) {
      console.error("Failed to save via Tauri:", error);
      triggerBrowserDownload(buffer, filename);
    }
  } else {
    triggerBrowserDownload(buffer, filename);
  }
}

function triggerBrowserDownload(buffer: ExcelJS.Buffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

type ExportTransactionRow = {
  vendor_name: string;
  present: boolean;
  snap: number;
  dufb: number;
  wdfm_tokens: number;
  voucher: number;
  reported_sales: number;
  est_produce_sales: number;
  est_num_transactions: number | null;
  customData?: Record<string, unknown>;
};

const formatExportFilename = (marketDate: string) => {
  const date = toSafeDate(marketDate);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}_${day}_${year} Trans Export.xlsx`;
};

const toCustomCellValue = (value: unknown, column: CustomColumnMetadata) => {
  if (value == null) {
    return column.type === 'number' || column.type === 'usd' ? 0 : '';
  }

  if (column.type === 'boolean') {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    const normalized = String(value).trim().toLowerCase();
    if (['y', 'yes', 'true', '1'].includes(normalized)) return 'Yes';
    if (['n', 'no', 'false', '0'].includes(normalized)) return 'No';
    return String(value);
  }

  if (column.type === 'number' || column.type === 'usd') {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  return String(value);
};

export async function exportVendorTransactionsSpreadsheet(
  marketDate: string,
  rows: ExportTransactionRow[],
  customColumns: CustomColumnMetadata[]
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Transactions');

  const headers = [...BASE_HEADERS, ...customColumns.map(createCustomHeader)];
  worksheet.addRow(headers);

  rows.forEach((row) => {
    const base = [
      row.vendor_name,
      row.present ? 'Yes' : 'No',
      row.snap ?? 0,
      row.dufb ?? 0,
      row.wdfm_tokens ?? 0,
      row.voucher ?? 0,
      null, // formula set after insert
      row.reported_sales ?? 0,
      row.est_produce_sales ?? 0,
      row.est_num_transactions ?? null,
    ];

    const customValues = customColumns.map((column) => {
      const columnId = column.id;
      if (columnId === undefined) return '';
      return toCustomCellValue(row.customData?.[columnId], column);
    });

    worksheet.addRow([...base, ...customValues]);
  });

  const firstDataRow = 2;
  const lastDataRow = Math.max(rows.length + 1, firstDataRow);
  const hasDataRows = rows.length > 0;

  const additionalValuesSheet = workbook.addWorksheet('Additional Values');
  addSummaryTable(additionalValuesSheet);

  if (hasDataRows) {
    for (let row = firstDataRow; row <= lastDataRow; row += 1) {
      worksheet.getCell(`G${row}`).value = { formula: `SUM(C${row}:F${row})` };
    }
  }

  const metadataSheet = workbook.addWorksheet('Custom Column Metadata');
  metadataSheet.addRow(['id', 'name', 'type', 'is_required']);
  customColumns.forEach((column) => {
    metadataSheet.addRow([column.id, column.name, column.type, column.isRequired ? 1 : 0]);
  });
  metadataSheet.state = 'hidden';

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = formatExportFilename(marketDate);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
