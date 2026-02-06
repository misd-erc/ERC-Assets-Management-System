import { useState, useEffect } from 'react';
import { useDeliveryRecordStore } from '@/store/delivery'; // Ensure you export this from store
import { DeliveryRecordTable } from './DeliveryRecordTable';
import { DeliveryRecordEditModal } from './DeliveryRecordEditModal';
import { DeliveryRecordDeleteModal } from './DeliveryRecordDeleteModal';
import { DeliveryRecordViewModal } from './DeliveryRecordViewModal';
import { VwDeliveryRecord } from '@/types/delivery/delivery';

export const DeliveryRecordTabContent = () => {
  const { vwDeliveryRecords, loading, fetchDeliveryRecords, addDeliveryRecord, updateDeliveryRecord, deleteDeliveryRecord } = useDeliveryRecordStore();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  const [selectedRecord, setSelectedRecord] = useState<VwDeliveryRecord | null>(null);
  const [mode, setMode] = useState<'add'|'edit'>('add');

  useEffect(() => {
    fetchDeliveryRecords();
  }, []);

  const handleAdd = () => { setSelectedRecord(null); setMode('add'); setIsEditOpen(true); };
  
  const handleEdit = (record: VwDeliveryRecord) => { 
      setSelectedRecord(record); 
      setMode('edit'); 
      setIsEditOpen(true); 
  };

  const handleDelete = (record: VwDeliveryRecord) => { 
      setSelectedRecord(record); 
      setIsDeleteOpen(true); 
  };

  const handleView = (record: VwDeliveryRecord) => {
      setSelectedRecord(record);
      setIsViewOpen(true);
  };

  const handleSave = async (data: any) => {
      if (mode === 'add') {
          await addDeliveryRecord(data);
      } else {
          await updateDeliveryRecord(selectedRecord!.id, data);
      }
  };

  const handleConfirmDelete = async () => {
      if (selectedRecord) {
          await deleteDeliveryRecord(selectedRecord.id);
          setIsDeleteOpen(false);
      }
  };

  if (loading && vwDeliveryRecords.length === 0) return <div className="p-8 text-center text-muted-foreground">Loading records...</div>;

  return (
    <>
      <DeliveryRecordTable 
        data={vwDeliveryRecords} 
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
      />

      <DeliveryRecordEditModal 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        mode={mode} 
        record={selectedRecord}
        onSubmit={handleSave}
      />

      <DeliveryRecordDeleteModal 
        open={isDeleteOpen} 
        onOpenChange={setIsDeleteOpen} 
        record={selectedRecord}
        onConfirm={handleConfirmDelete}
      />

      <DeliveryRecordViewModal 
        open={isViewOpen} 
        onOpenChange={setIsViewOpen} 
        record={selectedRecord} 
      />
    </>
  );
};