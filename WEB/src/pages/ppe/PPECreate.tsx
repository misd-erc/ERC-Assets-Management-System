import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PPEForm } from '@/components/ppe/PPEForm';
import { PPEAsset } from '@/types/asset/PPEAsset';
import { PPEService } from '@/services/ppeService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function PPECreate() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Omit<PPEAsset, 'id' | 'dateEncoded'>) => {
    try {
      setIsSubmitting(true);
      await PPEService.create(data);
      toast.success('PPE asset created successfully');
      navigate('/ppe');
    } catch (error) {
      console.error('Error creating PPE asset:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create PPE asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/ppe');
  };

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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New PPE Asset</h1>
          <p className="text-slate-600">Create a new Property, Plant, and Equipment asset record</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>PPE Asset Information</CardTitle>
          <CardDescription>
            Fill in the details below to add a new PPE asset to the system.
            All required fields are marked with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PPEForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={false}
          />
        </CardContent>
      </Card>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-slate-600">Creating PPE asset...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


