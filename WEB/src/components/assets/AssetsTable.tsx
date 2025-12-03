import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit, Trash2, Package } from 'lucide-react';
import { Asset } from '@/types/asset/UnifiedAsset';

interface AssetsTableProps {
  assets: Asset[];
  loading: boolean;
  onViewDetails: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function AssetsTable({
  assets,
  loading,
  onViewDetails,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
}: AssetsTableProps) {
  const getConditionBadgeVariant = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'working':
        return 'default';
      case 'not working':
      case 'unserviceable':
        return 'destructive';
      case 'iirup':
        return 'secondary';
      case 'disposed':
      case 'missing':
        return 'outline';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading assets...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (assets.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Package className="size-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-600">There are no assets matching your current filters.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="size-5 text-blue-600" />
          Assets List
        </CardTitle>
        <CardDescription>
          A list of all assets in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property Number</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit Value</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Date Acquired</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => {
                const latestMovement =
                  asset.movements && asset.movements.length > 0
                    ? asset.movements[asset.movements.length - 1]
                    : null;

                return (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.propertyNumber}</TableCell>
                    <TableCell className="max-w-xs truncate" title={asset.description}>
                      {asset.description}
                    </TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell>{formatCurrency(asset.unitValue)}</TableCell>
                    <TableCell>
                      <Badge variant={getConditionBadgeVariant(latestMovement?.condition || 'Working')}>
                        {latestMovement?.condition || 'Working'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={asset.group === 'PPE' ? 'default' : 'secondary'}>
                        {asset.group}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(asset.dateAcquired)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(asset)}
                          className="size-8 p-0"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(asset)}
                          className="size-8 p-0"
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(asset)}
                          className="size-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
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
