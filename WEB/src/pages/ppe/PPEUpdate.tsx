import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PPEForm } from '@/components/ppe/PPEForm';
import { PPEAsset } from '@/types/asset/ppe';
import { PPEService } from '@/services/ppeService';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';

export function PPEUpdate() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [ppeAsset, setPPEAsset] = useState<PPEAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadPPEAsset(id);
    }
  }, [id]);

  const loadPPEAsset = async (assetId: string) => {
    try {
      setLoading(true);
      const asset = await PPEService.getById(assetId);
      setPPEAsset(asset);
    } catch (error) {
      console.error('Error loading PPE asset:', error);
      toast.error('Failed to load PPE asset');
      navigate('/ppe');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Omit<PPEAsset, 'id' | 'dateEncoded' | 'history'>) => {
    if (!ppeAsset) return;

    try {
      setIsSubmitting(true);
      await PPEService.update(ppeAsset.id, data);
      toast.success('PPE asset updated successfully');
      navigate(`/ppe/${ppeAsset.id}`);
    } catch (error) {
      console.error('Error updating PPE asset:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update PPE asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (ppeAsset) {
      navigate(`/ppe/${ppeAsset.id}`);
    } else {
      navigate('/ppe');
    }
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
          onClick={() => navigate(ppeAsset ? `/ppe/${ppeAsset.id}` : '/ppe')}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back to PPE Details
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit PPE Asset</h1>
          <p className="text-slate-600">Update information for {ppeAsset.property_number}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>PPE Asset Information</CardTitle>
          <CardDescription>
            Modify the details below to update the PPE asset record.
            All required fields are marked with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PPEForm
            ppeAsset={ppeAsset}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={true}
          />
        </CardContent>
      </Card>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-slate-600">Updating PPE asset...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


