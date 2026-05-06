import { useState, useEffect, useCallback } from 'react';
import { useDeliveryRecordStore } from '@/store/delivery';
import { DeliveryRecordTable } from './DeliveryRecordTable';
import { DeliveryRecordEditModal } from './DeliveryRecordEditModal';
import { DeliveryRecordDeleteModal } from './DeliveryRecordDeleteModal';
import { DeliveryRecordViewModal } from './DeliveryRecordViewModal';
import { DeliveryRecordProofUploadModal } from './DeliveryRecordProofUploadModal';
import { VwDeliveryRecord } from '@/types/delivery/delivery';
import { useSupplyIARStore } from '@/store/supply';

export const DeliveryRecordTabContent = () => {
    const vwDeliveryRecords = useDeliveryRecordStore(state => state.vwDeliveryRecords);
    const loading = useDeliveryRecordStore(state => state.loading);
    const totalCount = useDeliveryRecordStore(state => state.totalCount);
    const page = useDeliveryRecordStore(state => state.page);
    const pageSize = useDeliveryRecordStore(state => state.pageSize);
    const searchQuery = useDeliveryRecordStore(state => state.searchQuery);
    const status = useDeliveryRecordStore(state => state.status);

    const fetchDeliveryRecords = useDeliveryRecordStore(state => state.fetchDeliveryRecords);
    const addDeliveryRecord = useDeliveryRecordStore(state => state.addDeliveryRecord);
    const updateDeliveryRecord = useDeliveryRecordStore(state => state.updateDeliveryRecord);
    const deleteDeliveryRecord = useDeliveryRecordStore(state => state.deleteDeliveryRecord);
    const uploadProof = useDeliveryRecordStore(state => state.uploadProof);

    const setPage = useDeliveryRecordStore(state => state.setPage);
    const setSearchQuery = useDeliveryRecordStore(state => state.setSearchQuery);
    const setStatus = useDeliveryRecordStore(state => state.setStatus);
    
    const fetchSupplyIARs = useSupplyIARStore(state => state.fetchSupplyIARs);
    
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isUploadProofOpen, setIsUploadProofOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<VwDeliveryRecord | null>(null);
    const [mode, setMode] = useState<'add'|'edit'>('add');

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(debouncedSearch);
        }, 500);
        return () => clearTimeout(timer);
    }, [debouncedSearch, setSearchQuery]);

    useEffect(() => {
        fetchDeliveryRecords();
    }, [fetchDeliveryRecords, page, searchQuery, status]);

    useEffect(() => {
        fetchSupplyIARs();
    }, [fetchSupplyIARs]);

    const handleParamsChange = useCallback((params: { page?: number; search?: string; status?: string }) => {
        if (params.page !== undefined) setPage(params.page);
        if (params.search !== undefined) setDebouncedSearch(params.search);
        if (params.status !== undefined) setStatus(params.status);
    }, [setPage, setStatus]);

    const handleSave = async (data: any) => {
        if (mode === 'add') await addDeliveryRecord(data);
        else await updateDeliveryRecord(selectedRecord!.id, data);
    };

    const handleConfirmDelete = async () => {
        if (selectedRecord) {
            await deleteDeliveryRecord(selectedRecord.id);
            setIsDeleteOpen(false);
        }
    };

    const handleUploadProof = async (id: number, file: File) => {
        await uploadProof(id, file);
    };

    return (
        <>
            <DeliveryRecordTable
                data={vwDeliveryRecords}
                totalCount={totalCount}
                page={page}
                pageSize={pageSize}
                searchQuery={debouncedSearch}
                statusFilter={status}
                loading={loading}
                onAdd={() => { setMode('add'); setSelectedRecord(null); setIsEditOpen(true); }}
                onEdit={(record) => { setMode('edit'); setSelectedRecord(record); setIsEditOpen(true); }}
                onDelete={(record) => { setSelectedRecord(record); setIsDeleteOpen(true); }}
                onView={(record) => { setSelectedRecord(record); setIsViewOpen(true); }}
                onUploadProof={(record) => { setSelectedRecord(record); setIsUploadProofOpen(true); }}
                onParamsChange={handleParamsChange}
            />
            <DeliveryRecordEditModal open={isEditOpen} onOpenChange={setIsEditOpen} mode={mode} record={selectedRecord} onSubmit={handleSave} />
            <DeliveryRecordDeleteModal open={isDeleteOpen} onOpenChange={setIsDeleteOpen} record={selectedRecord} onConfirm={handleConfirmDelete} />
            <DeliveryRecordViewModal open={isViewOpen} onOpenChange={setIsViewOpen} record={selectedRecord} />

            <DeliveryRecordProofUploadModal
                open={isUploadProofOpen}
                onOpenChange={setIsUploadProofOpen}
                record={selectedRecord}
                onUpload={handleUploadProof}
            />
        </>
    );
};