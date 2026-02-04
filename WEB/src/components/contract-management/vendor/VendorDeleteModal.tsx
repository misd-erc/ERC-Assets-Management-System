// src/components/contract-management/vendor/VendorDeleteModal.tsx
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useVendor } from '@/hooks';
import { Vendor } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor | null; // <--- CHANGED: Accept Object, not Number
}

export const VendorDeleteModal = ({ open, onOpenChange, vendor }: Props) => {
  const { deleteVendor } = useVendor();

  const handleDelete = async () => {
    if (vendor) {
      await deleteVendor(vendor.id); // <--- Access ID here
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{vendor?.name}</strong>. This action cannot be undone.
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