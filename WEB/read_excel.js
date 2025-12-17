const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('2025 RPCPPE_with New Property Number (1).xls');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  console.log('Sheet Name:', sheetName);
  console.log('Worksheet Range:', worksheet['!ref']);

  // Get headers
  const headers = [];
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    const cell = worksheet[cellAddress];
    headers.push(cell ? cell.v : '');
  }
  console.log('Headers:', headers);

  // Get all rows of data
  for (let row = 1; row <= range.e.r; row++) {
    const rowData = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      rowData.push(cell ? cell.v : '');
    }
    console.log(`Row ${row}:`, rowData);
  }

  // Check for merges
  if (worksheet['!merges']) {
    console.log('Merged cells:', worksheet['!merges']);
  }

  // Check for column widths
  if (worksheet['!cols']) {
    console.log('Column widths:', worksheet['!cols']);
  }

} catch (error) {
  console.error('Error reading Excel file:', error);
}
