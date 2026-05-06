// src/components/supply-management/ris/SupplyRISTabContent.tsx
import { useState, useEffect } from 'react';
import { useRISStore } from '@/store/supply/risStore';
import { useOfficeStore, useDivisionStore } from '@/store/office';
import { SupplyRISTable } from './SupplyRISTable';
import { RISFormModal } from './RISFormModal';
import { SupplyRISDeleteModal } from './SupplyRISDeleteModal';
import { VwSupplyRIS } from '@/types/supply/ris';
import { toast } from 'sonner';

export const SupplyRISTabContent = () => {
  const { risList, totalRis, loading, fetchRISs, deleteRIS, saveRIS } = useRISStore();
  const { vwOffices, fetchOffices } = useOfficeStore();
  const { vwDivisions, fetchDivisions } = useDivisionStore();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRIS, setSelectedRIS] = useState<VwSupplyRIS | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');

  const [params, setParams] = useState({
    page: 1,
    search: '',
    status: 'all',
    officeId: 'all',
    divisionId: 'all',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchOffices();
    fetchDivisions();
  }, [fetchOffices, fetchDivisions]);

  useEffect(() => {
    fetchRISs(
      params.page,
      10,
      params.search,
      params.status === 'all' ? undefined : params.status,
      params.officeId === 'all' ? undefined : Number(params.officeId),
      params.divisionId === 'all' ? undefined : Number(params.divisionId),
      params.startDate || undefined,
      params.endDate || undefined
    );
  }, [params, fetchRISs]);

  const handleAdd = () => {
    setSelectedRIS(null);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleEdit = (ris: VwSupplyRIS) => {
    setSelectedRIS(ris);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleView = (ris: VwSupplyRIS) => {
    setSelectedRIS(ris);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleDelete = (ris: VwSupplyRIS) => {
    setSelectedRIS(ris);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedRIS) {
      await deleteRIS(selectedRIS.id);
      setDeleteModalOpen(false);
    }
  };

  const handleToggleApproval = async (ris: VwSupplyRIS) => {
    try {

      const headerData = {
        id: ris.id,
        entityName: ris.entityName,
        fundCluster: ris.fundCluster,
        officeId: ris.office?.id ?? 0,
        divisionId: ris.division?.id ?? 0,
        responsibilityCenterCode: ris.responsibilityCenterCode,
        risNumber: ris.risNumber,
        risPurpose: ris.risPurpose,
        risRequestedDate: ris.risRequestedDate,
        risRequestedBySystemUserId: ris.requestedBySystemUser?.id,
        risApprovedBySystemUserId: ris.approvedBySystemUser?.id,
        risApprovedDate: ris.risApprovedDate,
        risIssuedBySystemUserId: ris.issuedBySystemUser?.id,
        risIssuedDate: ris.risIssuedDate,
        risReceivedBySystemUserId: ris.receivedBySystemUser?.id,
        risReceivedDate: ris.risReceivedDate,
        isApproved: !ris.isApproved, // Toggle the status
        isActive: ris.isActive,
      };

      await saveRIS(headerData, [], []);
      toast.success(`RIS has been ${!ris.isApproved ? 'approved' : 'unapproved'}.`);
    } catch (error) {
      toast.error("Failed to update approval status.");
    }
  };

  return (
      <>
        <SupplyRISTable
          data={risList}
          totalCount={totalRis}
          page={params.page}
          searchQuery={params.search}
          statusFilter={params.status}
          officeFilter={params.officeId}
          divisionFilter={params.divisionId}
          startDate={params.startDate}
          endDate={params.endDate}
          offices={vwOffices}
          divisions={vwDivisions}
          onParamsChange={setParams}
          loading={loading}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
          onApprove={handleToggleApproval}
        />
        <RISFormModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            mode={modalMode}
            ris={selectedRIS}
        />
        <SupplyRISDeleteModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            ris={selectedRIS}
            onConfirm={handleConfirmDelete}
        />
      </>
  );
};