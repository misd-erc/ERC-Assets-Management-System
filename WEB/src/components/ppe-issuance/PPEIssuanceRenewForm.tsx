import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  expiryDate: string;
  notes: string;
  saving: boolean;
  onSelectEmployee: (id: string) => void;
  onToggleIssuance: (id: number) => void;
  onChangeIssuedDate: (value: string) => void;
  onChangeExpiryDate: (value: string) => void;
  onChangeNotes: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function PPEIssuanceRenewForm({
  employees,
  records,
  selectedEmployeeId,
  selectedIssuanceIds,
  issuedDate,
  expiryDate,
  notes,
  saving,
  onSelectEmployee,
  onToggleIssuance,
  onChangeIssuedDate,
  onChangeExpiryDate,
  onChangeNotes,
  onSubmit,
  onClose,
}: PPEIssuanceRenewFormProps) {
  const employeeRecords = selectedEmployeeId
    ? records.filter((r) => r.employeeId === Number(selectedEmployeeId))
    : [];

  return (
    <DialogContent className="max-w-5xl w-full">
      <DialogHeader>
        <DialogTitle>Renew Issuance</DialogTitle>
        <DialogDescription>
          Piliin ang employee, tapos pumili ng PAR/ICS na i-re-renew. Maaari kang mag-renew ng isa o higit pang item sa isang submit.
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
            <Label htmlFor="issuedDateRenew">Issued Date</Label>
            <Input
              id="issuedDateRenew"
              type="date"
              value={issuedDate}
              onChange={(e) => onChangeIssuedDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiryDateRenew">Expiry Date (optional)</Label>
            <Input
              id="expiryDateRenew"
              type="date"
              value={expiryDate}
              onChange={(e) => onChangeExpiryDate(e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notesRenew">Notes</Label>
            <Input
              id="notesRenew"
              value={notes}
              onChange={(e) => onChangeNotes(e.target.value)}
              placeholder="Optional notes for renewal"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">PAR/ICS to renew</p>
              <p className="text-xs text-muted-foreground">Makikita dito lahat ng active issuance ng napiling employee.</p>
            </div>
          </div>

          {selectedEmployeeId && employeeRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">Walang active issuance para sa employee na ito.</p>
          ) : null}

          {!selectedEmployeeId ? (
            <p className="text-sm text-muted-foreground">Pumili muna ng employee para lumabas ang listahan ng PAR/ICS.</p>
          ) : null}

          {employeeRecords.map((record) => {
            const selected = selectedIssuanceIds.includes(record.id);
            return (
              <div
                key={record.id}
                className={`rounded-md border p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${selected ? 'border-blue-500 bg-blue-50' : ''}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge>{record.parIcsNumber}</Badge>
                    <Badge variant="secondary">{record.itemGroup}</Badge>
                    <Badge variant="outline">{record.issuanceType}</Badge>
                  </div>
                  <p className="font-semibold">{record.itemName}</p>
                  <p className="text-xs text-muted-foreground">Issued: {record.issuedDate}</p>
                  <p className="text-xs text-muted-foreground">Expiry: {record.expiryDate || '—'}</p>
                </div>
                <Button
                  type="button"
                  variant={selected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onToggleIssuance(record.id)}
                >
                  {selected ? 'Selected' : 'Select to Renew'}
                </Button>
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
