import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { UnifiedAssetService } from '@/services/UnifiedAssetService';
import { Asset } from '@/types/asset/UnifiedAsset';
import { PARGenerator } from '@/components/reports/PARGenerator';
import { ICSGenerator } from '@/components/reports/ICSGenerator';

export function ReportTab() {
  const [ppeAssets, setPpeAssets] = useState<Asset[]>([]);
  const [seAssets, setSeAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPpeAssets, setSelectedPpeAssets] = useState<Set<number>>(new Set());
  const [selectedSeAssets, setSelectedSeAssets] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);

      // Load PPE assets
      const ppeResponse = await UnifiedAssetService.getAll({
        group: 'PPE',
        PageNumber: 1,
        PageSize: 1000, // Load more for selection
      });
      setPpeAssets(ppeResponse.items);

      // Load SE assets
      const seResponse = await UnifiedAssetService.getAll({
        group: 'SE',
        PageNumber: 1,
        PageSize: 1000,
      });
      setSeAssets(seResponse.items);
    } catch (error) {
      console.error('Error loading assets for reports:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handlePpeAssetSelect = (assetId: number, checked: boolean) => {
    const newSelected = new Set(selectedPpeAssets);
    if (checked) {
      newSelected.add(assetId);
    } else {
      newSelected.delete(assetId);
    }
    setSelectedPpeAssets(newSelected);
  };

  const handleSeAssetSelect = (assetId: number, checked: boolean) => {
    const newSelected = new Set(selectedSeAssets);
    if (checked) {
      newSelected.add(assetId);
    } else {
      newSelected.delete(assetId);
    }
    setSelectedSeAssets(newSelected);
  };

  const handleSelectAllPpe = (checked: boolean) => {
    if (checked) {
      setSelectedPpeAssets(new Set(ppeAssets.map(asset => asset.id)));
    } else {
      setSelectedPpeAssets(new Set());
    }
  };

  const handleSelectAllSe = (checked: boolean) => {
    if (checked) {
      setSelectedSeAssets(new Set(seAssets.map(asset => asset.id)));
    } else {
      setSelectedSeAssets(new Set());
    }
  };

  const handleGeneratePAR = async () => {
    if (selectedPpeAssets.size === 0) {
      toast.error('Please select at least one PPE asset');
      return;
    }

    try {
      const selectedAssets = ppeAssets.filter(asset => selectedPpeAssets.has(asset.id));
      await PARGenerator.generatePAR(selectedAssets);
      toast.success('PAR PDF generated successfully');
    } catch (error) {
      console.error('Error generating PAR:', error);
      toast.error('Failed to generate PAR PDF');
    }
  };

  const handleGenerateICS = async () => {
    if (selectedSeAssets.size === 0) {
      toast.error('Please select at least one SE asset');
      return;
    }

    try {
      const selectedAssets = seAssets.filter(asset => selectedSeAssets.has(asset.id));
      await ICSGenerator.generateICS(selectedAssets);
      toast.success('ICS PDF generated successfully');
    } catch (error) {
      console.error('Error generating ICS:', error);
      toast.error('Failed to generate ICS PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* PAR Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Property Acknowledgement Receipt (PAR) - PPE Assets
          </CardTitle>
          <CardDescription>
            Generate PAR reports for selected PPE assets. Only PPE assets with valid movements and employee assignments will be included.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedPpeAssets.size === ppeAssets.length && ppeAssets.length > 0}
                onCheckedChange={handleSelectAllPpe}
              />
              <span className="text-sm font-medium">Select All ({ppeAssets.length} assets)</span>
            </div>
            <Button
              onClick={handleGeneratePAR}
              disabled={selectedPpeAssets.size === 0}
              className="gap-2"
            >
              <Download className="size-4" />
              Generate PAR PDF ({selectedPpeAssets.size} selected)
            </Button>
          </div>

          <div className="border rounded-lg max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Property Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Brand/Model</TableHead>
                  <TableHead>Condition</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ppeAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPpeAssets.has(asset.id)}
                        onCheckedChange={(checked) => handlePpeAssetSelect(asset.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>{asset.propertyNumber}</TableCell>
                    <TableCell>{asset.description}</TableCell>
                    <TableCell>{asset.serialNumber}</TableCell>
                    <TableCell>{asset.brand} {asset.model}</TableCell>
                    <TableCell>
                      <Badge variant={asset.movements?.[0]?.condition === 'Working' ? 'default' : 'secondary'}>
                        {asset.movements?.[0]?.condition || 'N/A'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ICS Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Inventory Custodian Slip (ICS) - SE Assets
          </CardTitle>
          <CardDescription>
            Generate ICS reports for selected SE assets. Only SE assets with valid movements and employee assignments will be included.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedSeAssets.size === seAssets.length && seAssets.length > 0}
                onCheckedChange={handleSelectAllSe}
              />
              <span className="text-sm font-medium">Select All ({seAssets.length} assets)</span>
            </div>
            <Button
              onClick={handleGenerateICS}
              disabled={selectedSeAssets.size === 0}
              className="gap-2"
            >
              <Download className="size-4" />
              Generate ICS PDF ({selectedSeAssets.size} selected)
            </Button>
          </div>

          <div className="border rounded-lg max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Property Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Brand/Model</TableHead>
                  <TableHead>Condition</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedSeAssets.has(asset.id)}
                        onCheckedChange={(checked) => handleSeAssetSelect(asset.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>{asset.propertyNumber}</TableCell>
                    <TableCell>{asset.description}</TableCell>
                    <TableCell>{asset.serialNumber}</TableCell>
                    <TableCell>{asset.brand} {asset.model}</TableCell>
                    <TableCell>
                      <Badge variant={asset.movements?.[0]?.condition === 'Working' ? 'default' : 'secondary'}>
                        {asset.movements?.[0]?.condition || 'N/A'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
