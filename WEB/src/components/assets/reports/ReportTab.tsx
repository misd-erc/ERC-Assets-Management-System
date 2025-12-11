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
import ReactSelect from 'react-select';


export function ReportTab() {
  const [ppeAssets, setPpeAssets] = useState<Asset[]>([]);
  const [seAssets, setSeAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPpeAssets, setSelectedPpeAssets] = useState<Set<number>>(new Set());
  const [selectedSeAssets, setSelectedSeAssets] = useState<Set<number>>(new Set());
  const [selectedPpeEmployeeId, setSelectedPpeEmployeeId] = useState<number | null>(null);
  const [selectedSeEmployeeId, setSelectedSeEmployeeId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<{ value: string; label: string } | null>(null);


  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [currentPagePpe, setCurrentPagePpe] = useState(1);
  const [currentPageSe, setCurrentPageSe] = useState(1);
  const [totalPpeAssets, setTotalPpeAssets] = useState(0);
  const [totalSeAssets, setTotalSeAssets] = useState(0);
  const [pageSize, setPageSize] = useState(10);

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

  useEffect(() => {
    loadPpeAssets();
  }, [currentPagePpe, searchTerm, startDate, endDate, selectedEmployee, pageSize]);

  useEffect(() => {
    loadSeAssets();
  }, [currentPageSe, searchTerm, startDate, endDate, selectedEmployee, pageSize]);

  const allPpeSelected = ppeAssets.length > 0 && ppeAssets.every(asset => selectedPpeAssets.has(asset.id));
  const somePpeSelected = ppeAssets.some(asset => selectedPpeAssets.has(asset.id)) && !allPpeSelected;
  const allSeSelected = seAssets.length > 0 && seAssets.every(asset => selectedSeAssets.has(asset.id));
  const someSeSelected = seAssets.some(asset => selectedSeAssets.has(asset.id)) && !allSeSelected;

  const loadAssets = async () => {

    await Promise.all([loadPpeAssets(), loadSeAssets()]);
  };

  const loadPpeAssets = async () => {
    try {
      setLoading(true);

      const filters: any = {
        group: 'PPE',
        PageNumber: currentPagePpe,
        PageSize: pageSize,
      };

      if (searchTerm) {
        filters.SearchTerm = searchTerm;
      }

      if (startDate) {
        filters.StartDate = startDate;
      }

      if (endDate) {
        filters.EndDate = endDate;
      }

      if (selectedEmployee) {
        filters.EmployeeId = parseInt(selectedEmployee.value);
      }

      const ppeResponse = await UnifiedAssetService.getAll(filters);
      setPpeAssets(ppeResponse.items);
      setTotalPpeAssets(ppeResponse.totalCount || ppeResponse.items.length);
    } catch (error) {
      console.error('Error loading PPE assets for reports:', error);
      toast.error('Failed to load PPE assets');
    } finally {
      setLoading(false);
    }
  };

  const loadSeAssets = async () => {
    try {
      setLoading(true);

      const filters: any = {
        group: 'SE',
        PageNumber: currentPageSe,
        PageSize: pageSize,
      };

      if (searchTerm) {
        filters.SearchTerm = searchTerm;
      }

      if (startDate) {
        filters.StartDate = startDate;
      }

      if (endDate) {
        filters.EndDate = endDate;
      }

      if (selectedEmployee) {
        filters.EmployeeId = parseInt(selectedEmployee.value);
      }

      const seResponse = await UnifiedAssetService.getAll(filters);
      setSeAssets(seResponse.items);
      setTotalSeAssets(seResponse.totalCount || seResponse.items.length);
    } catch (error) {
      console.error('Error loading SE assets for reports:', error);
      toast.error('Failed to load SE assets');
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
      const firstMovement = asset.movements.sort((a, b) => new Date(a.dateAssigned).getTime() - new Date(b.dateAssigned).getTime())[0];

      // First try to use the embedded employee object from the movement
      if (firstMovement.employee) {
        const emp = firstMovement.employee;
        const firstName = emp.firstName ?? "";
        const middleName = emp.middleName ?? "";
        const lastName = emp.lastName ?? "";
        const suffixName = emp.suffixName ?? "";
        const employeeIdOriginal = emp.employeeIdOriginal ?? "";
        const employmentTypeId = emp.employmentType?.id ?? 1;
        const employmentTypeName = employmentTypeId === 1 ? 'Plantilla' : 'Non-Plantilla';

        return `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ''}${suffixName ? ` ${suffixName}` : ''}${employeeIdOriginal ? ` — ${employeeIdOriginal}` : ''} (${employmentTypeName})`;
      }

      // Fallback to using employee ID lookup
      const employeeId = firstMovement.plantillaEmployeeId || firstMovement.nonPlantillaEmployeeId;
      if (employeeId) {
        const employee = employees.find((e: NormalizedEmployee) => e.id === employeeId);
        return employee ? employee.label : 'Unknown Employee';
      }
    }
    return 'N/A';
  };

  const getEmployeeId = (asset: Asset): number | null => {
    if (asset.movements && asset.movements.length > 0) {
      const firstMovement = asset.movements.sort((a, b) => new Date(a.dateAssigned).getTime() - new Date(b.dateAssigned).getTime())[0];
      return firstMovement.plantillaEmployeeId || firstMovement.nonPlantillaEmployeeId || null;
    }
    return null;
  };

  const getAssetDate = (asset: Asset): Date => {
    if (asset.movements && asset.movements.length > 0) {
      const latestMovement = asset.movements.sort((a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime())[0];
      return new Date(latestMovement.dateAssigned);
    }
    return new Date(asset.dateAcquired);
  };

  const handlePpeAssetSelect = (assetId: number, checked: boolean) => {
    const asset = ppeAssets.find(a => a.id === assetId);
    if (!asset) return;

    const employeeId = getEmployeeId(asset);
    if (checked && employeeId === null) {
      toast.error('Cannot select asset with no assigned employee.');
      return;
    }

    if (checked && selectedPpeEmployeeId !== null && employeeId !== selectedPpeEmployeeId) {
      toast.error('Cannot select assets assigned to different employees.');
      return;
    }


    const newSelected = new Set(selectedPpeAssets);
    if (checked) {
      newSelected.add(assetId);
      if (selectedPpeEmployeeId === null) {
        setSelectedPpeEmployeeId(employeeId);
      }
    } else {
      newSelected.delete(assetId);
      if (newSelected.size === 0) {
        setSelectedPpeEmployeeId(null);
      }
    }
    setSelectedPpeAssets(newSelected);
  };

  const handleSeAssetSelect = (assetId: number, checked: boolean) => {
    const asset = seAssets.find(a => a.id === assetId);
    if (!asset) return;

    const employeeId = getEmployeeId(asset);
    if (checked && employeeId === null) {
      toast.error('Cannot select asset with no assigned employee.');
      return;
    }

    if (checked && selectedSeEmployeeId !== null && employeeId !== selectedSeEmployeeId) {
      toast.error('Cannot select assets assigned to different employees.');
      return;
    }


    const newSelected = new Set(selectedSeAssets);
    if (checked) {
      newSelected.add(assetId);
      if (selectedSeEmployeeId === null) {
        setSelectedSeEmployeeId(employeeId);
      }
    } else {
      newSelected.delete(assetId);
      if (newSelected.size === 0) {
        setSelectedSeEmployeeId(null);
      }
    }
    setSelectedSeAssets(newSelected);
  };

  const handleSelectAllPpe = (checked: boolean) => {
    if (checked) {
      // Select all current page assets (same logic as before)
      // Check if there are already selected assets with different employee IDs
      if (selectedPpeAssets.size > 0) {
        const selectedEmployeeIds = new Set(
          Array.from(selectedPpeAssets).map(assetId => {
            const asset = ppeAssets.find(a => a.id === assetId);
            return asset ? getEmployeeId(asset) : null;
          }).filter(id => id !== null)
        );

        if (selectedEmployeeIds.size > 1) {
          toast.error('Meron na select na di mag ka parehas ng employee');
          return;
        }
      }

      // Filter assets that have the same employee ID as already selected or no selection
      const assetsToSelect = ppeAssets.filter(asset => {
        const employeeId = getEmployeeId(asset);
        if (employeeId === null) return false; // Skip N/A assets
        if (selectedPpeAssets.size === 0) return true; // If no selection, allow first employee
        const selectedEmployeeId = Array.from(selectedPpeAssets).map(assetId => {
          const asset = ppeAssets.find(a => a.id === assetId);
          return asset ? getEmployeeId(asset) : null;
        }).find(id => id !== null);
        return employeeId === selectedEmployeeId;
      });

      setSelectedPpeAssets(new Set(assetsToSelect.map(asset => asset.id)));
      if (assetsToSelect.length > 0 && selectedPpeEmployeeId === null) {
        setSelectedPpeEmployeeId(getEmployeeId(assetsToSelect[0]));
      }
    } else {
      // Unselect all current page assets only
      const newSelected = new Set(selectedPpeAssets);
      ppeAssets.forEach(asset => newSelected.delete(asset.id));
      setSelectedPpeAssets(newSelected);
      if (newSelected.size === 0) {
        setSelectedPpeEmployeeId(null);
      }
    }
  };


  const handleSelectAllSe = (checked: boolean) => {
    if (checked) {
      // Select all current page assets (same logic as before)
      // Check if there are already selected assets with different employee IDs
      if (selectedSeAssets.size > 0) {
        const selectedEmployeeIds = new Set(
          Array.from(selectedSeAssets).map(assetId => {
            const asset = seAssets.find(a => a.id === assetId);
            return asset ? getEmployeeId(asset) : null;
          }).filter(id => id !== null)
        );

        if (selectedEmployeeIds.size > 1) {
          toast.error('Meron na select na di mag ka parehas ng employee');
          return;
        }
      }

      // Filter assets that have the same employee ID as already selected or no selection
      const assetsToSelect = seAssets.filter(asset => {
        const employeeId = getEmployeeId(asset);
        if (employeeId === null) return false; // Skip N/A assets
        if (selectedSeAssets.size === 0) return true; // If no selection, allow first employee
        const selectedEmployeeId = Array.from(selectedSeAssets).map(assetId => {
          const asset = seAssets.find(a => a.id === assetId);
          return asset ? getEmployeeId(asset) : null;
        }).find(id => id !== null);
        return employeeId === selectedEmployeeId;
      });

      setSelectedSeAssets(new Set(assetsToSelect.map(asset => asset.id)));
      if (assetsToSelect.length > 0 && selectedSeEmployeeId === null) {
        setSelectedSeEmployeeId(getEmployeeId(assetsToSelect[0]));
      }
    } else {
      // Unselect all current page assets only
      const newSelected = new Set(selectedSeAssets);
      seAssets.forEach(asset => newSelected.delete(asset.id));
      setSelectedSeAssets(newSelected);
      if (newSelected.size === 0) {
        setSelectedSeEmployeeId(null);
      }
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
    setSelectedEmployee(null);
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

  const totalPagesPpe = Math.ceil(totalPpeAssets / pageSize);
  const totalPagesSe = Math.ceil(totalSeAssets / pageSize);

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
            <div className="flex-1 min-w-64">
              <label className="text-sm font-medium mb-2 block">Filter by Employee</label>
              <ReactSelect
                options={employees.filter(emp => emp.id != null).map(emp => ({ value: emp.id.toString(), label: emp.label }))}
                value={selectedEmployee}
                onChange={(selected) => {
                  setSelectedEmployee(selected);
                  setCurrentPagePpe(1);
                  setCurrentPageSe(1);
                }}
                placeholder="Select employee (optional)"
                isClearable
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
                    checked={selectedPpeAssets.size === ppeAssets.length && ppeAssets.length > 0}
                    onCheckedChange={handleSelectAllPpe}
                  />


                  <span className="text-sm font-medium">Select All ({ppeAssets.length} assets)</span>
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
                      {ppeAssets.map((asset) => (
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

              {totalPpeAssets > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPagePpe - 1) * pageSize) + 1} to {Math.min(currentPagePpe * pageSize, totalPpeAssets)} of {totalPpeAssets} assets
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Page Size:</label>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPagePpe(1);
                          setCurrentPageSe(1);
                        }}
                        className="flex h-8 w-16 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
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
                    checked={selectedSeAssets.size === seAssets.length && seAssets.length > 0}
                    onCheckedChange={handleSelectAllSe}
                  />


                  <span className="text-sm font-medium">Select All ({seAssets.length} assets)</span>
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
                      {seAssets.map((asset) => (
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

              {totalSeAssets > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPageSe - 1) * pageSize) + 1} to {Math.min(currentPageSe * pageSize, totalSeAssets)} of {totalSeAssets} assets
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Page Size:</label>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPagePpe(1);
                          setCurrentPageSe(1);
                        }}
                        className="flex h-8 w-16 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
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
