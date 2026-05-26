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
  loadingDeliveryRecord?: boolean;
  onConfirm: () => Promise<void>;
}

export const SupplyIARApproveModal = ({ open, onOpenChange, record, deliveryRecord, loadingDeliveryRecord, onConfirm }: Props) => {
  const deliveryItems = deliveryRecord?.items || [];
  const canApprove = !loadingDeliveryRecord && deliveryItems.length > 0;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {loadingDeliveryRecord ? (
            <div className="flex items-center gap-2 text-slate-600 mb-2">
              <AlertDialogTitle>Loading delivery items...</AlertDialogTitle>
            </div>
          ) : canApprove ? (
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
            {loadingDeliveryRecord ? (
              <>Please wait while delivery record items are loaded.</>
            ) : canApprove ? (
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
          {loadingDeliveryRecord ? (
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          ) : canApprove ? (
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