import { useState, useEffect } from 'react';
import { useSupplyIAR } from '@/hooks';
import { SupplyIARTable } from './SupplyIARTable';
import { SupplyIAREditModal } from './SupplyIAREditModal';
import { SupplyIARDeleteModal } from './SupplyIARDeleteModal';
import { SupplyIARViewModal } from './SupplyIARViewModal';
import { SupplyIARApproveModal } from './SupplyIARApproveModal';
import { VwSupplyIAR } from '@/types';

export const SupplyIARTabContent = () => {
  const { iars, loading, fetchSupplyIARs, addSupplyIAR, updateSupplyIAR, deleteSupplyIAR } = useSupplyIAR();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  
  const [selectedRecord, setSelectedRecord] = useState<VwSupplyIAR | null>(null);
  const [mode, setMode] = useState<'add' | 'edit'>('add');

  useEffect(() => { fetchSupplyIARs(); }, []);

  const handleAdd = () => { setSelectedRecord(null); setMode('add'); setIsEditOpen(true); };
  const handleEdit = (record: VwSupplyIAR) => { setSelectedRecord(record); setMode('edit'); setIsEditOpen(true); };
  const handleDelete = (record: VwSupplyIAR) => { setSelectedRecord(record); setIsDeleteOpen(true); };
  const handleView = (record: VwSupplyIAR) => { setSelectedRecord(record); setIsViewOpen(true); };
  
  const handleApproveClick = (record: VwSupplyIAR) => {
    setSelectedRecord(record);
    setIsApproveOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (selectedRecord) {
      const fullPayload = {
        ...selectedRecord,
        vendorId: selectedRecord.vendor?.id,
        officeId: selectedRecord.office?.id,
        divisionId: selectedRecord.division?.id,
        isApproved: true,
        isActive: selectedRecord.isActive ?? true
      };
      
      await updateSupplyIAR(selectedRecord.id, fullPayload);
      setIsApproveOpen(false);
    }
  };

  const handleSave = async (data: any) => {
    if (mode === 'add') await addSupplyIAR(data);
    else if (selectedRecord) await updateSupplyIAR(selectedRecord.id, data);
    setIsEditOpen(false);
  };

  return (
    <>
      <SupplyIARTable 
        data={iars} 
        onAdd={handleAdd} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
        onView={handleView}
        onApprove={handleApproveClick}
      />

      <SupplyIAREditModal open={isEditOpen} onOpenChange={setIsEditOpen} mode={mode} record={selectedRecord} onSubmit={handleSave} />
      
      <SupplyIARDeleteModal open={isDeleteOpen} onOpenChange={setIsDeleteOpen} record={selectedRecord} onConfirm={async () => { if(selectedRecord) await deleteSupplyIAR(selectedRecord.id); setIsDeleteOpen(false); }} />
      
      <SupplyIARApproveModal 
        open={isApproveOpen} 
        onOpenChange={setIsApproveOpen} 
        record={selectedRecord} 
        onConfirm={handleConfirmApprove} 
      />

      <SupplyIARViewModal open={isViewOpen} onOpenChange={setIsViewOpen} record={selectedRecord} />
    </>
  );
};