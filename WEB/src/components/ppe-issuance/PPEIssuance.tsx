import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HardHat, RefreshCcw, ShieldCheck, Users, RotateCcw, Eye, Search, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { createIssuance, getIssuanceStats, getNextParNumber, IssuanceListParams, listIssuances, renewIssuance } from '@/api/asset/issuanceApi';
import { listSePpeItemsNoMovement, PtaItem } from '@/api/asset/ptaMovementApi';
import { getEmployees } from '@/api/user-management/userApi';
import { getOffices } from '@/api/office-management/officeApi';
import { getDivisions } from '@/api/office-management/divisionApi';
import { IssuanceRecord, IssuanceStats, IssuanceType } from '@/types/issuance';
import { NormalizedEmployee } from '@/types/asset/UnifiedAsset';
import { VwOffice, VwDivision } from '@/types/office';
import { toast } from 'sonner';
import { PPEIssuanceForm } from './PPEIssuanceForm';
import { PPEIssuanceRenewForm } from './PPEIssuanceRenewForm';
import { PARGenerator } from '@/components/assets/reports/PARGenerator';
import { ICSGenerator } from '@/components/assets/reports/ICSGenerator';

export interface IssuanceFormState {
  group: 'PPE' | 'SE';
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
  group: 'PPE',
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
  const [promptOpen, setPromptOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<IssuanceType | null>(null);
  const [form, setForm] = useState<IssuanceFormState>(defaultFormState());
  const [items, setItems] = useState<IssuanceItemFormState[]>([defaultItemState()]);
  const [renewState, setRenewState] = useState({
    employeeId: '',
    issuanceIds: [] as number[],
    issuedDate: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [detailRecords, setDetailRecords] = useState<IssuanceRecord[] | null>(null);

  // Filters & pagination
  const [searchEmployee, setSearchEmployee] = useState('');
  const [parIcsFilter, setParIcsFilter] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Prevent the filter effect from double-firing on mount
  // (refreshData already handles the initial load)
  const isInitialMount = useRef(true);

  useEffect(() => {
    refreshData();
    fetchEmployees();
    fetchOfficesAndDivisions();
  }, []);

  // Re-fetch whenever filters, page number, or page size change (skip first mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchIssuanceData();
  }, [searchEmployee, parIcsFilter, pageNumber, pageSize]);

  const fetchIssuanceData = async (overrides?: Partial<IssuanceListParams>) => {
    setLoading(true);
    try {
      const result = await listIssuances({
        searchEmployee: searchEmployee || undefined,
        parIcsFilter: parIcsFilter || undefined,
        pageNumber,
        pageSize,
        ...overrides,
      });
      setRecords(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Failed to load issuance data', error);
      toast.error('Unable to load PPE/SE issuance data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const [statValues, result] = await Promise.all([
        getIssuanceStats(),
        listIssuances({ pageNumber: 1, pageSize }),
      ]);
      setStats(statValues);
      setRecords(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Failed to load issuance data', error);
      toast.error('Unable to load PPE/SE issuance data');
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 and trigger re-fetch via the effect
  const handleSearch = () => {
    if (pageNumber === 1) {
      // pageNumber won't change, so effect won't fire — call directly
      fetchIssuanceData({ pageNumber: 1 });
    } else {
      setPageNumber(1); // effect fires
    }
  };

  const handleClear = () => {
    setSearchEmployee('');
    setParIcsFilter('');
    if (pageNumber === 1) {
      fetchIssuanceData({ searchEmployee: undefined, parIcsFilter: undefined, pageNumber: 1 });
    } else {
      setPageNumber(1);
    }
  };

  const handlePageSizeChange = (value: string) => {
    const newSize = Number(value);
    setPageSize(newSize);
    setPageNumber(1);
  };

  // All records from the API are already filtered (status NEW/RENEW, isCurrent=true)
  const filteredActive = useMemo(() => records, [records]);
  const filteredPPE = useMemo(() => records.filter((r) => r.itemGroup === 'PPE'), [records]);
  const filteredSE = useMemo(() => records.filter((r) => r.itemGroup === 'SE'), [records]);

  // Unique PAR/ICS groups (for tab count display)
  const ppeParIcsCount = useMemo(() => new Set(filteredPPE.map((r) => r.parIcsNumber)).size, [filteredPPE]);
  const seParIcsCount = useMemo(() => new Set(filteredSE.map((r) => r.parIcsNumber)).size, [filteredSE]);

  const handleViewParIcs = (parIcsNumber: string, source: IssuanceRecord[]) => {
    setDetailRecords(source.filter((r) => r.parIcsNumber === parIcsNumber));
  };

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

  const handleGroupChange = async (group: 'PPE' | 'SE') => {
    setForm((prev) => ({ ...prev, group }));
    // Reset item selections when group changes
    setItems((prev) => prev.map((item) => ({ ...item, ptaId: 0, itemName: '', itemGroup: group })));
    const freshItems = await listSePpeItemsNoMovement(group);
    setSePpeItems(freshItems);
  };

  function normalizeEmployee(e: any): NormalizedEmployee {
    const firstName = e.firstName ?? '';
    const middleName = e.middleName ?? '';
    const lastName = e.lastName ?? '';
    const suffixName = e.suffixName ?? '';
    const employeeIdOriginal = e.employeeIdOriginal ?? '';
    const employmentTypeId = e.employmentType?.id ?? 1;
    const employmentTypeName = e.employmentType?.name ?? 'Plantilla';
    const groupLabel = employmentTypeName === 'Plantilla' || employmentTypeName === 'Contractual' ? 'Plantilla' : 'Non-Plantilla';
    const label = `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ''}${suffixName ? ` ${suffixName}` : ''}${employeeIdOriginal ? ` — ${employeeIdOriginal}` : ''} (${groupLabel})`;
    return { id: e.id, firstName, middleName, lastName, suffixName, employeeIdOriginal, employmentTypeId, employmentTypeName, label };
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
    });
  };

  const openNewDialog = () => {
    setPromptOpen(true);
  };

  const confirmGroupPrompt = async (group: 'PPE' | 'SE') => {
    setPromptOpen(false);
    setDialogMode('NEW');
    setForm({ ...defaultFormState(), group });
    setDialogOpen(true);
    // Fetch par number and items for the chosen group
    const [parNumber, freshItems] = await Promise.all([
      getNextParNumber(),
      listSePpeItemsNoMovement(group),
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

    if (!form.officeId) {
      toast.error('Office is required');
      return;
    }

    if (!form.divisionId) {
      toast.error('Division is required');
      return;
    }

    const hasValidItems = items.some((item) => item.ptaId > 0);
    if (!hasValidItems) {
      toast.error('Please select at least one item to issue');
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
      setPageNumber(1);
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
      toast.error('Please select an employee to renew');
      return;
    }

    if (!renewState.issuanceIds.length) {
      toast.error('Please select at least one PAR/ICS to renew');
      return;
    }

    const selectedRecords = records.filter((r) => renewState.issuanceIds.includes(r.id));
    if (!selectedRecords.length) {
      toast.error('No matching issuance records found for renewal');
      return;
    }

    setSaving(true);
    try {
      // Group selected records by their current PAR/ICS number.
      // Each group gets ONE freshly generated PAR/ICS number so all items
      // under the same PAR/ICS share the new number after renewal.
      const groupMap = new Map<string, IssuanceRecord[]>();
      for (const record of selectedRecords) {
        const existing = groupMap.get(record.parIcsNumber);
        if (existing) existing.push(record);
        else groupMap.set(record.parIcsNumber, [record]);
      }

      // Generate a new PAR/ICS number sequentially for each group
      const renewalTasks: Array<() => Promise<boolean>> = [];
      for (const groupRecords of groupMap.values()) {
        const newParIcsNumber = await getNextParNumber();
        for (const record of groupRecords) {
          renewalTasks.push(() => renewIssuance(record, renewState.issuedDate, newParIcsNumber));
        }
      }

      await Promise.all(renewalTasks.map((fn) => fn()));
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
        <CardContent className="space-y-4">
          {/* Search / Filter bar */}
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs text-muted-foreground mb-1">Search Employee</p>
              <Input
                placeholder="Name or Employee ID..."
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <p className="text-xs text-muted-foreground mb-1">PAR/ICS Filter</p>
              <Input
                placeholder="PAR, ICS, or number..."
                value={parIcsFilter}
                onChange={(e) => setParIcsFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="shrink-0">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button variant="ghost" className="shrink-0" onClick={handleClear}>
              Clear
            </Button>
          </div>

          <Tabs defaultValue="ppe">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="ppe">PPE ({loading ? '...' : ppeParIcsCount} PAR)</TabsTrigger>
              <TabsTrigger value="se">SE ({loading ? '...' : seParIcsCount} ICS)</TabsTrigger>
            </TabsList>

            <TabsContent value="ppe" className="pt-4">
              <IssuanceTable records={filteredPPE} loading={loading} onView={(parIcsNumber) => handleViewParIcs(parIcsNumber, filteredPPE)} />
            </TabsContent>
            <TabsContent value="se" className="pt-4">
              <IssuanceTable records={filteredSE} loading={loading} onView={(parIcsNumber) => handleViewParIcs(parIcsNumber, filteredSE)} />
            </TabsContent>
          </Tabs>

          {/* Pagination — always visible once data has loaded */}
          {!loading && (
            <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {totalCount > 0
                    ? `Page ${pageNumber} of ${totalPages} — ${totalCount} total record${totalCount !== 1 ? 's' : ''}`
                    : 'No records found'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 25, 50, 100].map((size) => (
                        <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageNumber >= totalPages}
                  onClick={() => setPageNumber((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Prompt Dialog */}
      <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Select Issuance Type</DialogTitle>
            <DialogDescription>What type of items are you issuing?</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-1">
            <Button className="w-full justify-start" onClick={() => confirmGroupPrompt('PPE')}>
              PPE &mdash; Property, Plant &amp; Equipment
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => confirmGroupPrompt('SE')}>
              SE &mdash; Semi-Expendable Equipment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailRecords} onOpenChange={(open) => { if (!open) setDetailRecords(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>PAR/ICS Details — {detailRecords?.[0]?.parIcsNumber}</DialogTitle>
          </DialogHeader>
          {detailRecords && (
            <>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!detailRecords.length) return;
                    try {
                      if (detailRecords[0].itemGroup === 'PPE') {
                        await PARGenerator.generateFromIssuanceRecords(detailRecords);
                      } else {
                        await ICSGenerator.generateFromIssuanceRecords(detailRecords);
                      }
                    } catch (err) {
                      console.error('Print failed', err);
                      toast.error('Failed to generate PDF');
                    }
                  }}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print {detailRecords[0]?.itemGroup === 'PPE' ? 'PAR' : 'ICS'}
                </Button>
              </div>
              <IssuanceDetailPanel records={detailRecords} />
            </>
          )}
        </DialogContent>
      </Dialog>

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
            saving={saving}
            onSelectEmployee={(id: string) => setRenewState((prev) => ({ ...prev, employeeId: id, issuanceIds: [] }))}
            onToggleIssuance={toggleRenewIssuance}
            onChangeIssuedDate={(value: string) => setRenewState((prev) => ({ ...prev, issuedDate: value }))}
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

function IssuanceTable({
  records,
  loading,
  onView,
}: {
  records: IssuanceRecord[];
  loading: boolean;
  onView: (parIcsNumber: string) => void;
}) {
  // Group by parIcsNumber, preserving order of first appearance
  // Must be called before any early returns (Rules of Hooks)
  const groups = useMemo(() => {
    const map = new Map<string, IssuanceRecord[]>();
    for (const r of records) {
      const existing = map.get(r.parIcsNumber);
      if (existing) existing.push(r);
      else map.set(r.parIcsNumber, [r]);
    }
    return Array.from(map.values());
  }, [records]);

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
          <TableHead>PAR/ICS</TableHead>
          <TableHead>Employee</TableHead>
          <TableHead>Sub Accountable</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Issued Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((group) => {
          const first = group[0];
          return (
            <TableRow key={first.parIcsNumber}>
              <TableCell className="font-medium">{first.parIcsNumber}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold">{first.employeeName}</span>
                </div>
              </TableCell>
              <TableCell>
                {first.subEmployeeName ? (
                  <div className="flex flex-col">
                    <span className="font-semibold">{first.subEmployeeName}</span>
                    {first.subEmployeeId ? (
                      <span className="text-xs text-muted-foreground">ID: {first.subEmployeeId}</span>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{group.length} item{group.length !== 1 ? 's' : ''}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{first.issuanceType}</Badge>
              </TableCell>
              <TableCell>{first.issuedDate}</TableCell>
              <TableCell>
                <Badge className={first.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : ''}>
                  {first.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => onView(first.parIcsNumber)}>
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? '—'}</span>
    </div>
  );
}

function IssuanceDetailPanel({ records }: { records: IssuanceRecord[] }) {
  const first = records[0];
  return (
    <div className="space-y-5 text-sm max-h-[70vh] overflow-y-auto pr-1">
      {/* PAR/ICS Info */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Issuance Info</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <DetailRow label="PAR/ICS Number" value={first.parIcsNumber} />
          <DetailRow label="Issuance Type" value={first.issuanceType} />
          <DetailRow label="Status" value={first.status} />
          <DetailRow label="Date Issued" value={first.issuedDate} />
          <DetailRow label="Expiry Date" value={first.expiryDate} />
          <DetailRow label="Remarks" value={first.notes} />
        </div>
      </div>

      <hr />

      {/* Accountable Persons */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Accountable Person</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <DetailRow label="Name" value={first.employeeName} />
          <DetailRow label="Employee ID" value={first.employeeIdOriginal || String(first.employeeId)} />
          <DetailRow label="Office" value={first.officeName ? `${first.officeName}${first.officeAcronym ? ` (${first.officeAcronym})` : ''}` : undefined} />
          <DetailRow label="Division" value={first.divisionName ? `${first.divisionName}${first.divisionAcronym ? ` (${first.divisionAcronym})` : ''}` : undefined} />
        </div>
      </div>

      {first.subEmployeeName && (
        <>
          <hr />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Sub-Accountable Person</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <DetailRow label="Name" value={first.subEmployeeName} />
              <DetailRow label="Employee ID" value={first.subEmployeeIdOriginal || (first.subEmployeeId ? String(first.subEmployeeId) : undefined)} />
            </div>
          </div>
        </>
      )}

      <hr />

      {/* Items */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Items ({records.length})
        </p>
        <div className="space-y-4">
          {records.map((record, idx) => (
            <div key={record.id} className="border rounded-md p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Item #{idx + 1}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="col-span-2 sm:col-span-3">
                  <DetailRow label="Description" value={record.itemName} />
                </div>
                <DetailRow label="Property Number" value={record.propertyNumber} />
                <DetailRow label="Category" value={record.category} />
                <DetailRow label="Group" value={record.itemGroup} />
                <DetailRow label="Brand" value={record.brand} />
                <DetailRow label="Model" value={record.model} />
                <DetailRow label="Serial Number" value={record.serialNumber} />
                <DetailRow label="Unit of Measurement" value={record.unitOfMeasurement} />
                <DetailRow label="Unit Value" value={record.unitValue != null ? `₱${record.unitValue.toLocaleString()}` : undefined} />
                <DetailRow label="Date Acquired" value={record.dateAcquired} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
