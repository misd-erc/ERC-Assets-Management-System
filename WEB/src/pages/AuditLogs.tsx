import React, { useState, useEffect } from 'react';
import { AuditLogsHeader, AuditLogsTable, AuditLogDetailsModal } from '../components/audit-logs';
import { getAllAuditTrail } from '../api/audit/auditApi';
import { AuditTrailItem } from '../types/audit';
import { toast } from 'sonner';
import { useAuthStore } from '../store/auth';

const AuditLogs: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditTrailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditTrailItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // KPI stats
  const [totalLogs, setTotalLogs] = useState(0);
  const [todayLogs, setTodayLogs] = useState(0);
  const [securityEvents, setSecurityEvents] = useState(0);
  const [failedActions, setFailedActions] = useState(0);

  const { user } = useAuthStore();

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      if (!token || !sessionKey) {
        setError('Authentication required');
        return;
      }

      const response = await getAllAuditTrail(token, sessionKey, currentPage, 10);

      if (response.success) {
        setAuditLogs(response.data.items);
        setTotalPages(response.data.totalPages);
      } else {
        setError('Failed to load audit logs');
      }
    } catch (error: any) {
      console.error('Failed to fetch audit logs:', error);
      if (error.response?.status === 401) {
        setError('You do not have permission to view audit logs or your session has expired.');
      } else {
        setError('Failed to load audit logs');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterClick = () => {
    // TODO: Implement filter functionality
    toast.info('Filter functionality coming soon');
  };

  const handleExportClick = () => {
    // TODO: Implement export functionality
    toast.info('Export functionality coming soon');
  };

  const handleViewDetails = (log: AuditTrailItem) => {
    setSelectedLog(log);
    setModalOpen(true);
  };



  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="pl-64 pt-16 space-y-8">
      <AuditLogsHeader
        totalLogs={totalLogs}
        todayLogs={todayLogs}
        securityEvents={securityEvents}
        failedActions={failedActions}
        onFilterClick={handleFilterClick}
        onExportClick={handleExportClick}
      />

      <AuditLogsTable
        auditLogs={auditLogs}
        loading={loading}
        error={error}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onViewDetails={handleViewDetails}
      />

      <AuditLogDetailsModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedLog(null);
        }}
        auditLog={selectedLog}
      />
    </div>
  );
};

export default AuditLogs;
