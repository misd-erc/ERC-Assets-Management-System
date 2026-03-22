// src/components/supply-management/supply-grouped/SupplyGroupedTabContent.tsx
import { useState, useEffect } from 'react';
import { useSupplyItem } from '@/hooks';
import { SupplyGroupedItemTable } from './SupplyGroupedItemTable';
import { SupplyGroupItemsModal } from './SupplyGroupItemsModal';
import { VwSupplyGroupedItem } from '@/types';

export const SupplyGroupedTabContent = () => {
  const { vwSupplyGroups, loading, fetchSupplyGroupedItems } = useSupplyItem();
  const [selectedGroup, setSelectedGroup] = useState<VwSupplyGroupedItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchSupplyGroupedItems();
  }, [fetchSupplyGroupedItems]);

  const handleView = (item: VwSupplyGroupedItem) => {
    setSelectedGroup(item);
    setModalOpen(true);
  };

  if (loading && vwSupplyGroups.length === 0) {
    return <p className="text-center text-gray-500 py-12">Loading grouped items...</p>;
  }

  return (
    <>
      <SupplyGroupedItemTable
        data={vwSupplyGroups}
        onView={handleView}
        loading={loading}
      />
      <SupplyGroupItemsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        groupedItem={selectedGroup}
      />
    </>
  );
};