// src/components/supply-management/stock-card/StockCardTabContent.tsx
import { useState, useEffect } from 'react';
import { useSupplyItem } from '@/hooks';
import { SupplyGroupedItemTable } from '../supply-item/supply-grouped/SupplyGroupedItemTable';
import { StockCardModal } from './StockCardModal';
import { VwSupplyGroupedItem } from '@/types';

export const StockCardTabContent = () => {
  const { vwSupplyGroups, totalGroups, loading, fetchSupplyGroupedItems } = useSupplyItem();
  const [selectedGroup, setSelectedGroup] = useState<VwSupplyGroupedItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [params, setParams] = useState({
    page: 1,
    search: '',
    status: 'all'
  });

  useEffect(() => {
    fetchSupplyGroupedItems(
      params.page,
      10,
      params.search,
      params.status === 'all' ? undefined : params.status
    );
  }, [params, fetchSupplyGroupedItems]);

  const handleViewStockCard = (item: VwSupplyGroupedItem) => {
    setSelectedGroup(item);
    setModalOpen(true);
  };

  return (
    <>
      <SupplyGroupedItemTable
        data={vwSupplyGroups}
        totalCount={totalGroups}
        page={params.page}
        searchQuery={params.search}
        statusFilter={params.status}
        onParamsChange={setParams}
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