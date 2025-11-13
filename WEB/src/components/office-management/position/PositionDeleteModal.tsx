// src/components/position/PositionDeleteModal.tsx
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
import { usePosition } from '@/hooks';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  positionId?: number;
  positionName?: string;
}

export const PositionDeleteModal = ({ open, onOpenChange, positionId, positionName }: Props) => {
  const { deletePosition } = usePosition();

  const handleDelete = async () => {
    if (!positionId) return;
    try {
      await deletePosition(positionId);
      toast.success('Position deleted');
      onOpenChange(false);
    } catch {
      toast.error('Failed to delete position');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Position?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{positionName}</strong>. This action cannot be undone.
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





