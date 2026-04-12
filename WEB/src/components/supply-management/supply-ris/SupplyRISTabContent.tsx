// src/components/supply-management/ris/SupplyRISTabContent.tsx
import { useState, useEffect } from 'react';
import { useRISStore } from '@/store/supply/risStore';
import { SupplyRISTable } from './SupplyRISTable';
import { RISFormModal } from './RISFormModal';
import { SupplyRISDeleteModal } from './SupplyRISDeleteModal';
import { VwSupplyRIS } from '@/types/supply/ris';
import { toast } from 'sonner';

export const SupplyRISTabContent = () => {
  // Grab whatever update/edit function you use in your store (e.g., saveRIS or editRIS)
  const { risList, loading, fetchRISs, deleteRIS, saveRIS } = useRISStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRIS, setSelectedRIS] = useState<VwSupplyRIS | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');

  useEffect(() => {
    fetchRISs();
  }, [fetchRISs]);

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
            onAdd={handleAdd}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            onApprove={handleToggleApproval} // ✅ Pass the new handler to the table
            loading={loading}
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