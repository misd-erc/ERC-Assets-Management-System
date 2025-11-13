// src/components/employment-type/EmploymentTypeDeleteModal.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/alert-dialog';
import { useEmploymentType } from '@/hooks';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeId?: number;
  typeName?: string;
}

export const EmploymentTypeDeleteModal = ({ open, onOpenChange, typeId, typeName }: Props) => {
  const { deleteEmploymentType } = useEmploymentType();

  const handleDelete = async () => {
    if (!typeId) return;
    try {
      await deleteEmploymentType(typeId);
      toast.success('Employment type deleted');
      onOpenChange(false);
    } catch {
      toast.error('Failed to delete employment type');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Employment Type?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{typeName}</strong>. This action cannot be undone.
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

