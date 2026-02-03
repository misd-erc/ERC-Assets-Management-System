// src/components/supply-management/supply-unit/SupplyUnitTabContent.tsx
import { useState, useEffect } from 'react';
import { useSupplyUnit } from '@/hooks';
import { SupplyUnitTable } from '..';
import { SupplyUnitEditModal } from '..';
import { SupplyUnitDeleteModal } from '..';
import { SupplyUnit } from '@/types';

export const SupplyUnitTabContent = () => {
  const { units, loading, fetchSupplyUnits } = useSupplyUnit();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<SupplyUnit | null>(null);
  const [mode, setMode] = useState<'add'|'edit'>('add');

  useEffect(() => { fetchSupplyUnits(); }, []);

  const handleAdd = () => { setSelectedUnit(null); setMode('add'); setIsEditOpen(true); };
  const handleEdit = (unit: SupplyUnit) => { setSelectedUnit(unit); setMode('edit'); setIsEditOpen(true); };
  const handleDelete = (unit: SupplyUnit) => { setSelectedUnit(unit); setIsDeleteOpen(true); };

  if (loading && units.length === 0) return <p className="py-12 text-center text-muted-foreground">Loading units...</p>;

  return (
    <>
      <SupplyUnitTable data={units} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} />
      <SupplyUnitEditModal open={isEditOpen} onOpenChange={setIsEditOpen} mode={mode} unit={selectedUnit} />
      <SupplyUnitDeleteModal open={isDeleteOpen} onOpenChange={setIsDeleteOpen} unit={selectedUnit} />
    </>
  );
};