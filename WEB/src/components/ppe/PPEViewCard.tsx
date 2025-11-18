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
import { PPEAsset } from '@/types/asset/ppe';

interface PPEViewCardProps {
  ppeAsset: PPEAsset;
  onEdit: () => void;
  onClose: () => void;
}

export function PPEViewCard({ ppeAsset, onEdit, onClose }: PPEViewCardProps) {
  const getConditionBadge = (condition: string) => {
    const styles = {
      Working: 'bg-green-100 text-green-800 border-green-200',
      'Not Working': 'bg-red-100 text-red-800 border-red-200',
      IIRUP: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Disposed: 'bg-gray-100 text-gray-800 border-gray-200',
      Missing: 'bg-purple-100 text-purple-800 border-purple-200'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{ppeAsset.property_number}</h2>
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
                <p className="text-lg font-semibold text-slate-900">{ppeAsset.property_number}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Category</Label>
                <p className="text-slate-900">{ppeAsset.category}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Legend</Label>
                <p className="text-slate-900">{ppeAsset.legend}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Serial Number</Label>
                <p className="text-slate-900">{ppeAsset.serial_number}</p>
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
                <p className="text-slate-900">{ppeAsset.parts || '-'}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Unit of Measurement</Label>
                <p className="text-slate-900">{ppeAsset.unit_of_measurement}</p>
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
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(ppeAsset.unit_value)}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-600">Date Acquired</Label>
              <p className="text-lg text-slate-900">{formatDate(ppeAsset.date_acquired)}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-600">Estimated Useful Life</Label>
              <p className="text-lg text-slate-900">{ppeAsset.estimated_useful_life} years</p>
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
                <p className="text-slate-900">{ppeAsset.par_itr_number || '-'}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Plantilla Employee ID</Label>
                <p className="text-slate-900">{ppeAsset.plantilla_employee_id || '-'}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Non-Plantilla Employee ID</Label>
                <p className="text-slate-900">{ppeAsset.non_plantilla_employee_id || '-'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-600">Actual Division</Label>
                <p className="text-slate-900">{ppeAsset.actual_division || '-'}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Condition</Label>
                <div className="flex items-center gap-2 mt-1">
                  {getConditionIcon(ppeAsset.condition)}
                  {getConditionBadge(ppeAsset.condition)}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Date</Label>
                <p className="text-slate-900">{formatDate(ppeAsset.date)}</p>
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
                      <span className="font-medium">Division:</span> {entry.actual_division || '-'}
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
}


