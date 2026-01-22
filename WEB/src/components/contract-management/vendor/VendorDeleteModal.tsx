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
import { useVendor } from '@/hooks';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId?: number;
  vendorName?: string;
}

export const VendorDeleteModal = ({ open, onOpenChange, vendorId, vendorName }: Props) => {
  const { deleteVendor } = useVendor();

  const handleDelete = async () => {
    if (!vendorId) return;
    try {
      await deleteVendor(vendorId);
      onOpenChange(false);
    } catch {
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{vendorName}</strong>. This action cannot be undone.
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





