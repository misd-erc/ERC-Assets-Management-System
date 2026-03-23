// src/components/supply-management/stock-card/StockCardTabContent.tsx
import { useState, useEffect } from 'react';
import { useSupplyItem } from '@/hooks';
import { SupplyGroupedItemTable } from '../supply-item/supply-grouped/SupplyGroupedItemTable';
import { StockCardModal } from './StockCardModal';
import { VwSupplyGroupedItem } from '@/types';

export const StockCardTabContent = () => {
  const { vwSupplyGroups, loading, fetchSupplyGroupedItems } = useSupplyItem();
  const [selectedGroup, setSelectedGroup] = useState<VwSupplyGroupedItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchSupplyGroupedItems();
  }, [fetchSupplyGroupedItems]);

  const handleViewStockCard = (item: VwSupplyGroupedItem) => {
    setSelectedGroup(item);
    setModalOpen(true);
  };

  if (loading && vwSupplyGroups.length === 0) {
    return <p className="text-center text-gray-500 py-12">Loading stock cards...</p>;
  }

  return (
    <>
      <SupplyGroupedItemTable
        data={vwSupplyGroups}
        onView={handleViewStockCard}
        loading={loading}
      />
      <StockCardModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        stockNumber={selectedGroup?.code || ''}
        description={selectedGroup?.description || ''}
      />
    </>
  );
};