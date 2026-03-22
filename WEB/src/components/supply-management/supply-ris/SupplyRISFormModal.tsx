// src/components/supply-management/supply-ris/SupplyRISFormModal.tsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRISStore } from '@/store/supply/risStore';
import { useSupplyItemStore } from '@/store/supply'; // Direct store import
import { useOffice, useDivision } from '@/hooks';
import { getUsers } from '@/api';
import { VwSupplyRIS, VwSupplyRISItem, EditSupplyRIS, EditSupplyRISItem } from '@/types/supply/ris';
import { VwSupplyGroupedItem, User } from '@/types';
import { toast } from 'sonner';
import { RISHeader } from './RISHeader';
import { RISItemRow } from './RISItemRow';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit' | 'view';
  ris?: VwSupplyRIS | null;
}

export interface FormItem extends EditSupplyRISItem {
  tempId?: string;
  selectedGroup?: VwSupplyGroupedItem;
  availableUnits?: { id: number; name: string }[];
  isLoadingUnits?: boolean;
}

export const SupplyRISFormModal = ({ open, onOpenChange, mode, ris }: Props) => {
  const { saveRIS } = useRISStore();
  const {
    vwSupplyGroups,
    fetchSupplyGroupedItems,
    fetchSupplyGroupedItemLists,
  } = useSupplyItemStore(); // use the store directly, not the hook
  const { vwOffices, fetchOffices } = useOffice();
  const { vwDivisions, fetchDivisions } = useDivision();

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isAddMode = mode === 'add';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [header, setHeader] = useState<EditSupplyRIS>({
    id: 0,
    entityName: '',
    fundCluster: '',
    officeId: 0,
    divisionId: 0,
    responsibilityCenterCode: '',
    risNumber: '',
    risPurpose: '',
    risRequestedDate: new Date().toISOString().slice(0, 10),
    risRequestedBySystemUserId: undefined,
    risApprovedBySystemUserId: undefined,
    risApprovedDate: undefined,
    risIssuedBySystemUserId: undefined,
    risIssuedDate: undefined,
    risReceivedBySystemUserId: undefined,
    risReceivedDate: undefined,
    isActive: true,
  });

  const [items, setItems] = useState<FormItem[]>([]);
  const [originalItems, setOriginalItems] = useState<VwSupplyRISItem[]>([]);

  // Fetch master data
  useEffect(() => {
    if (open) {
      const fetchMaster = async () => {
        try {
          await fetchSupplyGroupedItems();
          await Promise.all([fetchOffices(), fetchDivisions()]);
          const usersRes = await getUsers(1, 100);
          setUsers(usersRes.data.items || []);
        } catch (error) {
          console.error('Failed to fetch master data', error);
          toast.error('Failed to load reference data');
        }
      };
      fetchMaster();
    }
  }, [open, fetchSupplyGroupedItems, fetchOffices, fetchDivisions]);

  // Populate form when editing/viewing
  useEffect(() => {
    if (open && ris) {
      setHeader({
        id: ris.id,
        entityName: ris.entityName,
        fundCluster: ris.fundCluster,
        officeId: ris.office?.id ?? 0,
        divisionId: ris.division?.id ?? 0,
        responsibilityCenterCode: ris.responsibilityCenterCode,
        risNumber: ris.risNumber,
        risPurpose: ris.risPurpose,
        risRequestedDate: ris.risRequestedDate?.slice(0, 10) ?? '',
        risRequestedBySystemUserId: ris.requestedBySystemUser?.id,
        risApprovedBySystemUserId: ris.approvedBySystemUser?.id,
        risApprovedDate: ris.risApprovedDate,
        risIssuedBySystemUserId: ris.issuedBySystemUser?.id,
        risIssuedDate: ris.risIssuedDate,
        risReceivedBySystemUserId: ris.receivedBySystemUser?.id,
        risReceivedDate: ris.risReceivedDate,
        isActive: ris.isActive,
      });
      if (ris.id && (isEditMode || isViewMode)) {
        fetchRISItems(ris.id);
      }
    } else if (open && !ris) {
      setHeader({
        id: 0,
        entityName: '',
        fundCluster: '',
        officeId: 0,
        divisionId: 0,
        responsibilityCenterCode: '',
        risNumber: '',
        risPurpose: '',
        risRequestedDate: new Date().toISOString().slice(0, 10),
        risRequestedBySystemUserId: undefined,
        risApprovedBySystemUserId: undefined,
        risApprovedDate: undefined,
        risIssuedBySystemUserId: undefined,
        risIssuedDate: undefined,
        risReceivedBySystemUserId: undefined,
        risReceivedDate: undefined,
        isActive: true,
      });
      setItems([]);
      setOriginalItems([]);
    }
  }, [open, ris, isEditMode, isViewMode]);

  const fetchRISItems = async (risId: number) => {
    const store = useRISStore.getState();
    await store.fetchRISItems(risId);
    const fetchedItems = store.currentRISItems;
    setOriginalItems(fetchedItems);
    const formItems: FormItem[] = fetchedItems.map((item) => ({
      id: item.id,
      risId: item.risId,
      stockNumber: item.stockNumber,
      unitId: item.unit?.id ?? 0,
      itemDescription: item.itemDescription,
      requisitionQuantity: item.requisitionQuantity,
      isAvailable: item.isAvailable,
      issueQuantity: item.issueQuantity,
      itemRemarks: item.itemRemarks,
      isActive: item.isActive,
      selectedGroup: vwSupplyGroups.find(
        (g) => g.code === item.stockNumber && g.description === item.itemDescription
      ),
    }));
    setItems(formItems);
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: 0,
        risId: header.id,
        stockNumber: '',
        unitId: 0,
        itemDescription: '',
        requisitionQuantity: 0,
        isAvailable: false,
        issueQuantity: 0,
        itemRemarks: '',
        isActive: true,
        tempId: Math.random().toString(36).substr(2, 9),
        availableUnits: [],
        isLoadingUnits: false,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof FormItem, value: any) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };

      if (field === 'stockNumber' && value) {
        const selectedGroup = vwSupplyGroups.find((g) => g.code === value);
        if (selectedGroup) {
          newItems[index].selectedGroup = selectedGroup;
          newItems[index].itemDescription = selectedGroup.description;
          newItems[index].requisitionQuantity = selectedGroup.totalCurrentStock;
          newItems[index].isAvailable = selectedGroup.totalCurrentStock > 0;
          newItems[index].issueQuantity = 0;
          newItems[index].unitId = 0;
          newItems[index].isLoadingUnits = true;

          // Use store directly to fetch items for this group
          fetchSupplyGroupedItemLists(selectedGroup.id).then(() => {
            const groupItems = useSupplyItemStore.getState().vwSupplyGroupItems;
            const unitMap = new Map<number, string>();
            groupItems.forEach((gi: any) => { // Added explicit type
              if (gi.measurementUnit?.id && gi.measurementUnit?.name) {
                unitMap.set(gi.measurementUnit.id, gi.measurementUnit.name);
              }
            });
            const availableUnits = Array.from(unitMap.entries()).map(([id, name]) => ({ id, name }));
            updateItem(index, 'availableUnits', availableUnits);
            updateItem(index, 'isLoadingUnits', false);
          });
        } else {
          newItems[index].itemDescription = '';
          newItems[index].requisitionQuantity = 0;
          newItems[index].isAvailable = false;
          newItems[index].availableUnits = [];
          newItems[index].isLoadingUnits = false;
        }
      }

      if (field === 'issueQuantity') {
        const maxAllowed = newItems[index].requisitionQuantity;
        if (value > maxAllowed) {
          toast.error(`Issue quantity cannot exceed ${maxAllowed}`);
          newItems[index].issueQuantity = maxAllowed;
        }
      }

      return newItems;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) {
      onOpenChange(false);
      return;
    }

    if (!header.risNumber || !header.risPurpose || !header.officeId || !header.divisionId) {
      toast.error('Please fill all required fields');
      return;
    }
    if (items.some((item) => !item.stockNumber || !item.unitId || item.issueQuantity === undefined)) {
      toast.error('Please complete all item details');
      return;
    }

    setLoading(true);
    try {
      const saveItems: EditSupplyRISItem[] = items.map((item) => ({
        id: item.id,
        risId: 0,
        stockNumber: item.stockNumber,
        unitId: item.unitId,
        itemDescription: item.itemDescription,
        requisitionQuantity: item.requisitionQuantity,
        isAvailable: item.isAvailable,
        issueQuantity: item.issueQuantity,
        itemRemarks: item.itemRemarks,
        isActive: item.isActive,
      }));

      const result = await saveRIS(header, saveItems, originalItems);
      if (result) {
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save RIS');
    } finally {
      setLoading(false);
    }
  };

  const handleHeaderChange = (updates: Partial<EditSupplyRIS>) => {
    setHeader((prev) => ({ ...prev, ...updates }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] !w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isAddMode && 'Create New RIS'}
            {isEditMode && 'Edit RIS'}
            {isViewMode && 'View RIS'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'View the details of this requisition.'
              : 'Fill in the details below.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <RISHeader
            header={header}
            offices={vwOffices}
            divisions={vwDivisions}
            users={users}
            isViewMode={isViewMode}
            onChange={handleHeaderChange}
          />

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Items</h3>
              {!isViewMode && (
                <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                  <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
              )}
            </div>

            {items.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No items added. Click "Add Item" to start.
              </div>
            )}

            {items.map((item, idx) => (
              <RISItemRow
                key={item.tempId ?? item.id}
                item={item}
                index={idx}
                vwSupplyGroups={vwSupplyGroups}
                isViewMode={isViewMode}
                onUpdate={updateItem}
                onRemove={removeItemRow}
              />
            ))}
          </div>

          <DialogFooter>
            {isViewMode ? (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};