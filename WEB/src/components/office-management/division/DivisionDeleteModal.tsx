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
import { useDivision } from '@/hooks';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  divisionId?: number;
  divisionName?: string;
}

export const DivisionDeleteModal = ({ open, onOpenChange, divisionId, divisionName }: Props) => {
  const { deleteDivision } = useDivision();

  const handleDelete = async () => {
    if (!divisionId) return;
    try {
      await deleteDivision(divisionId);
      toast.success('Division deleted');
      onOpenChange(false);
    } catch {
      toast.error('Failed to delete division');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Division?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{divisionName}</strong>. This action cannot be undone.
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





