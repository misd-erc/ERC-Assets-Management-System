import React, { useEffect, useState } from 'react';
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
import { NormalizedEmployee, Asset } from '@/types/asset/UnifiedAsset';
import { UnifiedAssetService } from '@/services/UnifiedAssetService';
import { PTAService } from '@/services/PTAService';

import { ReportPreviewModal } from './ReportPreviewModal';
import { EmployeeSelectModal } from './EmployeeSelectModal';
import { RPCPPEFilterModal } from './RPCPPEFilterModal';
import { PARGenerator } from './PARGenerator';
import { ICSGenerator } from './ICSGenerator';
import { PALGenerator } from './PALGenerator';
import { RPCPPEPdfGenerator } from './RPCPPEExcelGenerator';
import { SESPIExcelGenerator, SESPIFilterModal } from './SESPIGenerator';
import { PTRGenerationModal } from './PTRGenerationModal';
import { ITRGenerationModal } from './ITRGenerationModal';
import { toast } from 'sonner';

export function ReportTab() {
  const [employees, setEmployees] = useState<NormalizedEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<NormalizedEmployee | null>(null);
  const [selectedReport, setSelectedReport] = useState<'PAR' | 'ICS' | 'SESPI' | 'RPCPPE' | 'PAL' | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [rpcppeYear, setRpcppeYear] = useState<number | null>(null);
  const [rpcppeCategoryId, setRpcppeCategoryId] = useState<number | undefined>(undefined);
  const [sespiYear, setSespiYear] = useState<number | null>(null);

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showRPCPPE, setShowRPCPPE] = useState(false);
  const [showSESPI, setShowSESPI] = useState(false);
  const [showPTR, setShowPTR] = useState(false);
  const [showITR, setShowITR] = useState(false);
  const [showPAL, setShowPAL] = useState(false);

  useEffect(() => {
    getEmployees(1, 1000).then(res => {
      if (res.success) {
        setEmployees(res.data.items.map(normalizeEmployee));
      }
    });
  }, []);

  const handleEmployeeSelect = async (emp: NormalizedEmployee) => {
    setSelectedEmployee(emp);
    setShowEmployeeModal(false);
    setShowPreview(true);
    setLoadingPreview(true);

    const url =
      selectedReport === 'ICS'
        ? await ICSGenerator.generateICSPreview(emp)
        : selectedReport === 'PAL'
        ? await PALGenerator.generatePALPreview(emp)
        : await PARGenerator.generatePARPreview(emp);

    setPreviewUrl(url);
    setLoadingPreview(false);
  };

  const handlePreviewConfirm = async () => {
    if (!selectedReport) return;

    if (selectedReport === 'SESPI') {
      await SESPIExcelGenerator.generate(sespiYear!);
      toast.success('Register SPI PDF generated');
    } else if (selectedReport === 'RPCPPE') {
      try {
        const assets = await PTAService.getAllForRPCPPE(rpcppeYear!, rpcppeCategoryId);

        if (!assets.length) {
          toast.error('No assets found for selected criteria');
          return;
        }

        await RPCPPEPdfGenerator.generate(assets, rpcppeYear!, rpcppeCategoryId);
        toast.success('RPCPPE PDF generated');
      } catch (error) {
        console.error('RPCPPE generation failed:', error);
        toast.error('RPCPPE generation failed');
      }
    } else if (selectedEmployee) {
      if (selectedReport === 'ICS') {
        await ICSGenerator.generateICS(selectedEmployee);
      } else if (selectedReport === 'PAL') {
        await PALGenerator.generatePAL(selectedEmployee);
      } else {
        await PARGenerator.generatePAR(selectedEmployee);
      }
    }

    setShowPreview(false);
  };

  const handleRPCPPEGenerate = async (year: number, categoryId?: number) => {
    try {
      const assets = await PTAService.getAllForRPCPPE(year, categoryId);

      if (!assets.length) {
        toast.error('No assets found for selected criteria');
        return;
      }

      // Generate preview
      setLoadingPreview(true);
      const url = await RPCPPEPdfGenerator.generatePreview(assets, year, categoryId?.toString());
      setPreviewUrl(url);
      setLoadingPreview(false);

      // Store parameters for download
      setRpcppeYear(year);
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

  const handleSESPIGenerate = async (year: number) => {
    try {
      // Generate preview
      setLoadingPreview(true);
      const url = await SESPIExcelGenerator.generateSESPIPreview(year);
      setPreviewUrl(url);
      setLoadingPreview(false);

      // Store parameters for download
      setSespiYear(year);
      setSelectedReport('SESPI');

      // Show preview modal
      setShowPreview(true);
    } catch (error) {
      console.error('SE SPI preview generation failed:', error);
      toast.error('SE SPI preview generation failed');
    }

    setShowSESPI(false);
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
      action: () => { setSelectedReport('PAR'); setShowEmployeeModal(true); }
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
      title: 'ICS',
      subtitle: 'Inventory Custodian Slip',
      icon: ClipboardList,
      bgColor: 'bg-red-600',
      action: () => { setSelectedReport('ICS'); setShowEmployeeModal(true); }
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

      <ReportPreviewModal
        isOpen={showPreview}
        pdfUrl={previewUrl}
        reportType={selectedReport || 'PAR'}
        isLoading={loadingPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handlePreviewConfirm}
      />

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
    </div>
  );
}
