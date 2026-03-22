import { useState, useEffect } from 'react';
import { useSupplyIAR } from '@/hooks';
import { SupplyIARTable } from './SupplyIARTable';
import { SupplyIAREditModal } from './SupplyIAREditModal';
import { SupplyIARDeleteModal } from './SupplyIARDeleteModal';
import { SupplyIARViewModal } from './SupplyIARViewModal';
import { SupplyIARApproveModal } from './SupplyIARApproveModal';
import { VwSupplyIAR } from '@/types';
import { VwDeliveryRecord } from '@/types/delivery/delivery';
import { useDeliveryRecordStore } from '@/store/delivery';

export const SupplyIARTabContent = () => {
  const { iars, loading, fetchSupplyIARs, addSupplyIAR, updateSupplyIAR, deleteSupplyIAR } = useSupplyIAR();
  const { vwDeliveryRecords, fetchDeliveryRecords } = useDeliveryRecordStore();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  
  const [selectedRecord, setSelectedRecord] = useState<VwSupplyIAR | null>(null);
  const [selectedDeliveryRecord, setSelectedDeliveryRecord] = useState<VwDeliveryRecord | null>(null);
  const [mode, setMode] = useState<'add' | 'edit'>('add');

  // Fetch IARs and delivery records when the component mounts
  useEffect(() => {
    fetchSupplyIARs();
    fetchDeliveryRecords();
  }, [fetchSupplyIARs, fetchDeliveryRecords]);

  const handleAdd = () => { 
    setSelectedRecord(null); 
    setMode('add'); 
    setIsEditOpen(true); 
  };

  const handleEdit = (record: VwSupplyIAR) => { 
    setSelectedRecord(record); 
    setMode('edit'); 
    setIsEditOpen(true); 
  };

  const handleDelete = (record: VwSupplyIAR) => { 
    setSelectedRecord(record); 
    setIsDeleteOpen(true); 
  };

  const handleView = (record: VwSupplyIAR) => {
    setSelectedRecord(record);
    // Find the delivery record linked to this IAR
    const match = vwDeliveryRecords.find(dr => dr.supplyIAR?.id === record.id);
    setSelectedDeliveryRecord(match || null);
    setIsViewOpen(true);
  };
  
  const handleApproveClick = (record: VwSupplyIAR) => {
    setSelectedRecord(record);
    // Also find the delivery record here, so the approve modal has it immediately
    const match = vwDeliveryRecords.find(dr => dr.supplyIAR?.id === record.id);
    setSelectedDeliveryRecord(match || null);
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

      <SupplyIAREditModal 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        mode={mode} 
        record={selectedRecord} 
        onSubmit={handleSave} 
      />
      
      <SupplyIARDeleteModal 
        open={isDeleteOpen} 
        onOpenChange={setIsDeleteOpen} 
        record={selectedRecord} 
        onConfirm={async () => { 
          if (selectedRecord) await deleteSupplyIAR(selectedRecord.id); 
          setIsDeleteOpen(false); 
        }} 
      />
      
      <SupplyIARApproveModal 
        open={isApproveOpen} 
        onOpenChange={setIsApproveOpen} 
        record={selectedRecord}
        deliveryRecord={selectedDeliveryRecord}
        onConfirm={handleConfirmApprove} 
      />

      <SupplyIARViewModal 
        open={isViewOpen} 
        onOpenChange={setIsViewOpen} 
        record={selectedRecord} 
        deliveryRecord={selectedDeliveryRecord} 
      />
    </>
  );
};