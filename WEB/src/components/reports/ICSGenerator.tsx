// src/components/reports/ICSGenerator.tsx
import React from 'react';
import { pdf, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Asset, UnifiedMovement } from '@/types/asset/UnifiedAsset';
import { getEmployees } from '@/api/user-management/userApi';
import { getOffices } from '@/api/office-management/officeApi';
import { getDivisions } from '@/api/office-management/divisionApi';
import { UnifiedAssetService } from '@/services/UnifiedAssetService';

/**
 * Logo source handling:
 * - When running in the browser, prefer the served public URL: window.location.origin + '/images/erc-logo.png'
 * - Otherwise (server / Node), use the local uploaded file path. This path was provided earlier:
 *   /mnt/data/f2bc7bb8-25c5-47db-bc3b-9beb926dac1b.png
 */
const logoSrc =
  typeof window !== 'undefined'
    ? `${window.location.origin}/images/erc-logo.png`
    : '/mnt/data/f2bc7bb8-25c5-47db-bc3b-9beb926dac1b.png';

const styles = StyleSheet.create({
  // Page is column so we can push signature to bottom with marginTop: 'auto'
  page: {
    padding: 18,
    fontSize: 8,
    fontFamily: 'Helvetica',
    flexDirection: 'column',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: 8,
  },
  logo: { width: 50, height: 50 },
  titleBlock: { flex: 1, paddingLeft: 8, textAlign: 'center' },
  smallText: { fontSize: 8 },
  bigText: { fontSize: 12, fontWeight: 'bold', lineHeight: 1.05 },
  blueRule: { height: 3, backgroundColor: '#0A62C6', marginTop: 6, marginBottom: 8 },
  tableWrap: {
    // make tableWrap flex:1 so it expands to fill vertical space
    flex: 1,
    width: '100%',
    marginBottom: 12,
  },
  table: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    minHeight: 14,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f7f7f7',
    fontWeight: 'bold',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
  },
  tableCell: {
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: '#000',
    flex: 1,
    fontSize: 8,
  },
  custodianCell: { width: '12%' },
  employeeIdCell: { width: '8%' },
  officeCell: { width: '10%' },
  divisionCell: { width: '10%' },
  propertyNoCell: { width: '10%' },
  descriptionCell: { width: '18%' },
  serialNoCell: { width: '10%' },
  brandModelCell: { width: '12%' },
  dateIssuedCell: { width: '9%' },
  signatureSection: {
    // push to bottom of pageWrap because tableWrap uses flex:1
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 8,
  },
  signatureBlock: {
    width: '45%',
  },
  signatureLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    marginTop: 4,
    marginBottom: 4,
    height: 16,
  },
});

/** Truncate helper to avoid long strings breaking layout */
function truncate(text?: string | null, maxChars = 80): string {
  if (!text) return '';
  const s = String(text);
  if (s.length <= maxChars) return s;
  const truncated = s.slice(0, maxChars - 1);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > Math.floor(maxChars * 0.6)) {
    return truncated.slice(0, lastSpace).trimEnd() + '…';
  }
  return truncated.trimEnd() + '…';
}

interface ICSData {
  custodianName: string;
  employeeOriginalId: string;
  officeName: string;
  divisionName: string;
  propertyNumber: string;
  description: string;
  serialNumber: string;
  brandModel: string;
  dateIssued: string;
}

const ICSDocument = ({ icsData }: { icsData: ICSData[] }) => {
  const rowsPerPage = 40;
  const pages: ICSData[][] = [];
  for (let i = 0; i < icsData.length; i += rowsPerPage) {
    pages.push(icsData.slice(i, i + rowsPerPage));
  }

  return (
    <Document>
      {pages.map((pageData, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <Image src={logoSrc} style={styles.logo} />
            <View style={styles.titleBlock}>
              <Text style={styles.smallText}>Republic of the Philippines</Text>
              <Text style={styles.bigText}>ENERGY</Text>
              <Text style={styles.bigText}>REGULATORY</Text>
              <Text style={styles.bigText}>COMMISSION</Text>
            </View>
          </View>

          <View style={styles.blueRule} />

          {/* TABLE WRAP (flex:1 so it consumes available vertical space) */}
          <View style={styles.tableWrap}>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.custodianCell]}>Custodian Name</Text>
                <Text style={[styles.tableCell, styles.employeeIdCell]}>Employee ID</Text>
                <Text style={[styles.tableCell, styles.officeCell]}>Office</Text>
                <Text style={[styles.tableCell, styles.divisionCell]}>Division</Text>
                <Text style={[styles.tableCell, styles.propertyNoCell]}>Property No.</Text>
                <Text style={[styles.tableCell, styles.descriptionCell]}>Description</Text>
                <Text style={[styles.tableCell, styles.serialNoCell]}>Serial No.</Text>
                <Text style={[styles.tableCell, styles.brandModelCell]}>Brand/Model</Text>
                <Text style={[styles.tableCell, styles.dateIssuedCell]}>Date Issued</Text>
              </View>

              {pageData.map((row, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.custodianCell]}>{truncate(row.custodianName, 30)}</Text>
                  <Text style={[styles.tableCell, styles.employeeIdCell]}>{truncate(row.employeeOriginalId, 20)}</Text>
                  <Text style={[styles.tableCell, styles.officeCell]}>{truncate(row.officeName, 30)}</Text>
                  <Text style={[styles.tableCell, styles.divisionCell]}>{truncate(row.divisionName, 30)}</Text>
                  <Text style={[styles.tableCell, styles.propertyNoCell]}>{truncate(row.propertyNumber, 28)}</Text>
                  <Text style={[styles.tableCell, styles.descriptionCell]}>{truncate(row.description, 110)}</Text>
                  <Text style={[styles.tableCell, styles.serialNoCell]}>{truncate(row.serialNumber, 30)}</Text>
                  <Text style={[styles.tableCell, styles.brandModelCell]}>{truncate(row.brandModel, 30)}</Text>
                  <Text style={[styles.tableCell, styles.dateIssuedCell]}>{truncate(row.dateIssued, 16)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Signatures ALWAYS at bottom of the page */}
          {pageIndex === pages.length - 1 && (
            <View style={styles.signatureSection}>
              <View style={styles.signatureBlock}>
                <Text>Issued By:</Text>
                <View style={styles.signatureLine} />
                <Text>Date:</Text>
                <View style={styles.signatureLine} />
              </View>

              <View style={styles.signatureBlock}>
                <Text>Received By:</Text>
                <View style={styles.signatureLine} />
                <Text>Date:</Text>
                <View style={styles.signatureLine} />
              </View>
            </View>
          )}
        </Page>
      ))}
    </Document>
  );
};

export class ICSGenerator {
  static async generateICS(assets: Asset[]): Promise<void> {
    if (!assets || assets.length === 0) {
      throw new Error('No assets selected');
    }

    const invalidAssets = assets.filter(a => a.group !== 'SE');
    if (invalidAssets.length > 0) {
      throw new Error(`Selected assets must be SE. Invalid assets: ${invalidAssets.map(a => a.propertyNumber).join(', ')}`);
    }

    const employeesResponse = await getEmployees(1, 10000);
    const employees = employeesResponse.data.items;

    const [offices, divisions] = await Promise.all([getOffices(), getDivisions()]);

    const icsData: ICSData[] = [];

    for (const asset of assets) {
      try {
        const fullAsset = await UnifiedAssetService.getById(asset.id);
        const latestMovement = this.getLatestMovement(fullAsset.movements);
        if (!latestMovement) {
          throw new Error(`No movement found for asset ${asset.propertyNumber}`);
        }
        const employee = this.resolveEmployee(latestMovement, employees);
        if (!employee) {
          throw new Error(`No assigned custodian for asset ${asset.propertyNumber}`);
        }
        const custodianName = this.formatEmployeeName(employee);
        const office = offices.find(o => o.id === latestMovement.actualOfficeId);
        const division = divisions.find(d => d.id === latestMovement.actualDivisionId);
        const officeName = office?.name || 'N/A';
        const divisionName = division?.name || 'N/A';
        const brandModel = `${fullAsset.brand || ''} ${fullAsset.model || ''}`.trim() || 'N/A';

        icsData.push({
          custodianName,
          employeeOriginalId: employee.employeeIdOriginal || employee.employeeId || '',
          officeName,
          divisionName,
          propertyNumber: fullAsset.propertyNumber,
          description: fullAsset.description,
          serialNumber: fullAsset.serialNumber || 'N/A',
          brandModel,
          dateIssued: latestMovement.dateAssigned ? new Date(latestMovement.dateAssigned).toLocaleDateString() : '',
        });
      } catch (error) {
        console.error(`Error processing asset ${asset.propertyNumber}:`, error);
        throw error;
      }
    }

    if (icsData.length === 0) {
      throw new Error('No valid assets found for ICS generation');
    }

    const blob = await pdf(<ICSDocument icsData={icsData} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const today = new Date();
    const yyyyMMdd = today.toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `ICS_${icsData.length}_${yyyyMMdd}.pdf`;

    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private static getLatestMovement(movements: UnifiedMovement[]): UnifiedMovement | null {
    if (!movements || movements.length === 0) return null;
    return movements.slice().sort((a, b) => {
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
    const suffix = employee.suffixName || '';
    return `${lastName}, ${firstName} ${middleName} ${suffix}`.trim();
  }
}
