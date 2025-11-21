import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SEForm } from '@/components/se/SEForm';
import { SEAsset } from '@/types/supply/se';
import { SEService } from '@/services/seService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function SECreate() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Omit<SEAsset, 'id' | 'dateEncoded' | 'movementHistory' | 'rrspHistory'>) => {
    try {
      setIsSubmitting(true);
      const dataWithHistory = { ...data, movementHistory: [], rrspHistory: [] };
      await SEService.create(dataWithHistory);
      toast.success('SE asset created successfully');
      navigate('/se');
    } catch (error) {
      console.error('Error creating SE asset:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create SE asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/se');
  };

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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New SE Asset</h1>
          <p className="text-slate-600">Create a new Semi-Expendable asset record</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>SE Asset Information</CardTitle>
          <CardDescription>
            Fill in the details below to add a new SE asset to the system.
            All required fields are marked with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SEForm
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
              <p className="text-slate-600">Creating SE asset...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


