import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { IssuanceRecord } from '@/types/issuance';

interface EmployeeOption {
  id: string;
  name: string;
}

interface PPEIssuanceRenewFormProps {
  employees: EmployeeOption[];
  records: IssuanceRecord[];
  selectedEmployeeId: string;
  selectedIssuanceIds: number[];
  issuedDate: string;
  saving: boolean;
  onSelectEmployee: (id: string) => void;
  onToggleIssuance: (id: number) => void;
  onChangeIssuedDate: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function PPEIssuanceRenewForm({
  employees,
  records,
  selectedEmployeeId,
  selectedIssuanceIds,
  issuedDate,
  saving,
  onSelectEmployee,
  onToggleIssuance,
  onChangeIssuedDate,
  onSubmit,
  onClose,
}: PPEIssuanceRenewFormProps) {
  const [expandedParIcs, setExpandedParIcs] = useState<string | null>(null);

  const employeeRecords = selectedEmployeeId
    ? records.filter((r) => r.employeeId === Number(selectedEmployeeId))
    : [];

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
    <DialogContent className="max-w-5xl w-full">
      <DialogHeader>
        <DialogTitle>Renew Issuance</DialogTitle>
        <DialogDescription>
          Select an employee, then choose the PAR/ICS records to renew. You can renew one or more items in a single submission.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 py-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="renewEmployee">Employee</Label>
            <select
              id="renewEmployee"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedEmployeeId}
              onChange={(e) => onSelectEmployee(e.target.value)}
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} (ID: {emp.id})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="issuedDateRenew">Renewal Date</Label>
            <Input
              id="issuedDateRenew"
              type="date"
              value={issuedDate}
              onChange={(e) => onChangeIssuedDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">PAR/ICS to renew</p>
              <p className="text-xs text-muted-foreground">
                {parIcsGroups.size > 0
                  ? `${parIcsGroups.size} PAR/ICS group${parIcsGroups.size !== 1 ? 's' : ''} — click a group to view and select items.`
                  : 'All active issuance records for the selected employee will appear here.'}
              </p>
            </div>
          </div>

          {selectedEmployeeId && employeeRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active issuance records found for this employee.</p>
          ) : null}

          {!selectedEmployeeId ? (
            <p className="text-sm text-muted-foreground">Select an employee to view their PAR/ICS records.</p>
          ) : null}

          {Array.from(parIcsGroups.entries()).map(([parIcs, groupRecords]) => {
            const isExpanded = expandedParIcs === parIcs;
            const selectedCount = groupRecords.filter((r) => selectedIssuanceIds.includes(r.id)).length;

            return (
              <div key={parIcs} className="rounded-md border overflow-hidden">
                {/* PAR/ICS header row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(parIcs)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                      : <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />}
                    <Badge>{parIcs}</Badge>
                    <Badge variant="secondary">{groupRecords[0].itemGroup}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {groupRecords.length} item{groupRecords.length !== 1 ? 's' : ''}
                    </span>
                    {selectedCount > 0 && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                        {selectedCount} selected
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {groupRecords[0].issuedDate}
                  </span>
                </button>

                {/* Expandable items */}
                {isExpanded && (
                  <div className="border-t divide-y">
                    {groupRecords.map((record) => {
                      const selected = selectedIssuanceIds.includes(record.id);
                      return (
                        <div
                          key={record.id}
                          className={`flex items-center justify-between gap-3 px-4 py-3 ${selected ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-background'}`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <p className="font-medium text-sm truncate">{record.itemName}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">{record.issuanceType}</Badge>
                              {record.condition && (
                                <Badge variant="outline" className="text-xs">{record.condition}</Badge>
                              )}
                              {record.propertyNumber && (
                                <span className="text-xs text-muted-foreground">{record.propertyNumber}</span>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant={selected ? 'default' : 'outline'}
                            size="sm"
                            className="shrink-0"
                            onClick={() => onToggleIssuance(record.id)}
                          >
                            {selected ? 'Selected' : 'Select'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={saving}>
          {saving ? 'Saving...' : 'Renew Issuance'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
