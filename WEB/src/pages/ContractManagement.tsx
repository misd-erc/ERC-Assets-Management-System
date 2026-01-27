'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';

import {
  useVendor,
} from '@/hooks';

import {
  Vendor,
} from '@/types';
import { VendorDeleteModal, VendorEditModal, VendorTabContent } from '@/components/contract-management';
import { ContractGeneralHeader } from '@/components/contract-management/ContractGeneralHeader';
import { ContractTabsList } from '@/components/contract-management/ContractTabsList';

const ContractManagement = () => {
  // â”€â”€ Hooks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const {
    vendors,
    searchQuery: vendorSearch,
    fetchVendors,
    loading: VendorLoading,
  } = useVendor();

  // â”€â”€ Dialog state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [vendorDialog, setVendorDialog] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    vendor?: Vendor;
  }>({ open: false, mode: 'add' });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'vendor';
    id?: number;
    name?: string;
  }>({ open: false, type: 'vendor' });

  // â”€â”€ Load data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // â”€â”€ Filter data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filteredVendor = vendors.filter(
    o =>
      o.name.toLowerCase().includes(vendorSearch.toLowerCase())
  );



  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openVendorAdd = () => setVendorDialog({ open: true, mode: 'add' });
  const openVendorEdit = (vendor: Vendor) => setVendorDialog({ open: true, mode: 'edit', vendor });

  const openDelete = (
    type: 'vendor',
    id: number,
    name: string
  ) => setDeleteDialog({ open: true, type, id, name });

  const closeAll = () => {
    setVendorDialog(prev => ({ ...prev, open: false }));
    setDeleteDialog({ open: false, type: 'vendor' });
  };

  const onSuccess = () => {
    closeAll();
    fetchVendors();
  };

  return (
    <div className="p-6 pt-20 space-y-8">
      <ContractGeneralHeader />

      <Tabs defaultValue="vendor">
        <ContractTabsList />

        {/* â”€â”€ OFFICE TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <TabsContent value="vendor" className="space-y-6">
          <VendorTabContent
            data={filteredVendor}
            loading={VendorLoading}
            onAdd={openVendorAdd}
            onEdit={openVendorEdit}
            onDelete={(id, name) => openDelete('vendor', id, name)}
          />
        </TabsContent>

      </Tabs>

      {/* â”€â”€ MODALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <VendorEditModal
        open={vendorDialog.open}
        mode={vendorDialog.mode}
        vendor={vendorDialog.vendor}
        onOpenChange={open => !open && closeAll()}
        onSuccess={onSuccess}
      />

      {/* â”€â”€ DELETE MODAL (Unified) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}

        <VendorDeleteModal
          open={deleteDialog.open}
          onOpenChange={open => !open && closeAll()}
          vendorId={deleteDialog.id}
          vendorName={deleteDialog.name}
        />
    </div>
  );
};

export default ContractManagement;




