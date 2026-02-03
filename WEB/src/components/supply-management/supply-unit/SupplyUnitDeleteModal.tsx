// src/components/supply-management/supply-unit/SupplyUnitDeleteModal.tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useSupplyUnit } from '@/hooks';
import { SupplyUnit } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: SupplyUnit | null;
}

export const SupplyUnitDeleteModal = ({ open, onOpenChange, unit }: Props) => {
  const { deleteSupplyUnit } = useSupplyUnit();
  
  const handleDelete = async () => {
    if (unit) {
      await deleteSupplyUnit(unit.id);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Unit?</AlertDialogTitle>
          <AlertDialogDescription>This will permanently delete <strong>{unit?.name}</strong>.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};