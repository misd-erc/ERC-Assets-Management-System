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
import { CheckCircle, CircleAlert } from 'lucide-react';
import {VwDeliveryRecord} from "@/types/delivery/delivery";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: VwSupplyIAR | null;
  deliveryRecord: VwDeliveryRecord | null;
  onConfirm: () => Promise<void>;
}

export const SupplyIARApproveModal = ({ open, onOpenChange, record, deliveryRecord, onConfirm }: Props) => {
  const deliveryItems = deliveryRecord?.items || [];
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {deliveryItems.length > 0 ? (
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle className="h-5 w-5" />
              <AlertDialogTitle>Approve IAR Record?</AlertDialogTitle>
            </div>
          ): (
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <CircleAlert className="h-5 w-5" />
              <AlertDialogTitle>IAR Record can't be Approved!</AlertDialogTitle>
            </div>
          )}

          <AlertDialogDescription>
            {deliveryItems.length > 0 ? (
              <>
                Are you sure you want to approve IAR <strong>{record?.iarNumber}</strong>?
                Once approved, the record will be finalized and can no longer be edited.
              </>
            ) : (
              <>
                <strong>{record?.iarNumber}</strong> currently doesn't have items yet.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {deliveryItems.length > 0 ? (
            <>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                  onClick={onConfirm}
                  className="bg-green-600 hover:bg-green-700"
              >
                Confirm Approval
              </AlertDialogAction>
            </>
          ):(
            <>
              <AlertDialogCancel>Return</AlertDialogCancel>
            </>
          )}

        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};