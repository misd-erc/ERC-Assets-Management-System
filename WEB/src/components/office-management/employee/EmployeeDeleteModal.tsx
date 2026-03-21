// src/components/office-management/employee/EmployeeDeleteModal.tsx
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
import { useEmployee } from '@/hooks';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId?: number;
  employeeName?: string;
}

export const EmployeeDeleteModal = ({ open, onOpenChange, employeeId, employeeName }: Props) => {
  const { deleteEmployee } = useEmployee();

  const handleDelete = async () => {
    if (!employeeId) return;
    try {
      await deleteEmployee(employeeId);
      onOpenChange(false);
    } catch {
      // error already handled in store
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Employee?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{employeeName}</strong>. This action cannot be undone.
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
