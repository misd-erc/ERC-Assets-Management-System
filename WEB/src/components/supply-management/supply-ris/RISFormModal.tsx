// src/components/supply-management/supply-ris/RISFormModal.tsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useRISStore } from '@/store/supply/risStore';
import { useSupplyItemStore } from '@/store/supply';
import { useSupplyUnitStore } from '@/store/supply';
import { useOffice, useDivision } from '@/hooks';
import { getUsers } from '@/api';
import { VwSupplyRIS, User } from '@/types';
import { toast } from 'sonner';
import { RISFormContent } from './RISFormContent';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit' | 'view';
  ris?: VwSupplyRIS | null;
}

export const RISFormModal = ({ open, onOpenChange, mode, ris }: Props) => {
  const { saveRIS } = useRISStore();
  const { vwSupplyGroups, fetchSupplyGroupedItems } = useSupplyItemStore();
  const { units, fetchSupplyUnits } = useSupplyUnitStore();
  const { vwOffices, fetchOffices } = useOffice();
  const { vwDivisions, fetchDivisions } = useDivision();

  const [users, setUsers] = useState<User[]>([]);
  const [masterLoading, setMasterLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchMaster = async () => {
        setMasterLoading(true);
        try {
          await Promise.all([
            fetchSupplyGroupedItems(),
            fetchSupplyUnits(),
            fetchOffices(),
            fetchDivisions(),
          ]);
          const usersRes = await getUsers(1, 100);
          setUsers(usersRes.data.items || []);
        } catch (error) {
          console.error('Failed to fetch master data', error);
          toast.error('Failed to load reference data');
        } finally {
          setMasterLoading(false);
        }
      };
      fetchMaster();
    }
  }, [open, fetchSupplyGroupedItems, fetchSupplyUnits, fetchOffices, fetchDivisions]);

  const isReady = !masterLoading && vwSupplyGroups.length > 0 && units.length > 0;

  const handleSave = async (headerData: any, itemsData: any[]) => {
    setSaving(true);
    try {
      const result = await saveRIS(headerData, itemsData, []);
      if (result) {
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save RIS');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-7xl !w-[60vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' && 'Create New RIS'}
            {mode === 'edit' && 'Edit RIS'}
            {mode === 'view' && 'View RIS'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'view'
              ? 'View the details of this requisition.'
              : 'Fill in the details below.'}
          </DialogDescription>
        </DialogHeader>

        {!isReady ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <RISFormContent
            mode={mode}
            ris={ris}
            offices={vwOffices}
            divisions={vwDivisions}
            users={users}
            vwSupplyGroups={vwSupplyGroups}
            units={units}
            onSave={handleSave}
            loading={saving}
            onItemsLoadingChange={setItemsLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};