// src/components/supply-management/ris/SupplyRISDeleteModal.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { VwSupplyRIS } from '@/types/supply/ris';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ris: VwSupplyRIS | null;
  onConfirm: () => void;
}

export const SupplyRISDeleteModal = ({ open, onOpenChange, ris, onConfirm }: Props) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete RIS?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{ris?.risNumber}</strong>. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};