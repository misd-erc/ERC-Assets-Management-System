import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload } from 'lucide-react';
import { PPETable } from '@/components/ppe/PPETable';
import { PPEFilters } from '@/components/ppe/PPEFilters';
import { PPEAsset } from '@/types/asset/ppe';
import { PPEService } from '@/services/ppeService';
import { toast } from 'sonner';

export function PPEList() {
  const [ppeAssets, setPPEAssets] = useState<PPEAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');

  // Actions
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPPE, setSelectedPPE] = useState<PPEAsset | null>(null);

  useEffect(() => {
    loadPPEAssets();
  }, [searchTerm, categoryFilter, conditionFilter, divisionFilter, currentPage]);

  const loadPPEAssets = async () => {
    try {
      setLoading(true);
      const filters = {
        search: searchTerm,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        condition: conditionFilter === 'all' ? undefined : conditionFilter,
        division: divisionFilter === 'all' ? undefined : divisionFilter,
      };

      const assets = await PPEService.getAll(filters);

      // Simple pagination (10 items per page)
      const itemsPerPage = 10;
      const totalItems = assets.length;
      setTotalPages(Math.ceil(totalItems / itemsPerPage));

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedAssets = assets.slice(startIndex, endIndex);

      setPPEAssets(paginatedAssets);
    } catch (error) {
      console.error('Error loading PPE assets:', error);
      toast.error('Failed to load PPE assets');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (ppe: PPEAsset) => {
    setSelectedPPE(ppe);
    setShowViewDialog(true);
  };

  const handleEdit = (ppe: PPEAsset) => {
    setSelectedPPE(ppe);
    setShowEditDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await PPEService.delete(id);
      toast.success('PPE asset deleted successfully');
      loadPPEAssets();
      setShowDeleteDialog(false);
      setSelectedPPE(null);
    } catch (error) {
      console.error('Error deleting PPE asset:', error);
      toast.error('Failed to delete PPE asset');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setConditionFilter('all');
    setDivisionFilter('all');
    setCurrentPage(1);
  };

  const downloadPPETemplate = () => {
    // PPE CSV Template with headers and sample row
    const headers = [
      'Property Number',
      'Category',
      'Legend',
      'Description',
      'Brand',
      'Model',
      'Serial Number',
      'Parts',
      'Unit of Measurement',
      'Unit Value (PHP)',
      'Date Acquired (YYYY-MM-DD)',
      'Estimated Useful Life',
      'PAR/ITR Number',
      'Plantilla Employee ID',
      'Non-Plantilla Employee ID',
      'Actual Division',
      'Condition',
      'Date (YYYY-MM-DD)'
    ];

    const sampleRow = [
      'PPE-2024-0001',
      'ICT Equipment',
      'I',
      'Desktop Computer',
      'Dell',
      'OptiPlex 7090',
      'DL-PC-2024-001',
      'Mouse, Keyboard',
      'unit',
      '45000',
      '2024-01-15',
      '5',
      'PAR-2024-0001',
      'ERC-2024-0001',
      '',
      'Technical Service',
      'Working',
      '2024-01-20'
    ];

    const csvContent = [
      headers.join(','),
      sampleRow.join(','),
      // Add empty rows for bulk entry
      Array(18).fill('').join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ERC_PPE_Template_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('PPE Template downloaded successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading PPE assets...</p>
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
                Add PPE Item
              </Button>
              <Button
                variant="outline"
                className="gap-2"
              >
                <Upload className="size-4" />
                Upload Bulk (Excel)
              </Button>
            </div>
            <Button variant="outline" className="gap-2" onClick={downloadPPETemplate}>
              <Download className="size-4" />
              Download PPE Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <PPEFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        conditionFilter={conditionFilter}
        onConditionFilterChange={setConditionFilter}
        divisionFilter={divisionFilter}
        onDivisionFilterChange={setDivisionFilter}
        onClearFilters={handleClearFilters}
        totalResults={ppeAssets.length}
      />

      {/* PPE Table */}
      <PPETable
        ppeAssets={ppeAssets}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        onDelete={(id) => {
          setSelectedPPE(ppeAssets.find(p => p.id === id) || null);
          setShowDeleteDialog(true);
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Add/Edit/View Dialogs would be implemented here */}
      {/* For now, showing placeholders */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add PPE Asset</h3>
            <p className="text-slate-600 mb-4">PPE Form component would be rendered here</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowAddDialog(false)}>
                Add Asset
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEditDialog && selectedPPE && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit PPE Asset</h3>
            <p className="text-slate-600 mb-4">PPE Form component would be rendered here for {selectedPPE.property_number}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowEditDialog(false)}>
                Update Asset
              </Button>
            </div>
          </div>
        </div>
      )}

      {showViewDialog && selectedPPE && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">View PPE Asset</h3>
            <p className="text-slate-600 mb-4">PPE View Card component would be rendered here for {selectedPPE.property_number}</p>
            <div className="flex justify-end">
              <Button onClick={() => setShowViewDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteDialog && selectedPPE && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete PPE Asset</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete {selectedPPE.property_number}?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(selectedPPE.id)}
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


