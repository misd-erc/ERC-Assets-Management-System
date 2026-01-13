import React, { useEffect, useState, useRef } from 'react';
import { PPEAsset } from '@/types/asset/PPEAsset';
import { Asset, NormalizedEmployee } from '@/types/asset/UnifiedAsset';
import { getEmployees } from '@/api/user-management/userApi';
import { getOffices } from '@/api/office-management/officeApi';
import { getDivisions } from '@/api/office-management/divisionApi';
import { VwOffice, VwDivision } from '@/types/office';
import { normalizeEmployee } from '@/utils/employeeUtils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AssetsPrintTemplateProps {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetsPrintTemplate({ asset, open, onOpenChange }: AssetsPrintTemplateProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [employees, setEmployees] = useState<NormalizedEmployee[]>([]);
  const [offices, setOffices] = useState<VwOffice[]>([]);
  const [divisions, setDivisions] = useState<VwDivision[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeeData, officesData, divisionsData] = await Promise.all([
          getEmployees(),
          getOffices(),
          getDivisions()
        ]);
        const normalizedEmployees = employeeData.data.items.map(normalizeEmployee);
        setEmployees(normalizedEmployees);
        setOffices(officesData);
        setDivisions(divisionsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  const getEmployeeName = (employeeId: string | number | null) => {
    if (!employeeId) return '-';
    const employee = employees.find(emp => emp.id === Number(employeeId));
    return employee ? `${employee.firstName} ${employee.lastName}` : String(employeeId);
  };

  const getOfficeName = (officeId: number | null) => {
    if (!officeId) return '-';
    const office = offices.find(o => o.id === officeId);
    return office ? office.name : String(officeId);
  };

  const getDivisionName = (divisionId: number | null) => {
    if (!divisionId) return '-';
    const division = divisions.find(d => d.id === divisionId);
    return division ? division.name : String(divisionId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getConditionLabel = (condition: string) => {
    return condition || '-';
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width
      const pageHeight = 297; // A4 height
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = `Asset_${asset.propertyNumber}_${new Date().getTime()}.pdf`;
      pdf.save(filename);
      toast.success('PDF exported successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      window.print();
    }
  };

  if (asset.group === 'PPE') {
    const ppeAsset = asset as unknown as PPEAsset;
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] !max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between w-full pr-4">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="size-5" />
                Print Preview - Asset {asset.propertyNumber}
              </DialogTitle>
              <div className="flex gap-2">
                <Button
                  onClick={handleExportPDF}
                  disabled={isGenerating}
                  className="gap-2"
                  variant="default"
                >
                  <Download className="size-4" />
                  {isGenerating ? 'Generating...' : 'Export PDF'}
                </Button>
                <Button onClick={handlePrint} className="gap-2" variant="outline">
                  <Printer className="size-4" />
                  Print
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div ref={printRef} className="print-container bg-white" style={{ padding: '40px', fontFamily: 'Arial, sans-serif', color: '#000', lineHeight: '1.6' }}>
        {/* Header */}
        <div style={{ borderBottom: '3px solid #1e40af', paddingBottom: '20px', marginBottom: '30px' }}>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold', color: '#1e40af' }}>
            {ppeAsset.propertyNumber}
          </h1>
          <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>{ppeAsset.description}</p>
        </div>

        {/* Basic Information */}
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1e40af', borderBottom: '2px solid #e0e7ff', paddingBottom: '8px' }}>
            BASIC INFORMATION
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Property Number</p>
              <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#000' }}>{ppeAsset.propertyNumber}</p>

              <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Category</p>
              <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#000' }}>
                {typeof ppeAsset.category === 'object' && ppeAsset.category !== null ? (ppeAsset.category as any).name : ppeAsset.category || '-'}
              </p>

              <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Legend</p>
              <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#000' }}>
                {typeof ppeAsset.legend === 'object' && ppeAsset.legend !== null ? (ppeAsset.legend as any).name : ppeAsset.legend || '-'}
              </p>

              <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Serial Number</p>
              <p style={{ margin: '0', fontSize: '14px', color: '#000' }}>{ppeAsset.serialNumber || '-'}</p>
            </div>

            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Brand</p>
              <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#000' }}>{ppeAsset.brand || '-'}</p>

              <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Model</p>
              <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#000' }}>{ppeAsset.model || '-'}</p>

              <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Unit of Measurement</p>
              <p style={{ margin: '0', fontSize: '14px', color: '#000' }}>{ppeAsset.unitOfMeasurement || '-'}</p>
            </div>
          </div>
        </div>

        {/* Parts Information */}
        {Array.isArray(ppeAsset.parts) && ppeAsset.parts.length > 0 && (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#333' }}>Parts</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#374151' }}>Name</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#374151' }}>Serial Number</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#374151' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {ppeAsset.parts.map((part, index) => (
                  <tr key={part.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ padding: '10px' }}>{part.name}</td>
                    <td style={{ padding: '10px' }}>{part.serialNumber}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: part.isActive ? '#16a34a' : '#dc2626' }}>
                      {part.isActive ? 'Active' : 'Inactive'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Financial Information */}
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1e40af', borderBottom: '2px solid #e0e7ff', paddingBottom: '8px' }}>
            FINANCIAL INFORMATION
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: '#0c4a6e', textTransform: 'uppercase' }}>Unit Value</p>
              <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#1e40af' }}>{formatCurrency(ppeAsset.unitValue)}</p>
            </div>

            <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: '#0c4a6e', textTransform: 'uppercase' }}>Date Acquired</p>
              <p style={{ margin: '0', fontSize: '14px', color: '#000' }}>{formatDate(ppeAsset.dateAcquired)}</p>
            </div>

            <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: '#0c4a6e', textTransform: 'uppercase' }}>Useful Life</p>
              <p style={{ margin: '0', fontSize: '14px', color: '#000' }}>{ppeAsset.estimatedUsefulLife} years</p>
            </div>
          </div>
        </div>

        {/* Accountability Information */}
        {ppeAsset.movements && ppeAsset.movements.length > 0 && (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1e40af', borderBottom: '2px solid #e0e7ff', paddingBottom: '8px' }}>
              ACCOUNTABILITY INFORMATION
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#374151' }}>Date Assigned</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#374151' }}>PAR/ITR</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#374151' }}>Employee</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#374151' }}>Division</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#374151' }}>Condition</th>
                </tr>
              </thead>
              <tbody>
                {ppeAsset.movements.map((movement, index) => (
                  <tr key={movement.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ padding: '10px' }}>{formatDate(movement.dateAssigned)}</td>
                    <td style={{ padding: '10px' }}>{movement.parItrNumber || '-'}</td>
                    <td style={{ padding: '10px' }}>{movement.plantillaEmployeeIdOriginal || movement.nonPlantillaEmployeeIdOriginal || '-'}</td>
                    <td style={{ padding: '10px' }}>{movement.employee?.[0]?.division?.name || '-'}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#000' }}>
                      {getConditionLabel(movement.condition || '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* History */}
        {ppeAsset.history && ppeAsset.history.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1e40af', borderBottom: '2px solid #e0e7ff', paddingBottom: '8px' }}>
              ACCOUNTABILITY HISTORY
            </h2>
            <div>
              {ppeAsset.history.map((entry, index) => (
                <div key={entry.id} style={{ marginBottom: '20px', paddingLeft: '15px', borderLeft: '3px solid #bfdbfe', pageBreakInside: 'avoid' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: '#1e40af' }}>
                    {formatDate(entry.date)}
                  </p>
                  <table style={{ width: '100%', fontSize: '12px', marginTop: '8px' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '4px 0', fontWeight: 'bold', color: '#374151', width: '150px' }}>PAR/ITR Number:</td>
                        <td style={{ padding: '4px 0', color: '#000' }}>{entry.par_itr_number || '-'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0', fontWeight: 'bold', color: '#374151', width: '150px' }}>Employee:</td>
                        <td style={{ padding: '4px 0', color: '#000' }}>{entry.plantilla_employee_id || entry.non_plantilla_employee_id || '-'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0', fontWeight: 'bold', color: '#374151', width: '150px' }}>Division:</td>
                        <td style={{ padding: '4px 0', color: '#000' }}>
                          {typeof entry.actual_division === 'object' && entry.actual_division !== null
                            ? (entry.actual_division as any).name
                            : entry.actual_division || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0', fontWeight: 'bold', color: '#374151', width: '150px' }}>Condition:</td>
                        <td style={{ padding: '4px 0', color: '#000' }}>{entry.condition || '-'}</td>
                      </tr>
                      {entry.remarks && (
                        <tr>
                          <td style={{ padding: '4px 0', fontWeight: 'bold', color: '#374151', width: '150px' }}>Remarks:</td>
                          <td style={{ padding: '4px 0', color: '#666', fontStyle: 'italic' }}>{entry.remarks}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #e5e7eb', fontSize: '11px', color: '#666' }}>
          <p style={{ margin: '0' }}>Encoded on: {formatDate(ppeAsset.dateEncoded)}</p>
          <p style={{ margin: '5px 0 0 0' }}>Document generated for asset management records</p>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            body {
              margin: 0;
              padding: 0;
              background: #fff;
            }
            .print-container {
              max-width: 8.5in;
              margin: 0 auto;
              padding: 0.5in;
              background: #fff;
            }
            h1, h2, h3 {
              page-break-after: avoid;
            }
            table {
              page-break-inside: avoid;
            }
            tr {
              page-break-inside: avoid;
            }
          }
        `}</style>
          </div>
        </DialogContent>
      </Dialog>
    );
  } else {
    // SE Asset using unified Asset type
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] !max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between w-full pr-4">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="size-5" />
                Print Preview - Asset {asset.propertyNumber}
              </DialogTitle>
              <div className="flex gap-2">
                <Button
                  onClick={handleExportPDF}
                  disabled={isGenerating}
                  className="gap-2"
                  variant="default"
                >
                  <Download className="size-4" />
                  {isGenerating ? 'Generating...' : 'Export PDF'}
                </Button>
                <Button onClick={handlePrint} className="gap-2" variant="outline">
                  <Printer className="size-4" />
                  Print
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div ref={printRef} className="print-container bg-white" style={{ padding: '40px', fontFamily: 'Arial, sans-serif', color: '#000', lineHeight: '1.6' }}>
        {/* Header */}
        <div style={{ borderBottom: '3px solid #1e40af', paddingBottom: '20px', marginBottom: '30px' }}>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold', color: '#1e40af' }}>
            {asset.propertyNumber}
          </h1>
          <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>{asset.description}</p>
        </div>

        {/* Basic Information */}
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1e40af', borderBottom: '2px solid #e0e7ff', paddingBottom: '8px' }}>
            BASIC INFORMATION
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Property Number</p>
              <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#000' }}>{asset.propertyNumber}</p>

              <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Category</p>
              <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#000' }}>{asset.category || '-'}</p>

              <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Legend</p>
              <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#000' }}>{asset.legend || '-'}</p>

              <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Serial Number</p>
              <p style={{ margin: '0', fontSize: '14px', color: '#000' }}>{asset.serialNumber || '-'}</p>
            </div>

            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Brand</p>
              <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#000' }}>{asset.brand || '-'}</p>

              <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Model</p>
              <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#000' }}>{asset.model || '-'}</p>

              <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Unit of Measurement</p>
              <p style={{ margin: '0', fontSize: '14px', color: '#000' }}>{asset.unitOfMeasurement || '-'}</p>
            </div>
          </div>
        </div>

        {/* Parts Information */}
        {Array.isArray(asset.parts) && asset.parts.length > 0 && (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#333' }}>Parts</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#374151' }}>Name</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#374151' }}>Serial Number</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#374151' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {asset.parts.map((part, index) => (
                  <tr key={part.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ padding: '10px' }}>{part.name}</td>
                    <td style={{ padding: '10px' }}>{part.serialNumber}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: part.isActive ? '#16a34a' : '#dc2626' }}>
                      {part.isActive ? 'Active' : 'Inactive'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Financial Information */}
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1e40af', borderBottom: '2px solid #e0e7ff', paddingBottom: '8px' }}>
            FINANCIAL INFORMATION
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: '#0c4a6e', textTransform: 'uppercase' }}>Unit Value</p>
              <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#1e40af' }}>{formatCurrency(asset.unitValue)}</p>
            </div>

            <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: '#0c4a6e', textTransform: 'uppercase' }}>Date Acquired</p>
              <p style={{ margin: '0', fontSize: '14px', color: '#000' }}>{formatDate(asset.dateAcquired)}</p>
            </div>

            <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: '#0c4a6e', textTransform: 'uppercase' }}>Useful Life</p>
              <p style={{ margin: '0', fontSize: '14px', color: '#000' }}>{asset.estimatedUsefulLife} years</p>
            </div>
          </div>
        </div>

        {/* Accountability Information */}
        {asset.movements && asset.movements.length > 0 && (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1e40af', borderBottom: '2px solid #e0e7ff', paddingBottom: '8px' }}>
              ACCOUNTABILITY INFORMATION
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#374151' }}>Date Assigned</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#374151' }}>PAR/ITR</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#374151' }}>Employee</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#374151' }}>Office</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#374151' }}>Division</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#374151' }}>Condition</th>
                </tr>
              </thead>
              <tbody>
                {asset.movements.map((movement, index) => (
                  <tr key={movement.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ padding: '10px' }}>{formatDate(movement.dateAssigned)}</td>
                    <td style={{ padding: '10px' }}>{movement.parItrNumber || '-'}</td>
                    <td style={{ padding: '10px' }}>
                      {movement.plantillaEmployeeId
                        ? getEmployeeName(movement.plantillaEmployeeId)
                        : movement.nonPlantillaEmployeeId
                        ? getEmployeeName(movement.nonPlantillaEmployeeId)
                        : '-'}
                    </td>
                    <td style={{ padding: '10px' }}>{getOfficeName(movement.actualOfficeId ?? null)}</td>
                    <td style={{ padding: '10px' }}>{getDivisionName(movement.actualDivisionId ?? null)}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#000' }}>
                      {getConditionLabel(movement.condition || '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #e5e7eb', fontSize: '11px', color: '#666' }}>
          <p style={{ margin: '0' }}>Encoded on: {formatDate(asset.dateAcquired)}</p>
          <p style={{ margin: '5px 0 0 0' }}>Document generated for asset management records</p>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            body {
              margin: 0;
              padding: 0;
              background: #fff;
            }
            .print-container {
              max-width: 8.5in;
              margin: 0 auto;
              padding: 0.5in;
              background: #fff;
            }
            h1, h2, h3 {
              page-break-after: avoid;
            }
            table {
              page-break-inside: avoid;
            }
            tr {
              page-break-inside: avoid;
            }
          }
        `}</style>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
}
