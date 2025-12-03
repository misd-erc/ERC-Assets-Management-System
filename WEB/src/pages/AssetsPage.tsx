import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Upload, Download, Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { AssetsTable } from '@/components/assets/AssetsTable';
import { AssetsFilters } from '@/components/assets/AssetsFilters';
import { AssetCreateForm } from '@/components/assets/forms/AssetCreateForm';
import { AssetEditForm } from '@/components/assets/forms/AssetEditForm';
import { AssetsViewCard } from '@/components/assets/AssetsViewCard';
import { UnifiedAssetService } from '@/services/UnifiedAssetService';
import { Asset } from '@/types/asset/UnifiedAsset';
import { ExcelExportService } from '@/utils/excelExport';

export function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Active tab
  const [activeTab, setActiveTab] = useState('all');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [officeFilter, setOfficeFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Selected asset
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Batch upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadConfirmDialogOpen, setUploadConfirmDialogOpen] = useState(false);

  // Excel export
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAssets();
  }, [currentPage, searchTerm, categoryFilter, conditionFilter, officeFilter, divisionFilter, startDate, endDate, activeTab]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const filters: any = {
        search: searchTerm || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        condition: conditionFilter !== 'all' ? conditionFilter : undefined,
        division: divisionFilter !== 'all' ? divisionFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        group: activeTab !== 'all' ? activeTab : undefined,
        PageNumber: currentPage,
        PageSize: 5,
      };

      const response = await UnifiedAssetService.getAll(filters);
      setAssets(response.items);
      setTotalCount(response.totalCount);
      setTotalPages(Math.ceil(response.totalCount / 5));
    } catch (error) {
      console.error('Error loading assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async (data: Omit<Asset, 'id'>) => {
    try {
      await UnifiedAssetService.create(data);
      toast.success('Asset added successfully');
      setAddDialogOpen(false);
      loadAssets();
    } catch (error) {
      console.error('Error adding asset:', error);
      toast.error('Failed to add asset');
    }
  };

  const handleEditAsset = async (data: Asset) => {
    // This function is now only used for closing the dialog, actual update is handled in AssetEditForm
    setEditDialogOpen(false);
    setSelectedAsset(null);
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;
    try {
      await UnifiedAssetService.delete(selectedAsset.id);
      toast.success('Asset deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedAsset(null);
      loadAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset');
    }
  };

  const handleBatchUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      if (!actionBySystemUserId || !sessionKey) {
        toast.error('Authentication required for batch upload');
        return;
      }

      const result = await UnifiedAssetService.batchUpload(uploadFile, actionBySystemUserId, sessionKey);

      if (result.success) {
        toast.success(result.data);
      } else {
        toast.error(result.message || 'Failed to upload file');
      }

      setUploadFile(null);
      loadAssets();
    } catch (error) {
      console.error('Error during batch upload:', error);
      toast.error('Failed to upload file');
    }
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/ppe-templates/ppe_template.xlsx';
    link.download = 'ppe_template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template downloaded successfully');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setConditionFilter('all');
    setOfficeFilter('all');
    setDivisionFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const handleViewDetails = async (asset: Asset) => {
    try {
      // Fetch complete asset data using the unified endpoint
      const fullAssetData = await UnifiedAssetService.getById(asset.id);
      setSelectedAsset(fullAssetData);
      setViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching asset details for viewing:', error);
      toast.error('Failed to load asset details');
    }
  };

  const handleEdit = async (asset: Asset) => {
    try {
      // Fetch complete asset data using the unified endpoint
      const fullAssetData = await UnifiedAssetService.getById(asset.id);
      setSelectedAsset(fullAssetData);
      setEditDialogOpen(true);
    } catch (error) {
      console.error('Error fetching asset details for edit:', error);
      toast.error('Failed to load asset details for editing');
    }
  };

  const handleDelete = (asset: Asset) => {
    setSelectedAsset(asset);
    setDeleteDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const groupName = activeTab === 'all' ? 'All' : (activeTab as 'PPE' | 'SE');
      await ExcelExportService.exportToExcel({
        groupName,
        startDate: exportStartDate || undefined,
        endDate: exportEndDate || undefined,
      });
      toast.success('Excel report downloaded successfully');
      setExportModalOpen(false);
      setExportStartDate('');
      setExportEndDate('');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 pt-20 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Assets Management
          </h1>
          <p className="text-slate-600">
            Manage and track your PPE and SE assets
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExportModalOpen(true)} className="gap-2">
            <Download className="size-4" />
            Export To Excel ({activeTab === 'all' ? 'ALL' : activeTab})
          </Button>

          <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
            <Download className="size-4" />
            Download Template
          </Button>

          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="hidden"
              id="batch-upload"
            />
            <Label htmlFor="batch-upload" className="cursor-pointer">
              <Button variant="outline" asChild className="gap-2">
                <span>
                  <Upload className="size-4" />
                  Batch Upload
                </span>
              </Button>
            </Label>
            {uploadFile && (
              <Button onClick={() => setUploadConfirmDialogOpen(true)} className="gap-2">
                <FileText className="size-4" />
                Upload {uploadFile.name}
              </Button>
            )}
          </div>

          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="size-4" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Assets</TabsTrigger>
          <TabsTrigger value="PPE">PPE Assets</TabsTrigger>
          <TabsTrigger value="SE">SE Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Filters */}
          <AssetsFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            conditionFilter={conditionFilter}
            onConditionFilterChange={setConditionFilter}
            officeFilter={officeFilter}
            onOfficeFilterChange={setOfficeFilter}
            divisionFilter={divisionFilter}
            onDivisionFilterChange={setDivisionFilter}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            onClearFilters={handleClearFilters}
            totalResults={totalCount}
          />

          {/* Table */}
          <AssetsTable
            assets={assets}
            loading={loading}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </TabsContent>

        <TabsContent value="PPE" className="space-y-6">
          {/* Filters */}
          <AssetsFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            conditionFilter={conditionFilter}
            onConditionFilterChange={setConditionFilter}
            officeFilter={officeFilter}
            onOfficeFilterChange={setOfficeFilter}
            divisionFilter={divisionFilter}
            onDivisionFilterChange={setDivisionFilter}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            onClearFilters={handleClearFilters}
            totalResults={totalCount}
          />

          {/* Table */}
          <AssetsTable
            assets={assets}
            loading={loading}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </TabsContent>

        <TabsContent value="SE" className="space-y-6">
          {/* Filters */}
          <AssetsFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            conditionFilter={conditionFilter}
            onConditionFilterChange={setConditionFilter}
            officeFilter={officeFilter}
            onOfficeFilterChange={setOfficeFilter}
            divisionFilter={divisionFilter}
            onDivisionFilterChange={setDivisionFilter}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            onClearFilters={handleClearFilters}
            totalResults={totalCount}
          />

          {/* Table */}
          <AssetsTable
            assets={assets}
            loading={loading}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="w-[85vw] !max-w-none max-h-[90vh] overflow-y-auto p-5 md:p-6 lg:p-8">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>
              Enter the details for the new asset.
            </DialogDescription>
          </DialogHeader>
          <AssetCreateForm
            onSubmit={handleAddAsset}
            onCancel={() => setAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-[85vw] !max-w-none max-h-[90vh] overflow-y-auto p-5 md:p-6 lg:p-8">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Update the details for this asset.
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <AssetEditForm
              asset={selectedAsset}
              onSubmit={handleEditAsset}
              onCancel={() => {
                setEditDialogOpen(false);
                setSelectedAsset(null);
              }}
              onSuccess={loadAssets}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-[95vw] !max-w-none max-h-[90vh] overflow-y-auto p-5 md:p-6 lg:p-8">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <AssetsViewCard
              asset={selectedAsset}
              onEdit={() => {
                setViewDialogOpen(false);
                handleEdit(selectedAsset);
              }}
              onClose={() => {
                setViewDialogOpen(false);
                setSelectedAsset(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this asset? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAsset(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAsset} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Upload Confirmation */}
      <AlertDialog open={uploadConfirmDialogOpen} onOpenChange={setUploadConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Batch Upload</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to upload the file "{uploadFile?.name}"? This will import assets from the selected file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setUploadConfirmDialogOpen(false);
              handleBatchUpload();
            }}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Excel Export Modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Export to  Excel</DialogTitle>
            <DialogDescription>
              Select date range for the assets report. Leave empty to export all records.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start-date" className="text-right">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end-date" className="text-right">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setExportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportExcel} disabled={exporting}>
              {exporting ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
