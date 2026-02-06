import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { VwDeliveryRecord } from '@/types/delivery/delivery';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: VwDeliveryRecord | null;
  onConfirm: () => Promise<void>;
}

export const DeliveryRecordDeleteModal = ({ open, onOpenChange, record, onConfirm }: Props) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Delivery Record?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete DR <strong>{record?.drNumber}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};