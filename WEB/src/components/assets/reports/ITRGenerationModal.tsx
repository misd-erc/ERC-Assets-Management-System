import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Asset } from '@/types/asset/UnifiedAsset';
import { UnifiedAssetService } from '@/services/UnifiedAssetService';
import { ITRGenerator } from './ITRGenerator';
import { ReportPreviewModal } from './ReportPreviewModal';
import { Search } from 'lucide-react';

interface ITRGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ITRGenerationModal({ isOpen, onClose }: ITRGenerationModalProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      resetModal();
      fetchAssets();
    }
  }, [isOpen]);

  const resetModal = () => {
    setSelectedAsset(null);
    setPreviewUrl('');
    setShowPreview(false);
    setSearchTerm('');
  };

  const fetchAssets = async () => {
    setLoadingAssets(true);
    try {
      const ppeAssets = await UnifiedAssetService.getAll({ group: 'PPE' });
      const seAssets = await UnifiedAssetService.getAll({ group: 'SE' });
      setAssets([...ppeAssets.items, ...seAssets.items]);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      setAssets([]);
    }
    setLoadingAssets(false);
  };

  const handleAssetSelect = async (asset: Asset) => {
    setSelectedAsset(asset);
    setLoadingPreview(true);
    try {
      const url = await ITRGenerator.generateITRPreview(asset);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
    setLoadingPreview(false);
  };

  const handleConfirm = async () => {
    if (!selectedAsset) return;
    try {
      await ITRGenerator.generateITR(selectedAsset);
      onClose();
    } catch (error) {
      console.error('Failed to generate ITR:', error);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate ITR</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {!selectedAsset ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Select Asset</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name or property number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {loadingAssets ? (
                  <div>Loading assets...</div>
                ) : assets.length === 0 ? (
                  <div>No assets found</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {assets
                      .filter(asset =>
                        asset.propertyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        asset.description.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map(asset => (
                        <button
                          key={asset.id}
                          onClick={() => handleAssetSelect(asset)}
                          className="p-3 text-left border rounded hover:bg-gray-50"
                        >
                          {asset.propertyNumber} - {asset.description}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Preview ITR</h3>
                <p className="text-sm text-gray-600">
                  Asset: {selectedAsset.propertyNumber} - {selectedAsset.description}
                </p>
                {loadingPreview ? (
                  <div>Generating preview...</div>
                ) : (
                  <Button onClick={() => setShowPreview(true)}>View Preview</Button>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {selectedAsset && (
              <Button onClick={handleConfirm} className="ml-2">
                Generate ITR
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ReportPreviewModal
        isOpen={showPreview}
        pdfUrl={previewUrl}
        reportType="ITR"
        isLoading={loadingPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
