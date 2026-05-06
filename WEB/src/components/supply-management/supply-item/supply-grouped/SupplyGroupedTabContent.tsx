// src/components/supply-management/supply-grouped/SupplyGroupedTabContent.tsx
import { useState, useEffect } from 'react';
import { useSupplyItem } from '@/hooks';
import { SupplyGroupedItemTable } from './SupplyGroupedItemTable';
import { SupplyGroupItemsModal } from './SupplyGroupItemsModal';
import { VwSupplyGroupedItem } from '@/types';

export const SupplyGroupedTabContent = () => {
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

  const handleView = (item: VwSupplyGroupedItem) => {
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