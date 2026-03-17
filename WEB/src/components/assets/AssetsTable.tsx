import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit, Trash2, Package } from 'lucide-react';
import { Asset, NormalizedEmployee } from '@/types/asset/UnifiedAsset';
import { getEmployees } from '@/api/user-management/userApi';

interface AssetsTableProps {
  assets: Asset[];
  loading: boolean;
  onViewDetails: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function AssetsTable({
  assets,
  loading,
  onViewDetails,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: AssetsTableProps) {
  const [employees, setEmployees] = useState<NormalizedEmployee[]>([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await getEmployees();
      const normalizedEmployees = response.data.items.map(normalizeEmployee);
      setEmployees(normalizedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  function normalizeEmployee(e: any): NormalizedEmployee {
    const firstName = e.firstName ?? "";
    const middleName = e.middleName ?? "";
    const lastName = e.lastName ?? "";
    const suffixName = e.suffixName ?? "";
    const employeeIdOriginal = e.employeeIdOriginal ?? "";
    const employmentTypeId = e.employmentType?.id ?? 1;
    const employmentTypeName = employmentTypeId === 1 ? 'Plantilla' : 'Non-Plantilla';

    const label = `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ''}${suffixName ? ` ${suffixName}` : ''}${employeeIdOriginal ? ` — ${employeeIdOriginal}` : ''} (${employmentTypeName})`;

    return {
      id: e.id,
      firstName,
      middleName,
      lastName,
      suffixName,
      employeeIdOriginal,
      employmentTypeId,
      label,
    };
  }

  const getPlantillaEmployeeName = (asset: Asset): string => {
    if (asset.movements && asset.movements.length > 0) {
      const latestMovement = asset.movements.sort((a: any, b: any) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime())[0];

      // First try embedded employee (plantilla only)
      if (latestMovement.employee && Array.isArray(latestMovement.employee) && latestMovement.employee.length > 0) {
        const emp = latestMovement.employee[0];
        if ((emp.employmentType?.id ?? 1) === 1) {
          const firstName = emp.firstName ?? "";
          const middleName = emp.middleName ?? "";
          const lastName = emp.lastName ?? "";
          const suffixName = emp.suffixName ?? "";
          const employeeIdOriginal = emp.employeeIdOriginal ?? "";
          return `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ''}${suffixName ? ` ${suffixName}` : ''}${employeeIdOriginal ? ` — ${employeeIdOriginal}` : ''}`;
        }
      }

      // Fallback to ID lookup
      if (latestMovement.plantillaEmployeeId) {
        const employee = employees.find((e: NormalizedEmployee) => e.id === latestMovement.plantillaEmployeeId);
        return employee ? employee.label : 'Unknown Employee';
      }
    }
    return 'N/A';
  };

  const getNonPlantillaEmployeeName = (asset: Asset): string => {
    if (asset.movements && asset.movements.length > 0) {
      const latestMovement = asset.movements.sort((a: any, b: any) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime())[0];

      // First try embedded employee (non-plantilla only)
      if (latestMovement.employee && Array.isArray(latestMovement.employee) && latestMovement.employee.length > 0) {
        const emp = latestMovement.employee[0];
        if ((emp.employmentType?.id ?? 1) !== 1) {
          const firstName = emp.firstName ?? "";
          const middleName = emp.middleName ?? "";
          const lastName = emp.lastName ?? "";
          const suffixName = emp.suffixName ?? "";
          const employeeIdOriginal = emp.employeeIdOriginal ?? "";
          return `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ''}${suffixName ? ` ${suffixName}` : ''}${employeeIdOriginal ? ` — ${employeeIdOriginal}` : ''}`;
        }
      }

      // Fallback to ID lookup
      if (latestMovement.nonPlantillaEmployeeId) {
        const employee = employees.find((e: NormalizedEmployee) => e.id === latestMovement.nonPlantillaEmployeeId);
        return employee ? employee.label : 'Unknown Employee';
      }
    }
    return 'N/A';
  };

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
                <TableHead>Accountable Employee (Plantilla)</TableHead>
                <TableHead>Accountable Employee (Non-Plantilla)</TableHead>
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
                    <TableCell>{getPlantillaEmployeeName(asset)}</TableCell>
                    <TableCell>{getNonPlantillaEmployeeName(asset)}</TableCell>
                    <TableCell className="max-w-xs truncate" title={asset.description}>
                      {asset.description}
                    </TableCell>
                    <TableCell>{asset.category?.name}</TableCell>
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
        {assets.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, assets.length)} of {assets.length} assets
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Page Size:</label>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="flex h-8 w-16 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
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
