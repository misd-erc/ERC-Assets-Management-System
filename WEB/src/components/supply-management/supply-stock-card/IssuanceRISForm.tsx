import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { SearchableSelect } from './SearchableSelect';
import { useOffice, useDivision } from '@/hooks';
import { useRISStore } from '@/store/supply/risStore';
import { getSupplyRISById, getSupplyRISItems } from '@/api';
import { getAuthParams } from '@/utils/auth';
import { EditSupplyRIS, EditSupplyRISItem } from '@/types/supply/ris';
import axiosInstance from '@/lib/axios';

interface IssuanceRISFormProps {
  stockNumber: string;
  description: string;
  unitId?: number;
  totalCurrentStock?: number;
  editItemId?: number;
  parentRISId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const safeFormatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr || dateStr.startsWith('0001')) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

export const IssuanceRISForm = ({
  stockNumber,
  description,
  unitId,
  totalCurrentStock,
  editItemId,
  parentRISId,
  onSuccess,
  onCancel,
}: IssuanceRISFormProps) => {
  const { vwOffices, fetchOffices } = useOffice();
  const { vwDivisions, fetchDivisions } = useDivision();
  const { saveRIS } = useRISStore();

  const [loading, setLoading] = useState(false);

  // RIS Form State
  const [risForm, setRisForm] = useState({
    id: 0,
    entityName: 'Energy Regulatory Commission',
    fundCluster: '01',
    officeId: 0,
    divisionId: 0,
    responsibilityCenterCode: '',
    risNumber: '',
    risPurpose: '',
    risRequestedDate: new Date().toISOString().slice(0, 10),
    risRequestedBySystemUserId: 0,
    risApprovedBySystemUserId: 0,
    risApprovedDate: new Date().toISOString().slice(0, 10),
    risIssuedBySystemUserId: 0,
    risIssuedDate: new Date().toISOString().slice(0, 10),
    risReceivedBySystemUserId: 0,
    risReceivedDate: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString().slice(0, 10),
  });

  const [risItemForm, setRisItemForm] = useState({
    id: 0,
    risId: 0,
    requisitionQuantity: 1,
    issueQuantity: 1,
    itemRemarks: '',
  });

  useEffect(() => {
    fetchOffices();
    fetchDivisions();
  }, [fetchOffices, fetchDivisions]);

  useEffect(() => {
    const { systemUserId, sessionKey } = getAuthParams();

    if (editItemId && editItemId > 0) {
      setLoading(true);

      // If parentRISId is provided directly, perform direct endpoint fetches
      if (parentRISId && parentRISId > 0) {
        getSupplyRISById(parentRISId)
          .then((ris) => {
            if (ris) {
              const newRisForm = {
                id: ris.id,
                entityName: ris.entityName || 'Energy Regulatory Commission',
                fundCluster: ris.fundCluster || '01',
                officeId: ris.office?.id ?? 0,
                divisionId: ris.division?.id ?? 0,
                responsibilityCenterCode: ris.responsibilityCenterCode || '',
                risNumber: ris.risNumber || '',
                risPurpose: ris.risPurpose || '',
                risRequestedDate: safeFormatDate(ris.risRequestedDate) || new Date().toISOString().slice(0, 10),
                risRequestedBySystemUserId: ris.requestedBySystemUser?.id ?? 0,
                risApprovedBySystemUserId: ris.approvedBySystemUser?.id ?? 0,
                risApprovedDate: safeFormatDate(ris.risApprovedDate) || new Date().toISOString().slice(0, 10),
                risIssuedBySystemUserId: ris.issuedBySystemUser?.id ?? 0,
                risIssuedDate: safeFormatDate(ris.risIssuedDate) || new Date().toISOString().slice(0, 10),
                risReceivedBySystemUserId: ris.receivedBySystemUser?.id ?? 0,
                risReceivedDate: safeFormatDate(ris.risReceivedDate) || new Date().toISOString().slice(0, 10),
                createdAt: safeFormatDate(ris.createdAt) || new Date().toISOString().slice(0, 10),
              };
              setRisForm(newRisForm);

              getSupplyRISItems(parentRISId)
                .then((items) => {
                  // eslint-disable-next-line eqeqeq
                  const item = items.find((i: any) => i.id == editItemId);
                  if (item) {
                    const newRisItemForm = {
                      id: item.id,
                      risId: item.risId ?? 0,
                      requisitionQuantity: totalCurrentStock || 0,
                      issueQuantity: item.issueQuantity ?? 0,
                      itemRemarks: item.itemRemarks ?? '',
                    };
                    setRisItemForm(newRisItemForm);
                  }
                })
                .catch((err) => console.error("Failed to load RIS items", err))
                .finally(() => setLoading(false));
            } else {
              setLoading(false);
            }
          })
          .catch((err) => {
            console.error("Failed to load parent RIS directly", err);
            setLoading(false);
          });
      } else {
        // Fallback: Search in all RIS items to resolve RIS ID
        axiosInstance.get('/Supply/ris-item/all', {
          params: {
            ActionBySystemUserId: systemUserId,
            SessionKey: sessionKey,
            PageSize: 10000
          }
        })
        .then((res) => {
          const items = res.data?.data?.items || [];
          // eslint-disable-next-line eqeqeq
          const item = items.find((i: any) => i.id == editItemId);
          if (item) {
            getSupplyRISById(item.risId)
              .then((ris) => {
                if (ris) {
                  const newRisForm = {
                    id: ris.id,
                    entityName: ris.entityName || 'Energy Regulatory Commission',
                    fundCluster: ris.fundCluster || '01',
                    officeId: ris.office?.id ?? 0,
                    divisionId: ris.division?.id ?? 0,
                    responsibilityCenterCode: ris.responsibilityCenterCode || '',
                    risNumber: ris.risNumber || '',
                    risPurpose: ris.risPurpose || '',
                    risRequestedDate: safeFormatDate(ris.risRequestedDate) || new Date().toISOString().slice(0, 10),
                    risRequestedBySystemUserId: ris.requestedBySystemUser?.id ?? 0,
                    risApprovedBySystemUserId: ris.approvedBySystemUser?.id ?? 0,
                    risApprovedDate: safeFormatDate(ris.risApprovedDate) || new Date().toISOString().slice(0, 10),
                    risIssuedBySystemUserId: ris.issuedBySystemUser?.id ?? 0,
                    risIssuedDate: safeFormatDate(ris.risIssuedDate) || new Date().toISOString().slice(0, 10),
                    risReceivedBySystemUserId: ris.receivedBySystemUser?.id ?? 0,
                    risReceivedDate: safeFormatDate(ris.risReceivedDate) || new Date().toISOString().slice(0, 10),
                    createdAt: safeFormatDate(ris.createdAt) || new Date().toISOString().slice(0, 10),
                  };
                  setRisForm(newRisForm);

                  const newRisItemForm = {
                    id: item.id,
                    risId: item.risId ?? 0,
                    requisitionQuantity: totalCurrentStock || 0,
                    issueQuantity: item.issueQuantity ?? 0,
                    itemRemarks: item.itemRemarks ?? '',
                  };
                  setRisItemForm(newRisItemForm);
                }
              })
              .catch((err) => console.error("Failed to load parent RIS via fallback", err))
              .finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("Failed to load RIS items in fallback", err);
          setLoading(false);
        });
      }
    } else if (!editItemId) {
      setRisForm({
        id: 0,
        entityName: 'Energy Regulatory Commission',
        fundCluster: '01',
        officeId: 0,
        divisionId: 0,
        responsibilityCenterCode: '',
        risNumber: '',
        risPurpose: '',
        risRequestedDate: new Date().toISOString().slice(0, 10),
        risRequestedBySystemUserId: systemUserId || 0,
        risApprovedBySystemUserId: systemUserId || 0,
        risApprovedDate: new Date().toISOString().slice(0, 10),
        risIssuedBySystemUserId: systemUserId || 0,
        risIssuedDate: new Date().toISOString().slice(0, 10),
        risReceivedBySystemUserId: 0,
        risReceivedDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString().slice(0, 10),
      });

      setRisItemForm({
        id: 0,
        risId: 0,
        requisitionQuantity: totalCurrentStock || 0,
        issueQuantity: 0,
        itemRemarks: '',
      });
    }
  }, [stockNumber, description, unitId, totalCurrentStock, editItemId, parentRISId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitRis(true);
  };

  const handleSaveAndAddAnother = async (e: React.MouseEvent) => {
    e.preventDefault();
    await submitRis(false);
  };

  const submitRis = async (closeAfterSave: boolean) => {
    if (!risForm.risNumber?.trim()) {
      toast.error('RIS Number is required');
      return;
    }
    if (!risForm.entityName?.trim()) {
      toast.error('Entity Name is required');
      return;
    }
    if (!risForm.officeId || risForm.officeId === 0) {
      toast.error('Office is required');
      return;
    }
    if (!risForm.divisionId || risForm.divisionId === 0) {
      toast.error('Division is required');
      return;
    }
    if (risItemForm.requisitionQuantity <= 0) {
      toast.error('Requisitioned Quantity must be greater than 0');
      return;
    }
    if (risItemForm.issueQuantity < 0) {
      toast.error('Issued Quantity cannot be negative');
      return;
    }
    if (risItemForm.issueQuantity > risItemForm.requisitionQuantity) {
      toast.error('Issued Quantity cannot exceed Requisition Quantity');
      return;
    }

    setLoading(true);
    try {
      const headerData: EditSupplyRIS = {
        id: risForm.id || 0,
        entityName: risForm.entityName,
        fundCluster: undefined,
        officeId: risForm.officeId,
        divisionId: risForm.divisionId || 0,
        responsibilityCenterCode: undefined,
        risNumber: risForm.risNumber,
        risPurpose: undefined,
        risRequestedBySystemUserId: undefined,
        risRequestedDate: risForm.createdAt ? new Date(risForm.createdAt).toISOString() : undefined,

        isApproved: true,
        risApprovedBySystemUserId: undefined,
        risApprovedDate: undefined,
        risIssuedBySystemUserId: undefined,
        risIssuedDate: undefined,
        risReceivedBySystemUserId: undefined,
        risReceivedDate: undefined,

        isActive: true,
        createdAt: risForm.createdAt ? new Date(risForm.createdAt).toISOString() : undefined,
      };

      const itemsData: EditSupplyRISItem[] = [{
        id: risItemForm.id || 0,
        risId: risItemForm.risId || 0,
        stockNumber: stockNumber,
        unitId: unitId || 0,
        itemDescription: description,
        requisitionQuantity: Number(risItemForm.requisitionQuantity),
        issueQuantity: Number(risItemForm.issueQuantity),
        isAvailable: true,
        itemRemarks: risItemForm.itemRemarks,
        isActive: true,
        createdAt: risForm.createdAt ? new Date(risForm.createdAt).toISOString() : undefined,
      }];

      const result = await saveRIS(headerData, itemsData, []);
      if (result) {
        toast.success(`RIS requisition recorded and ${editItemId ? 'updated' : 'automatically approved'}`);
        onSuccess();
        if (closeAfterSave) {
          onCancel();
        } else {
          setRisForm(prev => ({
            ...prev,
            risNumber: '',
            risPurpose: '',
          }));
          setRisItemForm({
            id: 0,
            risId: 0,
            requisitionQuantity: totalCurrentStock || 0,
            issueQuantity: 0,
            itemRemarks: '',
          });
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to record RIS requisition');
    } finally {
      setLoading(false);
    }
  };

  const filteredDivisions = vwDivisions.filter((d: any) => d.office?.id === risForm.officeId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4 border p-4 bg-slate-50/50 rounded-lg border-slate-100">
        <div className="col-span-2 flex items-center justify-between pb-2 border-b">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">RIS Header Information</span>
        </div>

        <div className="space-y-2 col-span-2">
          <Label className="text-slate-700 font-medium">Entity Name</Label>
          <Input value={risForm.entityName} onChange={(e) => setRisForm({ ...risForm, entityName: e.target.value })} className="bg-white border-slate-200 text-slate-900" />
        </div>

        <div className="space-y-2 col-span-2">
          <Label className="text-slate-700 font-medium">RIS Number <span className="text-red-500">*</span></Label>
          <Input required value={risForm.risNumber} onChange={(e) => setRisForm({ ...risForm, risNumber: e.target.value })} placeholder="e.g. RIS-2026-001" className="bg-white border-slate-200 text-slate-900" />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Office <span className="text-red-500">*</span></Label>
          <SearchableSelect
            value={risForm.officeId}
            onChange={(val) => setRisForm({ ...risForm, officeId: val, divisionId: 0 })}
            options={vwOffices}
            placeholder="Select Office"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Division <span className="text-red-500">*</span></Label>
          <SearchableSelect
            value={risForm.divisionId}
            onChange={(val) => setRisForm({ ...risForm, divisionId: val })}
            options={filteredDivisions}
            placeholder="Select Division"
            disabled={!risForm.officeId}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label className="text-slate-700 font-medium">Created At</Label>
          <Input type="date" value={risForm.createdAt} onChange={(e) => setRisForm({ ...risForm, createdAt: e.target.value, risRequestedDate: e.target.value })} className="bg-white border-slate-200 text-slate-900" />
        </div>
      </div>

      {/* RIS Item Fields */}
      <div className="grid grid-cols-3 gap-4 border p-4 bg-blue-50/20 rounded-lg border-blue-100">
        <div className="col-span-3 pb-2 border-b">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">RIS Requisitioned Item</span>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Requisition Quantity</Label>
          <Input
            type="number"
            value={risItemForm.requisitionQuantity === 0 ? "" : risItemForm.requisitionQuantity}
            disabled
            className="bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Issued Quantity <span className="text-red-500">*</span></Label>
          <Input
            type="number"
            value={risItemForm.issueQuantity === 0 ? "" : risItemForm.issueQuantity}
            onChange={(e) => {
              const val = e.target.value;
              const num = val === "" ? 0 : Number(val);
              setRisItemForm({
                ...risItemForm,
                issueQuantity: num
              });
            }}
            onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
            className="bg-white border-slate-200 text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min={0}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Remarks</Label>
          <Input
            value={risItemForm.itemRemarks}
            onChange={(e) => setRisItemForm({ ...risItemForm, itemRemarks: e.target.value })}
            placeholder="e.g. Issued completely"
            className="bg-white border-slate-200 text-slate-900"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end w-full border-t pt-4 mt-2 border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        {!editItemId && (
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={handleSaveAndAddAnother}
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
          >
            Save & Add Another
          </Button>
        )}
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {editItemId ? 'Update' : 'Save'}
        </Button>
      </div>
    </form>
  );
};
