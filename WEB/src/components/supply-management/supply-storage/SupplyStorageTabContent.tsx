// src/components/supply-management/supply-storage/SupplyStorageTabContent.tsx
import { useState, useEffect, useMemo } from 'react';
import { useSupplyStorageLocation, useSupplyItem } from '@/hooks';
import { SupplyStorageTable } from './SupplyStorageTable';
import { SupplyStorageEditModal } from './SupplyStorageEditModal';
import { SupplyStorageDeleteModal } from './SupplyStorageDeleteModal';
// Import new modal
import { SupplyStorageLinkedItemsModal } from './SupplyStorageLinkedItemsModal';
import { SupplyStorageLocation } from '@/types';

export const SupplyStorageTabContent = () => {
  const { storagelocations, loading, fetchSupplyStorageLocations } = useSupplyStorageLocation();
  const { vwSupplies, fetchSupplyItems } = useSupplyItem();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  // State for Linked Items Modal
  const [isLinkedItemsOpen, setIsLinkedItemsOpen] = useState(false);

  const [selectedStorage, setSelectedStorage] = useState<SupplyStorageLocation | null>(null);
  const [mode, setMode] = useState<'add'|'edit'>('add');

  useEffect(() => { 
    fetchSupplyStorageLocations(); 
    fetchSupplyItems();
  }, []);

  // Calculate usage counts
  const usageCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    if (!vwSupplies) return counts;

    vwSupplies.forEach(item => {
        // Use strict ID checking
        const locId = item.storageLocation?.id;
        if (locId) {
            counts[locId] = (counts[locId] || 0) + 1;
        }
    });
    return counts;
  }, [vwSupplies]);

  // Filter items for the specific location selected
  const linkedItems = useMemo(() => {
    if (!selectedStorage || !vwSupplies) return [];
    // Use strict ID checking
    return vwSupplies.filter(item => item.storageLocation?.id === selectedStorage.id);
  }, [selectedStorage, vwSupplies]);

  const handleAdd = () => { setSelectedStorage(null); setMode('add'); setIsEditOpen(true); };
  const handleEdit = (item: SupplyStorageLocation) => { setSelectedStorage(item); setMode('edit'); setIsEditOpen(true); };
  const handleDelete = (item: SupplyStorageLocation) => { setSelectedStorage(item); setIsDeleteOpen(true); };

  // Handle viewing linked items
  const handleViewLinkedItems = (storage: SupplyStorageLocation) => {
    setSelectedStorage(storage);
    setIsLinkedItemsOpen(true);
  };

  if (loading && storagelocations.length === 0) return <p className="py-12 text-center text-muted-foreground">Loading storage locations...</p>;

  return (
    <>
      <SupplyStorageTable 
        data={storagelocations} 
        usageCounts={usageCounts} 
        onAdd={handleAdd} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
        onViewLinkedItems={handleViewLinkedItems} // <--- Pass handler
      />

      <SupplyStorageEditModal open={isEditOpen} onOpenChange={setIsEditOpen} mode={mode} storage={selectedStorage} />
      <SupplyStorageDeleteModal open={isDeleteOpen} onOpenChange={setIsDeleteOpen} storage={selectedStorage} />
      
      {/* New Modal */}
      <SupplyStorageLinkedItemsModal
        open={isLinkedItemsOpen}
        onOpenChange={setIsLinkedItemsOpen}
        storage={selectedStorage}
        linkedItems={linkedItems}
      />
    </>
  );
};