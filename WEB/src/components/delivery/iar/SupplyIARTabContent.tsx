import { useState, useEffect } from 'react';
import { useSupplyIAR } from '@/hooks';
import { SupplyIARTable } from './SupplyIARTable';
import { SupplyIAREditModal } from './SupplyIAREditModal';
import { SupplyIARDeleteModal } from './SupplyIARDeleteModal';
import { SupplyIARViewModal } from './SupplyIARViewModal';
import { VwSupplyIAR } from '@/types'; // Use the View Model type

export const SupplyIARTabContent = () => {
  // Destructure all necessary methods from your store/hook
  const { 
    iars, 
    loading, 
    fetchSupplyIARs, 
    addSupplyIAR, 
    updateSupplyIAR, 
    deleteSupplyIAR 
  } = useSupplyIAR();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  // Typed to the View Model to support nested Vendor/Office/Division data
  const [selectedRecord, setSelectedRecord] = useState<VwSupplyIAR | null>(null);
  const [mode, setMode] = useState<'add' | 'edit'>('add');

  // Load data on component mount
  useEffect(() => { 
    fetchSupplyIARs(); 
  }, []);

  // Handler: Open modal for fresh entry
  const handleAdd = () => { 
    setSelectedRecord(null); 
    setMode('add'); 
    setIsEditOpen(true); 
  };

  // Handler: Open modal with existing record data
  const handleEdit = (record: VwSupplyIAR) => { 
    setSelectedRecord(record); 
    setMode('edit'); 
    setIsEditOpen(true); 
  };

  // Handler: Open deletion confirmation
  const handleDelete = (record: VwSupplyIAR) => { 
    setSelectedRecord(record); 
    setIsDeleteOpen(true); 
  };

  // Handler: Open detailed view
  const handleView = (record: VwSupplyIAR) => {
    setSelectedRecord(record);
    setIsViewOpen(true);
  };

  /**
   * handleSave processes the form submission from the Edit Modal.
   * It handles both creating a new IAR and updating an existing one.
   */
  const handleSave = async (data: any) => {
    try {
      if (mode === 'add') {
        await addSupplyIAR(data);
      } else if (selectedRecord) {
        await updateSupplyIAR(selectedRecord.id, data);
      }
      setIsEditOpen(false); // Close modal on success
    } catch (error) {
      // Error handling is managed by the toast in the store
      console.error("Save failed:", error);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedRecord) {
      await deleteSupplyIAR(selectedRecord.id);
      setIsDeleteOpen(false);
    }
  };

  // Loading state handling for initial fetch
  if (loading && iars.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground animate-pulse">
        Fetching Inspection & Acceptance Reports...
      </div>
    );
  }

  return (
    <>
      {/* 1. Main Data Table */}
      <SupplyIARTable 
        data={iars} 
        onAdd={handleAdd} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
        onView={handleView} 
      />

      {/* 2. Create/Edit Form Modal */}
      <SupplyIAREditModal 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        mode={mode} 
        record={selectedRecord} 
        onSubmit={handleSave} 
      />

      {/* 3. Delete Confirmation Modal */}
      <SupplyIARDeleteModal 
        open={isDeleteOpen} 
        onOpenChange={setIsDeleteOpen} 
        record={selectedRecord} 
        onConfirm={handleConfirmDelete} 
      />

      {/* 4. Detailed View Modal */}
      <SupplyIARViewModal 
        open={isViewOpen} 
        onOpenChange={setIsViewOpen} 
        record={selectedRecord} 
      />
    </>
  );
};