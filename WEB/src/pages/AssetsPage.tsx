import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { AssetsTable } from '@/components/assets/AssetsTable';
import { AssetsFilters } from '@/components/assets/AssetsFilters';
import { AssetsForm } from '@/components/assets/AssetsForm';
import { AssetsViewCard } from '@/components/assets/AssetsViewCard';
import { AssetService, AssetType } from '@/services/assetService';
import { PPEAsset } from '@/types/asset/PPEAsset';
import { SEAsset } from '@/types/supply/se';

interface AssetsPageProps {
  type: AssetType;
}

export function AssetsPage({ type }: AssetsPageProps) {
  const [assets, setAssets] = useState<(PPEAsset | SEAsset)[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Selected asset
  const [selectedAsset, setSelectedAsset] = useState<PPEAsset | SEAsset | null>(null);

  // Batch upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    loadAssets();
  }, [type, currentPage, searchTerm, categoryFilter, conditionFilter, statusFilter, divisionFilter]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const filters: any = {
        search: searchTerm || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        condition: conditionFilter !== 'all' ? conditionFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        division: divisionFilter !== 'all' ? divisionFilter : undefined,
      };

      const response = await AssetService.getAll(type, filters);
      setAssets(response.items);
      setTotalCount(response.totalCount);
      setTotalPages(Math.ceil(response.totalCount / 10));
    } catch (error) {
      console.error('Error loading assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async (data: any) => {
    try {
      await AssetService.create(type, data);
      toast.success(`${type.toUpperCase()} asset added successfully`);
      setAddDialogOpen(false);
      loadAssets();
    } catch (error) {
      console.error('Error adding asset:', error);
      toast.error('Failed to add asset');
    }
  };

  const handleEditAsset = async (data: any) => {
    if (!selectedAsset) return;
    try {
      await AssetService.update(type, selectedAsset.id, data);
      toast.success(`${type.toUpperCase()} asset updated successfully`);
      setEditDialogOpen(false);
      setSelectedAsset(null);
      loadAssets();
    } catch (error) {
      console.error('Error updating asset:', error);
      toast.error('Failed to update asset');
    }
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;
    try {
      await AssetService.delete(type, selectedAsset.id);
      toast.success(`${type.toUpperCase()} asset deleted successfully`);
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

      const result = await AssetService.batchUpload(type, uploadFile, actionBySystemUserId, sessionKey);

      if (result.errors.length > 0) {
        toast.error(`Upload completed with errors: ${result.errors.join(', ')}`);
      } else {
        toast.success(`Successfully uploaded ${result.imported} ${type.toUpperCase()} assets`);
      }

      setUploadFile(null);
      loadAssets();
    } catch (error) {
      console.error('Error during batch upload:', error);
      toast.error('Failed to upload file');
    }
  };

  const handleDownloadTemplate = () => {
    // For now, just show a message. In a real implementation, this would download a template file
    toast.info('Template download feature coming soon');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setConditionFilter('all');
    setStatusFilter('all');
    setDivisionFilter('all');
  };

  const handleViewDetails = (asset: PPEAsset | SEAsset) => {
    setSelectedAsset(asset);
    setViewDialogOpen(true);
  };

  const handleEdit = (asset: PPEAsset | SEAsset) => {
    setSelectedAsset(asset);
    setEditDialogOpen(true);
  };

  const handleDelete = (asset: PPEAsset | SEAsset) => {
    setSelectedAsset(asset);
    setDeleteDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {type === 'ppe' ? 'Property, Plant & Equipment' : 'Semi-Expendable'} Assets
          </h1>
          <p className="text-slate-600">
            Manage and track your {type.toUpperCase()} assets
          </p>
        </div>

        <div className="flex gap-2">
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
              <Button onClick={handleBatchUpload} className="gap-2">
                <FileText className="size-4" />
                Upload {uploadFile.name}
              </Button>
            )}
          </div>

          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="size-4" />
            Add {type.toUpperCase()} Asset
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AssetsFilters
        type={type}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        conditionFilter={conditionFilter}
        onConditionFilterChange={setConditionFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        divisionFilter={divisionFilter}
        onDivisionFilterChange={setDivisionFilter}
        onClearFilters={handleClearFilters}
        totalResults={totalCount}
      />

      {/* Table */}
      <AssetsTable
        type={type}
        assets={assets}
        loading={loading}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        onDelete={handleDelete}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New {type.toUpperCase()} Asset</DialogTitle>
            <DialogDescription>
              Enter the details for the new {type.toUpperCase()} asset.
            </DialogDescription>
          </DialogHeader>
          <AssetsForm
            type={type}
            onSubmit={handleAddAsset}
            onCancel={() => setAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {type.toUpperCase()} Asset</DialogTitle>
            <DialogDescription>
              Update the details for this {type.toUpperCase()} asset.
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <AssetsForm
              type={type}
              asset={selectedAsset}
              onSubmit={handleEditAsset}
              onCancel={() => {
                setEditDialogOpen(false);
                setSelectedAsset(null);
              }}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{type.toUpperCase()} Asset Details</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <AssetsViewCard
              type={type}
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
            <AlertDialogTitle>Delete {type.toUpperCase()} Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {type.toUpperCase()} asset? This action cannot be undone.
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
    </div>
  );
}
