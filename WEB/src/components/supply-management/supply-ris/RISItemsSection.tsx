// src/components/supply-management/supply-ris/RISItemsSection.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useRISStore } from '@/store/supply/risStore';
import { useSupplyItemStore } from '@/store/supply';
import { RISItemRow } from './RISItemRow';
import { EditSupplyRISItem } from '@/types/supply/ris';
import { VwSupplyGroupedItem, SupplyUnit } from '@/types';
import { toast } from 'sonner';

export interface FormItem extends EditSupplyRISItem {
  tempId?: string;
  selectedGroup?: VwSupplyGroupedItem;
  availableUnits?: { id: number; name: string }[];
  isLoadingUnits?: boolean;
}

interface Props {
  risId?: number;
  mode: 'add' | 'edit' | 'view';
  vwSupplyGroups: VwSupplyGroupedItem[];
  units: SupplyUnit[];
  onItemsChange: (items: EditSupplyRISItem[]) => void;
  onLoadingChange: (loading: boolean) => void;
}

export const RISItemsSection = ({
  risId,
  mode,
  vwSupplyGroups,
  units,
  onItemsChange,
  onLoadingChange,
}: Props) => {
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  const { fetchRISItems } = useRISStore.getState();
  const { fetchSupplyGroupedItemLists } = useSupplyItemStore();

  const [items, setItems] = useState<FormItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const unitCache = useRef<Record<number, { id: number; name: string }[]>>({});

  // Load items when editing/viewing an existing RIS
  useEffect(() => {
    if (risId && (isEditMode || isViewMode)) {
      const loadItems = async () => {
        setLoadingItems(true);
        onLoadingChange(true);
        try {
          await fetchRISItems(risId);
          const fetchedItems = useRISStore.getState().currentRISItems;
          const formItems: FormItem[] = [];

          for (const item of fetchedItems) {
            // FIX: Explicitly check for supplyUnit.id or supplyUnit.Id as requested
            const currentUnitId = 
              (item as any).supplyUnit?.id || 
              (item as any).supplyUnit?.Id || 
              (item as any).unit?.id || 
              (item as any).unitId || 
              0;

            const selectedGroup = vwSupplyGroups.find(
              (g) => g.code === item.stockNumber && g.description === item.itemDescription
            );

            if (selectedGroup) {
              let availableUnits: { id: number; name: string }[];

              if (unitCache.current[selectedGroup.id]) {
                availableUnits = unitCache.current[selectedGroup.id];
                // Ensure current unit is included
                if (currentUnitId && !availableUnits.some(u => u.id === currentUnitId)) {
                  const unitName = units.find((u) => u.id === currentUnitId)?.name || `Unit ${currentUnitId}`;
                  availableUnits = [...availableUnits, { id: currentUnitId, name: unitName }];
                  unitCache.current[selectedGroup.id] = availableUnits;
                }
              } else {
                await fetchSupplyGroupedItemLists(selectedGroup.id);
                const groupItems = useSupplyItemStore.getState().vwSupplyGroupItems;
                
                const unitIds = new Set<number>();
                
                // FIX: Force the current unit ID into the set so the dropdown always has it as an option
                if (currentUnitId) {
                  unitIds.add(currentUnitId);
                }

                groupItems.forEach((gi: any) => {
                  if (gi.measurementUnit?.id) unitIds.add(gi.measurementUnit.id);
                  // Also check if group items use supplyUnit internally
                  if (gi.supplyUnit?.id) unitIds.add(gi.supplyUnit.id);
                });
                
                availableUnits = Array.from(unitIds).map((id) => ({
                  id,
                  name: units.find((u) => u.id === id)?.name || `Unit ${id}`,
                }));

                unitCache.current[selectedGroup.id] = availableUnits;
              }

              formItems.push({
                id: item.id,
                risId: item.risId,
                stockNumber: item.stockNumber,
                unitId: currentUnitId, // Bind the extracted ID here
                itemDescription: item.itemDescription,
                requisitionQuantity: item.requisitionQuantity,
                isAvailable: item.isAvailable,
                issueQuantity: item.issueQuantity,
                itemRemarks: item.itemRemarks,
                isActive: item.isActive,
                selectedGroup,
                availableUnits,
              });
            } else {
              // If group is missing, still construct the item and unit
              formItems.push({
                id: item.id,
                risId: item.risId,
                stockNumber: item.stockNumber,
                unitId: currentUnitId,
                itemDescription: item.itemDescription,
                requisitionQuantity: item.requisitionQuantity,
                isAvailable: item.isAvailable,
                issueQuantity: item.issueQuantity,
                itemRemarks: item.itemRemarks,
                isActive: item.isActive,
                selectedGroup: undefined,
                availableUnits: currentUnitId ? [{
                  id: currentUnitId,
                  name: units.find((u) => u.id === currentUnitId)?.name || `Unit ${currentUnitId}`
                }] : [],
              });
            }
          }
          setItems(formItems);
        } catch (error) {
          toast.error('Failed to load RIS items');
        } finally {
          setLoadingItems(false);
          onLoadingChange(false);
        }
      };
      loadItems();
    } else if (mode === 'add') {
      setItems([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [risId, mode, vwSupplyGroups, units, fetchRISItems, fetchSupplyGroupedItemLists, onLoadingChange]);

  // Notify parent when items change
  useEffect(() => {
    const saveItems = items.map((item) => ({
      id: item.id,
      risId: item.risId,
      stockNumber: item.stockNumber,
      unitId: item.unitId,
      itemDescription: item.itemDescription,
      requisitionQuantity: item.requisitionQuantity,
      isAvailable: item.isAvailable,
      issueQuantity: item.issueQuantity,
      itemRemarks: item.itemRemarks,
      isActive: item.isActive,
    }));
    onItemsChange(saveItems);
  }, [items, onItemsChange]);

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: 0,
        risId: risId || 0,
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

  const updateItem = useCallback((index: number, field: keyof FormItem, value: any) => {
    // Selecting a stock number derives a lot of state and may fetch units. Keep all store
    // calls and side effects OUT of the setItems updater so React never sees another
    // component (e.g. SupplyGeneralHeader) updated while RISItemsSection is rendering.
    if (field === 'stockNumber') {
      const selectedGroup = value
        ? vwSupplyGroups.find((g) => g.code === value)
        : undefined;

      if (!selectedGroup) {
        setItems((prev) => {
          const newItems = [...prev];
          newItems[index] = {
            ...newItems[index],
            stockNumber: value || '',
            itemDescription: '',
            requisitionQuantity: 0,
            isAvailable: false,
            issueQuantity: 0,
            availableUnits: [],
            isLoadingUnits: false,
          };
          return newItems;
        });
        return;
      }

      const cachedUnits = unitCache.current[selectedGroup.id];

      setItems((prev) => {
        const newItems = [...prev];
        newItems[index] = {
          ...newItems[index],
          stockNumber: value,
          selectedGroup,
          itemDescription: selectedGroup.description,
          requisitionQuantity: selectedGroup.totalCurrentStock,
          isAvailable: selectedGroup.totalCurrentStock > 0,
          issueQuantity: 0,
          unitId: cachedUnits?.[0]?.id ?? 0,
          availableUnits: cachedUnits ?? [],
          isLoadingUnits: !cachedUnits,
        };
        return newItems;
      });

      if (cachedUnits) return;

      fetchSupplyGroupedItemLists(selectedGroup.id)
        .then(() => {
          const groupItems = useSupplyItemStore.getState().vwSupplyGroupItems;
          const unitIds = new Set<number>();
          groupItems.forEach((gi: any) => {
            if (gi.measurementUnit?.id) unitIds.add(gi.measurementUnit.id);
            if (gi.supplyUnit?.id) unitIds.add(gi.supplyUnit.id);
          });
          const availableUnits = Array.from(unitIds).map((id) => ({
            id,
            name: units.find((u) => u.id === id)?.name || `Unit ${id}`,
          }));

          unitCache.current[selectedGroup.id] = availableUnits;

          setItems((current) => {
            const updated = [...current];
            updated[index] = {
              ...updated[index],
              availableUnits,
              isLoadingUnits: false,
            };

            // Auto-select the first available unit if one exists to prevent blank dropdowns
            if (availableUnits.length > 0 && (!updated[index].unitId || updated[index].unitId === 0)) {
              updated[index].unitId = availableUnits[0].id;
            }
            return updated;
          });
        })
        .catch(() => {
          setItems((current) => {
            const updated = [...current];
            updated[index] = { ...updated[index], isLoadingUnits: false };
            return updated;
          });
        });
      return;
    }

    if (field === 'issueQuantity') {
      const maxAllowed = items[index]?.requisitionQuantity ?? 0;
      if (value > maxAllowed) {
        toast.error(`Issue quantity cannot exceed ${maxAllowed}`);
      }
      setItems((prev) => {
        const newItems = [...prev];
        newItems[index] = {
          ...newItems[index],
          issueQuantity: value > maxAllowed ? maxAllowed : value,
        };
        return newItems;
      });
      return;
    }

    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  }, [vwSupplyGroups, fetchSupplyGroupedItemLists, units, items]);

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Items</h3>
        {!isViewMode && !loadingItems && (
          <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        )}
      </div>

      {loadingItems && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading items...</span>
        </div>
      )}

      {!loadingItems && items.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No items added. Click "Add Item" to start.
        </div>
      )}

      {!loadingItems &&
        items.map((item, idx) => (
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
  );
};