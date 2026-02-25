import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { HardHat, RefreshCcw, ShieldCheck, Users, RotateCcw } from 'lucide-react';
import { createIssuance, generateParIcsNumber, getIssuanceStats, listIssuances, seedIssuances } from '@/api/asset/issuanceApi';
import { IssuanceRecord, IssuanceStats, IssuanceType } from '@/types/issuance';
import { toast } from 'sonner';
import { PPEIssuanceForm } from './PPEIssuanceForm';
import { PPEIssuanceRenewForm } from './PPEIssuanceRenewForm';

export interface IssuanceFormState {
  plantillaEmployeeId: string;
  plantillaEmployeeName: string;
  nonPlantillaEmployeeId: string;
  nonPlantillaEmployeeName: string;
  issuanceType: IssuanceType;
  issuedDate: string;
  expiryDate: string;
  notes: string;
}

export interface IssuanceItemFormState {
  itemName: string;
  itemGroup: 'PPE' | 'SE';
  parIcsNumber: string;
}

const defaultFormState = (): IssuanceFormState => ({
  plantillaEmployeeId: '',
  plantillaEmployeeName: '',
  nonPlantillaEmployeeId: '',
  nonPlantillaEmployeeName: '',
  issuanceType: 'NEW',
  issuedDate: new Date().toISOString().split('T')[0],
  expiryDate: '',
  notes: '',
});

const defaultItemState = (itemGroup: 'PPE' | 'SE' = 'PPE'): IssuanceItemFormState => ({
  itemName: '',
  itemGroup,
  parIcsNumber: generateParIcsNumber(itemGroup),
});

export function PPEIssuance() {
  const [stats, setStats] = useState<IssuanceStats>({ totalActive: 0, totalNew: 0, totalRenew: 0 });
  const [records, setRecords] = useState<IssuanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<IssuanceType | null>(null);
  const [form, setForm] = useState<IssuanceFormState>(defaultFormState());
  const [items, setItems] = useState<IssuanceItemFormState[]>([defaultItemState()]);
  const [renewState, setRenewState] = useState({
    employeeId: '',
    issuanceIds: [] as number[],
    issuedDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    seedIssuances();
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [statValues, issuanceList] = await Promise.all([getIssuanceStats(), listIssuances()]);
      setStats(statValues);
      setRecords(issuanceList);
    } catch (error) {
      console.error('Failed to load issuance data', error);
      toast.error('Unable to load PPE/SE issuance data');
    } finally {
      setLoading(false);
    }
  };

  const filteredActive = useMemo(() => records.filter((r) => r.status === 'ACTIVE'), [records]);
  const employeeOptions = useMemo(() => {
    const seen = new Set<number>();
    return records
      .filter((r) => {
        if (seen.has(r.employeeId)) return false;
        seen.add(r.employeeId);
        return true;
      })
      .map((r) => ({ id: String(r.employeeId), name: r.employeeName }));
  }, [records]);

  const handleChange = (field: keyof IssuanceFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof IssuanceItemFormState, value: string) => {
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (index !== itemIndex) return item;

        if (field === 'itemGroup') {
          const typedValue = value as IssuanceItemFormState['itemGroup'];
          return { ...item, itemGroup: typedValue, parIcsNumber: generateParIcsNumber(typedValue) };
        }

        return { ...item, [field]: value } as IssuanceItemFormState;
      })
    );
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, defaultItemState()]);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index)));
  };

  const resetRenewState = () => {
    setRenewState({
      employeeId: '',
      issuanceIds: [],
      issuedDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      notes: '',
    });
  };

  const openNewDialog = () => {
    setDialogMode('NEW');
    setDialogOpen(true);
    setForm(defaultFormState());
    setItems([defaultItemState()]);
  };

  const openRenewDialog = () => {
    setDialogMode('RENEW');
    setDialogOpen(true);
    resetRenewState();
  };

  const toggleRenewIssuance = (id: number) => {
    setRenewState((prev) => ({
      ...prev,
      issuanceIds: prev.issuanceIds.includes(id)
        ? prev.issuanceIds.filter((existing) => existing !== id)
        : [...prev.issuanceIds, id],
    }));
  };

  const submitForm = async () => {
    if (!form.plantillaEmployeeId || !form.plantillaEmployeeName) {
      toast.error('Plantilla employee details are required');
      return;
    }

    const hasValidItems = items.some((item) => item.itemName.trim());
    if (!hasValidItems) {
      toast.error('Add at least one item to issue');
      return;
    }

    setSaving(true);
    try {
      const payloads = items
        .filter((item) => item.itemName.trim())
        .map((item) =>
          createIssuance({
            employeeId: Number(form.plantillaEmployeeId),
            employeeName: form.plantillaEmployeeName,
            subEmployeeId: form.nonPlantillaEmployeeId ? Number(form.nonPlantillaEmployeeId) : undefined,
            subEmployeeName: form.nonPlantillaEmployeeName || undefined,
            itemName: item.itemName,
            itemGroup: item.itemGroup,
            parIcsNumber: item.parIcsNumber,
            issuanceType: form.issuanceType,
            issuedDate: form.issuedDate,
            expiryDate: form.expiryDate || undefined,
            notes: form.notes || undefined,
          })
        );

      await Promise.all(payloads);
      toast.success('Issuance recorded');
      setDialogOpen(false);
      setForm(defaultFormState());
      setItems([defaultItemState()]);
      refreshData();
    } catch (error) {
      console.error('Failed to create issuance', error);
      toast.error('Unable to save issuance');
    } finally {
      setSaving(false);
    }
  };

  const submitRenewForm = async () => {
    if (!renewState.employeeId) {
      toast.error('Pumili ng employee para i-renew');
      return;
    }

    if (!renewState.issuanceIds.length) {
      toast.error('Pumili ng PAR/ICS na i-re-renew');
      return;
    }

    const selectedRecords = records.filter((r) => renewState.issuanceIds.includes(r.id));
    if (!selectedRecords.length) {
      toast.error('Walang nakitang issuance na pwedeng i-renew');
      return;
    }

    setSaving(true);
    try {
      const payloads = selectedRecords.map((record) =>
        createIssuance({
          employeeId: record.employeeId,
          employeeName: record.employeeName,
          subEmployeeId: record.subEmployeeId,
          subEmployeeName: record.subEmployeeName,
          itemName: record.itemName,
          itemGroup: record.itemGroup,
          parIcsNumber: record.parIcsNumber,
          issuanceType: 'RENEW',
          issuedDate: renewState.issuedDate,
          expiryDate: renewState.expiryDate || undefined,
          notes: renewState.notes || record.notes || undefined,
        })
      );

      await Promise.all(payloads);
      toast.success('Renewal recorded');
      setDialogOpen(false);
      setDialogMode(null);
      resetRenewState();
      refreshData();
    } catch (error) {
      console.error('Failed to renew issuance', error);
      toast.error('Unable to renew issuance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 pt-20 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">PPE/SE Issuance</h1>
          <p className="text-muted-foreground">Issue and renew PPE/SE items per employee with active tracking.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={openNewDialog}>
            <HardHat className="w-4 h-4 mr-2" />
            New Issuance
          </Button>
          <Button variant="secondary" onClick={openRenewDialog}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Renew Issuance
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Active Issued Items</p>
              <p className="text-2xl font-semibold">{loading ? '...' : stats.totalActive}</p>
            </div>
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total NEW Issuances</p>
              <p className="text-2xl font-semibold">{loading ? '...' : stats.totalNew}</p>
            </div>
            <Users className="w-8 h-8 text-emerald-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total RENEW Issuances</p>
              <p className="text-2xl font-semibold">{loading ? '...' : stats.totalRenew}</p>
            </div>
            <RefreshCcw className="w-8 h-8 text-amber-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Issuance Records</CardTitle>
          <CardDescription>Every record is tied to a specific employee with issuance type and validity.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="pt-4">
              <IssuanceTable records={filteredActive} loading={loading} />
            </TabsContent>
            <TabsContent value="all" className="pt-4">
              <IssuanceTable records={records} loading={loading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen && dialogMode !== null}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setDialogMode(null);
          }
        }}
      >
        {dialogMode === 'NEW' ? (
          <PPEIssuanceForm
            form={form}
            items={items}
            saving={saving}
            onChange={handleChange}
            onItemChange={handleItemChange}
            onAddItem={addItemRow}
            onRemoveItem={removeItemRow}
            onSubmit={submitForm}
            onClose={() => {
              setDialogOpen(false);
              setDialogMode(null);
            }}
          />
        ) : null}

        {dialogMode === 'RENEW' ? (
          <PPEIssuanceRenewForm
            employees={employeeOptions}
            records={records}
            selectedEmployeeId={renewState.employeeId}
            selectedIssuanceIds={renewState.issuanceIds}
            issuedDate={renewState.issuedDate}
            expiryDate={renewState.expiryDate}
            notes={renewState.notes}
            saving={saving}
            onSelectEmployee={(id: string) => setRenewState((prev) => ({ ...prev, employeeId: id, issuanceIds: [] }))}
            onToggleIssuance={toggleRenewIssuance}
            onChangeIssuedDate={(value: string) => setRenewState((prev) => ({ ...prev, issuedDate: value }))}
            onChangeExpiryDate={(value: string) => setRenewState((prev) => ({ ...prev, expiryDate: value }))}
            onChangeNotes={(value: string) => setRenewState((prev) => ({ ...prev, notes: value }))}
            onSubmit={submitRenewForm}
            onClose={() => {
              setDialogOpen(false);
              setDialogMode(null);
            }}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

function IssuanceTable({ records, loading }: { records: IssuanceRecord[]; loading: boolean }) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (!records.length) {
    return <p className="text-sm text-muted-foreground">No issuance records yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Sub Accountable</TableHead>
          <TableHead>Item</TableHead>
          <TableHead>PAR/ICS</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Group</TableHead>
          <TableHead>Issued</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-semibold">{record.employeeName}</span>
                <span className="text-xs text-muted-foreground">ID: {record.employeeId}</span>
              </div>
            </TableCell>
            <TableCell>
              {record.subEmployeeName ? (
                <div className="flex flex-col">
                  <span className="font-semibold">{record.subEmployeeName}</span>
                  {record.subEmployeeId ? (
                    <span className="text-xs text-muted-foreground">ID: {record.subEmployeeId}</span>
                  ) : null}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>{record.itemName}</TableCell>
            <TableCell>{record.parIcsNumber}</TableCell>
            <TableCell>
              <Badge variant="secondary">{record.issuanceType}</Badge>
            </TableCell>
            <TableCell>{record.itemGroup}</TableCell>
            <TableCell>{record.issuedDate}</TableCell>
            <TableCell>{record.expiryDate || '—'}</TableCell>
            <TableCell>
              <Badge className={record.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : ''}>
                {record.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
