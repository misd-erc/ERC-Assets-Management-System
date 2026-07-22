// One-off script to (re)generate public/templates/EMPLOYEE_BATCH_UPLOAD_TEMPLATE.xlsx
// Run with: node scripts/generate-employee-template.js
const path = require('path');
const ExcelJS = require('exceljs');

const HEADERS = [
  'Employee ID',
  'First Name',
  'Middle Name',
  'Last Name',
  'Suffix Name',
  'Office Name',
  'Division Name',
  'Employment Type Name',
  'Position Name',
  'Status',
];

const SAMPLE_ROW = [
  'ERC-2026-001',
  'Juan',
  'Santos',
  'Dela Cruz',
  '',
  'Finance and Administrative Service',
  'General Services Division',
  'Permanent',
  'Administrative Officer II',
  'Active',
];

async function main() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Employees');

  sheet.columns = HEADERS.map((h) => ({ width: Math.max(18, h.length + 4) }));

  const headerRow = sheet.addRow(HEADERS);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    };
  });

  sheet.addRow(SAMPLE_ROW);

  // A few blank rows ready for filling in.
  for (let i = 0; i < 10; i++) sheet.addRow([]);

  const notes = workbook.addWorksheet('Instructions');
  notes.columns = [{ width: 100 }];
  const lines = [
    'EMPLOYEE BATCH UPLOAD — INSTRUCTIONS',
    '',
    '1. Do not rename, reorder, or remove any column on the "Employees" sheet.',
    '2. Row 1 is the header row. Row 2 is a sample entry — replace it with your own data or delete it.',
    '3. REQUIRED for every row: Employee ID, First Name, Middle Name, Last Name.',
    '   A row missing any of these will cause the WHOLE file to be rejected — no partial uploads.',
    '   "Employee ID" is used to match an existing employee (update) or create a new one (insert).',
    '4. OPTIONAL: Suffix Name, Office Name, Division Name, Employment Type Name, Position Name, Status.',
    '   Leave any of these blank to skip that field.',
    '5. "Office Name", "Division Name", "Employment Type Name", and "Position Name" (when provided) must',
    '   exactly match the names already set up under Office Management in the system.',
    '6. "Status" accepts "Active" or "Inactive". Leave blank to default to Active.',
    '7. Save the file as .xlsx and upload it via Employees > Batch Upload.',
  ];
  lines.forEach((line, i) => {
    const row = notes.addRow([line]);
    if (i === 0) row.getCell(1).font = { bold: true, size: 13 };
  });

  const outPath = path.join(__dirname, '..', 'public', 'templates', 'EMPLOYEE_BATCH_UPLOAD_TEMPLATE.xlsx');
  await workbook.xlsx.writeFile(outPath);
  console.log('Wrote', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
