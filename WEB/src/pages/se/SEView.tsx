import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { SEViewCard } from '@/components/se/SEViewCard';
import { SEAsset } from '@/types/supply/se';
import { SEService } from '@/services/seService';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';

export function SEView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [seAsset, setSEAsset] = useState<SEAsset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSEAsset(id);
    }
  }, [id]);

  const loadSEAsset = async (assetId: string) => {
    try {
      setLoading(true);
      const asset = await SEService.getById(assetId);
      setSEAsset(asset);
    } catch (error) {
      console.error('Error loading SE asset:', error);
      toast.error('Failed to load SE asset');
      navigate('/se');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (seAsset) {
      navigate(`/se/${seAsset.id}/edit`);
    }
  };

  const handleClose = () => {
    navigate('/se');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading SE asset...</p>
        </div>
      </div>
    );
  }

  if (!seAsset) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error</div>
          <p className="text-slate-600">SE asset not found</p>
          <Button
            variant="outline"
            onClick={() => navigate('/se')}
            className="mt-4"
          >
            Back to SE List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/se')}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back to SE List
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">SE Asset Details</h1>
          <p className="text-slate-600">View detailed information for {seAsset.se_property_number}</p>
        </div>
        <Button onClick={handleEdit} className="gap-2">
          <Edit className="size-4" />
          Edit Asset
        </Button>
      </div>

      {/* SE View Card */}
      <SEViewCard
        seAsset={seAsset}
        onEdit={handleEdit}
        onClose={handleClose}
      />
    </div>
  );
}


