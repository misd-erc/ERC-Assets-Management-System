import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { PPEViewCard } from '@/components/ppe/PPEViewCard';
import { PPEAsset } from '@/types/asset/PPEAsset';

const convertSnakeToCamel = (item: any): PPEAsset => {
  return {
    id: item.id,
    propertyNumber: item.property_number,
    category: item.category,
    legend: item.legend,
    description: item.description,
    brand: item.brand,
    model: item.model,
    serialNumber: item.serial_number,
    parts: Array.isArray(item.parts) ? item.parts : (item.parts ? JSON.parse(item.parts) : []),
    unitOfMeasurement: item.unit_of_measurement,
    unitValue: item.unit_value,
    dateAcquired: item.date_acquired,
    movements: item.movements || [],
    estimatedUsefulLife: item.estimated_useful_life,
    parItrNumber: item.par_itr_number,
    plantillaEmployeeId: item.plantilla_employee_id,
    nonPlantillaEmployeeId: item.non_plantilla_employee_id,
    actualDivision: item.actual_division,
    condition: item.condition,
    date: item.date,
    history: item.history,
    dateEncoded: item.dateEncoded,
  };
};
import { PPEService } from '@/services/ppeService';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';

export function PPEView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [ppeAsset, setPPEAsset] = useState<PPEAsset | null>(null);

  const setPPEAssetCamelCase = (item: any) => {
    setPPEAsset(item ? convertSnakeToCamel(item) : null);
  };
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPPEAsset(id);
    }
  }, [id]);

    const loadPPEAsset = async (assetId: string) => {
      try {
        setLoading(true);
        const asset = await PPEService.getById(assetId);
        setPPEAssetCamelCase(asset);
      } catch (error) {
        console.error('Error loading PPE asset:', error);
        toast.error('Failed to load PPE asset');
        navigate('/ppe');
      } finally {
        setLoading(false);
      }
    };

  const handleEdit = () => {
    if (ppeAsset) {
      navigate(`/ppe/${ppeAsset.id}/edit`);
    }
  };

  const handleClose = () => {
    navigate('/ppe');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading PPE asset...</p>
        </div>
      </div>
    );
  }

  if (!ppeAsset) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error</div>
          <p className="text-slate-600">PPE asset not found</p>
          <Button
            variant="outline"
            onClick={() => navigate('/ppe')}
            className="mt-4"
          >
            Back to PPE List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-20 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/ppe')}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back to PPE List
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">PPE Asset Details</h1>
            <p className="text-slate-600">View detailed information for {ppeAsset.propertyNumber}</p>
        </div>
        <Button onClick={handleEdit} className="gap-2">
          <Edit className="size-4" />
          Edit Asset
        </Button>
      </div>

      {/* PPE View Card */}
          <PPEViewCard
            ppeAsset={ppeAsset}
            onEdit={handleEdit}
            onClose={handleClose}
          />
    </div>
  );
}


