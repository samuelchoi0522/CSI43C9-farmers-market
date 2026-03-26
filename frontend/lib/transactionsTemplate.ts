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
  const lastDataRow = vendorNames.length + 1;
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
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = formatTemplateFilename(marketDate);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
