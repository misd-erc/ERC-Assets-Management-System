// src/components/supply-management/supply-storage/SupplyStorageTabContent.tsx
import { useState, useEffect } from 'react';
import { useSupplyStorageLocation } from '@/hooks';
import { SupplyStorageTable } from '..';
import { SupplyStorageEditModal } from '..';
import { SupplyStorageDeleteModal } from '..';
import { SupplyStorageLocation } from '@/types';

export const SupplyStorageTabContent = () => {
  const { storagelocations, loading, fetchSupplyStorageLocations } = useSupplyStorageLocation();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState<SupplyStorageLocation | null>(null);
  const [mode, setMode] = useState<'add'|'edit'>('add');

  useEffect(() => { fetchSupplyStorageLocations(); }, []);

  const handleAdd = () => { setSelectedStorage(null); setMode('add'); setIsEditOpen(true); };
  const handleEdit = (item: SupplyStorageLocation) => { setSelectedStorage(item); setMode('edit'); setIsEditOpen(true); };
  const handleDelete = (item: SupplyStorageLocation) => { setSelectedStorage(item); setIsDeleteOpen(true); };

  if (loading && storagelocations.length === 0) return <p className="py-12 text-center text-muted-foreground">Loading storage locations...</p>;

  return (
    <>
      <SupplyStorageTable data={storagelocations} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} />
      <SupplyStorageEditModal open={isEditOpen} onOpenChange={setIsEditOpen} mode={mode} storage={selectedStorage} />
      <SupplyStorageDeleteModal open={isDeleteOpen} onOpenChange={setIsDeleteOpen} storage={selectedStorage} />
    </>
  );
};