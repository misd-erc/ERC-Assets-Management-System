import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, AlertCircle, Package } from 'lucide-react';
import { PPEAsset } from '@/types/asset/PPEAsset';
import { SEAsset } from '@/types/supply/se';
import { AssetType } from '@/services/assetService';

interface AssetsTableProps {
  type: AssetType;
  assets: (PPEAsset | SEAsset)[];
  loading: boolean;
  onViewDetails: (asset: PPEAsset | SEAsset) => void;
  onEdit: (asset: PPEAsset | SEAsset) => void;
  onDelete: (asset: PPEAsset | SEAsset) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  groupBy?: string;
}

export function AssetsTable({
  type,
  assets,
  loading,
  onViewDetails,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
  groupBy,
}: AssetsTableProps): React.JSX.Element {
  const getConditionBadge = (condition: string) => {
    const styles = {
      Working: 'bg-green-100 text-green-800',
      'Not Working': 'bg-red-100 text-red-800',
      IIRUP: 'bg-yellow-100 text-yellow-800',
      Disposed: 'bg-gray-100 text-gray-800',
      Missing: 'bg-purple-100 text-purple-800',
      Unserviceable: 'bg-orange-100 text-orange-800'
    };
    return (
      <Badge className={styles[condition as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        {condition}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || !isFinite(amount)) {
      return '-';
    }
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

  const getAssetIdentifier = (asset: PPEAsset | SEAsset) => {
    if (type === 'ppe') {
      const ppeAsset = asset as PPEAsset;
      return ppeAsset.propertyNumber || '-';
    } else {
      const seAsset = asset as SEAsset;
      return seAsset.se_property_number || '-';
    }
  };

  const getAssetDescription = (asset: PPEAsset | SEAsset) => {
    if (type === 'ppe') {
      const ppeAsset = asset as PPEAsset;
      return ppeAsset.description || '-';
    } else {
      const seAsset = asset as SEAsset;
      return seAsset.description || '-';
    }
  };

  const getAssetCategory = (asset: PPEAsset | SEAsset) => {
    if (type === 'ppe') {
      const ppeAsset = asset as PPEAsset;
      return typeof ppeAsset.category === 'object' && ppeAsset.category !== null ? (ppeAsset.category as any).name : ppeAsset.category || '-';
    } else {
      const seAsset = asset as SEAsset;
      return seAsset.category || '-';
    }
  };

  const getAssetBrand = (asset: PPEAsset | SEAsset) => {
    if (type === 'ppe') {
      const ppeAsset = asset as PPEAsset;
      return ppeAsset.brand || '-';
    } else {
      const seAsset = asset as SEAsset;
      return seAsset.brand || '-';
    }
  };

  const getAssetModel = (asset: PPEAsset | SEAsset) => {
    if (type === 'ppe') {
      const ppeAsset = asset as PPEAsset;
      return ppeAsset.model || '-';
    } else {
      const seAsset = asset as SEAsset;
      return seAsset.model || '-';
    }
  };

  const getAssetSerialNumber = (asset: PPEAsset | SEAsset) => {
    if (type === 'ppe') {
      const ppeAsset = asset as PPEAsset;
      return ppeAsset.serialNumber || '-';
    } else {
      const seAsset = asset as SEAsset;
      return seAsset.serial_number || '-';
    }
  };

  const getAssetUnitValue = (asset: PPEAsset | SEAsset) => {
    if (type === 'ppe') {
      const ppeAsset = asset as PPEAsset;
      return formatCurrency(ppeAsset.unitValue);
    } else {
      const seAsset = asset as SEAsset;
      return formatCurrency(seAsset.unit_value);
    }
  };

  const getAssetDateAcquired = (asset: PPEAsset | SEAsset) => {
    if (type === 'ppe') {
      const ppeAsset = asset as PPEAsset;
      return formatDate(ppeAsset.dateAcquired);
    } else {
      const seAsset = asset as SEAsset;
      return formatDate(seAsset.date_acquired);
    }
  };

  const getAssetCondition = (asset: PPEAsset | SEAsset) => {
    if (type === 'ppe') {
      const ppeAsset = asset as PPEAsset;
      return ppeAsset.condition || '';
    } else {
      const seAsset = asset as SEAsset;
      // Get condition from the current accountability block
      const currentBlock = seAsset.accountabilityBlocks?.find(block => block.label === 'Current Holder');
      return currentBlock?.condition || seAsset.status || '';
    }
  };

  const getAssetDivision = (asset: PPEAsset | SEAsset) => {
    if (type === 'ppe') {
      const ppeAsset = asset as PPEAsset;
      return ppeAsset.actualDivision || '-';
    } else {
      const seAsset = asset as SEAsset;
      // Get division from the current accountability block
      const currentBlock = seAsset.accountabilityBlocks?.find(block => block.label === 'Current Holder');
      return currentBlock?.division_section || '-';
    }
  };

  const getTableHeaders = () => {
    if (type === 'ppe') {
      return (
        <>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Property #</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Category</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Legend</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Description</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Brand</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Model</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Serial #</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Unit Value</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Date Acquired</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Condition</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Division</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Actions</th>
        </>
      );
    } else {
      return (
        <>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">SE Property #</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Category</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Description</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Brand</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Model</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Serial #</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Unit Value</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Date Acquired</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Condition</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Division/Section</th>
          <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Actions</th>
        </>
      );
    }
  };

  const renderTableRow = (asset: PPEAsset | SEAsset) => {
    if (type === 'ppe') {
      const ppeAsset = asset as PPEAsset;
      return (
        <>
          <td className="px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">{getAssetIdentifier(asset)}</span>
            </div>
          </td>
          <td className="px-4 py-3 text-sm text-slate-600">{getAssetCategory(asset)}</td>
          <td className="px-4 py-3 text-sm text-slate-600">{typeof ppeAsset.legend === 'object' && ppeAsset.legend !== null ? (ppeAsset.legend as any).name : ppeAsset.legend || '-'}</td>
          <td className="px-4 py-3 text-sm text-slate-900 max-w-xs truncate">{getAssetDescription(asset)}</td>
          <td className="px-4 py-3 text-sm text-slate-600">{getAssetBrand(asset)}</td>
          <td className="px-4 py-3 text-sm text-slate-600">{getAssetModel(asset)}</td>
          <td className="px-4 py-3 text-sm text-slate-600">{getAssetSerialNumber(asset)}</td>
          <td className="px-4 py-3 text-sm text-slate-900">{getAssetUnitValue(asset)}</td>
          <td className="px-4 py-3 text-sm text-slate-600">{getAssetDateAcquired(asset)}</td>
          <td className="px-4 py-3">{getConditionBadge(getAssetCondition(asset))}</td>
          <td className="px-4 py-3 text-sm text-slate-600">{getAssetDivision(asset)}</td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-1">
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
                className="size-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </td>
        </>
      );
    } else {
      const seAsset = asset as SEAsset;
      return (
        <>
          <td className="px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">{getAssetIdentifier(asset)}</span>
            </div>
          </td>
          <td className="px-4 py-3 text-sm text-slate-600">{getAssetCategory(asset)}</td>
          <td className="px-4 py-3 text-sm text-slate-900 max-w-xs truncate">{getAssetDescription(asset)}</td>
          <td className="px-4 py-3 text-sm text-slate-600">{getAssetBrand(asset)}</td>
          <td className="px-4 py-3 text-sm text-slate-600">{getAssetModel(asset)}</td>
          <td className="px-4 py-3 text-sm text-slate-600">{getAssetSerialNumber(asset)}</td>
          <td className="px-4 py-3 text-sm text-slate-900">{getAssetUnitValue(asset)}</td>
          <td className="px-4 py-3 text-sm text-slate-600">{getAssetDateAcquired(asset)}</td>
          <td className="px-4 py-3">{getConditionBadge(getAssetCondition(asset))}</td>
          <td className="px-4 py-3 text-sm text-slate-600">{getAssetDivision(asset)}</td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-1">
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
                className="size-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </td>
        </>
      );
    }
  };

  const getColSpan = () => {
    return type === 'ppe' ? 12 : 11;
  };

  const groupAssets = (assets: (PPEAsset | SEAsset)[], groupBy: string) => {
    if (groupBy === 'none') return { '': assets };

    const groups: Record<string, (PPEAsset | SEAsset)[]> = {};

    assets.forEach(asset => {
      let groupKey = '';
      switch (groupBy) {
        case 'category':
          groupKey = getAssetCategory(asset);
          break;
        case 'condition':
          groupKey = getAssetCondition(asset);
          break;
        case 'division':
          groupKey = getAssetDivision(asset);
          break;
        default:
          groupKey = '';
      }
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(asset);
    });

    return groups;
  };

  const groupedAssets = groupBy ? groupAssets(assets, groupBy) : { '': assets };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                {getTableHeaders()}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={getColSpan()} className="px-4 py-8 text-center text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p>Loading {type.toUpperCase()} assets...</p>
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={getColSpan()} className="px-4 py-8 text-center text-slate-500">
                    <Package className="size-12 mx-auto mb-2 text-slate-300" />
                    <p>No {type.toUpperCase()} assets found</p>
                  </td>
                </tr>
              ) : (
                Object.entries(groupedAssets).map(([groupName, groupAssets]) => (
                  <React.Fragment key={groupName}>
                    {groupName && (
                      <tr className="bg-slate-100">
                        <td colSpan={getColSpan()} className="px-4 py-3 text-sm font-semibold text-slate-900">
                          {groupBy === 'category' && 'Category: '}
                          {groupBy === 'condition' && 'Condition: '}
                          {groupBy === 'division' && 'Division: '}
                          {groupName} ({groupAssets.length} assets)
                        </td>
                      </tr>
                    )}
                    {groupAssets.map(asset => (
                      <tr
                        key={asset.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        {renderTableRow(asset)}
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-slate-600">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, assets.length)} of {assets.length} results
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
