import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

export const DeleteConfirmDialog: React.FC<{ open: boolean; onOpenChange: (v: boolean) => void; onConfirm: () => void; itemDesc?: string; }> = ({ open, onOpenChange, onConfirm, itemDesc }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this item?</AlertDialogTitle>
          <p className="text-sm text-slate-600 mt-2">This action cannot be undone. {itemDesc ? `"${itemDesc}"` : ''}</p>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-red-600" onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};




