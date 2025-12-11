import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { FileText, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { UnifiedAssetService } from '@/services/UnifiedAssetService';
import { Asset, NormalizedEmployee } from '@/types/asset/UnifiedAsset';
import { PARGenerator } from '@/components/assets/reports/PARGenerator';
import { ICSGenerator } from '@/components/assets/reports/ICSGenerator';
import { ReportPreviewModal } from '@/components/assets/reports/ReportPreviewModal';
import { getEmployees } from '@/api/user-management/userApi';

export function ReportTab() {
  const [ppeAssets, setPpeAssets] = useState<Asset[]>([]);
  const [seAssets, setSeAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPpeAssets, setSelectedPpeAssets] = useState<Set<number>>(new Set());
  const [selectedSeAssets, setSelectedSeAssets] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [currentPagePpe, setCurrentPagePpe] = useState(1);
  const [currentPageSe, setCurrentPageSe] = useState(1);
  const pageSize = 10;

  // Preview modal state
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewType, setPreviewType] = useState<'PAR' | 'ICS'>('PAR');
  const [previewAssets, setPreviewAssets] = useState<Asset[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Employees state
  const [employees, setEmployees] = useState<NormalizedEmployee[]>([]);

  useEffect(() => {
    loadAssets();
    fetchEmployees();
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

  const fetchEmployees = async () => {
    try {
      const response = await getEmployees();
      const normalizedEmployees = response.data.items.map(normalizeEmployee);
      setEmployees(normalizedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  function normalizeEmployee(e: any): NormalizedEmployee {
    const firstName = e.firstName ?? "";
    const middleName = e.middleName ?? "";
    const lastName = e.lastName ?? "";
    const suffixName = e.suffixName ?? "";
    const employeeIdOriginal = e.employeeIdOriginal ?? "";
    const employmentTypeId = e.employmentType?.id ?? 1;
    const employmentTypeName = employmentTypeId === 1 ? 'Plantilla' : 'Non-Plantilla';

    const label = `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ''}${suffixName ? ` ${suffixName}` : ''}${employeeIdOriginal ? ` — ${employeeIdOriginal}` : ''} (${employmentTypeName})`;

    return {
      id: e.id,
      firstName,
      middleName,
      lastName,
      suffixName,
      employeeIdOriginal,
      employmentTypeId,
      label,
    };
  }

  const getEmployeeName = (asset: Asset): string => {
    if (asset.movements && asset.movements.length > 0) {
      const latestMovement = asset.movements.sort((a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime())[0];
      const employeeId = latestMovement.plantillaEmployeeId || latestMovement.nonPlantillaEmployeeId;
      if (employeeId) {
        const employee = employees.find(e => e.id === employeeId);
        return employee ? employee.label : 'Unknown Employee';
      }
    }
    return 'N/A';
  };

  const getAssetDate = (asset: Asset): Date => {
    if (asset.movements && asset.movements.length > 0) {
      const latestMovement = asset.movements.sort((a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime())[0];
      return new Date(latestMovement.dateAssigned);
    }
    return new Date(asset.dateAcquired);
  };

  const filterAssets = (assets: Asset[]): Asset[] => {
    return assets.filter(asset => {
      const matchesSearch = searchTerm === '' ||
        asset.propertyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.model.toLowerCase().includes(searchTerm.toLowerCase());

      const assetDate = getAssetDate(asset);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      let matchesDate = true;
      if (start && end) {
        matchesDate = assetDate >= start && assetDate <= end;
      } else if (start) {
        matchesDate = assetDate >= start;
      } else if (end) {
        matchesDate = assetDate <= end;
      }

      return matchesSearch && matchesDate;
    });
  };

  const filteredPpeAssets = filterAssets(ppeAssets);
  const filteredSeAssets = filterAssets(seAssets);

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
      setSelectedPpeAssets(new Set(filteredPpeAssets.map(asset => asset.id)));
    } else {
      setSelectedPpeAssets(new Set());
    }
  };

  const handleSelectAllSe = (checked: boolean) => {
    if (checked) {
      setSelectedSeAssets(new Set(filteredSeAssets.map(asset => asset.id)));
    } else {
      setSelectedSeAssets(new Set());
    }
  };

  const handlePreviewPAR = async () => {
    if (selectedPpeAssets.size === 0) {
      toast.error('Please select at least one PPE asset');
      return;
    }

    try {
      setIsPreviewLoading(true);
      const selectedAssets = ppeAssets.filter(asset => selectedPpeAssets.has(asset.id));
      const url = await PARGenerator.generatePARPreview(selectedAssets);
      setPreviewUrl(url);
      setPreviewType('PAR');
      setPreviewAssets(selectedAssets);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error generating PAR preview:', error);
      toast.error('Failed to generate PAR preview');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handlePreviewICS = async () => {
    if (selectedSeAssets.size === 0) {
      toast.error('Please select at least one SE asset');
      return;
    }

    try {
      setIsPreviewLoading(true);
      const selectedAssets = seAssets.filter(asset => selectedSeAssets.has(asset.id));
      const url = await ICSGenerator.generateICSPreview(selectedAssets);
      setPreviewUrl(url);
      setPreviewType('ICS');
      setPreviewAssets(selectedAssets);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error generating ICS preview:', error);
      toast.error('Failed to generate ICS preview');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleConfirmDownload = async () => {
    try {
      if (previewType === 'PAR') {
        await PARGenerator.generatePAR(previewAssets);
        toast.success('PAR PDF downloaded successfully');
      } else {
        await ICSGenerator.generateICS(previewAssets);
        toast.success('ICS PDF downloaded successfully');
      }
      handleClosePreview();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setPreviewAssets([]);
    setIsPreviewOpen(false);
  };

  const handleClearDates = () => {
    setStartDate('');
    setEndDate('');
    setDateError('');
    setCurrentPagePpe(1);
    setCurrentPageSe(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPagePpe(1);
    setCurrentPageSe(1);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setCurrentPagePpe(1);
    setCurrentPageSe(1);
    if (value && endDate && new Date(value) > new Date(endDate)) {
      setDateError('Start date cannot be after end date');
    } else {
      setDateError('');
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setCurrentPagePpe(1);
    setCurrentPageSe(1);
    if (startDate && value && new Date(startDate) > new Date(value)) {
      setDateError('End date cannot be before start date');
    } else {
      setDateError('');
    }
  };

  const paginatedPpeAssets = filteredPpeAssets.slice((currentPagePpe - 1) * pageSize, currentPagePpe * pageSize);
  const paginatedSeAssets = filteredSeAssets.slice((currentPageSe - 1) * pageSize, currentPageSe * pageSize);

  const totalPagesPpe = Math.ceil(filteredPpeAssets.length / pageSize);
  const totalPagesSe = Math.ceil(filteredSeAssets.length / pageSize);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <label className="text-sm font-medium mb-2 block">Search Assets</label>
              <Input
                placeholder="Search by property number, description, serial number, brand, model..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleClearDates}>
              Clear Dates
            </Button>
          </div>
          {dateError && (
            <p className="text-red-500 text-sm mt-2">{dateError}</p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="ppe" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ppe">PPE Reports</TabsTrigger>
          <TabsTrigger value="se">SE Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="ppe" className="space-y-6">
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
                    checked={selectedPpeAssets.size === filteredPpeAssets.length && filteredPpeAssets.length > 0}
                    onCheckedChange={handleSelectAllPpe}
                  />
                  <span className="text-sm font-medium">Select All ({filteredPpeAssets.length} assets)</span>
                </div>
                <Button
                  onClick={handlePreviewPAR}
                  disabled={selectedPpeAssets.size === 0 || isPreviewLoading}
                  className="gap-2"
                >
                  <Eye className="size-4" />
                  Preview PAR ({selectedPpeAssets.size} selected)
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading assets...</p>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Property Number</TableHead>
                        <TableHead>Employee Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Brand/Model</TableHead>
                        <TableHead>Condition</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPpeAssets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedPpeAssets.has(asset.id)}
                              onCheckedChange={(checked) => handlePpeAssetSelect(asset.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>{asset.propertyNumber}</TableCell>
                          <TableCell>{getEmployeeName(asset)}</TableCell>
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
              )}

              {totalPagesPpe > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPagePpe - 1) * pageSize) + 1} to {Math.min(currentPagePpe * pageSize, filteredPpeAssets.length)} of {filteredPpeAssets.length} assets
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPagePpe(currentPagePpe - 1)}
                      disabled={currentPagePpe === 1}
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPagePpe} of {totalPagesPpe}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPagePpe(currentPagePpe + 1)}
                      disabled={currentPagePpe === totalPagesPpe}
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="se" className="space-y-6">
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
                    checked={selectedSeAssets.size === filteredSeAssets.length && filteredSeAssets.length > 0}
                    onCheckedChange={handleSelectAllSe}
                  />
                  <span className="text-sm font-medium">Select All ({filteredSeAssets.length} assets)</span>
                </div>
                <Button
                  onClick={handlePreviewICS}
                  disabled={selectedSeAssets.size === 0 || isPreviewLoading}
                  className="gap-2"
                >
                  <Eye className="size-4" />
                  Preview ICS ({selectedSeAssets.size} selected)
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading assets...</p>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Property Number</TableHead>
                        <TableHead>Employee Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Brand/Model</TableHead>
                        <TableHead>Condition</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSeAssets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSeAssets.has(asset.id)}
                              onCheckedChange={(checked) => handleSeAssetSelect(asset.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>{asset.propertyNumber}</TableCell>
                          <TableCell>{getEmployeeName(asset)}</TableCell>
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
              )}

              {totalPagesSe > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPageSe - 1) * pageSize) + 1} to {Math.min(currentPageSe * pageSize, filteredSeAssets.length)} of {filteredSeAssets.length} assets
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPageSe(currentPageSe - 1)}
                      disabled={currentPageSe === 1}
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPageSe} of {totalPagesSe}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPageSe(currentPageSe + 1)}
                      disabled={currentPageSe === totalPagesSe}
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ReportPreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        onConfirm={handleConfirmDownload}
        pdfUrl={previewUrl}
        reportType={previewType}
        isLoading={isPreviewLoading}
      />
    </div>
  );
}
