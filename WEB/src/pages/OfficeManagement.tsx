// src/pages/office/OfficeManagement.tsx
import { useState, useEffect } from 'react';
import { OfficeGeneralHeader } from '../components/office-management/OfficeGeneralHeader';
import { OfficeSearchBar, OfficeTable, EditOfficeModal, DeleteOfficeModal } from '../components/office-management';
import { useOffice, useDivision, useEmploymentType, usePosition } from '../hooks';
import { Office } from '../types';

const OfficeManagement = () => {
  const { offices, searchQuery, fetchOffices, loading } = useOffice();
  const { totalDivisions } = useDivision();
  const { totalEmploymentTypes } = useEmploymentType();
  const { totalPositions } = usePosition();

  const [dialog, setDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; office?: Office }>({ open: false, mode: 'add' });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: number; name?: string }>({ open: false });

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  const filteredOffices = offices.filter(office =>
    office.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    office.acronym.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAdd = () => setDialog({ open: true, mode: 'add' });
  const openEdit = (office: Office) => setDialog({ open: true, mode: 'edit', office });
  const openDelete = (id: number, name: string) => setDeleteDialog({ open: true, id, name });

  const closeDialogs = () => {
    setDialog({ ...dialog, open: false });
    setDeleteDialog({ open: false });
  };

  const handleSuccess = () => {
    closeDialogs();
    fetchOffices();
  };

  return (
    <div className="space-y-8">
      <OfficeGeneralHeader/>

      <div className="pl-64">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading offices...</p>
          </div>
        ) : (
          <OfficeTable
            onAdd={openAdd} 
            data={filteredOffices}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        )}
      </div>

      <EditOfficeModal
        open={dialog.open}
        mode={dialog.mode}
        office={dialog.office}
        onOpenChange={(open) => !open && closeDialogs()}
        onSuccess={handleSuccess}
      />

      <DeleteOfficeModal
        open={deleteDialog.open}
        onOpenChange={(open) => !open && closeDialogs()}
        officeId={deleteDialog.id}
        officeName={deleteDialog.name}
      />
    </div>
  );
};

export default OfficeManagement;