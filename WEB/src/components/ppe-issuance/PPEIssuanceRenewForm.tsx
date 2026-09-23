import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { IssuanceRecord } from '@/types/issuance';
import { EmployeePicker } from './PPEIssuanceForm';

interface EmployeeOption {
  id: string;
  name: string;
}

interface PPEIssuanceRenewFormProps {
  employees: EmployeeOption[];
  records: IssuanceRecord[];
  selectedEmployeeId: string;
  selectedSubEmployeeId: string;
  loading: boolean;
  loadError: boolean;
  selectedIssuanceIds: number[];
  issuedDate: string;
  saving: boolean;
  onSelectEmployee: (id: string) => void;
  onSelectSubEmployee: (id: string) => void;
  onToggleIssuance: (id: number) => void;
  onChangeIssuedDate: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function PPEIssuanceRenewForm({
  employees,
  records,
  selectedEmployeeId,
  selectedSubEmployeeId,
  loading,
  loadError,
  selectedIssuanceIds,
  issuedDate,
  saving,
  onSelectEmployee,
  onSelectSubEmployee,
  onToggleIssuance,
  onChangeIssuedDate,
  onSubmit,
  onClose,
}: PPEIssuanceRenewFormProps) {
  const [expandedParIcs, setExpandedParIcs] = useState<string | null>(null);

  const hasEmployeeFilter = Boolean(selectedEmployeeId);
  const employeeRecords = selectedEmployeeId
    ? records.filter((r) => r.employeeId === Number(selectedEmployeeId))
    : [];
  const employeeOptions = employees.map((employee) => ({
    value: employee.id,
    label: employee.name + ' (ID: ' + employee.id + ')',
    name: employee.name,
  }));
  const hasSelectedItems = employeeRecords.some((record) => selectedIssuanceIds.includes(record.id));

  // Group by PAR/ICS number, preserving first-appearance order
  const parIcsGroups = employeeRecords.reduce<Map<string, IssuanceRecord[]>>((map, r) => {
    const group = map.get(r.parIcsNumber);
    if (group) group.push(r);
    else map.set(r.parIcsNumber, [r]);
    return map;
  }, new Map());

  const toggleExpand = (parIcs: string) => {
    setExpandedParIcs((prev) => (prev === parIcs ? null : parIcs));
  };

  return (
    <DialogContent className="sm:max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
      <DialogHeader className="shrink-0 pr-6">
        <DialogTitle>Renew Issuance</DialogTitle>
        <DialogDescription>
          Select an accountable employee, choose items to renew, then optionally select a sub-accountable employee for those items.
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 min-w-0 space-y-5 overflow-y-auto overflow-x-hidden py-2 pr-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <fieldset disabled={saving} className="space-y-2 md:col-span-2 min-w-0">
            <legend className="text-sm font-medium mb-2">Accountable Employee</legend>
            <EmployeePicker
              options={employeeOptions}
              selectedValue={selectedEmployeeId}
              onSelect={(id) => { setExpandedParIcs(null); onSelectEmployee(id); }}
              placeholder="Search accountable employee..."
            />
          </fieldset>
          <div className="space-y-2 min-w-0">
            <Label htmlFor="issuedDateRenew">Renewal Date</Label>
            <Input id="issuedDateRenew" type="date" value={issuedDate} disabled={saving}
              onChange={(e) => onChangeIssuedDate(e.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">PAR/ICS to renew</p>
          {loading && <p role="status">Loading renewal records...</p>}
          {loadError && <p role="alert" className="text-destructive">Unable to load renewal records. Close and reopen this dialog to retry.</p>}
          {!hasEmployeeFilter && <p className="text-sm text-muted-foreground">Select an accountable employee to view their PAR/ICS records.</p>}
          {!loading && !loadError && hasEmployeeFilter && !employeeRecords.length && (
            <p className="text-sm text-muted-foreground">No active issuance records found for this accountable employee.</p>
          )}
          {Array.from(parIcsGroups.entries()).map(([parIcs, groupRecords]) => {
            const expanded = expandedParIcs === parIcs;
            const selectedCount = groupRecords.filter((r) => selectedIssuanceIds.includes(r.id)).length;
            return (
              <div key={parIcs} className="rounded-md border overflow-hidden">
                <button type="button" onClick={() => toggleExpand(parIcs)} aria-expanded={expanded}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-accent">
                  <div className="flex items-center gap-3 flex-wrap">
                    {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <Badge>{parIcs}</Badge>
                    <Badge variant="secondary">{groupRecords[0].itemGroup}</Badge>
                    <span className="text-sm">{groupRecords.length} item(s)</span>
                    {selectedCount > 0 && <Badge>{selectedCount} selected</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">{groupRecords[0].issuedDate}</span>
                </button>
                {expanded && <div className="border-t divide-y">
                  {groupRecords.map((record) => {
                    const selected = selectedIssuanceIds.includes(record.id);
                    return (
                      <div key={record.id} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 ${selected ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-background'}`}>
                        <div className="space-y-1 min-w-0 [overflow-wrap:anywhere]">
                          <p className="font-medium text-sm break-words">{record.itemName}</p>
                          <p className="text-xs text-muted-foreground">Accountable: {record.employeeName}</p>
                          <p className="text-xs text-muted-foreground">Sub-Accountable: {record.subEmployeeName || 'None'}</p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline">{record.issuanceType}</Badge>
                            {record.condition && <Badge variant="outline">{record.condition}</Badge>}
                            {record.propertyNumber && <span className="text-xs text-muted-foreground">{record.propertyNumber}</span>}
                          </div>
                        </div>
                        <Button type="button" size="sm" className="shrink-0" disabled={saving} variant={selected ? 'default' : 'outline'}
                          onClick={() => onToggleIssuance(record.id)}>{selected ? 'Selected' : 'Select'}</Button>
                      </div>
                    );
                  })}
                </div>}
              </div>
            );
          })}
        </div>

        {hasSelectedItems && (
          <fieldset disabled={saving} className="min-w-0 space-y-2 rounded-md border p-4 pb-6">
            <legend className="px-1 text-sm font-medium">Sub-Accountable Employee</legend>
            <p className="text-sm text-muted-foreground">
              The existing sub-accountable employee is selected automatically when the selected items share one.
              If they have different assignments, this stays blank to keep each item's existing sub-accountable employee.
              Choosing an employee applies to all selected items.
            </p>
            <EmployeePicker options={employeeOptions} selectedValue={selectedSubEmployeeId}
              onSelect={(id) => onSelectSubEmployee(id)} placeholder="Search sub-accountable employee (optional)..." />
          </fieldset>
        )}
      </div>
      <DialogFooter className="shrink-0 gap-2 border-t pt-4">
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={onSubmit} disabled={saving || loading || loadError || !hasSelectedItems || !issuedDate}>
          {saving ? 'Saving...' : 'Renew Issuance'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
