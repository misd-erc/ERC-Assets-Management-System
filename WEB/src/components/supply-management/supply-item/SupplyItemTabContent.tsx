// src/components/supply-management/supply-item/SupplyItemTabContent.tsx
import { useState, useEffect } from 'react';
import { useSupplyItem } from '@/hooks';
import { useSupplyStorageLocationStore } from '@/store/supply';
import { SupplyItemTable } from './SupplyItemTable';
import { SupplyItemEditModal } from './SupplyItemEditModal';
import { SupplyItemDeleteModal } from './SupplyItemDeleteModal';
import { VwSupplyItem, Vendor } from '@/types';
import { getVendors } from '@/api';

const PAGE_SIZE = 100;

export const SupplyItemTabContent = () => {
  const { vwSupplies, totalSupplies, loading, fetchSupplyItems, categories, fetchCategories, deleteSupplyItems } = useSupplyItem();
  const { storagelocations, fetchSupplyStorageLocations } = useSupplyStorageLocationStore();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VwSupplyItem | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');

  const [params, setParams] = useState({
    page: 1,
    search: '',
    category: 'all',
    status: 'all',
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

  useEffect(() => {
    // Find the category ID if a category filter is selected
    const selectedCategory = categories.find(c => c.name === params.category);

    fetchSupplyItems(
      params.page,
      PAGE_SIZE,
      params.search,
      selectedCategory?.id,
      params.status === 'all' ? undefined : params.status,
      params.storageId === 'all' ? undefined : Number(params.storageId),
      params.vendorId === 'all' ? undefined : Number(params.vendorId)
    );
  }, [params, fetchSupplyItems, categories]);

  const refreshItems = async () => {
    const selectedCategory = categories.find(c => c.name === params.category);

    await fetchSupplyItems(
      params.page,
      PAGE_SIZE,
      params.search,
      selectedCategory?.id,
      params.status === 'all' ? undefined : params.status,
      params.storageId === 'all' ? undefined : Number(params.storageId),
      params.vendorId === 'all' ? undefined : Number(params.vendorId)
    );
  };

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

  const handleView = (item: VwSupplyItem) => {
    setSelectedItem(item);
    setModalMode('view');
    setIsEditOpen(true);
  };

  const handleDelete = (item: VwSupplyItem) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleBatchDelete = async (ids: number[]) => {
    await deleteSupplyItems(ids);
    await refreshItems();
  };

  if (loading && vwSupplies.length === 0) {
    return <p className="text-center text-gray-500 py-12">Loading inventory...</p>;
  }

  return (
    <>
      <SupplyItemTable 
        data={vwSupplies} 
        totalCount={totalSupplies}
        page={params.page}
        searchQuery={params.search}
        categoryFilter={params.category}
        statusFilter={params.status}
        storageFilter={params.storageId}
        vendorFilter={params.vendorId}
        allCategories={categories}
        storageLocations={storagelocations}
        allVendors={vendors}
        onParamsChange={(newParams) => setParams(prev => ({ ...prev, ...newParams }))}
        loading={loading}
        onAdd={handleAdd} 
        onView={handleView}
        onEdit={handleEdit} 
        onDelete={handleDelete} 
        onBatchDelete={handleBatchDelete}
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
        onSuccess={refreshItems}
      />
    </>
  );
};
