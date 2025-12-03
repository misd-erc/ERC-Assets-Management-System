import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Package,
  DollarSign,
  User,
  Calendar,
  Edit,
  History,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { PPEAsset } from '@/types/asset/PPEAsset';
import { SEAsset } from '@/types/supply/se';
import { Asset } from '@/types/asset/UnifiedAsset';

interface AssetsViewCardProps {
  asset: Asset;
  onEdit: () => void;
  onClose: () => void;
}

export function AssetsViewCard({ asset, onEdit, onClose }: AssetsViewCardProps) {
  const getConditionBadge = (condition: string) => {
    const styles = {
      Working: 'bg-green-100 text-green-800 border-green-200',
      'Not Working': 'bg-red-100 text-red-800 border-red-200',
      IIRUP: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Disposed: 'bg-gray-100 text-gray-800 border-gray-200',
      Missing: 'bg-purple-100 text-purple-800 border-purple-200',
      Unserviceable: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return (
      <Badge variant="outline" className={styles[condition as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        {condition}
      </Badge>
    );
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'Working':
        return <CheckCircle className="size-4 text-green-600" />;
      case 'Not Working':
      case 'Unserviceable':
        return <XCircle className="size-4 text-red-600" />;
      case 'IIRUP':
        return <Clock className="size-4 text-yellow-600" />;
      default:
        return <AlertCircle className="size-4 text-slate-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateToYYYYMMDD = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  if (asset.group === 'PPE') {
    const ppeAsset = asset as unknown as PPEAsset;
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{ppeAsset.propertyNumber}</h2>
            <p className="text-slate-600">{ppeAsset.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onEdit} className="gap-2">
              <Edit className="size-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5 text-blue-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Property Number</Label>
                  <p className="text-lg font-semibold text-slate-900">{ppeAsset.propertyNumber}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Category</Label>
                  <p className="text-slate-900">{typeof ppeAsset.category === 'object' && ppeAsset.category !== null ? (ppeAsset.category as any).name : ppeAsset.category || '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Legend</Label>
                  <p className="text-slate-900">{typeof ppeAsset.legend === 'object' && ppeAsset.legend !== null ? (ppeAsset.legend as any).name : ppeAsset.legend || '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Serial Number</Label>
                  <p className="text-slate-900">{ppeAsset.serialNumber || '-'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Brand</Label>
                  <p className="text-slate-900">{ppeAsset.brand || '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Model</Label>
                  <p className="text-slate-900">{ppeAsset.model || '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Parts</Label>
                  <p className="text-slate-900">{Array.isArray(ppeAsset.parts) ? ppeAsset.parts.join(', ') : '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Unit of Measurement</Label>
                  <p className="text-slate-900">{ppeAsset.unitOfMeasurement || '-'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="size-5 text-blue-600" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-medium text-slate-600">Unit Value</Label>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(ppeAsset.unitValue)}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Date Acquired</Label>
                <p className="text-lg text-slate-900">{formatDate(ppeAsset.dateAcquired)}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Estimated Useful Life</Label>
                <p className="text-lg text-slate-900">{ppeAsset.estimatedUsefulLife} years</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accountability Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5 text-blue-600" />
              Accountability Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">PAR/ITR Number</Label>
                  <p className="text-slate-900">{ppeAsset.movements && ppeAsset.movements.length > 0 ? ppeAsset.movements[0].parItrNumber || '-' : '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Plantilla Employee ID</Label>
                  <p className="text-slate-900">{ppeAsset.movements && ppeAsset.movements.length > 0 ? ppeAsset.movements[0].plantillaEmployeeIdOriginal || '-' : '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Non-Plantilla Employee ID</Label>
                  <p className="text-slate-900">{ppeAsset.movements && ppeAsset.movements.length > 0 ? ppeAsset.movements[0].nonPlantillaEmployeeIdOriginal || '-' : '-'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Actual Division</Label>
                  <p className="text-slate-900">{ppeAsset.movements && ppeAsset.movements.length > 0 && typeof ppeAsset.movements[0].division === 'object' && ppeAsset.movements[0].division !== null ? ppeAsset.movements[0].division.name : '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Condition</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {ppeAsset.movements && ppeAsset.movements.length > 0 ? getConditionIcon(ppeAsset.movements[0].condition || '') : getConditionIcon('')}
                    {ppeAsset.movements && ppeAsset.movements.length > 0 ? getConditionBadge(ppeAsset.movements[0].condition || '') : getConditionBadge('')}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Date</Label>
                  <p className="text-slate-900">{ppeAsset.movements && ppeAsset.movements.length > 0 ? formatDate(ppeAsset.movements[0].dateAssigned) : '-'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        {ppeAsset.history && ppeAsset.history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-5 text-blue-600" />
                Accountability History
              </CardTitle>
              <CardDescription>Previous assignments and transfers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ppeAsset.history.map((entry, index) => (
                  <div key={entry.id} className="border-l-2 border-blue-200 pl-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="size-4 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {formatDate(entry.date)}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-900">
                        <span className="font-medium">PAR/ITR:</span> {entry.par_itr_number || '-'}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-medium">Employee:</span> {entry.plantilla_employee_id || entry.non_plantilla_employee_id || '-'}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-medium">Division:</span> {typeof entry.actual_division === 'object' && entry.actual_division !== null ? (entry.actual_division as any).name : entry.actual_division || '-'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-slate-600 font-medium">Condition:</span>
                        {getConditionBadge(entry.condition)}
                      </div>
                      {entry.remarks && (
                        <p className="text-slate-500 italic mt-2">{entry.remarks}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500">
              <p>Encoded on: {formatDate(ppeAsset.dateEncoded)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } else {
    // SE Asset using unified Asset type
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{asset.propertyNumber}</h2>
            <p className="text-slate-600">{asset.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onEdit} className="gap-2">
              <Edit className="size-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5 text-blue-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Property Number</Label>
                  <p className="text-lg font-semibold text-slate-900">{asset.propertyNumber}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Category</Label>
                  <p className="text-slate-900">{asset.category || '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Legend</Label>
                  <p className="text-slate-900">{asset.legend || '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Serial Number</Label>
                  <p className="text-slate-900">{asset.serialNumber || '-'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Brand</Label>
                  <p className="text-slate-900">{asset.brand || '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Model</Label>
                  <p className="text-slate-900">{asset.model || '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Parts</Label>
                  {Array.isArray(asset.parts) && asset.parts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Serial Number</TableHead>
                          <TableHead>Active</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {asset.parts.map((part) => (
                          <TableRow key={part.id}>
                            <TableCell>{part.name}</TableCell>
                            <TableCell>{part.serialNumber}</TableCell>
                            <TableCell>
                              <Badge variant={part.isActive ? "default" : "secondary"}>
                                {part.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-slate-900">-</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Unit of Measurement</Label>
                  <p className="text-slate-900">{asset.unitOfMeasurement || '-'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="size-5 text-blue-600" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-medium text-slate-600">Unit Value</Label>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(asset.unitValue)}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Date Acquired</Label>
                <p className="text-lg text-slate-900">{formatDate(asset.dateAcquired)}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Estimated Useful Life</Label>
                <p className="text-lg text-slate-900">{asset.estimatedUsefulLife} years</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accountability Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5 text-blue-600" />
              Accountability Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">PAR/ITR Number</Label>
                  <p className="text-slate-900">{asset.movements && asset.movements.length > 0 ? asset.movements[0].parItrNumber || '-' : '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Plantilla Employee ID</Label>
                  <p className="text-slate-900">{asset.movements && asset.movements.length > 0 ? asset.movements[0].plantillaEmployeeId || '-' : '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Non-Plantilla Employee ID</Label>
                  <p className="text-slate-900">{asset.movements && asset.movements.length > 0 ? asset.movements[0].nonPlantillaEmployeeId || '-' : '-'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Office</Label>
                  <p className="text-slate-900">{asset.movements && asset.movements.length > 0 ? asset.movements[0].office.name : '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Division</Label>
                  <p className="text-slate-900">{asset.movements && asset.movements.length > 0 ? asset.movements[0].division.name : '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Condition</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {asset.movements && asset.movements.length > 0 ? getConditionIcon(asset.movements[0].condition || '') : getConditionIcon('')}
                    {asset.movements && asset.movements.length > 0 ? getConditionBadge(asset.movements[0].condition || '') : getConditionBadge('')}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Date Assigned</Label>
                  <p className="text-slate-900">{asset.movements && asset.movements.length > 0 ? formatDate(asset.movements[0].dateAssigned) : '-'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


      </div>
    );
  }
}
