import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  FileText,
  Receipt,
  ArrowRightLeft,
  BookOpen,
  BarChart3,
  ClipboardList,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  FileBarChart,
  FileCheck,
  FileSearch,
} from 'lucide-react';

import { getEmployees } from '@/api/user-management/userApi';
import { normalizeEmployee } from '@/utils/employeeUtils';
import { NormalizedEmployee, Asset, UnifiedMovement } from '@/types/asset/UnifiedAsset';
import { UnifiedAssetService } from '@/services/UnifiedAssetService';
import { PTAService } from '@/services/PTAService';

import { ReportPreviewModal } from './ReportPreviewModal';
import { EmployeeSelectModal } from './EmployeeSelectModal';
import { ItemSelectModal } from './ItemSelectModal';
import { ItemMovementsModal } from './ItemMovementsModal';
import { RPCPPEFilterModal } from './RPCPPEFilterModal';
import { PARGenerator } from './PARGenerator';
import { ICSGenerator } from './ICSGenerator';
import { PALGenerator } from './PALGenerator';
import { RPCPPEPdfGenerator } from './RPCPPEExcelGenerator';
import { SESPIExcelGenerator, SESPIFilterModal } from './SESPIGenerator';
import { SEPropertyReportGenerator, SEPropertyReportFilterModal } from './SEPropertyReportGenerator';
import { PTRGenerationModal } from './PTRGenerationModal';
import { ITRGenerationModal } from './ITRGenerationModal';
import { toast } from 'sonner';
import { NumberInputModal } from './NumberInputModal';

export function ReportTab() {
  const [employees, setEmployees] = useState<NormalizedEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<NormalizedEmployee | null>(null);
  const [selectedReport, setSelectedReport] = useState<'PAR' | 'ICS' | 'SESPI' | 'SESPI-REPORT' | 'RPCPPE' | 'PAL' | 'PTR' | 'ITR' | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [rpcppeDate, setRpcppeDate] = useState<Date | null>(null);
  const [rpcppeCategoryId, setRpcppeCategoryId] = useState<number | undefined>(undefined);
  const [sespiDate, setSespiDate] = useState<Date | null>(null);

  // Item-centric flow states
  const [selectedItem, setSelectedItem] = useState<Asset | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<UnifiedMovement | null>(null);

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showItemSelectModal, setShowItemSelectModal] = useState(false);
  const [showItemMovementsModal, setShowItemMovementsModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showRPCPPE, setShowRPCPPE] = useState(false);
  const [showSESPI, setShowSESPI] = useState(false);
  const [showSEPropertyReport, setShowSEPropertyReport] = useState(false);
  const [showPTR, setShowPTR] = useState(false);
  const [showITR, setShowITR] = useState(false);
  const [showPAL, setShowPAL] = useState(false);
  const [showNumberModal, setShowNumberModal] = useState(false);
  const [customNumber, setCustomNumber] = useState('');

  useEffect(() => {
    getEmployees(1, 1000).then(res => {
      if (res.success) {
        setEmployees(res.data.items.map(normalizeEmployee));
      }
    });
    
    // Reset modal states when component mounts
    setShowItemSelectModal(false);
    setShowItemMovementsModal(false);
    setShowPreview(false);
    setShowEmployeeModal(false);
    setShowRPCPPE(false);
    setShowSESPI(false);
    setShowSEPropertyReport(false);
    setShowPTR(false);
    setShowITR(false);
    setShowPAL(false);
    setSelectedReport(null);
    setSelectedItem(null);
    setSelectedMovement(null);

    // Cleanup on unmount
    return () => {
      setShowItemSelectModal(false);
      setShowItemMovementsModal(false);
      setShowPreview(false);
      setSelectedReport(null);
      setSelectedItem(null);
      setSelectedMovement(null);
    };
  }, []);

  // Safety effect: close item select modal if selectedReport becomes null
  useEffect(() => {
    console.log('[ReportTab] showItemSelectModal/selectedReport state:', { showItemSelectModal, selectedReport });
    if (selectedReport === null && showItemSelectModal) {
      console.log('[ReportTab] Safety: Closing ItemSelectModal because selectedReport is null');
      setShowItemSelectModal(false);
    }
  }, [selectedReport, showItemSelectModal]);

  // OLD FLOW - For PAL and other employee-based reports
  const handleEmployeeSelect = async (emp: NormalizedEmployee) => {
    setSelectedEmployee(emp);
    setShowEmployeeModal(false);

    if (selectedReport === 'PAL') {
      setShowPreview(true);
      setLoadingPreview(true);
      const url = await PALGenerator.generatePALPreview(emp);
      setPreviewUrl(url);
      setLoadingPreview(false);
    }
  };

  // NEW FLOW - For item-based PAR/ICS reports
  const handleItemSelect = (item: Asset) => {
    setSelectedItem(item);
    setShowItemSelectModal(false);
    setShowItemMovementsModal(true);
  };

  // Show number modal after movement selection
  const handleMovementSelect = (item: Asset, movement: UnifiedMovement | null) => {
    setSelectedItem(item);
    setSelectedMovement(movement);
    setShowItemMovementsModal(false);
    // Auto-generate number
    const autoNumber = selectedReport === 'ICS'
      ? ICSGenerator.generateICSNumber()
      : PARGenerator.generatePARNumber();
    setCustomNumber(autoNumber);
    setShowNumberModal(true);
  };

  // After number is confirmed, generate preview
  const handleNumberConfirm = (number: string) => {
    setCustomNumber(number);
    setShowNumberModal(false);
    setShowPreview(true);
    generateItemPreview(selectedItem, selectedMovement, number);
  };

  // Update preview generator to accept number
  const generateItemPreview = async (item: Asset | null, movement: UnifiedMovement | null, number?: string) => {
    setLoadingPreview(true);
    try {
      if (!item) throw new Error('No item selected');
      const url =
        selectedReport === 'ICS'
          ? await ICSGenerator.generateICSPreview(item, movement, number)
          : await PARGenerator.generatePARPreview(item, movement, number);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Preview generation failed:', error);
      toast.error('Failed to generate preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handlePreviewConfirm = async () => {
    if (!selectedReport) return;

    if (selectedReport === 'SESPI') {
      await SESPIExcelGenerator.generate(sespiDate!);
      toast.success('Register SPI PDF generated');
    } else if (selectedReport === 'SESPI-REPORT') {
      await SEPropertyReportGenerator.generate(sespiDate!);
      toast.success('Report of Semi-Expandable Property Issued PDF generated');
    } else if (selectedReport === 'RPCPPE') {
      try {
        const assets = await PTAService.getAllForRPCPPE(rpcppeDate!, rpcppeCategoryId);

        if (!assets.length) {
          toast.error('No assets found for selected criteria');
          return;
        }

        await RPCPPEPdfGenerator.generate(assets, rpcppeDate!, rpcppeCategoryId);
        toast.success('RPCPPE PDF generated');
      } catch (error) {
        console.error('RPCPPE generation failed:', error);
        toast.error('RPCPPE generation failed');
      }
    } else if (selectedReport === 'PAR') {
      // New item-based flow
      if (selectedItem) {
        await PARGenerator.generatePAR(selectedItem, selectedMovement);
        toast.success('PAR PDF generated');
      }
    } else if (selectedReport === 'ICS') {
      // New item-based flow
      if (selectedItem) {
        await ICSGenerator.generateICS(selectedItem, selectedMovement);
        toast.success('ICS PDF generated');
      }
    } else if (selectedEmployee) {
      // Old PAL flow
      if (selectedReport === 'PAL') {
        await PALGenerator.generatePAL(selectedEmployee);
        toast.success('PAL PDF generated');
      }
    }

    setShowPreview(false);
    setSelectedReport(null);
    setSelectedItem(null);
    setSelectedMovement(null);
    setCustomNumber('');
  };

  const handleRPCPPEGenerate = async (asOfDate: Date, categoryId?: number) => {
    try {
      const assets = await PTAService.getAllForRPCPPE(asOfDate, categoryId);

      if (!assets.length) {
        toast.error('No assets found for selected criteria');
        return;
      }

      // Generate preview
      setLoadingPreview(true);
      const url = await RPCPPEPdfGenerator.generatePreview(assets, asOfDate, categoryId?.toString());
      setPreviewUrl(url);
      setLoadingPreview(false);

      // Store parameters for download
      setRpcppeDate(asOfDate);
      setRpcppeCategoryId(categoryId);

      // Show preview modal
      setSelectedReport('RPCPPE');
      setShowPreview(true);
    } catch (error) {
      console.error('RPCPPE preview generation failed:', error);
      toast.error('RPCPPE preview generation failed');
    }

    setShowRPCPPE(false);
  };

  const handleSESPIGenerate = async (asOfDate: Date) => {
    try {
      // Generate preview
      setLoadingPreview(true);
      const url = await SESPIExcelGenerator.generateSESPIPreview(asOfDate);
      setPreviewUrl(url);
      setLoadingPreview(false);

      // Store parameters for download
      setSespiDate(asOfDate);
      setSelectedReport('SESPI');

      // Show preview modal
      setShowPreview(true);
    } catch (error) {
      console.error('SE SPI preview generation failed:', error);
      toast.error('SE SPI preview generation failed');
    }

    setShowSESPI(false);
  };

  const handleSEPropertyReportGenerate = async (asOfDate: Date) => {
    try {
      setLoadingPreview(true);
      const url = await SEPropertyReportGenerator.generatePreview(asOfDate);
      setPreviewUrl(url);
      setLoadingPreview(false);

      setSespiDate(asOfDate);
      setSelectedReport('SESPI-REPORT');
      setShowPreview(true);
    } catch (error) {
      console.error('SE Property Report preview generation failed:', error);
      toast.error('SE Property Report preview generation failed');
    }

    setShowSEPropertyReport(false);
  };

  const reports = [
    {
      title: 'RPCPPE',
      subtitle: 'Physical Count of PPE',
      icon: FileSpreadsheet,
      bgColor: 'bg-blue-600',
      action: () => setShowRPCPPE(true)
    },
    {
      title: 'PAR',
      subtitle: 'Property Acknowledgement',
      icon: FileCheck,
      bgColor: 'bg-green-600',
      action: () => { setSelectedReport('PAR'); setShowItemSelectModal(true); }
    },
    {
      title: 'PTR',
      subtitle: 'Property Transfer',
      icon: ArrowRightLeft,
      bgColor: 'bg-orange-600',
      action: () => setShowPTR(true)
    },
    {
      title: 'Registry SPI',
      subtitle: 'Semi-Expandable Property',
      icon: BookOpen,
      bgColor: 'bg-purple-600',
      action: () => setShowSESPI(true)
    },
    {
      title: 'SE Property Issued',
      subtitle: 'Report of Semi-Expandable Property Issued',
      icon: FileBarChart,
      bgColor: 'bg-pink-600',
      action: () => setShowSEPropertyReport(true)
    },
    {
      title: 'ICS',
      subtitle: 'Inventory Custodian Slip',
      icon: ClipboardList,
      bgColor: 'bg-red-600',
      action: () => { setSelectedReport('ICS'); setShowItemSelectModal(true); }
    },
    {
      title: 'ITR',
      subtitle: 'Inventory Transfer',
      icon: TrendingUp,
      bgColor: 'bg-teal-600',
      action: () => setShowITR(true)
    },
    {
      title: 'Property Accountability List (PAL)',
      subtitle: 'Accountable Assets per Employee',
      icon: FileSearch,
      bgColor: 'bg-indigo-600',
      action: () => { setSelectedReport('PAL'); setShowEmployeeModal(true); }
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Reports
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Generate comprehensive reports for asset management
          </p>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((r, i) => (
            <Card
              key={i}
              onClick={r.action}
              className="cursor-pointer group hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            >
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl ${r.bgColor} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <r.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                      {r.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {r.subtitle}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>


      </div>

      {/* Modals */}
      <EmployeeSelectModal
        isOpen={showEmployeeModal}
        employees={employees}
        onClose={() => setShowEmployeeModal(false)}
        onSelect={handleEmployeeSelect}
      />

      {showItemSelectModal === true && selectedReport !== null && (
        <ItemSelectModal
          key={`item-select-modal-${selectedReport}`}
          isOpen={true}
          onClose={() => {
            console.log('[ReportTab] ItemSelectModal onClose called');
            setShowItemSelectModal(false);
          }}
          onSelect={handleItemSelect}
          groupType={selectedReport === 'ICS' ? 'SE' : 'PPE'}
          title={`Select ${selectedReport === 'ICS' ? 'SE' : 'PPE'} Item`}
        />
      )}

      <ItemMovementsModal
        isOpen={showItemMovementsModal}
        onClose={() => {
          setShowItemMovementsModal(false);
          setSelectedItem(null);
          setSelectedMovement(null);
          setShowItemSelectModal(false);
        }}
        item={selectedItem}
        onConfirm={handleMovementSelect}
      />


      {/* Fullscreen Preview */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center">
          <div className="w-full max-w-6xl h-[90vh] flex flex-col bg-white rounded-lg shadow-xl relative">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <Download className="size-5 text-blue-600" />
                <span className="font-semibold text-lg text-slate-900">Preview {selectedReport === 'PAR' ? 'Property Acknowledgement Receipt (PAR)' :
                  selectedReport === 'ICS' ? 'Inventory Custodian Slip (ICS)' :
                  selectedReport === 'PTR' ? 'Property Transfer Report (PTR)' :
                  selectedReport === 'ITR' ? 'Inventory Transfer Report (ITR)' :
                  selectedReport === 'RPCPPE' ? 'Report on the Physical Count of Property, Plant and Equipment (RPCPPE)' :
                  selectedReport === 'PAL' ? 'Property Accountability List (PAL)' :
                  selectedReport === 'SESPI' ? 'Registry SPI Semi-Expandable Property (SESPI)' :
                  selectedReport === 'SESPI-REPORT' ? 'Report of Semi-Expandable Property Issued' :
                  ''}
                </span>
              </div>
              <button
                className="ml-auto text-slate-500 hover:text-red-600 transition-colors"
                onClick={() => setShowPreview(false)}
                disabled={loadingPreview}
                aria-label="Close Preview"
              >
                <X className="size-6" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              {loadingPreview ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="size-8 animate-spin text-blue-600" />
                    <p className="text-muted-foreground">Generating preview...</p>
                  </div>
                </div>
              ) : previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] border-none rounded-b-lg"
                  title={`${selectedReport} Preview`}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No preview available</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setShowPreview(false)} disabled={loadingPreview}>
                <X className="size-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handlePreviewConfirm} disabled={loadingPreview || !previewUrl}>
                <Download className="size-4 mr-2" />
                Confirm Download
              </Button>
            </div>
          </div>
        </div>
      )}

      <RPCPPEFilterModal
        isOpen={showRPCPPE}
        onClose={() => setShowRPCPPE(false)}
        onGenerate={handleRPCPPEGenerate}
      />

      <PTRGenerationModal
        isOpen={showPTR}
        onClose={() => setShowPTR(false)}
        employees={employees}
      />

      <ITRGenerationModal
        isOpen={showITR}
        onClose={() => setShowITR(false)}
        employees={employees}
      />

      <SESPIFilterModal
        isOpen={showSESPI}
        onClose={() => setShowSESPI(false)}
        onGenerate={handleSESPIGenerate}
      />

      <SEPropertyReportFilterModal
        isOpen={showSEPropertyReport}
        onClose={() => setShowSEPropertyReport(false)}
        onGenerate={handleSEPropertyReportGenerate}
      />

      <SEPropertyReportFilterModal
        isOpen={showSEPropertyReport}
        onClose={() => setShowSEPropertyReport(false)}
        onGenerate={handleSEPropertyReportGenerate}
      />

      <SEPropertyReportFilterModal
        isOpen={showSEPropertyReport}
        onClose={() => setShowSEPropertyReport(false)}
        onGenerate={handleSEPropertyReportGenerate}
      />

      <NumberInputModal
        isOpen={showNumberModal}
        onClose={() => setShowNumberModal(false)}
        onConfirm={handleNumberConfirm}
        defaultNumber={customNumber}
        label={selectedReport === 'ICS' ? 'ICS Number' : 'PAR Number'}
      />
    </div>
  );
}
