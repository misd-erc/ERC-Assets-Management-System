// src/components/supply-management/supply-grouped/SupplyGroupedTabContent.tsx
import { useState, useEffect } from 'react';
import { useSupplyItem } from '@/hooks';
import { useSupplyStorageLocationStore } from '@/store/supply';
import { SupplyGroupedItemTable } from './SupplyGroupedItemTable';
import { SupplyGroupItemsModal } from './SupplyGroupItemsModal';
import { SupplyItemEditModal } from '../SupplyItemEditModal';
import { VwSupplyGroupedItem } from '@/types';
import { getVendors } from '@/api';

const PAGE_SIZE = 100;

export const SupplyGroupedTabContent = () => {
  const { vwSupplyGroups, totalGroups, loading, fetchSupplyGroupedItems, categories, fetchCategories } = useSupplyItem();
  const { storagelocations, fetchSupplyStorageLocations } = useSupplyStorageLocationStore();
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<VwSupplyGroupedItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [params, setParams] = useState({
    page: 1,
    search: '',
    status: 'all',
    category: 'all',
    storageId: 'all',
    vendorId: 'all'
  });

  useEffect(() => {
    fetchSupplyStorageLocations();
    fetchCategories();
    getVendors()
      .then(res => setVendors(res || []))
      .catch(() => setVendors([]));
  }, [fetchSupplyStorageLocations, fetchCategories]);

  const refreshItems = async () => {
    const selectedCategory = categories.find(c => c.name === params.category);

    await fetchSupplyGroupedItems(
      params.page,
      PAGE_SIZE,
      params.search,
      params.status === 'all' ? undefined : params.status,
      selectedCategory?.id,
      params.storageId === 'all' ? undefined : Number(params.storageId),
      params.vendorId === 'all' ? undefined : Number(params.vendorId)
    );
  };

  useEffect(() => {
    const selectedCategory = categories.find(c => c.name === params.category);

    fetchSupplyGroupedItems(
      params.page,
      PAGE_SIZE,
      params.search,
      params.status === 'all' ? undefined : params.status,
      selectedCategory?.id,
      params.storageId === 'all' ? undefined : Number(params.storageId),
      params.vendorId === 'all' ? undefined : Number(params.vendorId)
    );
  }, [params, fetchSupplyGroupedItems, categories]);

  const handleView = (item: VwSupplyGroupedItem) => {
    setSelectedGroup(item);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setIsAddModalOpen(true);
  };

  return (
    <>
      <SupplyGroupedItemTable
        data={vwSupplyGroups}
        totalCount={totalGroups}
        page={params.page}
        searchQuery={params.search}
        statusFilter={params.status}
        categoryFilter={params.category}
        storageFilter={params.storageId}
        vendorFilter={params.vendorId}
        allCategories={categories}
        storageLocations={storagelocations}
        allVendors={vendors}
        title="Grouped Inventory"
        description="Overview of supply items grouped by item code"
        onParamsChange={(newParams) => setParams(prev => ({ ...prev, ...newParams }))}
        onView={handleView}
        onAdd={handleAdd}
        viewActionLabel="View"
        loading={loading}
      />
      <SupplyGroupItemsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        groupedItem={selectedGroup}
      />
      <SupplyItemEditModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        mode="add"
        supplyItem={null}
        onSuccess={refreshItems}
      />
    </>
  );
};
