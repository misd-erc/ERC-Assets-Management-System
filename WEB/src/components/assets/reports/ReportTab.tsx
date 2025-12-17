import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportPreviewModal } from '@/components/assets/reports/ReportPreviewModal';
import { EmployeeSelectModal } from '@/components/assets/reports/EmployeeSelectModal';
import { motion } from 'framer-motion';
import { FileText, Receipt, ArrowRightLeft, BookOpen, BarChart3, ClipboardList } from 'lucide-react';
import { getEmployees } from '@/api/user-management/userApi';
import { normalizeEmployee } from '@/utils/employeeUtils';
import { NormalizedEmployee } from '@/types/asset/UnifiedAsset';
import { PARGenerator } from './PARGenerator';
import { ICSGenerator } from './ICSGenerator';


export function ReportTab() {
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employees, setEmployees] = useState<NormalizedEmployee[]>([]);
  const [selectedReportType, setSelectedReportType] = useState<'PAR' | 'ICS' | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await getEmployees(1, 1000);
        if (response.success) {
          const normalized = response.data.items.map(normalizeEmployee);
          setEmployees(normalized);
        }
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      }
    };

    fetchEmployees();
  }, []);

  const handleReportClick = (reportType: 'PAR' | 'ICS') => {
    setSelectedReportType(reportType);
    setIsEmployeeModalOpen(true);
  };

  const handleEmployeeSelect = async (employee: NormalizedEmployee) => {
    try {
      if (selectedReportType === 'ICS') {
        await ICSGenerator.generateICS(employee);
      } else if (selectedReportType === 'PAR') {
        await PARGenerator.generatePAR(employee);
      }
      console.log(`Report generated successfully for ${selectedReportType}:`, employee);
    } catch (error) {
      console.error(`Failed to generate ${selectedReportType} report:`, error);
      alert(`Failed to generate ${selectedReportType} report. Please try again.`);
    }
    setIsEmployeeModalOpen(false);
    setSelectedReportType(null);
  };

  const reports = [
    {
      title: 'RPCPPE',
      description: 'Report on Property, Plant, and Equipment - Provides a comprehensive overview of all property, plant, and equipment assets.',
      icon: FileText,
      onClick: () => console.log('RPCPPE clicked'),
    },
    {
      title: 'PAR',
      description: 'Property Acknowledgement Receipt - Generates receipts for property acknowledgements and transfers.',
      icon: Receipt,
      onClick: () => handleReportClick('PAR'),
    },
    {
      title: 'PTR',
      description: 'Property Transfer Report - Tracks and reports on property transfers within the organization.',
      icon: ArrowRightLeft,
      onClick: () => console.log('PTR clicked'),
    },
    {
      title: 'Reg SPI',
      description: 'Registry of Semi-Expendable Property Issued.',
      icon: BookOpen,
      onClick: () => console.log('Register SPI clicked'),
    },
     {
      title: 'ICS',
      description: 'Inventory Custodian Slip - Creates slips for inventory custodians to acknowledge receipt of items.',
      icon: ClipboardList,
      onClick: () => handleReportClick('ICS'),
    },
    {
      title: 'ITR',
      description: 'Inventory Turnover Report - Analyzes inventory turnover rates and efficiency metrics.',
      icon: BarChart3,
      onClick: () => console.log('ITR clicked'),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Launcher</CardTitle>
          <CardDescription>Select a report to generate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report, index) => {
              const IconComponent = report.icon;
              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer"
                  onClick={report.onClick}
                >
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200 transition-all duration-300 shadow-md hover:shadow-xl border-0 overflow-hidden">
                    <CardHeader className="text-center pb-4">
                      <div className="flex justify-center mb-3">
                        <IconComponent className="w-10 h-10 text-indigo-600" />
                      </div>
                      <CardTitle className="text-lg font-semibold text-gray-800 mb-2">{report.title}</CardTitle>
                      <CardDescription className="text-sm text-gray-600 leading-relaxed">{report.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ReportPreviewModal
        isOpen={false}
        onClose={() => {}}
        onConfirm={() => {}}
        pdfUrl=""
        reportType="PAR"
        isLoading={false}
      />

      <EmployeeSelectModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        employees={employees}
        onSelect={handleEmployeeSelect}
      />
    </div>
  );
}
