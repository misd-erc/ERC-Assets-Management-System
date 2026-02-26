import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { HardHat, RefreshCcw, ShieldCheck, Users, RotateCcw } from 'lucide-react';
import { createIssuance, getIssuanceStats, getNextParNumber, listIssuances, renewIssuance } from '@/api/asset/issuanceApi';
import { listSePpeItems, PtaItem } from '@/api/asset/ptaMovementApi';
import { getEmployees } from '@/api/user-management/userApi';
import { getOffices } from '@/api/office-management/officeApi';
import { getDivisions } from '@/api/office-management/divisionApi';
import { IssuanceRecord, IssuanceStats, IssuanceType } from '@/types/issuance';
import { NormalizedEmployee } from '@/types/asset/UnifiedAsset';
import { VwOffice, VwDivision } from '@/types/office';
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
  officeId: string;
  divisionId: string;
}

export interface IssuanceItemFormState {
  ptaId: number;
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
  officeId: '',
  divisionId: '',
});

const defaultItemState = (): IssuanceItemFormState => ({
  ptaId: 0,
  itemName: '',
  itemGroup: 'PPE',
  parIcsNumber: '',
});

export function PPEIssuance() {
  const [stats, setStats] = useState<IssuanceStats>({ totalActive: 0, totalNew: 0, totalRenew: 0 });
  const [records, setRecords] = useState<IssuanceRecord[]>([]);
  const [sePpeItems, setSePpeItems] = useState<PtaItem[]>([]);
  const [employees, setEmployees] = useState<NormalizedEmployee[]>([]);
  const [offices, setOffices] = useState<VwOffice[]>([]);
  const [divisions, setDivisions] = useState<VwDivision[]>([]);
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
    refreshData();
    fetchEmployees();
    fetchOfficesAndDivisions();
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

  // All records from the API are already filtered (status NEW/RENEW, isCurrent=true)
  const filteredActive = useMemo(() => records, [records]);

  // ptaIds that already have an active current movement — cannot be re-issued as NEW
  const issuedPtaIds = useMemo(() => new Set(records.map((r) => r.ptaId)), [records]);

  // Items available for a NEW issuance: those without any current movement yet
  const availableForNewIssuance = useMemo(
    () => sePpeItems.filter((i) => !issuedPtaIds.has(i.id)),
    [sePpeItems, issuedPtaIds]
  );

  // ptaIds already picked in the current form rows (for per-row dedup in the form)
  const pickedPtaIds = useMemo(() => new Set(items.map((i) => i.ptaId).filter(Boolean)), [items]);

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

  function normalizeEmployee(e: any): NormalizedEmployee {
    const firstName = e.firstName ?? '';
    const middleName = e.middleName ?? '';
    const lastName = e.lastName ?? '';
    const suffixName = e.suffixName ?? '';
    const employeeIdOriginal = e.employeeIdOriginal ?? '';
    const employmentTypeId = e.employmentType?.id ?? 1;
    const employmentTypeName = employmentTypeId === 1 ? 'Plantilla' : 'Non-Plantilla';
    const label = `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ''}${suffixName ? ` ${suffixName}` : ''}${employeeIdOriginal ? ` — ${employeeIdOriginal}` : ''} (${employmentTypeName})`;
    return { id: e.id, firstName, middleName, lastName, suffixName, employeeIdOriginal, employmentTypeId, label };
  }

  async function fetchEmployees() {
    try {
      const response = await getEmployees();
      setEmployees(response.data.items.map(normalizeEmployee));
    } catch (error) {
      console.error('Failed to load employees', error);
    }
  }

  async function fetchOfficesAndDivisions() {
    try {
      const [officesData, divisionsData] = await Promise.all([getOffices(), getDivisions()]);
      setOffices(officesData);
      setDivisions(divisionsData);
    } catch (error) {
      console.error('Failed to load offices/divisions', error);
    }
  }

  const handleItemChange = (index: number, field: keyof IssuanceItemFormState, value: string) => {
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (index !== itemIndex) return item;
        return { ...item, [field]: value } as IssuanceItemFormState;
      })
    );
  };

  const handleItemSelect = (index: number, ptaId: number) => {
    const selected = sePpeItems.find((i) => i.id === ptaId);
    if (!selected) return;
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, ptaId: selected.id, itemName: selected.description, itemGroup: selected.groupName }
          : item
      )
    );
  };

  const addItemRow = async () => {
    const parNumber = await getNextParNumber();
    setItems((prev) => [...prev, { ...defaultItemState(), parIcsNumber: parNumber }]);
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

  const openNewDialog = async () => {
    setDialogMode('NEW');
    setDialogOpen(true);
    setForm(defaultFormState());
    // Always re-fetch so the list reflects the latest issued state
    const [parNumber, freshItems] = await Promise.all([
      getNextParNumber(),
      listSePpeItems(),
    ]);
    setSePpeItems(freshItems);
    setItems([{ ...defaultItemState(), parIcsNumber: parNumber }]);
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

    const hasValidItems = items.some((item) => item.ptaId > 0);
    if (!hasValidItems) {
      toast.error('Pumili ng kahit isang item na ibibigay');
      return;
    }

    setSaving(true);
    try {
      const payloads = items
        .filter((item) => item.ptaId > 0)
        .map((item) =>
          createIssuance({
            ptaId: item.ptaId,
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
            actualOfficeId: Number(form.officeId) || 0,
            actualDivisionId: Number(form.divisionId) || 0,
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
      await Promise.all(
        selectedRecords.map((record) => renewIssuance(record, renewState.issuedDate))
      );
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
            sePpeItems={availableForNewIssuance}
            pickedPtaIds={pickedPtaIds}
            employees={employees}
            offices={offices}
            divisions={divisions}
            saving={saving}
            onChange={handleChange}
            onItemChange={handleItemChange}
            onItemSelect={handleItemSelect}
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
