import jsPDF from 'jspdf';
import { Asset, UnifiedMovement } from '@/types/asset/UnifiedAsset';
import { getEmployees } from '@/api/user-management/userApi';
import { UnifiedAssetService } from '@/services/UnifiedAssetService';

export class PARGenerator {
  static async generatePAR(assets: Asset[]): Promise<void> {
    if (assets.length === 0) {
      throw new Error('No assets selected');
    }

    // Validate all assets are PPE
    const invalidAssets = assets.filter(asset => asset.group !== 'PPE');
    if (invalidAssets.length > 0) {
      throw new Error(`Selected assets must be PPE. Invalid assets: ${invalidAssets.map(a => a.propertyNumber).join(', ')}`);
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

        // Get office and division - need to fetch separately or use IDs
        // For now, we'll use placeholder as office/division resolution needs API calls
        const office = 'N/A'; // TODO: Resolve office name from actualOfficeId
        const division = 'N/A'; // TODO: Resolve division name from actualDivisionId

        parData.push({
          employeeName,
          employeeId: employee.employeeId || '',
          office,
          division,
          propertyNumber: fullAsset.propertyNumber,
          description: fullAsset.description,
          serialNumber: fullAsset.serialNumber,
          brandModel: `${fullAsset.brand || ''} ${fullAsset.model || ''}`.trim(),
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

    return movements.sort((a, b) => {
      const dateA = new Date(a.dateAssigned || 0);
      const dateB = new Date(b.dateAssigned || 0);
      return dateB.getTime() - dateA.getTime();
    })[0];
  }

  private static resolveEmployee(movement: UnifiedMovement, employees: any[]): any {
    if (movement.plantillaEmployeeId && movement.plantillaEmployeeId > 0) {
      return employees.find(emp => emp.id === movement.plantillaEmployeeId);
    } else if (movement.nonPlantillaEmployeeId && movement.nonPlantillaEmployeeId > 0) {
      return employees.find(emp => emp.id === movement.nonPlantillaEmployeeId);
    }
    return null;
  }

  private static formatEmployeeName(employee: any): string {
    if (!employee) return '';

    const lastName = employee.lastName || '';
    const firstName = employee.firstName || '';
    const middleName = employee.middleName || '';
    const suffix = employee.suffix || '';

    return `${lastName}, ${firstName} ${middleName} ${suffix}`.trim();
  }

  private static generatePARPDF(parData: any[]): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PROPERTY ACKNOWLEDGEMENT RECEIPT (PAR)', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Table headers
    const headers = [
      'Employee Name',
      'Employee ID',
      'Office',
      'Division',
      'Property Number',
      'Description',
      'Serial Number',
      'Brand/Model',
      'Date Assigned'
    ];

    const columnWidths = [35, 25, 25, 25, 30, 40, 30, 30, 25];
    const rowHeight = 10;

    // Draw table header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    let xPosition = margin;

    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition);
      xPosition += columnWidths[index];
    });

    yPosition += rowHeight;

    // Draw header underline
    doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
    yPosition += 5;

    // Draw table rows
    doc.setFont('helvetica', 'normal');

    parData.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (yPosition + rowHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;

        // Redraw headers on new page
        doc.setFont('helvetica', 'bold');
        xPosition = margin;
        headers.forEach((header, index) => {
          doc.text(header, xPosition, yPosition);
          xPosition += columnWidths[index];
        });
        yPosition += rowHeight;
        doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
        yPosition += 5;
        doc.setFont('helvetica', 'normal');
      }

      xPosition = margin;
      const values = [
        row.employeeName,
        row.employeeId,
        row.office,
        row.division,
        row.propertyNumber,
        row.description,
        row.serialNumber,
        row.brandModel,
        row.dateAssigned
      ];

      values.forEach((value, colIndex) => {
        const cellText = String(value || '');
        const maxWidth = columnWidths[colIndex] - 2;

        // Wrap text if too long
        if (doc.getTextWidth(cellText) > maxWidth) {
          const lines = doc.splitTextToSize(cellText, maxWidth);
          doc.text(lines[0], xPosition, yPosition);
        } else {
          doc.text(cellText, xPosition, yPosition);
        }

        xPosition += columnWidths[colIndex];
      });

      yPosition += rowHeight;
    });

    // Add signature blocks at the bottom
    yPosition += 20;
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    // Issued By
    doc.setFont('helvetica', 'bold');
    doc.text('Issued By:', margin, yPosition);
    yPosition += 25;
    doc.line(margin, yPosition, margin + 60, yPosition); // Signature line
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('Date:', margin, yPosition);
    yPosition += 10;
    doc.line(margin, yPosition, margin + 40, yPosition); // Date line

    // Received By (positioned to the right)
    const receivedX = pageWidth - margin - 60;
    yPosition = pageHeight - 80;
    doc.setFont('helvetica', 'bold');
    doc.text('Received By:', receivedX, yPosition);
    yPosition += 25;
    doc.line(receivedX, yPosition, receivedX + 60, yPosition); // Signature line
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('Date:', receivedX, yPosition);
    yPosition += 10;
    doc.line(receivedX, yPosition, receivedX + 40, yPosition); // Date line

    // Download the PDF
    const fileName = `PAR_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
}
