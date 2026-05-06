import { useState, useEffect, useCallback } from 'react';
import { useSupplyIARStore } from '@/store/supply'; // Use store directly
import { useOfficeStore, useDivisionStore } from '@/store/office';
import { getVendors } from '@/api/contract-management/vendorApi';
import { SupplyIARTable } from './SupplyIARTable';
import { SupplyIAREditModal } from './SupplyIAREditModal';
import { SupplyIARDeleteModal } from './SupplyIARDeleteModal';
import { SupplyIARViewModal } from './SupplyIARViewModal';
import { SupplyIARApproveModal } from './SupplyIARApproveModal';
import { VwSupplyIAR, Vendor } from '@/types';
import { VwDeliveryRecord } from '@/types/delivery/delivery';
import { useDeliveryRecordStore } from '@/store/delivery';

export const SupplyIARTabContent = () => {
  // Use specific selectors for stability
  const iars = useSupplyIARStore(state => state.iars);
  const loading = useSupplyIARStore(state => state.loading);
  const totalIars = useSupplyIARStore(state => state.totalIars);
  const page = useSupplyIARStore(state => state.page);
  const pageSize = useSupplyIARStore(state => state.pageSize);
  const searchQuery = useSupplyIARStore(state => state.searchQuery);
  const status = useSupplyIARStore(state => state.status);
  const vendorId = useSupplyIARStore(state => state.vendorId);
  const officeId = useSupplyIARStore(state => state.officeId);
  const divisionId = useSupplyIARStore(state => state.divisionId);

  const fetchSupplyIARs = useSupplyIARStore(state => state.fetchSupplyIARs);
  const addSupplyIAR = useSupplyIARStore(state => state.addSupplyIAR);
  const updateSupplyIAR = useSupplyIARStore(state => state.updateSupplyIAR);
  const deleteSupplyIAR = useSupplyIARStore(state => state.deleteSupplyIAR);

  const setPage = useSupplyIARStore(state => state.setPage);
  const setSearchQuery = useSupplyIARStore(state => state.setSearchQuery);
  const setStatus = useSupplyIARStore(state => state.setStatus);
  const setVendorId = useSupplyIARStore(state => state.setVendorId);
  const setOfficeId = useSupplyIARStore(state => state.setOfficeId);
  const setDivisionId = useSupplyIARStore(state => state.setDivisionId);

  const { vwDeliveryRecords, fetchDeliveryRecords } = useDeliveryRecordStore();
  const { vwOffices, fetchOffices } = useOfficeStore();
  const { vwDivisions, fetchDivisions } = useDivisionStore();
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  
  const [selectedRecord, setSelectedRecord] = useState<VwSupplyIAR | null>(null);
  const [selectedDeliveryRecord, setSelectedDeliveryRecord] = useState<VwDeliveryRecord | null>(null);
  const [mode, setMode] = useState<'add' | 'edit'>('add');

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(debouncedSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [debouncedSearch, setSearchQuery]);

  useEffect(() => {
    fetchSupplyIARs();
  }, [fetchSupplyIARs, page, searchQuery, status, vendorId, officeId, divisionId]);

  useEffect(() => {
    fetchDeliveryRecords();
    fetchOffices();
    fetchDivisions();
    getVendors().then(setVendors);
  }, [fetchDeliveryRecords, fetchOffices, fetchDivisions]);

  const handleParamsChange = useCallback((params: { page?: number; search?: string; status?: string; vendorId?: number; officeId?: number; divisionId?: number }) => {
    if (params.page !== undefined) setPage(params.page);
    if (params.search !== undefined) setDebouncedSearch(params.search);
    if (params.status !== undefined) setStatus(params.status);
    if (params.vendorId !== undefined || params.vendorId === undefined) setVendorId(params.vendorId);
    if (params.officeId !== undefined || params.officeId === undefined) setOfficeId(params.officeId);
    if (params.divisionId !== undefined || params.divisionId === undefined) setDivisionId(params.divisionId);
  }, [setPage, setStatus, setVendorId, setOfficeId, setDivisionId]);

  const handleAdd = () => { 
    setSelectedRecord(null); 
    setMode('add'); 
    setIsEditOpen(true); 
  };

  const handleEdit = (record: VwSupplyIAR) => { 
    setSelectedRecord(record); 
    setMode('edit'); 
    setIsEditOpen(true); 
  };

  const handleDelete = (record: VwSupplyIAR) => { 
    setSelectedRecord(record); 
    setIsDeleteOpen(true); 
  };

  const handleView = (record: VwSupplyIAR) => {
    setSelectedRecord(record);
    const match = vwDeliveryRecords.find(dr => dr.id === record.recordId);
    setSelectedDeliveryRecord(match || null);
    setIsViewOpen(true);
  };
  
  const handleApproveClick = (record: VwSupplyIAR) => {
    setSelectedRecord(record);
    const match = vwDeliveryRecords.find(dr => dr.id === record.recordId);
    setSelectedDeliveryRecord(match || null);
    setIsApproveOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (selectedRecord) {
      const fullPayload = {
        ...selectedRecord,
        vendorId: selectedRecord.vendor?.id,
        officeId: selectedRecord.office?.id,
        divisionId: selectedRecord.division?.id,
        deliveryRecordId: selectedRecord.recordId,
        isApproved: true,
        isActive: selectedRecord.isActive ?? true
      };
      
      await updateSupplyIAR(selectedRecord.id, fullPayload);
      setIsApproveOpen(false);
    }
  };

  const handleSave = async (data: any) => {
    if (mode === 'add') await addSupplyIAR(data);
    else if (selectedRecord) await updateSupplyIAR(selectedRecord.id, data);
    setIsEditOpen(false);
  };

  const availableDeliveryRecords = vwDeliveryRecords.filter(dr => {
    const isUnreceived = !dr.isReceived;
    const isLinkedToOtherIAR = iars.some(iar => 
      iar.recordId === dr.id && 
      iar.id !== selectedRecord?.id
    );
    return isUnreceived && !isLinkedToOtherIAR;
  });

  return (
    <>
      <SupplyIARTable 
        data={iars} 
        totalCount={totalIars}
        page={page}
        pageSize={pageSize}
        searchQuery={debouncedSearch}
        statusFilter={status}
        vendorFilter={vendorId}
        officeFilter={officeId}
        divisionFilter={divisionId}
        vendors={vendors}
        offices={vwOffices}
        divisions={vwDivisions}
        loading={loading}
        onAdd={handleAdd} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
        onView={handleView}
        onApprove={handleApproveClick}
        onParamsChange={handleParamsChange}
      />

      <SupplyIAREditModal 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        mode={mode} 
        record={selectedRecord} 
        onSubmit={handleSave}
        availableDeliveryRecords={availableDeliveryRecords}
      />
      
      <SupplyIARDeleteModal 
        open={isDeleteOpen} 
        onOpenChange={setIsDeleteOpen} 
        record={selectedRecord} 
        onConfirm={async () => { 
          if (selectedRecord) await deleteSupplyIAR(selectedRecord.id); 
          setIsDeleteOpen(false); 
        }} 
      />
      
      <SupplyIARApproveModal 
        open={isApproveOpen} 
        onOpenChange={setIsApproveOpen} 
        record={selectedRecord}
        deliveryRecord={selectedDeliveryRecord}
        onConfirm={handleConfirmApprove} 
      />

      <SupplyIARViewModal 
        open={isViewOpen} 
        onOpenChange={setIsViewOpen} 
        record={selectedRecord} 
        deliveryRecord={selectedDeliveryRecord} 
      />
    </>
  );
};