// src/components/contract-management/vendor/VendorTabContent.tsx
import { useState, useEffect, useMemo } from 'react';
import { useVendor, useSupplyItem } from '@/hooks';
import { VendorTable } from './VendorTable';
import { VendorEditModal } from './VendorEditModal';
import { VendorDeleteModal } from './VendorDeleteModal';
import { VendorLinkedItemsModal } from './VendorLinkedItemsModal';
import { Vendor } from '@/types';

export const VendorTabContent = () => {
  const { vendors, loading, fetchVendors } = useVendor();
  const { vwSupplies, fetchSupplyItems } = useSupplyItem(); 

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLinkedItemsOpen, setIsLinkedItemsOpen] = useState(false);

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [mode, setMode] = useState<'add'|'edit'>('add');

  useEffect(() => { 
    fetchVendors();
    fetchSupplyItems(); 
  }, []);

  const usageCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    if (!vwSupplies) return counts;

    vwSupplies.forEach(item => {
        const vendorId = item.vendor?.id;
        if (vendorId) {
            counts[vendorId] = (counts[vendorId] || 0) + 1;
        }
    });
    return counts;
  }, [vwSupplies]);

  const linkedItems = useMemo(() => {
    if (!selectedVendor || !vwSupplies) return [];
    return vwSupplies.filter(item => item.vendor?.id === selectedVendor.id);
  }, [selectedVendor, vwSupplies]);

  const handleAdd = () => { setSelectedVendor(null); setMode('add'); setIsEditOpen(true); };
  const handleEdit = (vendor: Vendor) => { setSelectedVendor(vendor); setMode('edit'); setIsEditOpen(true); };
  const handleDelete = (vendor: Vendor) => { setSelectedVendor(vendor); setIsDeleteOpen(true); };
  
  const handleViewLinkedItems = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsLinkedItemsOpen(true);
  };

  if (loading && vendors.length === 0) return <p className="py-12 text-center text-muted-foreground">Loading vendors...</p>;

  return (
    <>
      <VendorTable 
        data={vendors} 
        usageCounts={usageCounts} 
        onAdd={handleAdd} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        onViewLinkedItems={handleViewLinkedItems}
      />
      
      <VendorEditModal open={isEditOpen} onOpenChange={setIsEditOpen} mode={mode} vendor={selectedVendor} />
      
      {/* UPDATED: Passing 'vendor' instead of 'vendorId' */}
      <VendorDeleteModal 
        open={isDeleteOpen} 
        onOpenChange={setIsDeleteOpen} 
        vendor={selectedVendor} 
      />
      
      <VendorLinkedItemsModal 
        open={isLinkedItemsOpen} 
        onOpenChange={setIsLinkedItemsOpen} 
        vendor={selectedVendor} 
        linkedItems={linkedItems} 
      />
    </>
  );
};