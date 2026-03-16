import { useState, useEffect } from 'react';
import { useDeliveryRecordStore } from '@/store/delivery';
import { DeliveryRecordTable } from './DeliveryRecordTable';
import { DeliveryRecordEditModal } from './DeliveryRecordEditModal';
import { DeliveryRecordDeleteModal } from './DeliveryRecordDeleteModal';
import { DeliveryRecordViewModal } from './DeliveryRecordViewModal';
import { VwDeliveryRecord } from '@/types/delivery/delivery';
import { useSupplyIAR } from '@/hooks';

export const DeliveryRecordTabContent = () => {
  const { vwDeliveryRecords, loading, fetchDeliveryRecords, addDeliveryRecord, updateDeliveryRecord, deleteDeliveryRecord } = useDeliveryRecordStore();
  const { iars, fetchSupplyIARs } = useSupplyIAR();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<VwDeliveryRecord | null>(null);
  const [mode, setMode] = useState<'add'|'edit'>('add');

  useEffect(() => {
      fetchDeliveryRecords();
      fetchSupplyIARs();
  }, []);

    const deliveredIarIds = new Set(
        vwDeliveryRecords.map(dr => dr.supplyIAR?.id).filter(id => id !== undefined)
    );

    const availableIars = iars.filter(iar => {
        if (mode === 'edit' && selectedRecord?.supplyIAR?.id === iar.id) return true;
        return !deliveredIarIds.has(iar.id);
    });

  const handleSave = async (data: any) => {
      if (mode === 'add') await addDeliveryRecord(data);
      else await updateDeliveryRecord(selectedRecord!.id, data);
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
      <DeliveryRecordTable data={vwDeliveryRecords} onAdd={() => { setSelectedRecord(null); setMode('add'); setIsEditOpen(true); }} onEdit={(r) => { setSelectedRecord(r); setMode('edit'); setIsEditOpen(true); }} onDelete={(r) => { setSelectedRecord(r); setIsDeleteOpen(true); }} onView={(r) => { setSelectedRecord(r); setIsViewOpen(true); }} />
      <DeliveryRecordEditModal open={isEditOpen} onOpenChange={setIsEditOpen} mode={mode} record={selectedRecord} availableIars={availableIars} onSubmit={handleSave} />
      <DeliveryRecordDeleteModal open={isDeleteOpen} onOpenChange={setIsDeleteOpen} record={selectedRecord} onConfirm={handleConfirmDelete} />
      <DeliveryRecordViewModal open={isViewOpen} onOpenChange={setIsViewOpen} record={selectedRecord} />
    </>
  );
};