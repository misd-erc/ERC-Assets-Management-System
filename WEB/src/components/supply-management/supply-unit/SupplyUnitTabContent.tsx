// src/components/supply-management/supply-unit/SupplyUnitTabContent.tsx
import { useState, useEffect, useMemo } from 'react';
import { useSupplyUnit, useSupplyItem } from '@/hooks';
import { SupplyUnitTable } from './SupplyUnitTable';
import { SupplyUnitEditModal } from './SupplyUnitEditModal';
import { SupplyUnitDeleteModal } from './SupplyUnitDeleteModal';
// Import the new modal
import { SupplyUnitLinkedItemsModal } from './SupplyUnitLinkedItemsModal';
import { SupplyUnit } from '@/types';

export const SupplyUnitTabContent = () => {
  const { units, loading: unitsLoading, fetchSupplyUnits } = useSupplyUnit();
  const { vwSupplies, fetchSupplyItems } = useSupplyItem(); 

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  // State for Linked Items Modal
  const [isLinkedItemsOpen, setIsLinkedItemsOpen] = useState(false);
  
  const [selectedUnit, setSelectedUnit] = useState<SupplyUnit | null>(null);
  const [mode, setMode] = useState<'add'|'edit'>('add');

  useEffect(() => { 
    fetchSupplyUnits();
    fetchSupplyItems(); 
  }, []);

  const usageCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    if (!vwSupplies) return counts;

    vwSupplies.forEach(item => {
        const unitId = item.measurementUnit?.id || item.measurementUnit?.id;
        if (unitId) {
            counts[unitId] = (counts[unitId] || 0) + 1;
        }
    });
    return counts;
  }, [vwSupplies]);

  // Filter items for the specific unit selected
  const linkedItems = useMemo(() => {
    if (!selectedUnit || !vwSupplies) return [];
    return vwSupplies.filter(item => 
      (item.measurementUnit?.id || item.measurementUnit?.id) === selectedUnit.id
    );
  }, [selectedUnit, vwSupplies]);

  const handleAdd = () => { setSelectedUnit(null); setMode('add'); setIsEditOpen(true); };
  const handleEdit = (unit: SupplyUnit) => { setSelectedUnit(unit); setMode('edit'); setIsEditOpen(true); };
  const handleDelete = (unit: SupplyUnit) => { setSelectedUnit(unit); setIsDeleteOpen(true); };
  
  // Handle viewing linked items
  const handleViewLinkedItems = (unit: SupplyUnit) => {
    setSelectedUnit(unit);
    setIsLinkedItemsOpen(true);
  };

  if (unitsLoading && units.length === 0) return <p className="py-12 text-center text-muted-foreground">Loading units...</p>;

  return (
    <>
      <SupplyUnitTable 
        data={units} 
        usageCounts={usageCounts} 
        onAdd={handleAdd} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        onViewLinkedItems={handleViewLinkedItems} // <--- Pass handler
      />
      
      <SupplyUnitEditModal open={isEditOpen} onOpenChange={setIsEditOpen} mode={mode} unit={selectedUnit} />
      <SupplyUnitDeleteModal open={isDeleteOpen} onOpenChange={setIsDeleteOpen} unit={selectedUnit} />
      
      {/* New Modal */}
      <SupplyUnitLinkedItemsModal 
        open={isLinkedItemsOpen} 
        onOpenChange={setIsLinkedItemsOpen} 
        unit={selectedUnit} 
        linkedItems={linkedItems} 
      />
    </>
  );
};