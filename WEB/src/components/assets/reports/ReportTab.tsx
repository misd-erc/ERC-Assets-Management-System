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
import { RPCPPEPdfGenerator } from './RPCPPEExcelGenerator';
import { SESPIExcelGenerator } from './SESPIGenerator';
import { PTRGenerationModal } from './PTRGenerationModal';
import { ITRGenerationModal } from './ITRGenerationModal';
import { toast } from 'sonner';

export function ReportTab() {
  const [employees, setEmployees] = useState<NormalizedEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<NormalizedEmployee | null>(null);
  const [selectedReport, setSelectedReport] = useState<'PAR' | 'ICS' | 'SESPI' | 'RPCPPE' | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [rpcppeYear, setRpcppeYear] = useState<number | null>(null);
  const [rpcppeCategoryName, setRpcppeCategoryName] = useState<string | undefined>(undefined);

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showRPCPPE, setShowRPCPPE] = useState(false);
  const [showPTR, setShowPTR] = useState(false);
  const [showITR, setShowITR] = useState(false);

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
        : await PARGenerator.generatePARPreview(emp);

    setPreviewUrl(url);
    setLoadingPreview(false);
  };

  const handlePreviewConfirm = async () => {
    if (!selectedReport) return;

    if (selectedReport === 'SESPI') {
      await SESPIExcelGenerator.generate();
      toast.success('Register SPI PDF generated');
    } else if (selectedReport === 'RPCPPE') {
      try {
        // Map categoryName to categoryId for API call
        const categoryMapping: { [key: string]: number } = {
          'Information and Communication Technology Equipment': 1,
          'Communication Equipment': 2,
          'Medical Equipment': 3,
          'Office Equipment': 4,
          'Furniture and Fixtures': 5,
          'Books and Reference Materials': 6,
          'Other PPE': 7,
        };
        const categoryId = rpcppeCategoryName ? categoryMapping[rpcppeCategoryName] : undefined;

        const assets = await PTAService.getAllForRPCPPE(rpcppeYear!, categoryId);

        if (!assets.length) {
          toast.error('No assets found for selected criteria');
          return;
        }

        await RPCPPEPdfGenerator.generate(assets, rpcppeYear!, rpcppeCategoryName);
        toast.success('RPCPPE PDF generated');
      } catch (error) {
        console.error('RPCPPE generation failed:', error);
        toast.error('RPCPPE generation failed');
      }
    } else if (selectedEmployee) {
      selectedReport === 'ICS'
        ? await ICSGenerator.generateICS(selectedEmployee)
        : await PARGenerator.generatePAR(selectedEmployee);
    }

    setShowPreview(false);
  };

  const handleRPCPPEGenerate = async (year: number, categoryName?: string) => {
    try {
      // Map categoryName to categoryId for API call
      const categoryMapping: { [key: string]: number } = {
        'Information and Communication Technology Equipment': 1,
        'Communication Equipment': 2,
        'Medical Equipment': 3,
        'Office Equipment': 4,
        'Furniture and Fixtures': 5,
        'Books and Reference Materials': 6,
        'Other PPE': 7,
      };
      const categoryId = categoryName ? categoryMapping[categoryName] : undefined;

      const assets = await PTAService.getAllForRPCPPE(year, categoryId);

      if (!assets.length) {
        toast.error('No assets found for selected criteria');
        return;
      }

      // Generate preview
      setLoadingPreview(true);
      const url = await RPCPPEPdfGenerator.generatePreview(assets, year, categoryName);
      setPreviewUrl(url);
      setLoadingPreview(false);

      // Store parameters for download
      setRpcppeYear(year);
      setRpcppeCategoryName(categoryName);

      // Show preview modal
      setSelectedReport('RPCPPE');
      setShowPreview(true);
    } catch (error) {
      console.error('RPCPPE preview generation failed:', error);
      toast.error('RPCPPE preview generation failed');
    }

    setShowRPCPPE(false);
  };

  const handleSESPIGenerate = async () => {
    setSelectedReport('SESPI');
    setShowPreview(true);
    setLoadingPreview(true);

    try {
      const url = await SESPIExcelGenerator.generateSESPIPreview();
      setPreviewUrl(url);
      setLoadingPreview(false);
    } catch (error) {
      console.error('SE SPI preview generation failed:', error);
      toast.error('SE SPI preview generation failed');
      setShowPreview(false);
      setLoadingPreview(false);
    }
  };

  const reports = [
    { title: 'RPCPPE', icon: FileText, action: () => setShowRPCPPE(true) },
    { title: 'PAR', icon: Receipt, action: () => { setSelectedReport('PAR'); setShowEmployeeModal(true); }},
    { title: 'PTR', icon: ArrowRightLeft, action: () => setShowPTR(true) },
    { title: 'Register SPI', icon: BookOpen, action: () => handleSESPIGenerate() },
    { title: 'ICS', icon: ClipboardList, action: () => { setSelectedReport('ICS'); setShowEmployeeModal(true); }},
    { title: 'ITR', icon: BarChart3, action: () => setShowITR(true) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Launcher</CardTitle>
        <CardDescription>Select a report to generate</CardDescription>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reports.map((r, i) => (
          <motion.div key={i} whileHover={{ scale: 1.05 }}>
            <Card onClick={r.action} className="cursor-pointer text-center p-4">
              <r.icon className="mx-auto mb-2" />
              <CardTitle>{r.title}</CardTitle>
            </Card>
          </motion.div>
        ))}
      </CardContent>

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
    </Card>
  );
}
