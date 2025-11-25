﻿import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload } from 'lucide-react';
import { PPETable } from '@/components/ppe/PPETable';
import { PPEFilters } from '@/components/ppe/PPEFilters';
import { PPEViewCard } from '@/components/ppe/PPEViewCard';
import { PPEForm } from '@/components/ppe/PPEForm';
import { PPEAsset } from '@/types/asset/PPEAsset';
import { PPEService } from '@/services/ppeService';
import { useNavigate } from 'react-router-dom';  // Added useNavigate import
import { toast } from 'sonner';

const convertSnakeToCamel = (item: any): PPEAsset => {
  return {
    id: item.id,
    propertyNumber: item.propertyNumber,
    category: item.category ? {
      id: item.category.id,
      name: item.category.name,
      isActive: item.category.isActive,
      isDeleted: item.category.isDeleted,
      createdAt: item.category.createdAt
    } : null,
    legend: item.legend,
    description: item.description,
    brand: item.brand,
    model: item.model,
    serialNumber: item.serialNumber,
    parts: Array.isArray(item.parts) ? item.parts : (item.parts ? JSON.parse(item.parts) : []),
    unitOfMeasurement: item.unitOfMeasurement,
    unitValue: item.unitValue,
    dateAcquired: item.dateAcquired,
    estimatedUsefulLife: item.estimatedUsefulLife,
    parItrNumber: item.parItrNumber,
    plantillaEmployeeId: item.plantillaEmployeeId,
    nonPlantillaEmployeeId: item.nonPlantillaEmployeeId,
    actualDivision: item.movements && item.movements.length > 0 && item.movements[0].division ? item.movements[0].division.name : '-',
    condition: item.condition,
    date: item.date,
    history: item.history,
    movements: [],
    dateEncoded: item.dateEncoded,
  };
};

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

  const navigate = useNavigate();  // added navigate hook

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
        startDate: undefined,
        endDate: undefined,
      };

      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      if (!actionBySystemUserId || !sessionKey) {
        toast.error('User session info missing. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await PPEService.getAll(filters);

      // Already mapped in PPEService, but if any snake_case slipping in use convertSnakeToCamel
      const camelItems = response.items.map(item => convertSnakeToCamel(item));

      // Exclude the "movements" property from each PPE asset before setting state
      const filteredItems = camelItems.map(({ movements, ...rest }) => ({
        ...rest,
        movements: [], // add empty movements to adhere to PPEAsset type
      }));

      setPPEAssets(filteredItems);

      setTotalPages(Math.ceil(response.totalCount / 10));

    } catch (error) {
      console.error('Error loading PPE assets:', error);
      toast.error('Failed to load PPE assets');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (ppe: PPEAsset) => {
    try {
      setLoading(true);
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      if (!actionBySystemUserId || !sessionKey) {
        toast.error('User session info missing. Please log in again.');
        return;
      }

      const detailedPPE = await PPEService.getById(ppe.id);
      setSelectedPPE(detailedPPE);
      setShowViewDialog(true);
    } catch (error) {
      console.error('Error fetching PPE details:', error);
      toast.error('Failed to load PPE details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (ppe: PPEAsset) => {
    try {
      setLoading(true);
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';
      if (!actionBySystemUserId || !sessionKey) {
        toast.error('User session info missing. Please log in again.');
        return;
      }
      const detailedPPE = await PPEService.getById(ppe.id);
      setSelectedPPE(detailedPPE);
      setShowEditDialog(true);
    } catch (error) {
      console.error('Error fetching PPE details for edit:', error);
      toast.error('Failed to load PPE details for editing.');
    } finally {
      setLoading(false);
    }
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
    const link = document.createElement('a');
    link.href = '/ppe-templates/ppe_template.xlsx';
    link.setAttribute('download', 'ppe_template.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('PPE Excel Template downloaded successfully');
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
                onClick={() => {
                  const fileInput = document.getElementById('ppe-upload-input');
                  if (fileInput) {
                    fileInput.click();
                  }
                }}
              >
                <Upload className="size-4" />
                Upload Bulk (Excel)
              </Button>
              <input
                type="file"
                id="ppe-upload-input"
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) {
                    return;
                  }
                  const file = files[0];

                  const actionBySystemUserId = localStorage.getItem('systemUserId');
                  const sessionKey = localStorage.getItem('sessionToken') || '';

                  if (!actionBySystemUserId || !sessionKey) {
                    toast.error('User session info missing. Please log in again.');
                    return;
                  }

                  try {
                    const result = await PPEService.batchUpload(file, actionBySystemUserId, sessionKey);
                    toast.success(`Upload successful: ${result.imported} items imported`);

                    // Reload PPE assets
                    loadPPEAssets();
                  } catch (error) {
                    console.error('Batch upload failed:', error);
                    toast.error(`Batch upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  } finally {
                    // Reset the input value to allow uploading the same file again if needed
                    if (e.target) {
                      e.target.value = '';
                    }
                  }
                }}
              />
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

      {/* Edit PPE Modal */}
      {showEditDialog && selectedPPE && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-6">Edit PPE Asset</h3>
              <PPEForm
                ppeAsset={selectedPPE}
                onSubmit={async (data: any) => {
                  try {
                    await PPEService.update(selectedPPE.id, data);
                    toast.success('PPE asset updated successfully');
                    setShowEditDialog(false);
                    setSelectedPPE(null);
                    loadPPEAssets();
                  } catch (error) {
                    console.error('Error updating PPE asset:', error);
                    toast.error('Failed to update PPE asset');
                  }
                }}
                onCancel={() => {
                  setShowEditDialog(false);
                  setSelectedPPE(null);
                }}
                isEditing={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* View PPE Modal */}
      {showViewDialog && selectedPPE && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
          <PPEViewCard
            ppeAsset={selectedPPE}
            onEdit={() => {
              setShowViewDialog(false);
              // Open edit modal instead of navigating
              setSelectedPPE(selectedPPE);
              setShowEditDialog(true);
            }}
            onClose={() => {
              setShowViewDialog(false);
              setSelectedPPE(null);
            }}
          />
            </div>
          </div>
        </div>
      )}

      {/* Delete PPE Modal */}
      {showDeleteDialog && selectedPPE && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete PPE Asset</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete {selectedPPE.propertyNumber}?
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


