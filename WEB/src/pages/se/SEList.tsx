import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload } from 'lucide-react';
import { SETable } from '@/components/se/SETable';
import { SEFilters } from '@/components/se/SEFilters';
import { SEForm } from '@/components/se/SEForm';
import { SEViewCard } from '@/components/se/SEViewCard';
import { SEAsset } from '@/types/supply/se';
import { SEService } from '@/services/seService';
import { toast } from 'sonner';

export function SEList() {
  const [seAssets, setSEAssets] = useState<SEAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');

  // Actions
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSE, setSelectedSE] = useState<SEAsset | null>(null);

  useEffect(() => {
    loadSEAssets();
  }, [searchTerm, categoryFilter, conditionFilter, statusFilter, divisionFilter, currentPage]);

  const loadSEAssets = async () => {
    try {
      setLoading(true);
      const filters = {
        search: searchTerm,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        condition: conditionFilter === 'all' ? undefined : conditionFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        division: divisionFilter === 'all' ? undefined : divisionFilter,
      };

      const assets = await SEService.getAll(filters);

      // Simple pagination (10 items per page)
      const itemsPerPage = 10;
      const totalItems = assets.length;
      setTotalPages(Math.ceil(totalItems / itemsPerPage));

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedAssets = assets.slice(startIndex, endIndex);

      setSEAssets(paginatedAssets);
    } catch (error) {
      console.error('Error loading SE assets:', error);
      toast.error('Failed to load SE assets');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (se: SEAsset) => {
    setSelectedSE(se);
    setShowViewDialog(true);
  };

  const handleEdit = (se: SEAsset) => {
    setSelectedSE(se);
    setShowEditDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await SEService.delete(id);
      toast.success('SE asset deleted successfully');
      loadSEAssets();
      setShowDeleteDialog(false);
      setSelectedSE(null);
    } catch (error) {
      console.error('Error deleting SE asset:', error);
      toast.error('Failed to delete SE asset');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setConditionFilter('all');
    setStatusFilter('all');
    setDivisionFilter('all');
    setCurrentPage(1);
  };

  const downloadSETemplate = () => {
    // SE CSV Template with headers and sample row
    const headers = [
      'SE Property Number',
      'Category',
      'Legend',
      'Description',
      'Brand',
      'Model',
      'Serial Number',
      'Parts/Accessories',
      'Unit of Measurement',
      'Unit Value (PHP)',
      'Date Acquired (YYYY-MM-DD)',
      'Warranty Status',
      'Status',
      'Current ITR/RRSP Number',
      'Current Plantilla Employee ID',
      'Current Non-Plantilla Employee ID',
      'Current Division/Section',
      'Current Condition',
      'Current Date Issued (YYYY-MM-DD)',
      'Current Remarks'
    ];

    const sampleRow = [
      'SE-2024-0001',
      'ICT Equipment',
      'I',
      'Wireless Mouse',
      'Logitech',
      'MX Master 3',
      'LG-MX3-2024-001',
      'USB Receiver',
      'unit',
      '2500',
      '2024-01-15',
      'In Warranty',
      'Active',
      'ITR-2024-0001',
      'ERC-2024-0001',
      '',
      'Technical Service',
      'Working',
      '2024-01-20',
      'New assignment'
    ];

    const csvContent = [
      headers.join(','),
      sampleRow.join(','),
      // Add empty rows for bulk entry
      Array(20).fill('').join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ERC_SE_Template_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('SE Template downloaded successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading SE assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-20 space-y-6">
      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <Plus className="size-4" />
                Add SE Item
              </Button>
              <Button
                variant="outline"
                className="gap-2"
              >
                <Upload className="size-4" />
                Upload Bulk (Excel)
              </Button>
            </div>
            <Button variant="outline" className="gap-2" onClick={downloadSETemplate}>
              <Download className="size-4" />
              Download SE Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <SEFilters
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
        totalResults={seAssets.length}
      />

      {/* SE Table */}
      <SETable
        seAssets={seAssets}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        onDelete={(id) => {
          setSelectedSE(seAssets.find(se => se.id === id) || null);
          setShowDeleteDialog(true);
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Add SE Modal */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-6">Add SE Asset</h3>
              <SEForm
                onSubmit={async (data) => {
                  try {
                    await SEService.create({
                      ...data,
                      movementHistory: [],
                      rrspHistory: []
                    });
                    toast.success('SE asset added successfully');
                    setShowAddDialog(false);
                    loadSEAssets();
                  } catch (error) {
                    console.error('Error adding SE asset:', error);
                    toast.error('Failed to add SE asset');
                  }
                }}
                onCancel={() => setShowAddDialog(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit SE Modal */}
      {showEditDialog && selectedSE && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-6">Edit SE Asset</h3>
              <SEForm
                seAsset={selectedSE}
                onSubmit={async (data) => {
                  try {
                    await SEService.update(selectedSE.id, data);
                    toast.success('SE asset updated successfully');
                    setShowEditDialog(false);
                    setSelectedSE(null);
                    loadSEAssets();
                  } catch (error) {
                    console.error('Error updating SE asset:', error);
                    toast.error('Failed to update SE asset');
                  }
                }}
                onCancel={() => {
                  setShowEditDialog(false);
                  setSelectedSE(null);
                }}
                isEditing={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* View SE Modal */}
      {showViewDialog && selectedSE && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <SEViewCard
                seAsset={selectedSE}
                onEdit={() => {
                  setShowViewDialog(false);
                  setShowEditDialog(true);
                }}
                onClose={() => {
                  setShowViewDialog(false);
                  setSelectedSE(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showDeleteDialog && selectedSE && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete SE Asset</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete {selectedSE.se_property_number}?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(selectedSE.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


