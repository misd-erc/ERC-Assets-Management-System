import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/dateUtils';
import { VwDeliveryRecord } from '@/types/delivery/delivery';
import { FileText, ExternalLink, Loader2, FileDown } from 'lucide-react';
import { getAuthParams } from '@/utils/auth';
import axiosInstance from '@/lib/axios';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: VwDeliveryRecord | null;
}

export const DeliveryRecordViewModal = ({ open, onOpenChange, record }: Props) => {
  const [fileBlobUrl, setFileBlobUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const { systemUserId, sessionKey } = getAuthParams();
  const baseUrl = axiosInstance.defaults.baseURL || '/api';

  const directFileUrl = record?.fileId
      ? `${baseUrl}/Storage/retrieve/${record.fileId}?ActionBySystemUserId=${systemUserId}&SessionKey=${sessionKey}`
      : null;

  useEffect(() => {
    if (open && record?.fileId) {
      const fetchFilePreview = async () => {
        setIsLoadingFile(true);
        try {
          const res = await axiosInstance.get(`/Storage/retrieve/${record.fileId}`, {
            params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
            responseType: 'blob',
          });

          const contentType = res.headers['content-type'] || 'application/octet-stream';
          setFileType(contentType);

          const blob = new Blob([res.data], { type: contentType });
          const url = URL.createObjectURL(blob);
          setFileBlobUrl(url);
        } catch (error) {
          console.error('Failed to load file preview', error);
        } finally {
          setIsLoadingFile(false);
        }
      };

      fetchFilePreview();
    }

    return () => {
      if (fileBlobUrl) {
        URL.revokeObjectURL(fileBlobUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record?.fileId]);

  if (!record) return null;

  const totalValue = record.items.reduce((acc, item) => acc + (item.itemQuantity * item.unitCost), 0);
  const isPreviewable = fileType?.includes('pdf') || fileType?.includes('image');

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
            <DialogDescription>Reference: {record.drNumber}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
              <div>
                <Label className="text-muted-foreground text-xs">Delivery Date</Label>
                <div className="font-medium">{formatDate(record.deliveryDate)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Status</Label>
                <div><Badge variant={record.isReceived ? "default" : "secondary"}>{record.isReceived ? 'Received' : 'Pending'}</Badge></div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-sm">Delivered Items</h3>
              <div className="space-y-2">
                {record.items.map((item) => (
                    <div key={item.id} className="flex flex-col p-3 border rounded-lg bg-slate-50/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{item.itemTypeId === 1 ? 'Supply' : item.itemTypeId === 2 ? 'PPE' : 'SE'}</Badge>
                            {item.itemDescription}
                            {item.code && <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 rounded">[{item.code}]</span>}
                          </div>

                          {item.itemTypeId === 1 && (
                              <div className="flex gap-3 mt-1.5 mb-1 text-[11px] text-blue-700 font-medium">
                                <span>Stock: {item.currentStock}</span>
                                <span>Reorder: {item.reorderPoint}</span>
                                <span>Loc: {item.storageLocation?.name || 'N/A'}</span>
                              </div>
                          )}

                          {item.itemSpecification && (
                              <div className="text-[11px] text-muted-foreground italic mt-1 max-w-sm">
                                Specs: {item.itemSpecification}
                              </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(item.itemQuantity * item.unitCost)}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.itemQuantity} {item.measurementUnit?.name} @ {formatCurrency(item.unitCost)}
                          </div>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end items-center gap-4 p-4 border rounded-lg bg-blue-50/30 border-slate-200">
                <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Total Value:</span>
                <span className="text-xl font-bold text-blue-700">{formatCurrency(totalValue)}</span>
              </div>
            </div>

            {record.remarks && (
                <div className="bg-slate-50 p-3 rounded text-sm">
                  <Label className="text-xs text-muted-foreground">Remarks</Label>
                  <p>{record.remarks}</p>
                </div>
            )}

            {directFileUrl && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Proof of Delivery Document
                    </Label>
                    <Button variant="outline" size="sm" className="h-8 bg-white" asChild>
                      <a href={directFileUrl} target="_blank" rel="noopener noreferrer" download>
                        <ExternalLink className="w-4 h-4 mr-2 text-blue-600" /> Download File
                      </a>
                    </Button>
                  </div>

                  <div className="w-full rounded border border-slate-300 bg-white overflow-hidden flex flex-col justify-center items-center relative" style={{ minHeight: isPreviewable ? '400px' : '200px' }}>
                    {isLoadingFile ? (
                        <div className="flex flex-col items-center justify-center text-slate-500 p-10">
                          <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-600" />
                          <span className="text-sm font-medium">Loading file data...</span>
                        </div>
                    ) : fileBlobUrl ? (
                        isPreviewable ? (
                            <iframe
                                src={`${fileBlobUrl}#toolbar=0&navpanes=0&view=FitH`}
                                className="w-full h-[400px] border-none absolute inset-0"
                                title="Delivery Proof"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-slate-500 p-10">
                              <FileDown className="w-12 h-12 mb-3 text-slate-300" />
                              <span className="text-sm font-medium text-slate-800 mb-1">Preview not available for this file type</span>
                              <span className="text-xs text-slate-500 mb-4 text-center max-w-[250px]">
                                  Browsers cannot preview Word or Excel documents directly.
                                </span>
                              <Button variant="secondary" size="sm" asChild>
                                <a href={directFileUrl} download>Download to View</a>
                              </Button>
                            </div>
                        )
                    ) : (
                        <span className="text-sm text-slate-500 p-10">Preview not available</span>
                    )}
                  </div>
                </div>
            )}

          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
};