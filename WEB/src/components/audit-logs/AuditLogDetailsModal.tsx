import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { FileText, Database, User, Calendar, Hash } from 'lucide-react';
import { AuditTrailItem } from '../../types/audit';

interface AuditLogDetailsModalProps {
  open: boolean;
  onClose: () => void;
  auditLog: AuditTrailItem | null;
}

export function AuditLogDetailsModal({
  open,
  onClose,
  auditLog
}: AuditLogDetailsModalProps) {
  if (!auditLog) return null;

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'insert':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Audit Log Details
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                Detailed information about this audit trail entry
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information Card */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                  <Database className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Table</label>
                    <p className="text-sm font-medium text-gray-900 font-mono">{auditLog.table}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Record ID</label>
                    <p className="text-sm font-medium text-gray-900 font-mono">{auditLog.recordId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                  <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">A</span>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Action</label>
                    <div className="mt-1">
                      <Badge className={`${getActionColor(auditLog.action)} font-medium px-3 py-1`}>
                        {auditLog.action}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Action By</label>
                    <p className="text-sm font-medium text-gray-900">{auditLog.actionBy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 md:col-span-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date & Time</label>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(auditLog.date).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Changes Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Changes
                <Badge variant="secondary" className="ml-2">
                  {Object.keys(auditLog.changes).length} field{Object.keys(auditLog.changes).length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(auditLog.changes).length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No changes recorded for this entry</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {Object.entries(auditLog.changes).map(([field, value], index) => (
                    <div key={index} className="group relative bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-semibold text-gray-900 capitalize">
                            {field.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                          Current Value
                        </label>
                        <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border break-all">
                          {value !== null && value !== undefined ? String(value) : <span className="text-gray-400 italic">(empty)</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
