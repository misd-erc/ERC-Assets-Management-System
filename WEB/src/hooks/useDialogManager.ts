import { useState } from 'react';

export interface DialogStates {
  showAddDialog: boolean;
  showViewDialog: boolean;
  showEditDialog: boolean;
  showDeleteDialog: boolean;
  showRISDialog: boolean;
  showViewRISDialog: boolean;
  showApproveRISDialog: boolean;
  showAllocationDialog: boolean;
}

export const useDialogManager = () => {
  const [dialogStates, setDialogStates] = useState<DialogStates>({
    showAddDialog: false,
    showViewDialog: false,
    showEditDialog: false,
    showDeleteDialog: false,
    showRISDialog: false,
    showViewRISDialog: false,
    showApproveRISDialog: false,
    showAllocationDialog: false,
  });

  const toggleDialog = (dialogName: keyof DialogStates, value?: boolean) => {
    setDialogStates(prev => ({
      ...prev,
      [dialogName]: value !== undefined ? value : !prev[dialogName]
    }));
  };

  const closeAllDialogs = () => {
    setDialogStates({
      showAddDialog: false,
      showViewDialog: false,
      showEditDialog: false,
      showDeleteDialog: false,
      showRISDialog: false,
      showViewRISDialog: false,
      showApproveRISDialog: false,
      showAllocationDialog: false,
    });
  };

  return {
    ...dialogStates,
    toggleDialog,
    closeAllDialogs,
  };
};
