import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, AlertCircle, Package, User } from 'lucide-react';
import { SEAsset } from '@/types/supply/se';

interface SETableProps {
  seAssets: SEAsset[];
  onViewDetails: (se: SEAsset) => void;
  onEdit: (se: SEAsset) => void;
  onDelete: (id: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function SETable({
  seAssets,
  onViewDetails,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
}: SETableProps) {
  const getConditionBadge = (condition: string) => {
    const styles = {
      Working: 'bg-green-100 text-green-800',
      'Not Working': 'bg-red-100 text-red-800',
      'For Repair': 'bg-yellow-100 text-yellow-800',
      Lost: 'bg-purple-100 text-purple-800',
      Unserviceable: 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge className={styles[condition as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        {condition}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Active: 'bg-green-100 text-green-800 border-green-200',
      Returned: 'bg-blue-100 text-blue-800 border-blue-200',
      Lost: 'bg-red-100 text-red-800 border-red-200',
      Unserviceable: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const hasWarning = (se: SEAsset) => {
    return !se.se_property_number || !se.serial_number;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getCurrentHolder = (se: SEAsset) => {
    const currentBlock = se.accountabilityBlocks.find(b => b.label === 'Current Holder');
    if (!currentBlock) return '-';

    const employeeId = currentBlock.plantilla_employee_id || currentBlock.non_plantilla_employee_id;
    return employeeId || '-';
  };

  const getCurrentCondition = (se: SEAsset) => {
    const currentBlock = se.accountabilityBlocks.find(b => b.label === 'Current Holder');
    return currentBlock?.condition || '-';
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">SE Property #</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Serial #</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Unit Value</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Current Holder</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Condition</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {seAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    <Package className="size-12 mx-auto mb-2 text-slate-300" />
                    <p>No SE assets found</p>
                  </td>
                </tr>
              ) : (
                seAssets.map(se => (
                  <tr
                    key={se.id}
                    className={`hover:bg-slate-50 transition-colors ${hasWarning(se) ? 'bg-yellow-50' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {hasWarning(se) && (
                          <AlertCircle className="size-4 text-yellow-600" />
                        )}
                        <span className="font-medium text-slate-900">{se.se_property_number || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{se.category}</td>
                    <td className="px-4 py-3 text-sm text-slate-900 max-w-xs truncate">{se.description}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{se.serial_number || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{formatCurrency(se.unit_value)}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-slate-400" />
                        <span className="text-slate-600">{getCurrentHolder(se)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getConditionBadge(getCurrentCondition(se))}</td>
                    <td className="px-4 py-3">{getStatusBadge(se.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(se)}
                          className="size-8 p-0"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(se)}
                          className="size-8 p-0"
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(se.id)}
                          className="size-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-slate-600">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, seAssets.length)} of {seAssets.length} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


