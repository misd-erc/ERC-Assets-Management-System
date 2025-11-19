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
  Clock,
  FileText,
  Camera
} from 'lucide-react';
import { SEAsset } from '@/types/supply/se';

interface SEViewCardProps {
  seAsset: SEAsset;
  onEdit: () => void;
  onClose: () => void;
}

export function SEViewCard({ seAsset, onEdit, onClose }: SEViewCardProps) {
  const getConditionBadge = (condition: string) => {
    const styles = {
      Working: 'bg-green-100 text-green-800 border-green-200',
      'Not Working': 'bg-red-100 text-red-800 border-red-200',
      'For Repair': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Lost: 'bg-purple-100 text-purple-800 border-purple-200',
      Unserviceable: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return (
      <Badge variant="outline" className={styles[condition as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
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

  const getWarrantyBadge = (warranty: string) => {
    const styles = {
      'In Warranty': 'bg-green-100 text-green-800 border-green-200',
      Expired: 'bg-red-100 text-red-800 border-red-200',
      Unknown: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return (
      <Badge variant="outline" className={styles[warranty as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        {warranty}
      </Badge>
    );
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'Working':
        return <CheckCircle className="size-4 text-green-600" />;
      case 'Not Working':
        return <XCircle className="size-4 text-red-600" />;
      case 'For Repair':
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

  const getCurrentHolder = () => {
    return seAsset.accountabilityBlocks.find(b => b.label === 'Current Holder');
  };

  const getPreviousHolders = () => {
    return seAsset.accountabilityBlocks.filter(b => b.label !== 'Current Holder');
  };

  const currentHolder = getCurrentHolder();
  const previousHolders = getPreviousHolders();

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
                <p className="text-slate-900">{seAsset.category}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Legend</Label>
                <p className="text-slate-900">{seAsset.legend}</p>
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
                <Label className="text-sm font-medium text-slate-600">Parts/Accessories</Label>
                <p className="text-slate-900">{seAsset.parts_accessories || '-'}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Unit of Measurement</Label>
                <p className="text-slate-900">{seAsset.unit_of_measurement}</p>
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
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(seAsset.unit_value)}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-600">Date Acquired</Label>
              <p className="text-lg text-slate-900">{formatDate(seAsset.date_acquired)}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-600">Warranty Status</Label>
              <div className="mt-1">
                {getWarrantyBadge(seAsset.warranty_status)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Accountability */}
      {currentHolder && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5 text-blue-600" />
              Current Accountability
            </CardTitle>
            <CardDescription>Current holder and assignment details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">ITR/RRSP Number</Label>
                  <p className="text-slate-900">{currentHolder.itr_rrsp_number || '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Plantilla Employee ID</Label>
                  <p className="text-slate-900">{currentHolder.plantilla_employee_id || '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Non-Plantilla Employee ID</Label>
                  <p className="text-slate-900">{currentHolder.non_plantilla_employee_id || '-'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Division/Section</Label>
                  <p className="text-slate-900">{currentHolder.division_section || '-'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Condition</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getConditionIcon(currentHolder.condition)}
                    {getConditionBadge(currentHolder.condition)}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-600">Date Issued</Label>
                  <p className="text-slate-900">{formatDate(currentHolder.date_issued_returned)}</p>
                </div>
              </div>
            </div>

            {currentHolder.remarks && (
              <div className="mt-4">
                <Label className="text-sm font-medium text-slate-600">Remarks</Label>
                <p className="text-slate-600 mt-1">{currentHolder.remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Accountability History */}
      {previousHolders.length > 0 && (
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
              {previousHolders.map((holder, index) => (
                <div key={holder.id} className="border-l-2 border-blue-200 pl-4 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{holder.label}</Badge>
                    {holder.type && (
                      <Badge variant="outline">{holder.type}</Badge>
                    )}
                    <Calendar className="size-4 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {formatDate(holder.date_issued_returned)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-900">
                      <span className="font-medium">ITR/RRSP:</span> {holder.itr_rrsp_number || '-'}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium">Employee:</span> {holder.plantilla_employee_id || holder.non_plantilla_employee_id || '-'}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium">Division:</span> {holder.division_section || '-'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-slate-600 font-medium">Condition:</span>
                      {getConditionBadge(holder.condition)}
                    </div>
                    {holder.remarks && (
                      <p className="text-slate-500 italic mt-2">{holder.remarks}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Movement History */}
      {seAsset.movementHistory && seAsset.movementHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5 text-blue-600" />
              Movement History
            </CardTitle>
            <CardDescription>Record of all movements and transfers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {seAsset.movementHistory.map((movement, index) => (
                <div key={movement.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{movement.type}</Badge>
                    <span className="text-sm text-slate-600">{formatDate(movement.date)}</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-900">
                      <span className="font-medium">From:</span> {movement.from_employee || 'N/A'}
                    </p>
                    <p className="text-slate-900">
                      <span className="font-medium">To:</span> {movement.to_employee}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium">Condition:</span> {movement.condition}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium">Document:</span> {movement.documentNumber}
                    </p>
                    {movement.remarks && (
                      <p className="text-slate-500 italic mt-2">{movement.remarks}</p>
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
              <Camera className="size-5 text-blue-600" />
              RRSP History
            </CardTitle>
            <CardDescription>Return and inspection records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {seAsset.rrspHistory.map((rrsp, index) => (
                <div key={rrsp.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">RRSP-{rrsp.rrsp_number}</Badge>
                    <span className="text-sm text-slate-600">{formatDate(rrsp.date_returned)}</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-900">
                      <span className="font-medium">Returned by:</span> {rrsp.employee_returning}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium">Condition on Return:</span> {rrsp.condition_on_return}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium">Verified by:</span> {rrsp.verified_by}
                    </p>
                    <div className="mt-2">
                      <Label className="text-sm font-medium text-slate-600">Findings</Label>
                      <p className="text-slate-600 mt-1">{rrsp.findings}</p>
                    </div>
                    {rrsp.photos && rrsp.photos.length > 0 && (
                      <div className="mt-2">
                        <Label className="text-sm font-medium text-slate-600">Photos</Label>
                        <p className="text-slate-500 text-sm mt-1">{rrsp.photos.length} photo(s) attached</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status and Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-slate-600">Status</Label>
              <div className="mt-1">
                {getStatusBadge(seAsset.status)}
              </div>
            </div>
            <div className="text-right">
              <Label className="text-sm font-medium text-slate-600">Encoded on</Label>
              <p className="text-sm text-slate-500">{formatDate(seAsset.dateEncoded)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


