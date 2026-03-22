// src/components/supply-management/supply-grouped/SupplyGroupItemsModal.tsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { VwSupplyGroupedItem, VwSupplyItem } from '@/types';
import { useSupplyItem } from '@/hooks';
import { SupplyItemEditModal } from '../SupplyItemEditModal';
import { SupplyItemDeleteModal } from '../SupplyItemDeleteModal';
import { SupplyItemTable } from '../SupplyItemTable';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupedItem: VwSupplyGroupedItem | null;
}

export const SupplyGroupItemsModal = ({ open, onOpenChange, groupedItem }: Props) => {
  const {
    vwSupplyGroupItems,
    fetchSupplyGroupedItemLists,
    fetchSupplyGroupedItems,
  } = useSupplyItem();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VwSupplyItem | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');

  useEffect(() => {
    if (open && groupedItem) {
      fetchSupplyGroupedItemLists(groupedItem.id);
    }
  }, [open, groupedItem, fetchSupplyGroupedItemLists]);

  const handleAdd = () => {
    setSelectedItem(null);
    setModalMode('add');
    setEditModalOpen(true);
  };

  const handleEdit = (item: VwSupplyItem) => {
    setSelectedItem(item);
    setModalMode('edit');
    setEditModalOpen(true);
  };

  const handleView = (item: VwSupplyItem) => {
    setSelectedItem(item);
    setModalMode('view');
    setEditModalOpen(true);
  };

  const handleDelete = (item: VwSupplyItem) => {
    setSelectedItem(item);
    setDeleteModalOpen(true);
  };

  const refreshAfterChange = async () => {
    if (groupedItem) {
      await fetchSupplyGroupedItemLists(groupedItem.id);
    }
    await fetchSupplyGroupedItems();
  };

  if (!groupedItem) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[95vw] !w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Items in Group: {groupedItem.code} - {groupedItem.description}
            </DialogTitle>
            <DialogDescription>
              List of all supply items with this code and description.
              {!groupedItem.iarId && (
                <span className="ml-2 text-sm text-muted-foreground">
                  (Add, edit, or delete items as needed)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Total Current Stock: <strong>{groupedItem.totalCurrentStock}</strong> &nbsp;|&nbsp;
                Total Stock Cost: <strong>₱{groupedItem.totalStockCost?.toLocaleString()}</strong>
              </div>
              <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> Add New Item
              </Button>
            </div>

            <div className="border rounded-md overflow-x-auto">
              <SupplyItemTable
                data={vwSupplyGroupItems}
                onAdd={handleAdd}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                hideAddButton
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SupplyItemEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        mode={modalMode}
        supplyItem={selectedItem}
        groupContext={groupedItem ? { code: groupedItem.code, description: groupedItem.description } : undefined}
        onSuccess={refreshAfterChange}
      />

      <SupplyItemDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        supplyItem={selectedItem}
        onSuccess={refreshAfterChange}
      />
    </>
  );
};