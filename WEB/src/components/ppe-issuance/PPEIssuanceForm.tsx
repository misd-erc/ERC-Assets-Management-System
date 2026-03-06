import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronDown, Plus, Search, Trash2, X } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { PtaItem } from '@/api/asset/ptaMovementApi';
import { NormalizedEmployee } from '@/types/asset/UnifiedAsset';
import { VwOffice, VwDivision } from '@/types/office';
import { IssuanceFormState, IssuanceItemFormState } from './PPEIssuance';

interface PPEIssuanceFormProps {
  form: IssuanceFormState;
  items: IssuanceItemFormState[];
  sePpeItems: PtaItem[];
  /** ptaIds already picked in the form rows — used to suppress duplicates per-row */
  pickedPtaIds: Set<number>;
  employees: NormalizedEmployee[];
  offices: VwOffice[];
  divisions: VwDivision[];
  saving: boolean;
  onChange: (field: keyof IssuanceFormState, value: string) => void;
  onItemChange: (index: number, field: keyof IssuanceItemFormState, value: string) => void;
  onItemSelect: (index: number, ptaId: number) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onSubmit: () => void;
  onClose: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Inline searchable employee picker                                          */
/* -------------------------------------------------------------------------- */

interface EmployeeOption { value: string; label: string; name: string; }

interface EmployeePickerProps {
  options: EmployeeOption[];
  selectedValue: string;
  onSelect: (value: string, option: EmployeeOption | null) => void;
  placeholder?: string;
}

function EmployeePicker({ options, selectedValue, onSelect, placeholder = 'Click to search…' }: EmployeePickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === selectedValue) ?? null;

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleSelect = (opt: EmployeeOption) => {
    onSelect(opt.value, opt);
    setOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    onSelect('', null);
    setQuery('');
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full" onBlur={handleBlur}>
      {!open ? (
        <button
          type="button"
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
          className={cn(
            'w-full flex items-center justify-between rounded-md border border-input bg-background px-3 h-10 text-sm text-left transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring',
            !selected && 'text-muted-foreground'
          )}
        >
          <span className="truncate flex-1">{selected ? selected.label : placeholder}</span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {selected && (
              <span
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleClear()}
                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                className="rounded p-0.5 hover:bg-muted cursor-pointer"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </button>
      ) : (
        <div className="flex items-center rounded-md border border-ring ring-2 ring-ring bg-background px-3 h-10 gap-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search by name or employee ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setOpen(false); setQuery(''); }
              if (e.key === 'Enter' && filtered.length === 1) handleSelect(filtered[0]);
            }}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} tabIndex={-1}>
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      )}

      {open && (
        <div className="absolute w-full mt-1 rounded-md border border-border bg-popover shadow-lg overflow-hidden z-50">
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">No employees found.</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(opt)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors',
                    opt.value === selectedValue && 'bg-accent font-medium'
                  )}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
          <div className="border-t px-3 py-1.5 text-xs text-muted-foreground bg-muted/40">
            {filtered.length} employee{filtered.length !== 1 ? 's' : ''} found
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inline searchable item picker (no portal — stays inside the dialog)        */
/* -------------------------------------------------------------------------- */

interface ItemPickerProps {
  options: PtaItem[];
  selectedId: number;
  onSelect: (ptaId: number) => void;
}

function ItemPicker({ options, selectedId, onSelect }: ItemPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === selectedId) ?? null;

  const filtered = query.trim()
    ? options.filter((o) =>
        `${o.description} ${o.propertyNumber ?? ''} ${o.brand ?? ''} ${o.model ?? ''} ${o.groupName}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : options;

  const handleSelect = (id: number) => {
    onSelect(id);
    setOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    onSelect(0);
    setQuery('');
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Close on outside click
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full" onBlur={handleBlur}>
      {/* Trigger / selected display */}
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className={cn(
            'w-full flex items-center justify-between rounded-md border border-input bg-background px-3 h-11 text-sm text-left transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring',
            !selected && 'text-muted-foreground'
          )}
        >
          <span className="truncate flex-1">
            {selected
              ? `[${selected.groupName}] ${selected.description}${selected.propertyNumber ? ` — ${selected.propertyNumber}` : ''}`
              : 'Click to search and select an item…'}
          </span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {selected && (
              <span
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleClear()}
                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                className="rounded p-0.5 hover:bg-muted cursor-pointer"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </button>
      ) : (
        /* Search input */
        <div className="flex items-center rounded-md border border-ring ring-2 ring-ring bg-background px-3 h-11 gap-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search by description, property no., brand, model…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setOpen(false); setQuery(''); }
              if (e.key === 'Enter' && filtered.length === 1) handleSelect(filtered[0].id);
            }}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} tabIndex={-1}>
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      )}

      {/* Inline dropdown results */}
      {open && (
        <div className="absolute w-full mt-1 rounded-md border border-border bg-popover shadow-lg overflow-hidden z-50">
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center text-muted-foreground">
                {options.length === 0 ? 'No available items to issue.' : 'No items match your search.'}
              </p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  tabIndex={0}
                  onClick={() => handleSelect(item.id)}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 text-left text-sm hover:bg-accent transition-colors',
                    selectedId === item.id && 'bg-accent'
                  )}
                >
                  <Check
                    className={cn('mt-0.5 h-4 w-4 shrink-0 text-primary', selectedId === item.id ? 'opacity-100' : 'opacity-0')}
                  />
                  <div className="flex flex-col min-w-0 gap-0.5">
                    <span className="font-medium truncate">{item.description}</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{item.groupName}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {[item.propertyNumber, item.brand, item.model, item.condition].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          {filtered.length > 0 && (
            <p className="px-4 py-2 text-xs text-muted-foreground border-t bg-muted/40">
              {filtered.length} item{filtered.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main form                                                                   */
/* -------------------------------------------------------------------------- */

export function PPEIssuanceForm({
  form,
  items,
  sePpeItems,
  pickedPtaIds,
  employees,
  offices,
  divisions,
  saving,
  onChange,
  onItemChange,
  onItemSelect,
  onAddItem,
  onRemoveItem,
  onSubmit,
  onClose,
}: PPEIssuanceFormProps) {
  const pickedCount = items.filter((i) => i.ptaId > 0).length;

  const plantillaOptions: EmployeeOption[] = employees
    .filter((e) => e.employmentTypeId === 1)
    .map((e) => ({
      value: e.id.toString(),
      label: e.label,
      name: `${e.lastName}, ${e.firstName}${e.middleName ? ' ' + e.middleName : ''}`.trim(),
    }));

  const nonPlantillaOptions: EmployeeOption[] = employees
    .filter((e) => e.employmentTypeId !== 1)
    .map((e) => ({
      value: e.id.toString(),
      label: e.label,
      name: `${e.lastName}, ${e.firstName}${e.middleName ? ' ' + e.middleName : ''}`.trim(),
    }));

  return (
    <DialogContent className="max-w-6xl w-full max-h-[94vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl">New PPE/SE Issuance</DialogTitle>
        <DialogDescription>
          Assign new PPE/SE items to an employee. PAR/ICS numbers are automatically generated per item.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-2">

        <section className="space-y-4">
          <p className="text-base font-semibold">Accountable Employee</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium">Accountable Employee (Plantilla) *</Label>
              <EmployeePicker
                options={plantillaOptions}
                selectedValue={form.plantillaEmployeeId}
                onSelect={(val, opt) => {
                  onChange('plantillaEmployeeId', val);
                  onChange('plantillaEmployeeName', opt?.name ?? '');
                }}
                placeholder="Click to search plantilla employee…"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium">
                Sub-Accountable Employee (Non-Plantilla){' '}
                <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </Label>
              <EmployeePicker
                options={nonPlantillaOptions}
                selectedValue={form.nonPlantillaEmployeeId}
                onSelect={(val, opt) => {
                  onChange('nonPlantillaEmployeeId', val);
                  onChange('nonPlantillaEmployeeName', opt?.name ?? '');
                }}
                placeholder="Click to search non-plantilla employee…"
              />
            </div>
          </div>
        </section>

        {/* ── Issuance Details ── */}
        <section className="space-y-4">
          <p className="text-base font-semibold">Issuance Details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issuedDate" className="text-sm font-medium">Date Assigned</Label>
              <Input
                id="issuedDate"
                type="date"
                className="h-10"
                value={form.issuedDate}
                onChange={(e) => onChange('issuedDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="officeId" className="text-sm font-medium">Office <span className="text-destructive">*</span></Label>
              <select
                id="officeId"
                value={form.officeId}
                onChange={(e) => onChange('officeId', e.target.value)}
                className={cn('w-full h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring', !form.officeId ? 'border-destructive' : 'border-input')}
              >
                <option value="">Select office</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id.toString()}>{o.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="divisionId" className="text-sm font-medium">Division <span className="text-destructive">*</span></Label>
              <select
                id="divisionId"
                value={form.divisionId}
                onChange={(e) => onChange('divisionId', e.target.value)}
                className={cn('w-full h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring', !form.divisionId ? 'border-destructive' : 'border-input')}
              >
                <option value="">Select division</option>
                {divisions.map((d) => (
                  <option key={d.id} value={d.id.toString()}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ── Items ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">Items to Issue</p>
              <p className="text-xs text-muted-foreground">
                You can add multiple items. Each item will be assigned its own PAR/ICS number.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={onAddItem} className="shrink-0">
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const rowOptions = sePpeItems.filter(
                (si) => !pickedPtaIds.has(si.id) || si.id === item.ptaId
              );
              const selectedItem = sePpeItems.find((si) => si.id === item.ptaId) ?? null;

              return (
                <div
                  key={`item-row-${index}`}
                  className={cn(
                    'rounded-lg border p-4 space-y-3 transition-colors',
                    selectedItem ? 'border-primary/40 bg-primary/5' : 'border-dashed'
                  )}
                >
                  {/* Row header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Item #{index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Searchable picker */}
                  <div className="space-y-1.5">
                    <Label>SE/PPE Item</Label>
                    <ItemPicker
                      options={rowOptions}
                      selectedId={item.ptaId}
                      onSelect={(ptaId) => onItemSelect(index, ptaId)}
                    />
                    {rowOptions.length === 0 && (
                      <p className="text-xs text-amber-600">
                        No available items that have not been issued yet.
                      </p>
                    )}
                  </div>

                  {/* Selected item detail strip */}
                  {selectedItem && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Group</p>
                        <Badge variant="secondary">{selectedItem.groupName}</Badge>
                      </div>
                      {selectedItem.propertyNumber && (
                        <div className="space-y-1">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Property #</p>
                          <p className="text-sm font-medium">{selectedItem.propertyNumber}</p>
                        </div>
                      )}
                      {selectedItem.condition && (
                        <div className="space-y-1">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Condition</p>
                          <p className="text-sm">{selectedItem.condition}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">PAR/ICS #</p>
                        <p className="text-sm font-mono font-semibold text-primary">
                          {item.parIcsNumber || '—'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {pickedCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <Check className="h-3.5 w-3.5 text-green-600" />
              <span>
                <strong className="text-foreground">{pickedCount}</strong>{' '}
                item{pickedCount > 1 ? 's' : ''} selected
              </span>
            </div>
          )}
        </section>
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={saving}>
          {saving ? 'Saving…' : 'Save Issuance'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
