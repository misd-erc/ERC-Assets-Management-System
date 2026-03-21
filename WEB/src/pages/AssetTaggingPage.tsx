import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks';
import { UnifiedAssetService } from '@/services/UnifiedAssetService';
import { Asset } from '@/types/asset/UnifiedAsset';
import {
  TAG_TEMPLATES,
  TagTemplate,
  TaggableAsset,
  TagPreview,
  normalizeAssets,
  generateQRCode,
  generateBarcode,
} from '@/hooks/useAssetTagging';
import { CodeType } from '@/components/asset-tagging/TagConfigurationCard';
import { TagConfigurationCard } from '@/components/asset-tagging/TagConfigurationCard';
import { AssetSelectionCard } from '@/components/asset-tagging/AssetSelectionCard';
import { StatsRow } from '@/components/asset-tagging/StatsRow';
import { QuickStartGuide } from '@/components/asset-tagging/QuickStartGuide';
import { TagPreviewGrid } from '@/components/asset-tagging/TagPreviewGrid';

const logoSrc = '/images/erc-logo.png';

export default function AssetTaggingPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagTemplate, setTagTemplate] = useState<string>('standard');
  const [codeType, setCodeType] = useState<CodeType>('qr');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tagPreviews, setTagPreviews] = useState<TagPreview[]>([]);

  useEffect(() => {
    const loadAssets = async () => {
      setIsLoading(true);
      try {
        const response = await UnifiedAssetService.getAll({ PageNumber: 1, PageSize: 500 });
        setAssets(response.items || []);
      } catch (error) {
        console.error('Error loading assets for tagging:', error);
        toast.error('Failed to load assets for tagging');
      } finally {
        setIsLoading(false);
      }
    };

    loadAssets();
  }, []);

  const normalizedAssets = useMemo<TaggableAsset[]>(() => normalizeAssets(assets), [assets]);

  const filteredAssets = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return normalizedAssets.filter((asset) =>
      [asset.code, asset.description, asset.category, asset.location, asset.assignedTo]
        .some((field) => field.toLowerCase().includes(term))
    );
  }, [normalizedAssets, searchTerm]);

  const handleSelectAsset = (assetId: number) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAssets.length === filteredAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(filteredAssets.map((a) => a.id));
    }
  };

  const handleGenerateTags = async () => {
    if (selectedAssets.length === 0) {
      toast.error('Please select at least one asset');
      return;
    }

    setIsGenerating(true);

    try {
      const selected = normalizedAssets.filter((a) => selectedAssets.includes(a.id));
      const previews: TagPreview[] = [];

      for (const asset of selected) {
        let qrCode = '';
        let barcodeUrl = '';

        const codeData = asset.code || `ASSET-${asset.id}`;

        if (codeType === 'qr') {
          const qrData = JSON.stringify({
            code: asset.code,
            description: asset.description,
            category: asset.category,
            location: asset.location,
            group: asset.group,
          });
          qrCode = await generateQRCode(qrData);
        } else if (codeType === 'barcode') {
          barcodeUrl = generateBarcode(codeData);
        }

        previews.push({ ...asset, qrCode, barcodeUrl });
      }

      setTagPreviews(previews);

      toast.success(`Generated ${previews.length} asset tag(s)`);

      setTimeout(() => {
        window.print();
      }, 400);
    } catch (error) {
      console.error('Error generating tags:', error);
      toast.error('Failed to generate asset tags');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['Asset Code', 'Description', 'Category', 'Location', 'Assigned To', 'Type'];
    const csv = `${headers.join(',')}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'asset-tag-template.csv';
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Tag template downloaded');
  };

  const activeTemplate = (TAG_TEMPLATES.find((t) => t.id === tagTemplate) || TAG_TEMPLATES[0]) as TagTemplate;

  return (
    <div className="p-6 pt-20 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold">Asset Tag Generator</h2>
          <p className="text-muted-foreground">Generate QR-ready labels for PPE and SE assets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            Template
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <TagConfigurationCard
          tagTemplate={tagTemplate}
          tagTemplates={TAG_TEMPLATES}
          activeTemplate={activeTemplate}
          codeType={codeType}
          includeLogo={includeLogo}
          selectedCount={selectedAssets.length}
          isGenerating={isGenerating}
          isLoading={isLoading}
          onTemplateChange={setTagTemplate}
          onCodeTypeChange={setCodeType}
          onToggleLogo={setIncludeLogo}
          onGenerate={handleGenerateTags}
        />

        <AssetSelectionCard
          filteredAssets={filteredAssets}
          selectedAssets={selectedAssets}
          isLoading={isLoading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectAll={handleSelectAll}
          onToggleAsset={handleSelectAsset}
        />
      </div>

      <StatsRow
        totalAssets={normalizedAssets.length}
        ppeAssets={normalizedAssets.filter((a) => a.group === 'PPE').length}
        selected={selectedAssets.length}
        ready={tagPreviews.length}
      />

      <QuickStartGuide />

      <TagPreviewGrid
        tagPreviews={tagPreviews}
        includeQR={codeType === 'qr'}
        includeBarcode={codeType === 'barcode'}
        includeLogo={includeLogo}
        activeTemplate={activeTemplate}
        generatedBy={user || undefined}
        logoSrc={logoSrc}
      />

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 4mm; }
          .print-area .grid { gap: 6px !important; }
          @page { size: A4; margin: 8mm; }
        }
      `}</style>
    </div>
  );
}
