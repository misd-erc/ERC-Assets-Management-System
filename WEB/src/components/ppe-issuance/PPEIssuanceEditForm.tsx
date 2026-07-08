import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/components/ui/utils';
import { EmployeeOption, EmployeePicker } from './PPEIssuanceForm';
import { NormalizedEmployee } from '@/types/asset/UnifiedAsset';
import { VwOffice, VwDivision } from '@/types/office';
import { IssuanceRecord } from '@/types/issuance';
import { UpdateIssuanceGroupPayload } from '@/api/asset/issuanceApi';

interface PPEIssuanceEditFormProps {
  group: IssuanceRecord[];
  employees: NormalizedEmployee[];
  offices: VwOffice[];
  divisions: VwDivision[];
  saving: boolean;
  onSubmit: (updates: UpdateIssuanceGroupPayload) => void;
  onClose: () => void;
}

export function PPEIssuanceEditForm({
  group,
  employees,
  offices,
  divisions,
  saving,
  onSubmit,
  onClose,
}: PPEIssuanceEditFormProps) {
  const first = group[0];

  const [parIcsNumber, setParIcsNumber] = useState(first.parIcsNumber || '');
  const [plantillaEmployeeId, setPlantillaEmployeeId] = useState(String(first.employeeId));
  const [nonPlantillaEmployeeId, setNonPlantillaEmployeeId] = useState(first.subEmployeeId ? String(first.subEmployeeId) : '');
  const [officeId, setOfficeId] = useState(first.actualOfficeId ? String(first.actualOfficeId) : '');
  const [divisionId, setDivisionId] = useState(first.actualDivisionId ? String(first.actualDivisionId) : '');
  const [issuedDate, setIssuedDate] = useState(first.issuedDate || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(first.notes || '');

  const plantillaOptions: EmployeeOption[] = employees
    .filter((e) => e.employmentTypeName === 'Plantilla' || e.employmentTypeName === 'Contractual')
    .map((e) => ({
      value: e.id.toString(),
      label: e.label,
      name: `${e.lastName}, ${e.firstName}${e.middleName ? ' ' + e.middleName : ''}`.trim(),
    }));

  const nonPlantillaOptions: EmployeeOption[] = employees
    .filter((e) => e.employmentTypeName !== 'Plantilla' && e.employmentTypeName !== 'Contractual')
    .map((e) => ({
      value: e.id.toString(),
      label: e.label,
      name: `${e.lastName}, ${e.firstName}${e.middleName ? ' ' + e.middleName : ''}`.trim(),
    }));

  const filteredDivisions = divisions.filter((d) => !officeId || d.office?.id.toString() === officeId);

  const canSubmit = !!parIcsNumber.trim() && !!plantillaEmployeeId && !!officeId && !!divisionId && !!issuedDate;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      parIcsNumber: parIcsNumber.trim(),
      employeeId: Number(plantillaEmployeeId),
      subEmployeeId: nonPlantillaEmployeeId ? Number(nonPlantillaEmployeeId) : undefined,
      actualOfficeId: Number(officeId),
      actualDivisionId: Number(divisionId),
      issuedDate,
      notes: notes || undefined,
    });
  };

  return (
    <DialogContent className="sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl">Edit Issuance — {first.parIcsNumber}</DialogTitle>
        <DialogDescription>
          Updates (including the {first.itemGroup === 'PPE' ? 'PAR' : 'ICS'} number) apply to all {group.length} item{group.length !== 1 ? 's' : ''} in this group.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-2">
        <section className="space-y-4">
          <p className="text-base font-semibold">Accountable Employee</p>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Accountable Employee (Plantilla) *</Label>
              <EmployeePicker
                options={plantillaOptions}
                selectedValue={plantillaEmployeeId}
                onSelect={(val) => setPlantillaEmployeeId(val)}
                placeholder="Click to search plantilla employee…"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Sub-Accountable Employee (Non-Plantilla){' '}
                <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </Label>
              <EmployeePicker
                options={nonPlantillaOptions}
                selectedValue={nonPlantillaEmployeeId}
                onSelect={(val) => setNonPlantillaEmployeeId(val)}
                placeholder="Click to search non-plantilla employee…"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-base font-semibold">Issuance Details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="editParIcsNumber" className="text-sm font-medium">
                {first.itemGroup === 'PPE' ? 'PAR' : 'ICS'} Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="editParIcsNumber"
                value={parIcsNumber}
                onChange={(e) => setParIcsNumber(e.target.value)}
                className={cn('h-10 font-mono font-semibold', !parIcsNumber.trim() ? 'border-destructive' : '')}
                placeholder={`e.g. ${first.itemGroup === 'PPE' ? 'PAR' : 'ICS'}-2026-07-001`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editIssuedDate" className="text-sm font-medium">Date Assigned</Label>
              <Input
                id="editIssuedDate"
                type="date"
                className="h-10"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editOfficeId" className="text-sm font-medium">Office <span className="text-destructive">*</span></Label>
              <select
                id="editOfficeId"
                value={officeId}
                onChange={(e) => {
                  setOfficeId(e.target.value);
                  setDivisionId('');
                }}
                className={cn('w-full h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring', !officeId ? 'border-destructive' : 'border-input')}
              >
                <option value="">Select office</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id.toString()}>{o.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDivisionId" className="text-sm font-medium">Division <span className="text-destructive">*</span></Label>
              <select
                id="editDivisionId"
                value={divisionId}
                onChange={(e) => setDivisionId(e.target.value)}
                disabled={!officeId}
                className={cn('w-full h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50', !divisionId ? 'border-destructive' : 'border-input')}
              >
                <option value="">{officeId ? 'Select division' : 'Select office first'}</option>
                {filteredDivisions.map((d) => (
                  <option key={d.id} value={d.id.toString()}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="editNotes" className="text-sm font-medium">Notes / Remarks</Label>
              <Input
                id="editNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional remarks"
                className="h-10"
              />
            </div>
          </div>
        </section>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
            Items in this PAR/ICS ({group.length})
          </p>
          <ul className="space-y-1">
            {group.map((r) => (
              <li key={r.id} className="text-sm text-slate-700">• {r.itemName}</li>
            ))}
          </ul>
        </div>
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving || !canSubmit}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
