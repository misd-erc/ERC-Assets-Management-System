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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Audit Logs</h1>
          <p className="text-muted-foreground">
            System audit trail, user activity monitoring, and compliance reporting
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onFilterClick}>
            <Filter className="w-4 h-4 mr-2" />
            Filter Logs
          </Button>
          <Button variant="outline" onClick={onExportClick}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Logs</p>
                <p className="text-2xl font-bold mt-1">{totalLogs.toLocaleString()}</p>
              </div>
              <FileSearch className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold mt-1">{todayLogs}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Security Events</p>
                <p className="text-2xl font-bold mt-1">{securityEvents}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed Actions</p>
                <p className="text-2xl font-bold mt-1">{failedActions}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




