import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
import { AssetType } from '@/services/assetService';

interface AssetsViewCardProps {
  type: AssetType;
  asset: PPEAsset | SEAsset;
  onEdit: () => void;
  onClose: () => void;
}

export function AssetsViewCard({ type, asset, onEdit, onClose }: AssetsViewCardProps) {
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

  if (type === 'ppe') {
    const ppeAsset = asset as PPEAsset;
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
    const seAsset = asset as SEAsset;
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{seAsset.se_property_number}</h2>
            <p className="text-slate-600">{seAsset.description}</p>
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
                  <Label className="text-sm font-medium text-slate-600">SE Property Number</Label>
                  <p className="text-lg font-semibold text-slate-900">{seAsset.se_property_number}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Category</Label>
                  <p className="text-slate-900">{seAsset.category || '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Serial Number</Label>
                  <p className="text-slate-900">{seAsset.serial_number || '-'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Brand</Label>
                  <p className="text-slate-900">{seAsset.brand || '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Model</Label>
                  <p className="text-slate-900">{seAsset.model || '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Unit Value</Label>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(seAsset.unit_value)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Label className="text-sm font-medium text-slate-600">Date Acquired</Label>
              <p className="text-lg text-slate-900">{seAsset.date_acquired ? formatDate(seAsset.date_acquired) : '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Current Holder */}
        {seAsset.accountabilityBlocks && seAsset.accountabilityBlocks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5 text-blue-600" />
                Current Holder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Plantilla Employee ID</Label>
                    <p className="text-slate-900">{seAsset.accountabilityBlocks[0].plantilla_employee_id || '-'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-600">Non-Plantilla Employee ID</Label>
                    <p className="text-slate-900">{seAsset.accountabilityBlocks[0].non_plantilla_employee_id || '-'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Division/Section</Label>
                    <p className="text-slate-900">{seAsset.accountabilityBlocks[0].division_section || '-'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-600">Condition</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getConditionIcon(seAsset.accountabilityBlocks[0].condition)}
                      {getConditionBadge(seAsset.accountabilityBlocks[0].condition)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-600">Date Issued/Returned</Label>
                    <p className="text-slate-900">{seAsset.accountabilityBlocks[0].date_issued_returned ? formatDate(seAsset.accountabilityBlocks[0].date_issued_returned) : '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Movement History */}
        {seAsset.movementHistory && seAsset.movementHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-5 text-blue-600" />
                Movement History
              </CardTitle>
              <CardDescription>Previous transfers and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {seAsset.movementHistory.map((entry, index) => (
                  <div key={entry.id} className="border-l-2 border-blue-200 pl-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="size-4 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {formatDate(entry.date)}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-900">
                        <span className="font-medium">From:</span> {entry.from_employee || '-'}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-medium">To:</span> {entry.to_employee || '-'}
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

        {/* RRSP History */}
        {seAsset.rrspHistory && seAsset.rrspHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-5 text-blue-600" />
                RRSP History
              </CardTitle>
              <CardDescription>Return and Repair Service Procedure records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {seAsset.rrspHistory.map((entry, index) => (
                  <div key={entry.id} className="border-l-2 border-blue-200 pl-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="size-4 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {formatDate(entry.date_returned)}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-900">
                        <span className="font-medium">RRSP Number:</span> {entry.rrsp_number}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-medium">Employee Returning:</span> {entry.employee_returning}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-slate-600 font-medium">Condition on Return:</span>
                        {getConditionBadge(entry.condition_on_return)}
                      </div>
                      {entry.findings && (
                        <p className="text-slate-500 italic mt-2">{entry.findings}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
}
