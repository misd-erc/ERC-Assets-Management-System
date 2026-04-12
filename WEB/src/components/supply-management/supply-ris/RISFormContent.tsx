// src/components/supply-management/supply-ris/RISFormContent.tsx
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RISHeader } from './RISHeader';
import { RISItemsSection } from './RISItemsSection';
import { EditSupplyRIS, VwSupplyRIS } from '@/types/supply/ris';
import { User, VwOffice, VwDivision, VwSupplyGroupedItem, SupplyUnit } from '@/types';
import { Loader2 } from 'lucide-react';

interface Props {
  mode: 'add' | 'edit' | 'view';
  ris?: VwSupplyRIS | null;
  offices: VwOffice[];
  divisions: VwDivision[];
  users: User[];
  vwSupplyGroups: VwSupplyGroupedItem[];
  units: SupplyUnit[];
  onSave: (header: EditSupplyRIS, items: any[]) => Promise<void>;
  loading: boolean;
  onItemsLoadingChange: (loading: boolean) => void;
}

export const RISFormContent = ({
  mode,
  ris,
  offices,
  divisions,
  users,
  vwSupplyGroups,
  units,
  onSave,
  loading,
  onItemsLoadingChange,
}: Props) => {
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isAddMode = mode === 'add';

  const [header, setHeader] = useState<EditSupplyRIS>({
    id: 0,
    entityName: '',
    fundCluster: '',
    officeId: 0,
    divisionId: 0,
    responsibilityCenterCode: '',
    risNumber: '',
    risPurpose: '',
    risRequestedDate: new Date().toISOString().slice(0, 10),
    risRequestedBySystemUserId: undefined,
    risApprovedBySystemUserId: undefined,
    risApprovedDate: undefined,
    risIssuedBySystemUserId: undefined,
    risIssuedDate: undefined,
    risReceivedBySystemUserId: undefined,
    risReceivedDate: undefined,
    isApproved: false,
    isActive: true,
  });

  // Keep track of items locally until the user clicks Save
  const [items, setItems] = useState<any[]>([]);

  // Populate header when ris changes (edit/view)
  useEffect(() => {
    if (ris && (isEditMode || isViewMode)) {
      setHeader({
        id: ris.id,
        entityName: ris.entityName,
        fundCluster: ris.fundCluster,
        officeId: ris.office?.id ?? 0,
        divisionId: ris.division?.id ?? 0,
        responsibilityCenterCode: ris.responsibilityCenterCode,
        risNumber: ris.risNumber,
        risPurpose: ris.risPurpose,
        risRequestedDate: ris.risRequestedDate?.slice(0, 10) ?? '',
        risRequestedBySystemUserId: ris.requestedBySystemUser?.id,
        risApprovedBySystemUserId: ris.approvedBySystemUser?.id,
        risApprovedDate: ris.risApprovedDate,
        risIssuedBySystemUserId: ris.issuedBySystemUser?.id,
        risIssuedDate: ris.risIssuedDate,
        risReceivedBySystemUserId: ris.receivedBySystemUser?.id,
        risReceivedDate: ris.risReceivedDate,
        isApproved: ris.isApproved,
        isActive: ris.isActive,
      });
    } else if (isAddMode) {
      setHeader((prev) => ({
        ...prev,
        id: 0,
        entityName: '',
        fundCluster: '',
        officeId: 0,
        divisionId: 0,
        responsibilityCenterCode: '',
        risNumber: '',
        risPurpose: '',
        risRequestedDate: new Date().toISOString().slice(0, 10),
        risRequestedBySystemUserId: undefined,
        risApprovedBySystemUserId: undefined,
        risApprovedDate: undefined,
        risIssuedBySystemUserId: undefined,
        risIssuedDate: undefined,
        risReceivedBySystemUserId: undefined,
        risReceivedDate: undefined,
        isApproved: false,
        isActive: true,
      }));
    }
  }, [ris, mode, isEditMode, isViewMode, isAddMode]);

  // Use useCallback to stabilize references and prevent unnecessary re-renders downstream
  const handleHeaderChange = useCallback((updates: Partial<EditSupplyRIS>) => {
    setHeader((prev) => ({ ...prev, ...updates }));
  }, []);

  // Update local items state (does NOT hit the API)
  const handleItemsChange = useCallback((newItems: any[]) => {
    setItems(newItems);
  }, []);

  // Fires only when the Save button is clicked
  const handleSubmit = async () => {
    await onSave(header, items);
  };

  return (
    <div className="space-y-6">
      <RISHeader
        header={header}
        offices={offices}
        divisions={divisions}
        users={users}
        isViewMode={isViewMode}
        onChange={handleHeaderChange}
      />

      <RISItemsSection
        risId={ris?.id}
        mode={mode}
        vwSupplyGroups={vwSupplyGroups}
        units={units}
        onItemsChange={handleItemsChange}
        onLoadingChange={onItemsLoadingChange}
      />

      {/* Added explicit Save Button to prevent infinite Auto-Saving loops */}
      {!isViewMode && (
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save RIS Record'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};