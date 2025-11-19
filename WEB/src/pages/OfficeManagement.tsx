// src/pages/office/OfficeManagement.tsx
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { OfficeGeneralHeader } from '@/components/office-management/OfficeGeneralHeader';
import { OfficeTabsList } from '@/components/office-management/OfficeTabsList';
import {
  OfficeTabContent,
  DivisionTabContent,
  EmploymentTypeTabContent,
  PositionTabContent
} from '@/components/office-management';
import {
  OfficeEditModal,
  OfficeDeleteModal,
  DivisionEditModal,
  DivisionDeleteModal,
  EmploymentTypeEditModal,
  EmploymentTypeDeleteModal,
  PositionEditModal,
  PositionDeleteModal
} from '@/components/office-management';

import {
  useOffice,
  useDivision,
  useEmploymentType,
  usePosition,
} from '@/hooks';

import {
  Office,
  VwDivision,
  EmploymentType,
  Position,
} from '@/types';

const OfficeManagement = () => {
  // â”€â”€ Hooks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const {
    vwOffices,
    searchQuery: officeSearch,
    fetchOffices,
    loading: officeLoading,
  } = useOffice();

  const {
    vwDivisions,
    fetchDivisions,
    loading: divisionLoading,
  } = useDivision();

  const {
    vwEmploymentTypes,
    searchQuery: typeSearch,
    fetchEmploymentTypes,
    loading: typeLoading,
  } = useEmploymentType();

  const {
    vwPositions,
    searchQuery: posSearch,
    fetchPositions,
    loading: posLoading,
  } = usePosition();

  // â”€â”€ Dialog state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [officeDialog, setOfficeDialog] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    office?: Office;
  }>({ open: false, mode: 'add' });

  const [divisionDialog, setDivisionDialog] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    division?: VwDivision;
  }>({ open: false, mode: 'add' });

  const [typeDialog, setTypeDialog] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    type?: EmploymentType;
  }>({ open: false, mode: 'add' });

  const [positionDialog, setPositionDialog] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    position?: Position;
  }>({ open: false, mode: 'add' });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'office' | 'division' | 'employment-type' | 'position';
    id?: number;
    name?: string;
  }>({ open: false, type: 'office' });

  // â”€â”€ Load data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    fetchOffices();
    fetchDivisions();
    fetchEmploymentTypes();
    fetchPositions();
  }, [fetchOffices, fetchDivisions, fetchEmploymentTypes, fetchPositions]);

  // â”€â”€ Filter data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filteredOffices = vwOffices.filter(
    o =>
      o.name.toLowerCase().includes(officeSearch.toLowerCase()) ||
      o.acronym.toLowerCase().includes(officeSearch.toLowerCase())
  );

  const filteredTypes = vwEmploymentTypes.filter(t =>
    t.name.toLowerCase().includes(typeSearch.toLowerCase())
  );

  const filteredPositions = vwPositions.filter(p =>
    p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
    p.acronym.toLowerCase().includes(posSearch.toLowerCase()) ||
    p.salaryGrade.toLowerCase().includes(posSearch.toLowerCase())
  );

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openOfficeAdd = () => setOfficeDialog({ open: true, mode: 'add' });
  const openOfficeEdit = (office: Office) => setOfficeDialog({ open: true, mode: 'edit', office });

  const openDivisionAdd = () => setDivisionDialog({ open: true, mode: 'add' });
  const openDivisionEdit = (d: VwDivision) => setDivisionDialog({ open: true, mode: 'edit', division: d });

  const openTypeAdd = () => setTypeDialog({ open: true, mode: 'add' });
  const openTypeEdit = (t: EmploymentType) => setTypeDialog({ open: true, mode: 'edit', type: t });

  const openPositionAdd = () => setPositionDialog({ open: true, mode: 'add' });
  const openPositionEdit = (p: Position) => setPositionDialog({ open: true, mode: 'edit', position: p });

  const openDelete = (
    type: 'office' | 'division' | 'employment-type' | 'position',
    id: number,
    name: string
  ) => setDeleteDialog({ open: true, type, id, name });

  const closeAll = () => {
    setOfficeDialog(prev => ({ ...prev, open: false }));
    setDivisionDialog(prev => ({ ...prev, open: false }));
    setTypeDialog(prev => ({ ...prev, open: false }));
    setPositionDialog(prev => ({ ...prev, open: false }));
    setDeleteDialog({ open: false, type: 'office' });
  };

  const onSuccess = () => {
    closeAll();
    fetchOffices();
    fetchDivisions();
    fetchEmploymentTypes();
    fetchPositions();
  };

  return (
    <div className="p-6 pt-20 space-y-8">
      <OfficeGeneralHeader />

      <Tabs defaultValue="office">
        <OfficeTabsList />

        {/* â”€â”€ OFFICE TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <TabsContent value="office" className="space-y-6">
          <OfficeTabContent
            data={filteredOffices}
            loading={officeLoading}
            onAdd={openOfficeAdd}
            onEdit={openOfficeEdit}
            onDelete={(id, name) => openDelete('office', id, name)}
          />
        </TabsContent>

        {/* â”€â”€ DIVISION TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <TabsContent value="division" className="space-y-6">
          <DivisionTabContent
            data={vwDivisions}
            loading={divisionLoading}
            onAdd={openDivisionAdd}
            onEdit={openDivisionEdit}
            onDelete={(id, name) => openDelete('division', id, name)}
          />
        </TabsContent>

        {/* â”€â”€ EMPLOYMENT TYPE TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <TabsContent value="employment-type" className="space-y-6">
          <EmploymentTypeTabContent
            data={filteredTypes}
            loading={typeLoading}
            onAdd={openTypeAdd}
            onEdit={openTypeEdit}
            onDelete={(id, name) => openDelete('employment-type', id, name)}
          />
        </TabsContent>

        {/* â”€â”€ POSITION TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <TabsContent value="position" className="space-y-6">
          <PositionTabContent
            data={filteredPositions}
            loading={posLoading}
            onAdd={openPositionAdd}
            onEdit={openPositionEdit}
            onDelete={(id, name) => openDelete('position', id, name)}
          />
        </TabsContent>
      </Tabs>

      {/* â”€â”€ MODALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <OfficeEditModal
        open={officeDialog.open}
        mode={officeDialog.mode}
        office={officeDialog.office}
        onOpenChange={open => !open && closeAll()}
        onSuccess={onSuccess}
      />

      <DivisionEditModal
        open={divisionDialog.open}
        mode={divisionDialog.mode}
        division={divisionDialog.division}
        onOpenChange={open => !open && closeAll()}
        onSuccess={onSuccess}
      />

      <EmploymentTypeEditModal
        open={typeDialog.open}
        mode={typeDialog.mode}
        type={typeDialog.type}
        onOpenChange={open => !open && closeAll()}
        onSuccess={onSuccess}
      />

      <PositionEditModal
        open={positionDialog.open}
        mode={positionDialog.mode}
        position={positionDialog.position}
        onOpenChange={open => !open && closeAll()}
        onSuccess={onSuccess}
      />

      {/* â”€â”€ DELETE MODAL (Unified) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {deleteDialog.type === 'office' ? (
        <OfficeDeleteModal
          open={deleteDialog.open}
          onOpenChange={open => !open && closeAll()}
          officeId={deleteDialog.id}
          officeName={deleteDialog.name}
        />
      ) : deleteDialog.type === 'division' ? (
        <DivisionDeleteModal
          open={deleteDialog.open}
          onOpenChange={open => !open && closeAll()}
          divisionId={deleteDialog.id}
          divisionName={deleteDialog.name}
        />
      ) : deleteDialog.type === 'employment-type' ? (
        <EmploymentTypeDeleteModal
          open={deleteDialog.open}
          onOpenChange={open => !open && closeAll()}
          typeId={deleteDialog.id}
          typeName={deleteDialog.name}
        />
      ) : (
        <PositionDeleteModal
          open={deleteDialog.open}
          onOpenChange={open => !open && closeAll()}
          positionId={deleteDialog.id}
          positionName={deleteDialog.name}
        />
      )}
    </div>
  );
};

export default OfficeManagement;




