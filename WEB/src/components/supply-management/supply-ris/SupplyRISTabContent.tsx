// src/components/supply-management/ris/SupplyRISTabContent.tsx
import { useState, useEffect } from 'react';
import { useRISStore } from '@/store/supply/risStore';
import { SupplyRISTable } from './SupplyRISTable';
import { SupplyRISFormModal } from './SupplyRISFormModal';
import { SupplyRISDeleteModal } from './SupplyRISDeleteModal';
import { VwSupplyRIS } from '@/types/supply/ris';

export const SupplyRISTabContent = () => {
  const { risList, loading, fetchRISs, deleteRIS } = useRISStore();
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

  return (
    <>
      <SupplyRISTable
        data={risList}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        loading={loading}
      />
      <SupplyRISFormModal
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