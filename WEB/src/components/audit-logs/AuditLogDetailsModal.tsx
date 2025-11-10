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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>
            Detailed information about this audit trail entry
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Table</label>
              <p className="text-sm text-gray-900 font-mono">{auditLog.table}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Record ID</label>
              <p className="text-sm text-gray-900 font-mono">{auditLog.recordId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Action</label>
              <Badge className={getActionColor(auditLog.action)}>
                {auditLog.action}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Action By</label>
              <p className="text-sm text-gray-900">{auditLog.actionBy}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <p className="text-sm text-gray-900">
                {new Date(auditLog.date).toLocaleString()}
              </p>
            </div>
          </div>

          <Separator />

          {/* Changes */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Changes ({auditLog.changes.length})
            </h3>
            {auditLog.changes.length === 0 ? (
              <p className="text-sm text-gray-500">No changes recorded</p>
            ) : (
              <div className="space-y-3">
                {auditLog.changes.map((change, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {change.field}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">
                          Old Value
                        </label>
                        <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800 font-mono break-all">
                          {change.oldValue || '(empty)'}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">
                          New Value
                        </label>
                        <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800 font-mono break-all">
                          {change.newValue || '(empty)'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
