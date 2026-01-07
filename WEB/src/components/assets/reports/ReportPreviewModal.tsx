import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, X } from 'lucide-react';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pdfUrl: string;
  reportType: 'PAR' | 'ICS' | 'PTR' | 'ITR' | 'SESPI' | 'RPCPPE' | 'PAL';
  isLoading?: boolean;
}

export function ReportPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  pdfUrl,
  reportType,
  isLoading = false,
}: ReportPreviewModalProps) {
  const reportTitle = reportType === 'PAR' ? 'Property Acknowledgement Receipt (PAR)' :
                     reportType === 'ICS' ? 'Inventory Custodian Slip (ICS)' :
                     reportType === 'PTR' ? 'Property Transfer Report (PTR)' :
                     reportType === 'ITR' ? 'Inventory Transfer Report (ITR)' :
                     reportType === 'RPCPPE' ? 'Report on the Physical Count of Property, Plant and Equipment (RPCPPE)' :
                     reportType === 'PAL' ? 'Property Accountability List (PAL)' :
                     'Report of Semi-Expandable Property Issued (SESPI)';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-9xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="size-5" />
            Preview {reportTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="size-8 animate-spin" />
                <p className="text-muted-foreground">Generating preview...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[800px] border rounded-lg"
              title={`${reportType} Preview`}
            />
          ) : (
            <div className="flex items-center justify-center h-96">
              <p className="text-muted-foreground">No preview available</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            <X className="size-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading || !pdfUrl}>
            <Download className="size-4 mr-2" />
            Confirm Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
