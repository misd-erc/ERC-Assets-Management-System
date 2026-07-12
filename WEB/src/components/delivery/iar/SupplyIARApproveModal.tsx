import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { VwSupplyIAR } from '@/types';
import { CheckCircle, CircleAlert, UploadCloud, X, FileText, Loader2 } from 'lucide-react';
import {VwDeliveryRecord} from "@/types/delivery/delivery";
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: VwSupplyIAR | null;
  deliveryRecords: VwDeliveryRecord[];
  loadingDeliveryRecord?: boolean;
  onConfirm: (file: File) => Promise<void>;
}

export const SupplyIARApproveModal = ({ open, onOpenChange, record, deliveryRecords, loadingDeliveryRecord, onConfirm }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (!open) {
      handleRemoveFile();
    }
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const maxSizeBytes = 10 * 1024 * 1024;
      if (selectedFile.size > maxSizeBytes) {
        toast.error('File size must be 10MB or less');
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    const fileInput = document.getElementById('iarSignedFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleConfirm = async () => {
    if (!file) return;
    setIsApproving(true);
    try {
      await onConfirm(file);
      handleRemoveFile();
    } catch {
      // Error toast handled by store
    } finally {
      setIsApproving(false);
    }
  };

  const deliveryItems = deliveryRecords.flatMap(dr => dr.items || []);
  const hasItems = !loadingDeliveryRecord && deliveryItems.length > 0;
  const canApprove = hasItems && !!file;

  return (
    <AlertDialog open={open} onOpenChange={(val) => { if (!isApproving) onOpenChange(val); }}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          {loadingDeliveryRecord ? (
            <div className="flex items-center gap-2 text-slate-600 mb-2">
              <AlertDialogTitle>Loading delivery items...</AlertDialogTitle>
            </div>
          ) : hasItems ? (
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
            ) : hasItems ? (
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

        {hasItems && (
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="iarSignedFile" className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-blue-600" />
                Upload Signed IAR Document <span className="text-red-500">*</span>
              </Label>
              <Input
                id="iarSignedFile"
                type="file"
                onChange={handleFileChange}
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                disabled={isApproving}
              />
              <p className="text-xs text-slate-500">Supported formats: PDF, Images, Word, Excel, Text (Max 10MB)</p>
            </div>

            {file && (
              <div className="relative border rounded-lg overflow-hidden bg-slate-50 shadow-sm w-full">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 z-10 rounded-full shadow-md"
                  onClick={handleRemoveFile}
                  disabled={isApproving}
                >
                  <X className="h-4 w-4" />
                </Button>

                {previewUrl ? (
                  file.type.startsWith('image/') ? (
                    <div className="flex justify-center bg-slate-100/50 p-2">
                      <img src={previewUrl} alt="Preview" className="max-h-[200px] object-contain rounded" />
                    </div>
                  ) : (
                    <div className="h-[200px] w-full bg-slate-100/50">
                      <iframe src={`${previewUrl}#toolbar=0&navpanes=0`} className="w-full h-full border-none" title="Signed IAR Preview" />
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-slate-500 bg-slate-100/50 w-full">
                    <FileText className="w-10 h-10 mb-2 text-indigo-400 shrink-0" />
                    <span className="text-sm font-semibold text-slate-700 block truncate max-w-[300px] mx-auto">
                      {file.name}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter>
          {loadingDeliveryRecord ? (
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          ) : hasItems ? (
            <>
              <AlertDialogCancel disabled={isApproving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                disabled={!canApprove || isApproving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApproving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                {isApproving ? 'Approving...' : 'Confirm Approval'}
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
