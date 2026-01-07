const XLSX = require('xlsx');
const path = require('path');

const templatePath = path.join(__dirname, 'public/ppe-templates/ppe_template.xlsx');

try {
  const workbook = XLSX.readFile(templatePath);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Read header row (row 2 = index 1)
  const HEADER_ROW = 1;
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

  const headers = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: HEADER_ROW, c: col })];
    headers.push(cell?.v?.toString().trim() || '');
  }

  console.log('Total Columns:', headers.length);
  console.log('\nHeaders:');
  headers.forEach((header, index) => {
    console.log(`Column ${index + 1}: "${header}"`);
  });

  // Parse into base + movement blocks
  console.log('\n--- STRUCTURE ANALYSIS ---');
  const movementBlockSize = 6; // Expected size
  const baseCount = 13; // If fiscal year added
  
  if (headers.length >= baseCount) {
    console.log('\nBase Headers (columns 1-' + baseCount + '):');
    headers.slice(0, baseCount).forEach((h, i) => {
      console.log(`  ${i + 1}. ${h}`);
    });

    const remaining = headers.slice(baseCount);
    console.log('\nMovement Block Headers (' + remaining.length + ' columns):');
    remaining.forEach((h, i) => {
      console.log(`  ${i + 1}. ${h}`);
    });

    const blockCount = remaining.length / movementBlockSize;
    console.log(`\nDetected Movement Blocks: ${blockCount} (expected ${movementBlockSize} columns per block)`);
  }
} catch (error) {
  console.error('Error reading template:', error.message);
}
