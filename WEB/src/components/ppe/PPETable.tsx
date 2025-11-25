import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, AlertCircle, Package } from 'lucide-react';
import { PPEAsset } from '@/types/asset/PPEAsset';

interface PPETableProps {
  ppeAssets: PPEAsset[];
  onViewDetails: (ppe: PPEAsset) => void;
  onEdit: (ppe: PPEAsset) => void;
  onDelete: (id: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PPETable({
  ppeAssets,
  onViewDetails,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
}: PPETableProps) {
  const getConditionBadge = (condition: string) => {
    const styles = {
      Working: 'bg-green-100 text-green-800',
      'Not Working': 'bg-red-100 text-red-800',
      IIRUP: 'bg-yellow-100 text-yellow-800',
      Disposed: 'bg-gray-100 text-gray-800',
      Missing: 'bg-purple-100 text-purple-800'
    };
    return (
      <Badge className={styles[condition as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        {condition}
      </Badge>
    );
  };

  const hasWarning = (ppe: PPEAsset) => {
    return !ppe.serialNumber || !ppe.propertyNumber;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
  };

  // Extract division name from PPE asset's actualDivision field
  const getDivisionName = (ppe: PPEAsset) => {
    return ppe.actualDivision || '-';
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Property #</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Legend</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Brand</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Model</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Serial #</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Unit of Measurement</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Unit Value</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Date Acquired</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Estimated Useful Life</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Condition</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Division</th>
                <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {ppeAssets.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-slate-500">
                    <Package className="size-12 mx-auto mb-2 text-slate-300" />
                    <p>No PPE assets found</p>
                  </td>
                </tr>
              ) : (
                ppeAssets.map(ppe => (
                  <tr
                    key={ppe.id}
                    className={`hover:bg-slate-50 transition-colors ${hasWarning(ppe) ? 'bg-yellow-50' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {hasWarning(ppe) && (
                          <AlertCircle className="size-4 text-yellow-600" />
                        )}
                        <span className="font-medium text-slate-900">{ppe.propertyNumber || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{typeof ppe.category === 'object' && ppe.category !== null ? (ppe.category as any).name : ppe.category || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{typeof ppe.legend === 'object' && ppe.legend !== null ? (ppe.legend as any).name : ppe.legend || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-900 max-w-xs truncate">{ppe.description || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{ppe.brand || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{ppe.model || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{ppe.serialNumber || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{ppe.unitOfMeasurement || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{formatCurrency(ppe.unitValue)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(ppe.dateAcquired)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{ppe.estimatedUsefulLife || '-'}</td>
                    <td className="px-4 py-3">{getConditionBadge(ppe.condition || '')}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{getDivisionName(ppe)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(ppe)}
                          className="size-8 p-0"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(ppe)}
                          className="size-8 p-0"
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(ppe.id)}
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
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, ppeAssets.length)} of {ppeAssets.length} results
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
