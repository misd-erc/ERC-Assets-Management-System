// src/components/office/DeleteConfirmDialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';
import { useOffice } from '../../../hooks';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  officeId?: number;
  officeName?: string;
}

export const OfficeDeleteModal = ({ open, onOpenChange, officeId, officeName }: Props) => {
  const { deleteOffice } = useOffice();

  const handleDelete = async () => {
    if (!officeId) return;
    try {
      await deleteOffice(officeId);
      toast.success('Office deleted');
      onOpenChange(false);
    } catch {
      toast.error('Failed to delete office');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Office?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{officeName}</strong>. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};