// src/components/supply-management/supply-item/SupplyItemTabContent.tsx
import { useState, useEffect } from 'react';
import { useSupplyItem } from '@/hooks';
import { SupplyItemTable } from '..';
import { SupplyItemEditModal } from '..';
import { SupplyItemDeleteModal } from '..';
import { SupplyItem, VwSupplyItem } from '@/types';

export const SupplyItemTabContent = () => {
  const { vwSupplies, loading, fetchSupplyItems } = useSupplyItem();
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VwSupplyItem | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  useEffect(() => {
    fetchSupplyItems();
  }, []);

  const handleAdd = () => {
    setSelectedItem(null);
    setModalMode('add');
    setIsEditOpen(true);
  };

  const handleEdit = (item: VwSupplyItem) => {
    setSelectedItem(item);
    setModalMode('edit');
    setIsEditOpen(true);
  };

  const handleDelete = (item: VwSupplyItem) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  if (loading && vwSupplies.length === 0) {
    return <p className="text-center text-gray-500 py-12">Loading inventory...</p>;
  }

  return (
    <>
      <SupplyItemTable 
        data={vwSupplies} 
        onAdd={handleAdd} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />

      <SupplyItemEditModal 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        mode={modalMode} 
        supplyItem={selectedItem} 
      />

      <SupplyItemDeleteModal 
        open={isDeleteOpen} 
        onOpenChange={setIsDeleteOpen} 
        supplyItem={selectedItem} 
      />
    </>
  );
};