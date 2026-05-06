import { useState, useEffect } from 'react';
import { useSupplyItem } from '@/hooks';
import { SupplyGroupedItemTable } from '../supply-item/supply-grouped/SupplyGroupedItemTable';
import { StockCardModal } from './StockCardModal';
import { VwSupplyGroupedItem } from '@/types';
import { useSupplyStorageLocationStore } from '@/store/supply';
import { getVendors } from '@/api';

export const StockCardTabContent = () => {
  const { vwSupplyGroups, totalGroups, loading, fetchSupplyGroupedItems, categories, fetchCategories } = useSupplyItem();
  const { storagelocations, fetchSupplyStorageLocations } = useSupplyStorageLocationStore();
  const [vendors, setVendors] = useState<any[]>([]);

  const [selectedGroup, setSelectedGroup] = useState<VwSupplyGroupedItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [params, setParams] = useState({
    page: 1,
    search: '',
    status: 'all',
    category: 'all',
    storageId: 'all',
    vendorId: 'all'
  });

  useEffect(() => {
    fetchCategories();
    fetchSupplyStorageLocations();
    getVendors().then(res => setVendors(res || []));
  }, [fetchCategories, fetchSupplyStorageLocations]);

  useEffect(() => {
    // Find the category ID if a category filter is selected
    const selectedCategory = categories.find(c => c.name === params.category);

    fetchSupplyGroupedItems(
      params.page,
      10,
      params.search,
      params.status === 'all' ? undefined : params.status,
      selectedCategory?.id,
      params.storageId === 'all' ? undefined : Number(params.storageId),
      params.vendorId === 'all' ? undefined : Number(params.vendorId)
    );
  }, [params, fetchSupplyGroupedItems, categories]);

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
        categoryFilter={params.category}
        storageFilter={params.storageId}
        vendorFilter={params.vendorId}
        allCategories={categories}
        storageLocations={storagelocations}
        allVendors={vendors}
        onParamsChange={(newParams) => setParams(prev => ({ ...prev, ...newParams }))}
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