import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileSearch,
  Download,
  Filter,
  Calendar,
  User,
  Activity,
  Shield,
  AlertTriangle
} from 'lucide-react';

interface AuditLogsHeaderProps {
  totalLogs: number;
  todayLogs: number;
  securityEvents: number;
  failedActions: number;
  onFilterClick: () => void;
  onExportClick: () => void;
}

export function AuditLogsHeader({
  totalLogs,
  todayLogs,
  securityEvents,
  failedActions,
  onFilterClick,
  onExportClick
}: AuditLogsHeaderProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">
            System audit trail, user activity monitoring, and compliance reporting
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onFilterClick} className="flex-1 sm:flex-initial">
            <Filter className="w-4 h-4 mr-2" />
            Filter Logs
          </Button>
          <Button variant="outline" onClick={onExportClick} className="flex-1 sm:flex-initial">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Logs</p>
                <p className="text-lg sm:text-2xl font-bold mt-1">{totalLogs.toLocaleString()}</p>
              </div>
              <FileSearch className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Today</p>
                <p className="text-lg sm:text-2xl font-bold mt-1">{todayLogs}</p>
              </div>
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Security Events</p>
                <p className="text-lg sm:text-2xl font-bold mt-1">{securityEvents}</p>
              </div>
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Failed Actions</p>
                <p className="text-lg sm:text-2xl font-bold mt-1">{failedActions}</p>
              </div>
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




