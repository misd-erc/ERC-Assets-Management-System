// src/components/supply-management/supply-storage/SupplyStorageDeleteModal.tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useSupplyStorageLocation } from '@/hooks';
import { SupplyStorageLocation } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storage?: SupplyStorageLocation | null;
}

export const SupplyStorageDeleteModal = ({ open, onOpenChange, storage }: Props) => {
  const { deleteSupplyStorageLocation } = useSupplyStorageLocation();
  
  const handleDelete = async () => {
    if (storage) {
      await deleteSupplyStorageLocation(storage.id);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Location?</AlertDialogTitle>
          <AlertDialogDescription>This will permanently delete <strong>{storage?.name}</strong>.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};