// src/components/reports/PARGenerator.ts
import jsPDF from 'jspdf';
import { Asset, UnifiedMovement } from '@/types/asset/UnifiedAsset';
import { getEmployees } from '@/api/user-management/userApi';
import { UnifiedAssetService } from '@/services/UnifiedAssetService';

/**
 * Logo source handling:
 * - Browser: window.location.origin + '/images/erc-logo.png'
 * - Otherwise (server/local): use uploaded file path from conversation history
 */
const logoSrc =
  typeof window !== 'undefined'
    ? `${window.location.origin}/images/erc-logo.png`
    : '/mnt/data/f2bc7bb8-25c5-47db-bc3b-9beb926dac1b.png';

export class PARGenerator {
  static async generatePAR(assets: Asset[]): Promise<void> {
    if (!assets || assets.length === 0) {
      throw new Error('No assets selected');
    }

    // Validate all assets are PPE
    const invalidAssets = assets.filter(asset => asset.group !== 'PPE');
    if (invalidAssets.length > 0) {
      throw new Error(
        `Selected assets must be PPE. Invalid assets: ${invalidAssets.map(a => a.propertyNumber).join(', ')}`
      );
    }

    // Fetch employee data
    const employeesResponse = await getEmployees(1, 10000);
    const employees = employeesResponse.data.items;

    // Process each asset
    const parData: any[] = [];

    for (const asset of assets) {
      try {
        // Fetch full asset details
        const fullAsset = await UnifiedAssetService.getById(asset.id);

        // Get latest movement
        const latestMovement = this.getLatestMovement(fullAsset.movements);
        if (!latestMovement) {
          console.warn(`No movement found for asset ${asset.propertyNumber}`);
          continue;
        }

        // Resolve employee
        const employee = this.resolveEmployee(latestMovement, employees);
        if (!employee) {
          console.warn(`No accountable employee found for asset ${asset.propertyNumber}`);
          continue;
        }

        // Format employee name
        const employeeName = this.formatEmployeeName(employee);

        // TODO: Replace these placeholders with actual office/division lookups if needed
        const office = 'N/A';
        const division = 'N/A';

        parData.push({
          employeeName,
          employeeId: employee.employeeId || '',
          office,
          division,
          propertyNumber: fullAsset.propertyNumber,
          description: fullAsset.description || '',
          serialNumber: fullAsset.serialNumber || 'N/A',
          brandModel: `${fullAsset.brand || ''} ${fullAsset.model || ''}`.trim() || 'N/A',
          dateAssigned: latestMovement.dateAssigned ? new Date(latestMovement.dateAssigned).toLocaleDateString() : '',
        });
      } catch (error) {
        console.error(`Error processing asset ${asset.propertyNumber}:`, error);
        continue;
      }
    }

    if (parData.length === 0) {
      throw new Error('No valid assets found for PAR generation');
    }

    // Generate PDF
    this.generatePARPDF(parData);
  }

  private static getLatestMovement(movements: UnifiedMovement[]): UnifiedMovement | null {
    if (!movements || movements.length === 0) return null;

    return movements
      .slice()
      .sort((a, b) => {
        const dateA = a?.dateAssigned ? new Date(a.dateAssigned).getTime() : 0;
        const dateB = b?.dateAssigned ? new Date(b.dateAssigned).getTime() : 0;
        return dateB - dateA;
      })[0];
  }

  private static resolveEmployee(movement: UnifiedMovement, employees: any[]): any {
    if (movement.plantillaEmployeeId && movement.plantillaEmployeeId > 0) {
      return employees.find((emp: any) => emp.id === movement.plantillaEmployeeId);
    } else if (movement.nonPlantillaEmployeeId && movement.nonPlantillaEmployeeId > 0) {
      return employees.find((emp: any) => emp.id === movement.nonPlantillaEmployeeId);
    }
    return null;
  }

  private static formatEmployeeName(employee: any): string {
    if (!employee) return '';

    const lastName = employee.lastName || '';
    const firstName = employee.firstName || '';
    const middleName = employee.middleName || '';
    const suffix = employee.suffixName || employee.suffix || '';

    return `${lastName}, ${firstName} ${middleName} ${suffix}`.trim();
  }

  private static generatePARPDF(parData: any[]): void {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' }); // use points for finer control
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 28;
    const startX = margin;
    let y = margin;

    // Compact design settings
    const titleFontSize = 12;
    const headerFontSize = 8;
    const rowFontSize = 7;
    const lineSpacing = 4;

    // Column widths (adjusted to compact layout)
    const colWidths = [
      110, // Employee Name
      60,  // Employee ID
      60,  // Office
      60,  // Division
      80,  // Property Number
      140, // Description (bigger)
      70,  // Serial Number
      90,  // Brand/Model
      60,  // Date Assigned
    ];

    // Precompute total width (for possible scaling)
    const totalColsWidth = colWidths.reduce((s, w) => s + w, 0);
    const usableWidth = pageWidth - margin * 2;
    let scaleX = 1;
    if (totalColsWidth > usableWidth) {
      scaleX = usableWidth / totalColsWidth;
    }

    // Draw header (logo + title)
    // Try to draw image — if URL, jsPDF will load it; if local path not accepted, it may throw, so we wrap in try/catch.
    try {
      // Attempt to add image at left
      // Use width/height in pts
      const logoW = 48;
      const logoH = 48;
      // jsPDF supports image URL or base64 (browser accepts URL for same-origin)
      // Note: if the image fails to load in some envs, the try/catch prevents crashing
      doc.addImage(logoSrc as any, 'PNG', startX, y, logoW, logoH);
    } catch (e) {
      // ignore image errors
      // console.warn('Logo could not be added to PDF:', e);
    }

    // Title block (centered)
    doc.setFontSize(titleFontSize);
    doc.setFont('helvetica', 'bold');
    const titleLines = [
      'Republic of the Philippines',
      'ENERGY',
      'REGULATORY',
      'COMMISSION',
      '',
      'PROPERTY ACKNOWLEDGEMENT RECEIPT (PAR)',
    ];
    // place title aligned to center, but consider left padding for logo
    const titleX = startX + 60;
    let titleY = y + 6; // small offset to align vertically with logo
    titleLines.forEach((line, idx) => {
      doc.setFontSize(idx === titleLines.length - 1 ? titleFontSize : headerFontSize);
      doc.text(line, pageWidth / 2, titleY, { align: 'center' });
      titleY += idx === titleLines.length - 1 ? titleFontSize + 6 : headerFontSize + 2;
    });

    // Move y below header area
    y += 56;

    // Draw blue rule
    const ruleHeight = 6;
    doc.setFillColor(10, 98, 198); // #0A62C6
    doc.rect(margin, y, pageWidth - margin * 2, ruleHeight, 'F');
    y += ruleHeight + 8;

    // Prepare headers
    const headers = [
      'Employee Name',
      'Employee ID',
      'Office',
      'Division',
      'Property No.',
      'Description',
      'Serial No.',
      'Brand/Model',
      'Date Assigned',
    ];

    // Draw table header
    doc.setFontSize(headerFontSize);
    doc.setFont('helvetica', 'bold');
    let x = startX;
    for (let i = 0; i < headers.length; i++) {
      const w = colWidths[i] * scaleX;
      // small padding inside cell
      doc.text(headers[i], x + 2, y + headerFontSize);
      x += w;
    }
    y += headerFontSize + 6;

    // Draw underline for header
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, y - 4, pageWidth - margin, y - 4);
    y += 4;

    // Rows: wrap text per column using splitTextToSize, compute row height based on max lines
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(rowFontSize);

    const rowPaddingV = 4;

    for (let rowIndex = 0; rowIndex < parData.length; rowIndex++) {
      const row = parData[rowIndex];
      // prepare values
      const values = [
        row.employeeName || '',
        row.employeeId || '',
        row.office || '',
        row.division || '',
        row.propertyNumber || '',
        row.description || '',
        row.serialNumber || '',
        row.brandModel || '',
        row.dateAssigned || '',
      ];

      // calculate wrapped lines for each column
      const colLines: string[][] = [];
      let maxLines = 1;
      for (let c = 0; c < values.length; c++) {
        const cellText = String(values[c] || '');
        const w = Math.max(10, Math.floor(colWidths[c] * scaleX - 4)); // subtract padding
        const lines = doc.splitTextToSize(cellText, w);
        colLines.push(lines);
        if (lines.length > maxLines) maxLines = lines.length;
      }

      // compute required row height
      const rowHeight = maxLines * (rowFontSize + 2) + rowPaddingV;

      // If not enough space on page, add page and redraw header + rule + header titles
      if (y + rowHeight > pageHeight - margin - 120) {
        doc.addPage();
        // reset y
        y = margin;

        // redraw header on new page (compact)
        // try drawing logo small
        try {
          doc.addImage(logoSrc as any, 'PNG', startX, y, 36, 36);
        } catch (e) {
          /* ignore */
        }
        doc.setFontSize(headerFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text('PROPERTY ACKNOWLEDGEMENT RECEIPT (PAR)', pageWidth / 2, y + 10, { align: 'center' });
        y += 46;

        // blue rule
        doc.setFillColor(10, 98, 198);
        doc.rect(margin, y, pageWidth - margin * 2, ruleHeight, 'F');
        y += ruleHeight + 8;

        // redraw headers
        doc.setFontSize(headerFontSize);
        doc.setFont('helvetica', 'bold');
        x = startX;
        for (let i = 0; i < headers.length; i++) {
          const w = colWidths[i] * scaleX;
          doc.text(headers[i], x + 2, y + headerFontSize);
          x += w;
        }
        y += headerFontSize + 6;
        doc.line(margin, y - 4, pageWidth - margin, y - 4);
        y += 4;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(rowFontSize);
      }

      // draw the cell lines (optional) and text
      x = startX;
      const cellInnerPadding = 2;
      for (let c = 0; c < values.length; c++) {
        const w = colWidths[c] * scaleX;
        const lines = colLines[c];
        // draw cell text line by line
        for (let li = 0; li < lines.length; li++) {
          const text = lines[li];
          const tx = x + cellInnerPadding;
          const ty = y + (li * (rowFontSize + 2)) + rowFontSize;
          doc.text(text, tx, ty);
        }
        // optional: vertical separators
        // doc.line(x + w, y - rowPaddingV, x + w, y + rowHeight - rowPaddingV);
        x += w;
      }

      // move y to next row
      y += rowHeight;
      // thin horizontal line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, y - 2, pageWidth - margin, y - 2);
      doc.setDrawColor(0, 0, 0);
    }

    // Reserve and place signature blocks pinned to bottom of last page
    // If not enough vertical space on current page for signatures, add new page
    const sigBlockHeight = 90;
    if (y + sigBlockHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    } else {
      // push signatures down towards bottom of page (we align from bottom)
      y = Math.max(y + 20, pageHeight - margin - sigBlockHeight + 20);
    }

    // Issued By (left)
    const sigLeftX = margin;
    const sigRightX = pageWidth - margin - 200; // width reserved for signature block

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Issued By:', sigLeftX, y);
    // signature line
    doc.setLineWidth(0.7);
    doc.line(sigLeftX, y + 28, sigLeftX + 160, y + 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Date:', sigLeftX, y + 40);
    doc.line(sigLeftX, y + 56, sigLeftX + 100, y + 56);

    // Received By (right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Received By:', sigRightX, y);
    doc.setLineWidth(0.7);
    doc.line(sigRightX, y + 28, sigRightX + 160, y + 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Date:', sigRightX, y + 40);
    doc.line(sigRightX, y + 56, sigRightX + 100, y + 56);

    // finalize download
    const fileName = `PAR_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
}
