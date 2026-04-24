import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VwDeliveryRecord } from '@/types/delivery/delivery';
import { UploadCloud, Loader2, X, FileText } from 'lucide-react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    record: VwDeliveryRecord | null;
    onUpload: (id: number, file: File) => Promise<void>;
}

export const DeliveryRecordProofUploadModal = ({ open, onOpenChange, record, onUpload }: Props) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Cleanup object URL to prevent memory leaks when modal closes
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
            setFile(selectedFile);

            // Clean up the old preview URL if it exists
            if (previewUrl) URL.revokeObjectURL(previewUrl);

            // Only generate visual previews for Images and PDFs
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
        // Reset the file input element visually
        const fileInput = document.getElementById('proofFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !record) return;

        setIsUploading(true);
        await onUpload(record.id, file);
        setIsUploading(false);
        handleRemoveFile();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!isUploading) onOpenChange(val); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-blue-600" />
                        Upload Proof of Delivery
                    </DialogTitle>
                    <DialogDescription>
                        Attach a document or image as proof for DR Number: <span className="font-bold text-slate-800">{record?.drNumber}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="proofFile">Select File</Label>
                        <Input
                            id="proofFile"
                            type="file"
                            onChange={handleFileChange}
                            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                            disabled={isUploading}
                        />
                        <p className="text-xs text-slate-500">Supported formats: PDF, Images, Word, Excel, Text (Max 10MB)</p>
                    </div>

                    {/* Pre-upload Preview Section */}
                    {file && (
                        <div className="relative border rounded-lg overflow-hidden bg-slate-50 shadow-sm mt-4 w-full">
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7 z-10 rounded-full shadow-md"
                                onClick={handleRemoveFile}
                                disabled={isUploading}
                            >
                                <X className="h-4 w-4" />
                            </Button>

                            {previewUrl ? (
                                file.type.startsWith('image/') ? (
                                    <div className="flex justify-center bg-slate-100/50 p-2">
                                        <img src={previewUrl} alt="Preview" className="max-h-[250px] object-contain rounded" />
                                    </div>
                                ) : (
                                    <div className="h-[250px] w-full bg-slate-100/50">
                                        <iframe src={`${previewUrl}#toolbar=0&navpanes=0`} className="w-full h-full border-none" title="PDF Preview" />
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 text-slate-500 bg-slate-100/50 w-full">
                                    <FileText className="w-12 h-12 mb-3 text-indigo-400 shrink-0" />

                                    {/* FIXED: Hard max-width ensures truncation without stretching modal */}
                                    <div className="w-full px-4 text-center">
                                        <span className="text-sm font-semibold text-slate-700 block truncate max-w-[250px] sm:max-w-[300px] mx-auto">
                                            {file.name}
                                        </span>
                                    </div>

                                    <span className="text-xs text-slate-500 mt-1 shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    <span className="text-xs text-slate-400 mt-3 text-center max-w-[250px] shrink-0">
                                        Preview not available for this file type.
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={!file || isUploading}
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                            {isUploading ? 'Uploading...' : 'Upload File'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};