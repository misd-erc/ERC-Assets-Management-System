import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks';
import { UnifiedAssetService } from '@/services/UnifiedAssetService';
import {
  TAG_TEMPLATES,
  TagTemplate,
  TaggableAsset,
  TagPreview,
  normalizeAssets,
  generateQRCode,
} from '@/hooks/useAssetTagging';
import { TagConfigurationCard } from '@/components/asset-tagging/TagConfigurationCard';
import { AssetSelectionCard } from '@/components/asset-tagging/AssetSelectionCard';
import { StatsRow } from '@/components/asset-tagging/StatsRow';
import { QuickStartGuide } from '@/components/asset-tagging/QuickStartGuide';
import { TagPreviewGrid } from '@/components/asset-tagging/TagPreviewGrid';

const logoSrc = '/images/erc-logo.png';

export default function AssetTaggingPage() {
  const { user } = useAuth();

  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  // Cache asset details for selected items (persists across page navigation)
  const selectedDetailsRef = useRef<Map<number, TaggableAsset>>(new Map());

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [tagTemplate, setTagTemplate] = useState<string>('standard');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tagPreviews, setTagPreviews] = useState<TagPreview[]>([]);

  // PPE pagination
  const [ppeItems, setPpeItems] = useState<TaggableAsset[]>([]);
  const [ppePage, setPpePage] = useState(1);
  const [ppePageSize, setPpePageSize] = useState(10);
  const [ppeTotalCount, setPpeTotalCount] = useState(0);
  const [isPpeLoading, setIsPpeLoading] = useState(true);

  // SE pagination
  const [seItems, setSeItems] = useState<TaggableAsset[]>([]);
  const [seePage, setSeePage] = useState(1);
  const [sePageSize, setSePageSize] = useState(10);
  const [seTotalCount, setSeTotalCount] = useState(0);
  const [isSeLoading, setIsSeLoading] = useState(true);

  // Debounce search → reset both pages to 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPpePage(1);
      setSeePage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch PPE
  useEffect(() => {
    const fetch = async () => {
      setIsPpeLoading(true);
      try {
        const res = await UnifiedAssetService.getAll({
          group: 'PPE',
          search: debouncedSearch || undefined,
          PageNumber: ppePage,
          PageSize: ppePageSize,
        });
        setPpeItems(normalizeAssets(res.items || []));
        setPpeTotalCount(res.totalCount);
      } catch {}
      finally { setIsPpeLoading(false); }
    };
    fetch();
  }, [ppePage, ppePageSize, debouncedSearch]);

  // Fetch SE
  useEffect(() => {
    const fetch = async () => {
      setIsSeLoading(true);
      try {
        const res = await UnifiedAssetService.getAll({
          group: 'SE',
          search: debouncedSearch || undefined,
          PageNumber: seePage,
          PageSize: sePageSize,
        });
        setSeItems(normalizeAssets(res.items || []));
        setSeTotalCount(res.totalCount);
      } catch {}
      finally { setIsSeLoading(false); }
    };
    fetch();
  }, [seePage, sePageSize, debouncedSearch]);

  const handleToggleAsset = (asset: TaggableAsset) => {
    setSelectedAssets((prev) => {
      if (prev.includes(asset.id)) {
        selectedDetailsRef.current.delete(asset.id);
        return prev.filter((id) => id !== asset.id);
      }
      selectedDetailsRef.current.set(asset.id, asset);
      return [...prev, asset.id];
    });
  };

  const handleSelectAll = (items: TaggableAsset[]) => {
    const ids = items.map((a) => a.id);
    const allSelected = ids.every((id) => selectedAssets.includes(id));
    if (allSelected) {
      ids.forEach((id) => selectedDetailsRef.current.delete(id));
      setSelectedAssets((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      items.forEach((a) => selectedDetailsRef.current.set(a.id, a));
      setSelectedAssets((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const handleGenerateTags = async () => {
    if (selectedAssets.length === 0) {
      toast.error('Please select at least one asset');
      return;
    }

    setIsGenerating(true);

    try {
      const selected = Array.from(selectedDetailsRef.current.values()).filter((a) =>
        selectedAssets.includes(a.id)
      );
      const previews: TagPreview[] = [];

      for (const asset of selected) {
        const assetUrl = `${window.location.origin}/asset-info/${asset.id}`;
        const qrCode = await generateQRCode(assetUrl);
        previews.push({ ...asset, qrCode });
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



  const activeTemplate = (TAG_TEMPLATES.find((t) => t.id === tagTemplate) || TAG_TEMPLATES[0]) as TagTemplate;

  return (
    <div className="p-2 pt-5 md:pt-20 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold">Asset Tag Generator</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Generate QR-ready labels for PPE and SE assets</p>
        </div>
        <div className="flex gap-2">
         
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
        <TagConfigurationCard
          tagTemplate={tagTemplate}
          tagTemplates={TAG_TEMPLATES}
          activeTemplate={activeTemplate}
          includeLogo={includeLogo}
          selectedCount={selectedAssets.length}
          isGenerating={isGenerating}
          isLoading={isPpeLoading || isSeLoading}
          onTemplateChange={setTagTemplate}
          onToggleLogo={setIncludeLogo}
          onGenerate={handleGenerateTags}
        />

        <AssetSelectionCard
          ppeItems={ppeItems}
          seItems={seItems}
          ppePage={ppePage}
          ppePageSize={ppePageSize}
          ppeTotalCount={ppeTotalCount}
          sePage={seePage}
          sePageSize={sePageSize}
          seTotalCount={seTotalCount}
          onPpePageChange={setPpePage}
          onPpePageSizeChange={(s) => { setPpePageSize(s); setPpePage(1); }}
          onSePageChange={setSeePage}
          onSePageSizeChange={(s) => { setSePageSize(s); setSeePage(1); }}
          selectedAssets={selectedAssets}
          isPpeLoading={isPpeLoading}
          isSeLoading={isSeLoading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectAll={handleSelectAll}
          onToggleAsset={handleToggleAsset}
        />
      </div>

      <StatsRow
        totalAssets={ppeTotalCount + seTotalCount}
        ppeAssets={ppeTotalCount}
        seAssets={seTotalCount}
        selected={selectedAssets.length}
        ready={tagPreviews.length}
      />

      <QuickStartGuide />

      <TagPreviewGrid
        tagPreviews={tagPreviews}
        includeQR={true}
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
