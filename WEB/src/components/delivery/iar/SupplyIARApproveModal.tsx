import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { VwSupplyIAR } from '@/types';
import { CheckCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: VwSupplyIAR | null;
  onConfirm: () => Promise<void>;
}

export const SupplyIARApproveModal = ({ open, onOpenChange, record, onConfirm }: Props) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle className="h-5 w-5" />
            <AlertDialogTitle>Approve IAR Record?</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Are you sure you want to approve IAR <strong>{record?.iarNumber}</strong>? 
            Once approved, the record will be finalized and can no longer be edited.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="bg-green-600 hover:bg-green-700"
          >
            Confirm Approval
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};