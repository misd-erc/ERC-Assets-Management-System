// src/components/supply-management/supply-item/SupplyItemDeleteModal.tsx
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSupplyItem } from '@/hooks';
import { VwSupplyItem } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplyItem?: VwSupplyItem | null;
  onSuccess?: () => void;
}

export const SupplyItemDeleteModal = ({ open, onOpenChange, supplyItem, onSuccess }: Props) => {
  const { deleteSupplyItem } = useSupplyItem();

  const handleDelete = async () => {
    if (supplyItem) {
      await deleteSupplyItem(supplyItem.id);
      onSuccess?.(); // Notify parent to refresh lists
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Supply Item?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{supplyItem?.description}</strong>. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};