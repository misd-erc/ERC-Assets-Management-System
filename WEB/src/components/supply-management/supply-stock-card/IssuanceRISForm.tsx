import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { SearchableSelect } from './SearchableSelect';
import { useOffice, useDivision } from '@/hooks';
import { useRISStore } from '@/store/supply/risStore';
import { getUsers } from '@/api';
import { getSupplyRISById, getSupplyRISItems } from '@/api';
import { getAuthParams } from '@/utils/auth';
import { User } from '@/types';
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
  const [users, setUsers] = useState<User[]>([]);

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

    getUsers({ page: 1, pageSize: 10000 })
      .then((res) => setUsers(res.data.items || []))
      .catch((err) => console.error("Failed to load users", err));
  }, [fetchOffices, fetchDivisions]);

  useEffect(() => {
    const { systemUserId, sessionKey } = getAuthParams();
    console.log('[DEBUG] IssuanceRISForm - useEffect triggered. editItemId:', editItemId, 'parentRISId:', parentRISId);

    if (editItemId && editItemId > 0) {
      setLoading(true);

      // If parentRISId is provided directly, perform direct endpoint fetches
      if (parentRISId && parentRISId > 0) {
        console.log('[DEBUG] IssuanceRISForm - Fetching parent RIS directly, ID:', parentRISId);
        getSupplyRISById(parentRISId)
          .then((ris) => {
            console.log('[DEBUG] IssuanceRISForm - Fetched parent RIS directly:', ris);
            if (ris) {
              const newRisForm = {
                id: ris.id,
                entityName: ris.entityName || 'Energy Regulatory Commission',
                fundCluster: ris.fundCluster || '01',
                officeId: ris.office?.id ?? ris.office?.Id ?? 0,
                divisionId: ris.division?.id ?? ris.division?.Id ?? 0,
                responsibilityCenterCode: ris.responsibilityCenterCode || '',
                risNumber: ris.risNumber || '',
                risPurpose: ris.risPurpose || '',
                risRequestedDate: safeFormatDate(ris.risRequestedDate) || new Date().toISOString().slice(0, 10),
                risRequestedBySystemUserId: ris.requestedBySystemUser?.id ?? ris.requestedBySystemUser?.Id ?? 0,
                risApprovedBySystemUserId: ris.approvedBySystemUser?.id ?? ris.approvedBySystemUser?.Id ?? 0,
                risApprovedDate: safeFormatDate(ris.risApprovedDate) || new Date().toISOString().slice(0, 10),
                risIssuedBySystemUserId: ris.issuedBySystemUser?.id ?? ris.issuedBySystemUser?.Id ?? 0,
                risIssuedDate: safeFormatDate(ris.risIssuedDate) || new Date().toISOString().slice(0, 10),
                risReceivedBySystemUserId: ris.receivedBySystemUser?.id ?? ris.receivedBySystemUser?.Id ?? 0,
                risReceivedDate: safeFormatDate(ris.risReceivedDate) || new Date().toISOString().slice(0, 10),
                createdAt: safeFormatDate(ris.createdAt) || new Date().toISOString().slice(0, 10),
              };
              console.log('[DEBUG] IssuanceRISForm - Setting risForm to:', newRisForm);
              setRisForm(newRisForm);

              console.log('[DEBUG] IssuanceRISForm - Fetching RIS items for parent RIS ID:', parentRISId);
              getSupplyRISItems(parentRISId)
                .then((items) => {
                  console.log('[DEBUG] IssuanceRISForm - Fetched RIS items:', items);
                  const item = items.find((i: any) => (i.id ?? i.Id) == editItemId);
                  if (item) {
                    const newRisItemForm = {
                      id: item.id ?? item.Id,
                      risId: item.risId ?? item.RisId ?? item.RISId ?? 0,
                      requisitionQuantity: totalCurrentStock || 0,
                      issueQuantity: item.issueQuantity ?? item.IssueQuantity ?? 0,
                      itemRemarks: item.itemRemarks ?? item.ItemRemarks ?? '',
                    };
                    console.log('[DEBUG] IssuanceRISForm - Setting risItemForm to:', newRisItemForm);
                    setRisItemForm(newRisItemForm);
                  } else {
                    console.warn('[DEBUG] IssuanceRISForm - Could not find RIS item with editItemId:', editItemId, 'in items list:', items);
                  }
                })
                .catch((err) => console.error("[DEBUG] IssuanceRISForm - Failed to load RIS items", err))
                .finally(() => setLoading(false));
            } else {
              console.warn('[DEBUG] IssuanceRISForm - Fetched parent RIS is null/undefined');
              setLoading(false);
            }
          })
          .catch((err) => {
            console.error("[DEBUG] IssuanceRISForm - Failed to load parent RIS directly", err);
            setLoading(false);
          });
      } else {
        // Fallback: Search in all RIS items to resolve RIS ID
        console.log('[DEBUG] IssuanceRISForm - Fallback: searching in all RIS items for editItemId:', editItemId);
        axiosInstance.get('/Supply/ris-item/all', {
          params: {
            ActionBySystemUserId: systemUserId,
            SessionKey: sessionKey,
            PageSize: 10000
          }
        })
        .then((res) => {
          const items = res.data?.data?.items || [];
          console.log('[DEBUG] IssuanceRISForm - Fallback fetched all RIS items:', items);
          const item = items.find((i: any) => (i.id ?? i.Id) == editItemId);
          if (item) {
            console.log('[DEBUG] IssuanceRISForm - Fallback found item:', item, 'Fetching RIS ID:', item.risId ?? item.RisId ?? item.RISId);
            getSupplyRISById(item.risId ?? item.RisId ?? item.RISId)
              .then((ris) => {
                console.log('[DEBUG] IssuanceRISForm - Fallback fetched RIS:', ris);
                if (ris) {
                  const newRisForm = {
                    id: ris.id,
                    entityName: ris.entityName || 'Energy Regulatory Commission',
                    fundCluster: ris.fundCluster || '01',
                    officeId: ris.office?.id ?? ris.office?.Id ?? 0,
                    divisionId: ris.division?.id ?? ris.division?.Id ?? 0,
                    responsibilityCenterCode: ris.responsibilityCenterCode || '',
                    risNumber: ris.risNumber || '',
                    risPurpose: ris.risPurpose || '',
                    risRequestedDate: safeFormatDate(ris.risRequestedDate) || new Date().toISOString().slice(0, 10),
                    risRequestedBySystemUserId: ris.requestedBySystemUser?.id ?? ris.requestedBySystemUser?.Id ?? 0,
                    risApprovedBySystemUserId: ris.approvedBySystemUser?.id ?? ris.approvedBySystemUser?.Id ?? 0,
                    risApprovedDate: safeFormatDate(ris.risApprovedDate) || new Date().toISOString().slice(0, 10),
                    risIssuedBySystemUserId: ris.issuedBySystemUser?.id ?? ris.issuedBySystemUser?.Id ?? 0,
                    risIssuedDate: safeFormatDate(ris.risIssuedDate) || new Date().toISOString().slice(0, 10),
                    risReceivedBySystemUserId: ris.receivedBySystemUser?.id ?? ris.receivedBySystemUser?.Id ?? 0,
                    risReceivedDate: safeFormatDate(ris.risReceivedDate) || new Date().toISOString().slice(0, 10),
                    createdAt: safeFormatDate(ris.createdAt) || new Date().toISOString().slice(0, 10),
                  };
                  console.log('[DEBUG] IssuanceRISForm - Fallback setting risForm to:', newRisForm);
                  setRisForm(newRisForm);

                  const newRisItemForm = {
                    id: item.id ?? item.Id,
                    risId: item.risId ?? item.RisId ?? item.RISId ?? 0,
                    requisitionQuantity: totalCurrentStock || 0,
                    issueQuantity: item.issueQuantity ?? item.IssueQuantity ?? 0,
                    itemRemarks: item.itemRemarks ?? item.ItemRemarks ?? '',
                  };
                  console.log('[DEBUG] IssuanceRISForm - Fallback setting risItemForm to:', newRisItemForm);
                  setRisItemForm(newRisItemForm);
                } else {
                  console.warn('[DEBUG] IssuanceRISForm - Fallback fetched RIS is null/undefined');
                }
              })
              .catch((err) => console.error("[DEBUG] IssuanceRISForm - Failed to load parent RIS via fallback", err))
              .finally(() => setLoading(false));
          } else {
            console.warn('[DEBUG] IssuanceRISForm - Fallback could not find item with editItemId:', editItemId);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("[DEBUG] IssuanceRISForm - Failed to load RIS items in fallback", err);
          setLoading(false);
        });
      }
    } else if (!editItemId) {
      console.log('[DEBUG] IssuanceRISForm - Resetting form to defaults (no editItemId)');
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
    if (!risForm.fundCluster?.trim()) {
      toast.error('Fund Cluster is required');
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
    if (!risForm.responsibilityCenterCode?.trim()) {
      toast.error('Responsibility Center Code is required');
      return;
    }
    if (!risForm.risPurpose?.trim()) {
      toast.error('Purpose is required');
      return;
    }
    if (!risForm.risRequestedBySystemUserId || risForm.risRequestedBySystemUserId === 0) {
      toast.error('Requested By system user is required');
      return;
    }
    if (!risForm.risApprovedBySystemUserId || risForm.risApprovedBySystemUserId === 0) {
      toast.error('Approved By system user is required');
      return;
    }
    if (!risForm.risIssuedBySystemUserId || risForm.risIssuedBySystemUserId === 0) {
      toast.error('Issued By system user is required');
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
      const { systemUserId } = getAuthParams();

      const headerData: EditSupplyRIS = {
        id: risForm.id || 0,
        entityName: risForm.entityName,
        fundCluster: risForm.fundCluster,
        officeId: risForm.officeId,
        divisionId: risForm.divisionId || 0,
        responsibilityCenterCode: risForm.responsibilityCenterCode,
        risNumber: risForm.risNumber,
        risPurpose: risForm.risPurpose,
        risRequestedBySystemUserId: risForm.risRequestedBySystemUserId,
        risRequestedDate: risForm.risRequestedDate,

        isApproved: true,
        risApprovedBySystemUserId: risForm.risApprovedBySystemUserId || systemUserId,
        risApprovedDate: risForm.risApprovedDate ? new Date(risForm.risApprovedDate).toISOString() : new Date().toISOString(),
        risIssuedBySystemUserId: risForm.risIssuedBySystemUserId || systemUserId,
        risIssuedDate: risForm.risIssuedDate ? new Date(risForm.risIssuedDate).toISOString() : new Date().toISOString(),
        risReceivedBySystemUserId: risForm.risReceivedBySystemUserId || undefined,
        risReceivedDate: risForm.risReceivedBySystemUserId && risForm.risReceivedDate ? new Date(risForm.risReceivedDate).toISOString() : undefined,

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

        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Entity Name</Label>
          <Input value={risForm.entityName} onChange={(e) => setRisForm({ ...risForm, entityName: e.target.value })} className="bg-white border-slate-200 text-slate-900" />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Fund Cluster</Label>
          <Input value={risForm.fundCluster} onChange={(e) => setRisForm({ ...risForm, fundCluster: e.target.value })} className="bg-white border-slate-200 text-slate-900" />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">RIS Number <span className="text-red-500">*</span></Label>
          <Input required value={risForm.risNumber} onChange={(e) => setRisForm({ ...risForm, risNumber: e.target.value })} placeholder="e.g. RIS-2026-001" className="bg-white border-slate-200 text-slate-900" />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Responsibility Center Code (RCC) <span className="text-red-500">*</span></Label>
          <Input required value={risForm.responsibilityCenterCode} onChange={(e) => setRisForm({ ...risForm, responsibilityCenterCode: e.target.value })} placeholder="e.g. RCC-123" className="bg-white border-slate-200 text-slate-900" />
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

        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Requested By <span className="text-red-500">*</span></Label>
          <SearchableSelect
            value={risForm.risRequestedBySystemUserId}
            onChange={(val) => setRisForm({ ...risForm, risRequestedBySystemUserId: val })}
            options={users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }))}
            placeholder="Select Requester"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Date Requested</Label>
          <Input type="date" value={risForm.risRequestedDate} onChange={(e) => setRisForm({ ...risForm, risRequestedDate: e.target.value })} className="bg-white border-slate-200 text-slate-900" />
        </div>

        {/* Approved By & Date */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Approved By <span className="text-red-500">*</span></Label>
          <SearchableSelect
            value={risForm.risApprovedBySystemUserId}
            onChange={(val) => setRisForm({ ...risForm, risApprovedBySystemUserId: val })}
            options={users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }))}
            placeholder="Select Approver"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Date Approved</Label>
          <Input type="date" value={risForm.risApprovedDate} onChange={(e) => setRisForm({ ...risForm, risApprovedDate: e.target.value })} className="bg-white border-slate-200 text-slate-900" />
        </div>

        {/* Issued By & Date */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Issued By <span className="text-red-500">*</span></Label>
          <SearchableSelect
            value={risForm.risIssuedBySystemUserId}
            onChange={(val) => setRisForm({ ...risForm, risIssuedBySystemUserId: val })}
            options={users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }))}
            placeholder="Select Issuer"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Date Issued</Label>
          <Input type="date" value={risForm.risIssuedDate} onChange={(e) => setRisForm({ ...risForm, risIssuedDate: e.target.value })} className="bg-white border-slate-200 text-slate-900" />
        </div>

        {/* Received By & Date */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Received By</Label>
          <SearchableSelect
            value={risForm.risReceivedBySystemUserId}
            onChange={(val) => setRisForm({ ...risForm, risReceivedBySystemUserId: val })}
            options={users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }))}
            placeholder="Select Receiver"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Date Received</Label>
          <Input type="date" value={risForm.risReceivedDate} onChange={(e) => setRisForm({ ...risForm, risReceivedDate: e.target.value })} className="bg-white border-slate-200 text-slate-900" />
        </div>

        <div className="space-y-2 col-span-2">
          <Label className="text-slate-700 font-medium">Created At</Label>
          <Input type="date" value={risForm.createdAt} onChange={(e) => setRisForm({ ...risForm, createdAt: e.target.value })} className="bg-white border-slate-200 text-slate-900" />
        </div>

        <div className="space-y-2 col-span-2">
          <Label className="text-slate-700 font-medium">Purpose <span className="text-red-500">*</span></Label>
          <Textarea required value={risForm.risPurpose} onChange={(e) => setRisForm({ ...risForm, risPurpose: e.target.value })} placeholder="Purpose of this requisition..." className="bg-white border-slate-200 text-slate-900 min-h-[60px]" />
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
