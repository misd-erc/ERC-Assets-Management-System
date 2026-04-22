import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { motion, Variants } from 'framer-motion';
import {
  FileText,
  ArrowRightLeft,
  BookOpen,
  BarChart3,
  ClipboardList,
  TrendingUp,
  FileSpreadsheet,
  FileBarChart,
  FileCheck,
  FileSearch,
  Loader2,
  Download,
  X,
  Recycle,
  Printer,
  Archive,
  type LucideIcon,
} from 'lucide-react';

import { getEmployees } from '@/api/user-management/userApi';
import { normalizeEmployee } from '@/utils/employeeUtils';
import { NormalizedEmployee, Asset, UnifiedMovement } from '@/types/asset/UnifiedAsset';
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
import { RegistrySPIByEmployeeGenerator, RegistrySPIEmployeeFilterModal } from './RegistrySPIByEmployeeGenerator';
import { SEPropertyReportGenerator, SEPropertyReportFilterModal } from './SEPropertyReportGenerator';
import { PTRGenerationModal } from './PTRGenerationModal';
import { ITRGenerationModal } from './ITRGenerationModal';
import { ReturnReceiptGenerationModal } from './ReturnReceiptGenerationModal';
import { IIRUPGenerationModal } from './IIRUPGenerator';
import { toast } from 'sonner';
import { RSMIReportModal } from "./RSMIReportModal";
import { PARICSListModal } from "./PARICSListModal";
import { StockCardReportModal } from "./StockCardReportModal";

export function ReportTab() {
  const [employees, setEmployees] = useState<NormalizedEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<NormalizedEmployee | null>(null);
  const [selectedReport, setSelectedReport] = useState<'PAR' | 'ICS' | 'SESPI' | 'SESPI-REPORT' | 'RPCPPE' | 'PAL' | 'PTR' | 'ITR' | 'RRPPE' | 'RRSP' | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [rpcppeDate, setRpcppeDate] = useState<Date | null>(null);
  const [rpcppeCategoryId, setRpcppeCategoryId] = useState<number | undefined>(undefined);
  const [sespiDate, setSespiDate] = useState<Date | null>(null);
  const [sespiEmployee, setSespiEmployee] = useState<NormalizedEmployee | null>(null);

  // Item-centric flow states
  const [selectedItem, setSelectedItem] = useState<Asset | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<UnifiedMovement | null>(null);

  // Modal States
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showItemSelectModal, setShowItemSelectModal] = useState(false);
  const [showItemMovementsModal, setShowItemMovementsModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showRPCPPE, setShowRPCPPE] = useState(false);
  const [showSESPI, setShowSESPI] = useState(false);
  const [showSEPropertyReport, setShowSEPropertyReport] = useState(false);
  const [showPTR, setShowPTR] = useState(false);
  const [showITR, setShowITR] = useState(false);
  const [showRRPPE, setShowRRPPE] = useState(false);
  const [showRRSP, setShowRRSP] = useState(false);
  const [showPAL, setShowPAL] = useState(false);
  const [showIIRUP, setShowIIRUP] = useState(false);
  const [showIIRUSP, setShowIIRUSP] = useState(false);
  const [showRSMI, setShowRSMI] = useState(false);
  const [showRegistrySPI, setShowRegistrySPI] = useState(false);
  const [showPARList, setShowPARList] = useState(false);
  const [showICSList, setShowICSList] = useState(false);
  const [showStockCardModal, setShowStockCardModal] = useState(false);

  const [registrySPIEmployee, setRegistrySPIEmployee] = useState<import('@/types/asset/UnifiedAsset').NormalizedEmployee | null>(null);
  const [registrySPIAssets, setRegistrySPIAssets] = useState<any[]>([]);
  const [customNumber, setCustomNumber] = useState('');
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchTerm, setSearchTerm] = useState('');

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
    setShowIIRUP(false);
    setShowIIRUSP(false);
    setShowRSMI(false);
    setShowRegistrySPI(false);
    setShowStockCardModal(false);
    setSelectedReport(null);
    setSelectedItem(null);
    setSelectedMovement(null);

    return () => {
      setShowItemSelectModal(false);
      setShowItemMovementsModal(false);
      setShowPreview(false);
      setSelectedReport(null);
      setSelectedItem(null);
      setSelectedMovement(null);
    };
  }, []);

  useEffect(() => {
    if (selectedReport === null && showItemSelectModal) {
      setShowItemSelectModal(false);
    }
  }, [selectedReport, showItemSelectModal]);

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

  const handleItemSelect = (item: Asset) => {
    setSelectedItem(item);
    setShowItemSelectModal(false);
    setShowItemMovementsModal(true);
  };

  const handleMovementSelect = (item: Asset, movement: UnifiedMovement | null, sigDate?: string) => {
    setSelectedItem(item);
    setSelectedMovement(movement);
    setShowItemMovementsModal(false);
    const number = movement?.parIcsNumber ||
        (selectedReport === 'ICS' ? ICSGenerator.generateICSNumber() : PARGenerator.generatePARNumber());
    setCustomNumber(number);
    if (sigDate) setSignatureDate(sigDate);
    setShowPreview(true);
    generateItemPreview(item, movement, number, sigDate ?? signatureDate);
  };

  const generateItemPreview = async (item: Asset | null, movement: UnifiedMovement | null, number?: string, sigDate?: string) => {
    setLoadingPreview(true);
    try {
      if (!item) throw new Error('No item selected');
      const url =
          selectedReport === 'ICS'
              ? await ICSGenerator.generateICSPreview(item, movement, number, sigDate)
              : await PARGenerator.generatePARPreview(item, movement, number, sigDate);
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
      if (registrySPIEmployee) {
        await RegistrySPIByEmployeeGenerator.generate(registrySPIEmployee, sespiDate!, registrySPIAssets.length ? registrySPIAssets : undefined);
        toast.success('Registry SPI PDF generated');
      } else {
        await SESPIExcelGenerator.generate(sespiDate!, sespiEmployee!.id);
        toast.success('Register SPI PDF generated');
      }
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
      if (previewUrl) {
        const blob = await fetch(previewUrl).then(r => r.blob());
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PAR_${customNumber || Date.now()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('PAR PDF generated');
      }
    } else if (selectedReport === 'ICS') {
      if (previewUrl) {
        const blob = await fetch(previewUrl).then(r => r.blob());
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ICS_${customNumber || Date.now()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('ICS PDF generated');
      }
    } else if (selectedEmployee) {
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
    setRegistrySPIEmployee(null);
    setRegistrySPIAssets([]);
  };

  const handleRPCPPEGenerate = async (asOfDate: Date, categoryId?: number) => {
    try {
      const assets = await PTAService.getAllForRPCPPE(asOfDate, categoryId);

      if (!assets.length) {
        toast.error('No assets found for selected criteria');
        return;
      }

      setLoadingPreview(true);
      const url = await RPCPPEPdfGenerator.generatePreview(assets, asOfDate, categoryId?.toString());
      setPreviewUrl(url);
      setLoadingPreview(false);

      setRpcppeDate(asOfDate);
      setRpcppeCategoryId(categoryId);
      setSelectedReport('RPCPPE');
      setShowPreview(true);
    } catch (error) {
      console.error('RPCPPE preview generation failed:', error);
      toast.error('RPCPPE preview generation failed');
    }
    setShowRPCPPE(false);
  };

  const handleSESPIGenerate = async (asOfDate: Date, employee: NormalizedEmployee) => {
    try {
      setLoadingPreview(true);
      const url = await SESPIExcelGenerator.generateSESPIPreview(asOfDate, employee.id);
      setPreviewUrl(url);
      setLoadingPreview(false);

      setSespiDate(asOfDate);
      setSespiEmployee(employee);
      setSelectedReport('SESPI');
      setShowPreview(true);
    } catch (error) {
      console.error('SE SPI preview generation failed:', error);
      toast.error((error as Error).message || 'SE SPI preview generation failed');
    }
    setShowSESPI(false);
  };

  const handleRegistrySPIGenerate = async (employee: import('@/types/asset/UnifiedAsset').NormalizedEmployee, date: Date, assets?: any[]) => {
    setShowRegistrySPI(false);
    try {
      setLoadingPreview(true);
      const url = await RegistrySPIByEmployeeGenerator.generatePreview(employee, date, assets);
      setPreviewUrl(url);
      setLoadingPreview(false);
      setRegistrySPIEmployee(employee);
      setRegistrySPIAssets(assets ?? []);
      setSespiDate(date);
      setSelectedReport('SESPI');
      setShowPreview(true);
    } catch (error) {
      setLoadingPreview(false);
      toast.error((error as Error).message || 'Registry SPI generation failed');
    }
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
      toast.error((error as Error).message || 'SE Property Report preview generation failed');
    }
    setShowSEPropertyReport(false);
  };

  type ReportCategory =
      | 'Inventory & Physical Count'
      | 'Issuance & Accountability'
      | 'Transfers & Returns'
      | 'Disposal & Unserviceable';

  type ReportCard = {
    title: string;
    subtitle: string;
    category: ReportCategory;
    icon: LucideIcon | React.ReactElement;
    bgColor: string;
    action: () => void;
  };

  const renderIcon = (icon: ReportCard['icon']) => {
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
        className: 'w-6 h-6 text-white',
      });
    }
    const IconComp = icon as LucideIcon;
    return <IconComp className="w-6 h-6 text-white" />;
  };

  const reports: ReportCard[] = useMemo(() => ([
    // --- Inventory & Physical Count ---
    {
      title: 'RPCPPE',
      subtitle: 'Physical Count of PPE',
      category: 'Inventory & Physical Count',
      icon: FileSpreadsheet,
      bgColor: 'bg-blue-600',
      action: () => setShowRPCPPE(true)
    },
    {
      title: 'Registry SPI',
      subtitle: 'Semi-Expandable Property (by Employee)',
      category: 'Inventory & Physical Count',
      icon: BookOpen,
      bgColor: 'bg-purple-600',
      action: () => setShowRegistrySPI(true)
    },
    {
      title: 'Property Accountability List (PAL)',
      subtitle: 'Accountable Assets per Employee',
      category: 'Inventory & Physical Count',
      icon: FileSearch,
      bgColor: 'bg-indigo-600',
      action: () => { setSelectedReport('PAL'); setShowEmployeeModal(true); }
    },
    // Stock Card Report
    {
      title: 'Stock Card',
      subtitle: 'Item Stock Ledger & Movements',
      category: 'Inventory & Physical Count',
      icon: Archive,
      bgColor: 'bg-indigo-500',
      action: () => setShowStockCardModal(true)
    },
    // --- Issuance & Accountability ---
    {
      title: 'PAR',
      subtitle: 'Property Acknowledgement',
      category: 'Issuance & Accountability',
      icon: FileCheck,
      bgColor: 'bg-green-600',
      action: () => setShowPARList(true)
    },
    {
      title: 'ICS',
      subtitle: 'Inventory Custodian Slip',
      category: 'Issuance & Accountability',
      icon: ClipboardList,
      bgColor: 'bg-red-600',
      action: () => setShowICSList(true)
    },
    {
      title: 'RSMI',
      subtitle: 'Report of Supplies and Materials Issued',
      category: 'Issuance & Accountability',
      icon: FileText,
      bgColor: 'bg-cyan-600',
      action: () => setShowRSMI(true)
    },
    {
      title: 'Report of SE Property Issued',
      subtitle: 'Report of Semi-Expandable Property Issued',
      category: 'Issuance & Accountability',
      icon: FileBarChart,
      bgColor: 'bg-pink-600',
      action: () => setShowSEPropertyReport(true)
    },
    // --- Transfers & Returns ---
    {
      title: 'PTR',
      subtitle: 'Property Transfer',
      category: 'Transfers & Returns',
      icon: ArrowRightLeft,
      bgColor: 'bg-orange-600',
      action: () => setShowPTR(true)
    },
    {
      title: 'ITR',
      subtitle: 'Inventory Transfer',
      category: 'Transfers & Returns',
      icon: TrendingUp,
      bgColor: 'bg-teal-600',
      action: () => setShowITR(true)
    },
    {
      title: 'RRPPE',
      subtitle: 'Return PPE Receipt',
      category: 'Transfers & Returns',
      icon: <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g strokeWidth="0"></g><g strokeLinecap="round" strokeLinejoin="round"></g><g> <path d="M4.39502 12.0014C4.39544 12.4156 4.73156 12.751 5.14577 12.7506C5.55998 12.7502 5.89544 12.4141 5.89502 11.9999L4.39502 12.0014ZM6.28902 8.1116L6.91916 8.51834L6.91952 8.51777L6.28902 8.1116ZM9.33502 5.5336L9.0396 4.84424L9.03866 4.84464L9.33502 5.5336ZM13.256 5.1336L13.4085 4.39927L13.4062 4.39878L13.256 5.1336ZM16.73 7.0506L16.1901 7.57114L16.1907 7.57175L16.73 7.0506ZM17.7142 10.2078C17.8286 10.6059 18.2441 10.8358 18.6422 10.7214C19.0403 10.607 19.2703 10.1915 19.1558 9.79342L17.7142 10.2078ZM17.7091 9.81196C17.6049 10.2129 17.8455 10.6223 18.2464 10.7265C18.6473 10.8307 19.0567 10.5901 19.1609 10.1892L17.7091 9.81196ZM19.8709 7.45725C19.9751 7.05635 19.7346 6.6469 19.3337 6.54272C18.9328 6.43853 18.5233 6.67906 18.4191 7.07996L19.8709 7.45725ZM18.2353 10.7235C18.6345 10.8338 19.0476 10.5996 19.1579 10.2004C19.2683 9.80111 19.034 9.38802 18.6348 9.2777L18.2353 10.7235ZM15.9858 8.5457C15.5865 8.43537 15.1734 8.66959 15.0631 9.06884C14.9528 9.46809 15.187 9.88119 15.5863 9.99151L15.9858 8.5457ZM19.895 11.9999C19.8946 11.5856 19.5585 11.2502 19.1443 11.2506C18.7301 11.251 18.3946 11.5871 18.395 12.0014L19.895 11.9999ZM18.001 15.8896L17.3709 15.4829L17.3705 15.4834L18.001 15.8896ZM14.955 18.4676L15.2505 19.157L15.2514 19.1566L14.955 18.4676ZM11.034 18.8676L10.8815 19.6019L10.8839 19.6024L11.034 18.8676ZM7.56002 16.9506L8.09997 16.4301L8.09938 16.4295L7.56002 16.9506ZM6.57584 13.7934C6.46141 13.3953 6.04593 13.1654 5.64784 13.2798C5.24974 13.3942 5.01978 13.8097 5.13421 14.2078L6.57584 13.7934ZM6.58091 14.1892C6.6851 13.7884 6.44457 13.3789 6.04367 13.2747C5.64277 13.1705 5.23332 13.4111 5.12914 13.812L6.58091 14.1892ZM4.41914 16.544C4.31495 16.9449 4.55548 17.3543 4.95638 17.4585C5.35727 17.5627 5.76672 17.3221 5.87091 16.9212L4.41914 16.544ZM6.05478 13.2777C5.65553 13.1674 5.24244 13.4016 5.13212 13.8008C5.02179 14.2001 5.25601 14.6132 5.65526 14.7235L6.05478 13.2777ZM8.30426 15.4555C8.70351 15.5658 9.11661 15.3316 9.22693 14.9324C9.33726 14.5331 9.10304 14.12 8.70378 14.0097L8.30426 15.4555ZM5.89502 11.9999C5.89379 10.7649 6.24943 9.55591 6.91916 8.51834L5.65889 7.70487C4.83239 8.98532 4.3935 10.4773 4.39502 12.0014L5.89502 11.9999ZM6.91952 8.51777C7.57513 7.50005 8.51931 6.70094 9.63139 6.22256L9.03866 4.84464C7.65253 5.4409 6.47568 6.43693 5.65852 7.70544L6.91952 8.51777ZM9.63045 6.22297C10.7258 5.75356 11.9383 5.62986 13.1059 5.86842L13.4062 4.39878C11.9392 4.09906 10.4158 4.25448 9.0396 4.84424L9.63045 6.22297ZM13.1035 5.86793C14.2803 6.11232 15.3559 6.7059 16.1901 7.57114L17.27 6.53006C16.2264 5.44761 14.8807 4.70502 13.4085 4.39927L13.1035 5.86793ZM16.1907 7.57175C16.9065 8.31258 17.4296 9.21772 17.7142 10.2078L19.1558 9.79342C18.8035 8.5675 18.1557 7.44675 17.2694 6.52945L16.1907 7.57175ZM19.1609 10.1892L19.8709 7.45725L18.4191 7.07996L17.7091 9.81196L19.1609 10.1892ZM18.6348 9.2777L15.9858 8.5457L15.5863 9.99151L18.2353 10.7235L18.6348 9.2777ZM18.395 12.0014C18.3963 13.2363 18.0406 14.4453 17.3709 15.4829L18.6312 16.2963C19.4577 15.0159 19.8965 13.5239 19.895 11.9999L18.395 12.0014ZM17.3705 15.4834C16.7149 16.5012 15.7707 17.3003 14.6587 17.7786L15.2514 19.1566C16.6375 18.5603 17.8144 17.5643 18.6315 16.2958L17.3705 15.4834ZM14.6596 17.7782C13.5643 18.2476 12.3517 18.3713 11.1842 18.1328L10.8839 19.6024C12.3508 19.9021 13.8743 19.7467 15.2505 19.157L14.6596 17.7782ZM11.1865 18.1333C10.0098 17.8889 8.93411 17.2953 8.09997 16.4301L7.02008 17.4711C8.06363 18.5536 9.40936 19.2962 10.8815 19.6019L11.1865 18.1333ZM8.09938 16.4295C7.38355 15.6886 6.86042 14.7835 6.57584 13.7934L5.13421 14.2078C5.48658 15.4337 6.13433 16.5545 7.02067 17.4718L8.09938 16.4295ZM5.12914 13.812L4.41914 16.544L5.87091 16.9212L6.58091 14.1892L5.12914 13.812ZM5.65526 14.7235L8.30426 15.4555L8.70378 14.0097L6.05478 13.2777L5.65526 14.7235Z" fill="#ffffff"></path> </g></svg>,
      bgColor: 'bg-emerald-600',
      action: () => setShowRRPPE(true)
    },
    {
      title: 'RRSP',
      subtitle: 'Return SE Receipt',
      category: 'Transfers & Returns',
      icon: <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g strokeWidth="0"></g><g strokeLinecap="round" strokeLinejoin="round"></g><g> <path d="M4.39502 12.0014C4.39544 12.4156 4.73156 12.751 5.14577 12.7506C5.55998 12.7502 5.89544 12.4141 5.89502 11.9999L4.39502 12.0014ZM6.28902 8.1116L6.91916 8.51834L6.91952 8.51777L6.28902 8.1116ZM9.33502 5.5336L9.0396 4.84424L9.03866 4.84464L9.33502 5.5336ZM13.256 5.1336L13.4085 4.39927L13.4062 4.39878L13.256 5.1336ZM16.73 7.0506L16.1901 7.57114L16.1907 7.57175L16.73 7.0506ZM17.7142 10.2078C17.8286 10.6059 18.2441 10.8358 18.6422 10.7214C19.0403 10.607 19.2703 10.1915 19.1558 9.79342L17.7142 10.2078ZM17.7091 9.81196C17.6049 10.2129 17.8455 10.6223 18.2464 10.7265C18.6473 10.8307 19.0567 10.5901 19.1609 10.1892L17.7091 9.81196ZM19.8709 7.45725C19.9751 7.05635 19.7346 6.6469 19.3337 6.54272C18.9328 6.43853 18.5233 6.67906 18.4191 7.07996L19.8709 7.45725ZM18.2353 10.7235C18.6345 10.8338 19.0476 10.5996 19.1579 10.2004C19.2683 9.80111 19.034 9.38802 18.6348 9.2777L18.2353 10.7235ZM15.9858 8.5457C15.5865 8.43537 15.1734 8.66959 15.0631 9.06884C14.9528 9.46809 15.187 9.88119 15.5863 9.99151L15.9858 8.5457ZM19.895 11.9999C19.8946 11.5856 19.5585 11.2502 19.1443 11.2506C18.7301 11.251 18.3946 11.5871 18.395 12.0014L19.895 11.9999ZM18.001 15.8896L17.3709 15.4829L17.3705 15.4834L18.001 15.8896ZM14.955 18.4676L15.2505 19.157L15.2514 19.1566L14.955 18.4676ZM11.034 18.8676L10.8815 19.6019L10.8839 19.6024L11.034 18.8676ZM7.56002 16.9506L8.09997 16.4301L8.09938 16.4295L7.56002 16.9506ZM6.57584 13.7934C6.46141 13.3953 6.04593 13.1654 5.64784 13.2798C5.24974 13.3942 5.01978 13.8097 5.13421 14.2078L6.57584 13.7934ZM6.58091 14.1892C6.6851 13.7884 6.44457 13.3789 6.04367 13.2747C5.64277 13.1705 5.23332 13.4111 5.12914 13.812L6.58091 14.1892ZM4.41914 16.544C4.31495 16.9449 4.55548 17.3543 4.95638 17.4585C5.35727 17.5627 5.76672 17.3221 5.87091 16.9212L4.41914 16.544ZM6.05478 13.2777C5.65553 13.1674 5.24244 13.4016 5.13212 13.8008C5.02179 14.2001 5.25601 14.6132 5.65526 14.7235L6.05478 13.2777ZM8.30426 15.4555C8.70351 15.5658 9.11661 15.3316 9.22693 14.9324C9.33726 14.5331 9.10304 14.12 8.70378 14.0097L8.30426 15.4555ZM5.89502 11.9999C5.89379 10.7649 6.24943 9.55591 6.91916 8.51834L5.65889 7.70487C4.83239 8.98532 4.3935 10.4773 4.39502 12.0014L5.89502 11.9999ZM6.91952 8.51777C7.57513 7.50005 8.51931 6.70094 9.63139 6.22256L9.03866 4.84464C7.65253 5.4409 6.47568 6.43693 5.65852 7.70544L6.91952 8.51777ZM9.63045 6.22297C10.7258 5.75356 11.9383 5.62986 13.1059 5.86842L13.4062 4.39878C11.9392 4.09906 10.4158 4.25448 9.0396 4.84424L9.63045 6.22297ZM13.1035 5.86793C14.2803 6.11232 15.3559 6.7059 16.1901 7.57114L17.27 6.53006C16.2264 5.44761 14.8807 4.70502 13.4085 4.39927L13.1035 5.86793ZM16.1907 7.57175C16.9065 8.31258 17.4296 9.21772 17.7142 10.2078L19.1558 9.79342C18.8035 8.5675 18.1557 7.44675 17.2694 6.52945L16.1907 7.57175ZM19.1609 10.1892L19.8709 7.45725L18.4191 7.07996L17.7091 9.81196L19.1609 10.1892ZM18.6348 9.2777L15.9858 8.5457L15.5863 9.99151L18.2353 10.7235L18.6348 9.2777ZM18.395 12.0014C18.3963 13.2363 18.0406 14.4453 17.3709 15.4829L18.6312 16.2963C19.4577 15.0159 19.8965 13.5239 19.895 11.9999L18.395 12.0014ZM17.3705 15.4834C16.7149 16.5012 15.7707 17.3003 14.6587 17.7786L15.2514 19.1566C16.6375 18.5603 17.8144 17.5643 18.6315 16.2958L17.3705 15.4834ZM14.6596 17.7782C13.5643 18.2476 12.3517 18.3713 11.1842 18.1328L10.8839 19.6024C12.3508 19.9021 13.8743 19.7467 15.2505 19.157L14.6596 17.7782ZM11.1865 18.1333C10.0098 17.8889 8.93411 17.2953 8.09997 16.4301L7.02008 17.4711C8.06363 18.5536 9.40936 19.2962 10.8815 19.6019L11.1865 18.1333ZM8.09938 16.4295C7.38355 15.6886 6.86042 14.7835 6.57584 13.7934L5.13421 14.2078C5.48658 15.4337 6.13433 16.5545 7.02067 17.4718L8.09938 16.4295ZM5.12914 13.812L4.41914 16.544L5.87091 16.9212L6.58091 14.1892L5.12914 13.812ZM5.65526 14.7235L8.30426 15.4555L8.70378 14.0097L6.05478 13.2777L5.65526 14.7235Z" fill="#ffffff"></path> </g></svg>,
      bgColor: 'bg-amber-600',
      action: () => setShowRRSP(true)
    },
    // --- Disposal & Unserviceable ---
    {
      title: 'IIRUP',
      subtitle: 'Inventory & Inspection of Unserviceable PPE',
      category: 'Disposal & Unserviceable',
      icon: Recycle,
      bgColor: 'bg-rose-700',
      action: () => setShowIIRUP(true)
    },
    {
      title: 'IIRUSP',
      subtitle: 'Inventory & Inspection of Unserviceable SE',
      category: 'Disposal & Unserviceable',
      icon: Recycle,
      bgColor: 'bg-fuchsia-700',
      action: () => setShowIIRUSP(true)
    }
  ]), []);

  const filteredReports = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
    );
  }, [reports, searchTerm]);

  // Group filtered reports by category
  const groupedReports = useMemo(() => {
    return filteredReports.reduce((acc, report) => {
      if (!acc[report.category]) {
        acc[report.category] = [];
      }
      acc[report.category].push(report);
      return acc;
    }, {} as Record<string, ReportCard[]>);
  }, [filteredReports]);

  const containerVariant: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariant: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
        {/* --- Hero Header --- */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-10 pb-8 px-6 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                Reports Directory
              </h1>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl">
                Generate, download, and print official asset management reports, registries, and accountability slips.
              </p>
            </div>
            <div className="w-full md:w-96 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileSearch className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                  className="pl-10 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search reports..."
              />
            </div>
          </div>
        </div>

        {/* --- Content Area --- */}
        <div className="max-w-7xl mx-auto px-6 pt-8 space-y-12">
          {Object.keys(groupedReports).length === 0 ? (
              <div className="text-center py-20">
                <FileSearch className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">No reports found</h3>
                <p className="text-slate-500">Try adjusting your search terms.</p>
              </div>
          ) : (
              <motion.div
                  key={searchTerm}
                  variants={containerVariant}
                  initial="hidden"
                  animate="show"
                  className="space-y-10"
              >
                {Object.entries(groupedReports).map(([category, items]) => (
                    <div key={category} className="space-y-4">
                      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                        {category}
                        <Badge variant="secondary" className="ml-2 font-normal text-xs">{items.length}</Badge>
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((r, i) => (
                            <motion.div key={r.title} variants={itemVariant} layout whileHover={{ y: -3 }}>
                              <Card
                                  onClick={r.action}
                                  className="group cursor-pointer border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-800 h-full overflow-hidden"
                              >
                                <CardContent className="p-0 flex items-stretch h-full">
                                  <div className={`${r.bgColor} w-16 flex items-center justify-center shrink-0`}>
                                    {renderIcon(r.icon)}
                                  </div>
                                  <div className="p-4 flex flex-col justify-center flex-1">
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                      {r.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                      {r.subtitle}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                        ))}
                      </div>
                    </div>
                ))}
              </motion.div>
          )}
        </div>

        {/* --- MODALS --- */}
        <EmployeeSelectModal isOpen={showEmployeeModal} employees={employees} onClose={() => setShowEmployeeModal(false)} onSelect={handleEmployeeSelect} />

        {showItemSelectModal === true && selectedReport !== null && (
            <ItemSelectModal key={`item-select-modal-${selectedReport}`} isOpen={true} onClose={() => setShowItemSelectModal(false)} onSelect={handleItemSelect} groupType={selectedReport === 'ICS' ? 'SE' : 'PPE'} title={`Select ${selectedReport === 'ICS' ? 'SE' : 'PPE'} Item`} />
        )}

        <ItemMovementsModal isOpen={showItemMovementsModal} onClose={() => { setShowItemMovementsModal(false); setSelectedItem(null); setSelectedMovement(null); setShowItemSelectModal(false); }} item={selectedItem} onConfirm={handleMovementSelect} />

        {/* Fullscreen Preview */}
        {showPreview && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
              <div className="w-full max-w-6xl h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden relative">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      <FileText className="size-5" />
                    </div>
                    <span className="font-semibold text-lg text-slate-900 dark:text-white">
                      Preview Document
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setShowPreview(false)} disabled={loadingPreview}>
                    <X className="size-5" />
                  </button>
                </div>
                <div className="flex-1 min-h-0 bg-slate-100/50 dark:bg-black/20">
                  {loadingPreview ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                        <Loader2 className="size-10 animate-spin text-blue-600" />
                        <p className="text-slate-500 font-medium">Compiling Report...</p>
                      </div>
                  ) : previewUrl ? (
                      <iframe src={previewUrl} className="w-full h-full border-none" title="Report Preview" />
                  ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-slate-500">No preview available</p>
                      </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <Button variant="outline" onClick={() => setShowPreview(false)} disabled={loadingPreview}>
                    Cancel
                  </Button>
                  <Button variant="outline" onClick={() => { if (!previewUrl) return; const w = window.open(previewUrl); if (w) { w.addEventListener('load', () => w.print()); } }} disabled={loadingPreview || !previewUrl}>
                    <Printer className="size-4 mr-2" /> Print
                  </Button>
                  <Button onClick={handlePreviewConfirm} disabled={loadingPreview || !previewUrl} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Download className="size-4 mr-2" /> Download PDF
                  </Button>
                </div>
              </div>
            </div>
        )}

        <StockCardReportModal isOpen={showStockCardModal} onClose={() => setShowStockCardModal(false)} />
        <RPCPPEFilterModal isOpen={showRPCPPE} onClose={() => setShowRPCPPE(false)} onGenerate={handleRPCPPEGenerate} />
        <PTRGenerationModal isOpen={showPTR} onClose={() => setShowPTR(false)} employees={employees} />
        <ITRGenerationModal isOpen={showITR} onClose={() => setShowITR(false)} employees={employees} />
        <ReturnReceiptGenerationModal isOpen={showRRPPE} onClose={() => setShowRRPPE(false)} returnType="RRPPE" />
        <ReturnReceiptGenerationModal isOpen={showRRSP} onClose={() => setShowRRSP(false)} returnType="RRSP" />
        <SESPIFilterModal isOpen={showSESPI} onClose={() => setShowSESPI(false)} employees={employees} onGenerate={handleSESPIGenerate} />
        <RegistrySPIEmployeeFilterModal isOpen={showRegistrySPI} onClose={() => setShowRegistrySPI(false)} employees={employees} onGenerate={handleRegistrySPIGenerate} />
        <SEPropertyReportFilterModal isOpen={showSEPropertyReport} onClose={() => setShowSEPropertyReport(false)} onGenerate={handleSEPropertyReportGenerate} />
        <IIRUPGenerationModal isOpen={showIIRUP} onClose={() => setShowIIRUP(false)} reportType="IIRUP" />
        <IIRUPGenerationModal isOpen={showIIRUSP} onClose={() => setShowIIRUSP(false)} reportType="IIRUSP" />
        <RSMIReportModal isOpen={showRSMI} onClose={() => setShowRSMI(false)} />
        <PARICSListModal isOpen={showPARList} onClose={() => setShowPARList(false)} reportType="PAR" />
        <PARICSListModal isOpen={showICSList} onClose={() => setShowICSList(false)} reportType="ICS" />
      </div>
  );
}