import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getCategories } from '@/api/asset/inventoryApi';
import { getEmployees } from '@/api/user-management/userApi';
import { EmployeeSelector } from '@/components/transfers-returns/EmployeeSelector';
import { ApiEmployee } from '@/types/transfer';
import {
    getRPCPPESignatoryTemplates,
    saveRPCPPESignatoryTemplate,
    deleteRPCPPESignatoryTemplate,
    RPCPPESignatoryTemplateDto,
} from '@/api/asset/rpcppeSignatoryTemplateApi';
import { Loader2, BookmarkPlus, BookOpen, X, Pencil, Users } from 'lucide-react';
import { toast } from 'sonner';

// --- SIGNATORY TYPES ---
export interface RPCPPESignatory {
  name: string;
  designation: string;
}

export interface RPCPPESignatories {
  inventoryChairperson: RPCPPESignatory;
  inventoryViceChairperson: RPCPPESignatory;
  chairpersonAndCEO: RPCPPESignatory;
  coaRepresentative: RPCPPESignatory;
}

export const DEFAULT_RPCPPE_SIGNATORIES: RPCPPESignatories = {
  inventoryChairperson: { name: '', designation: 'Inventory Committee Chairperson' },
  inventoryViceChairperson: { name: '', designation: 'Inventory Committee Vice-Chairperson' },
  chairpersonAndCEO: { name: '', designation: 'Chairperson and CEO' },
  coaRepresentative: { name: '', designation: 'COA Representative' },
};

const SIGNATORY_LABELS: Record<keyof RPCPPESignatories, string> = {
  inventoryChairperson: 'Inventory Chairperson',
  inventoryViceChairperson: 'Inventory Vice-Chairperson',
  chairpersonAndCEO: 'Chairperson and CEO',
  coaRepresentative: 'COA Representative',
};

interface RPCPPEFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (date: Date, categoryId: number | undefined, signatories: RPCPPESignatories) => void;
}

export function RPCPPEFilterModal({ isOpen, onClose, onGenerate }: RPCPPEFilterModalProps) {
  const [asOfDate, setAsOfDate] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);

  const [signatories, setSignatories] = useState<RPCPPESignatories>(() =>
    JSON.parse(JSON.stringify(DEFAULT_RPCPPE_SIGNATORIES))
  );
  const [templates, setTemplates] = useState<RPCPPESignatoryTemplateDto[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [employeeIdMap, setEmployeeIdMap] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (isOpen) {
      getCategories('PPE').then(categoriesData => {
        setCategories(categoriesData);
      });

      setSignatories(JSON.parse(JSON.stringify(DEFAULT_RPCPPE_SIGNATORIES)));
      setTemplateName('');
      setSavingTemplate(false);
      setEditingTemplateId(null);
      setEmployeeIdMap({});
      setTemplateLoading(true);
      getRPCPPESignatoryTemplates()
        .then(setTemplates)
        .finally(() => setTemplateLoading(false));
      getEmployees(1, 10000).then((response) => {
        if (response.success && response.data?.items) {
          setEmployees(response.data.items);
        }
      });
    }
  }, [isOpen]);

  const handleGenerate = () => {
    if (!asOfDate) {
      toast.error('Please select a date');
      return;
    }
    const selectedCategoryId = categoryId === 'all' ? undefined : Number(categoryId);
    onGenerate(new Date(asOfDate), selectedCategoryId, signatories);
  };

  const updateSignatory = (key: keyof RPCPPESignatories, field: keyof RPCPPESignatory, value: string) => {
    setSignatories(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const handleSelectEmployee = (key: keyof RPCPPESignatories, employeeId: number | null) => {
    if (employeeId === null) {
      setEmployeeIdMap(prev => ({ ...prev, [key]: null }));
      updateSignatory(key, 'name', '');
      return;
    }

    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      updateSignatory(key, 'name', `${emp.firstName} ${emp.lastName}`.toUpperCase());
    }
    setEmployeeIdMap(prev => ({ ...prev, [key]: employeeId }));
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    const saved = await saveRPCPPESignatoryTemplate(templateName.trim(), signatories, editingTemplateId ?? 0);
    if (saved) {
      if (editingTemplateId) {
        setTemplates(prev => prev.map(t => t.id === editingTemplateId ? saved : t));
        setEditingTemplateId(null);
        toast.success('Template updated');
      } else {
        setTemplates(prev => [...prev, saved]);
        toast.success('Template saved');
      }
      setSavingTemplate(false);
      setTemplateName('');
    } else {
      toast.error('Failed to save template');
    }
  };

  const handleLoadTemplate = (tpl: RPCPPESignatoryTemplateDto) => {
    if (tpl.signatories) {
      setSignatories(JSON.parse(JSON.stringify(tpl.signatories)));
      setEmployeeIdMap({});
    }
    setEditingTemplateId(null);
    setTemplateName('');
    setSavingTemplate(false);
  };

  const handleEditTemplate = (tpl: RPCPPESignatoryTemplateDto) => {
    if (tpl.signatories) {
      setSignatories(JSON.parse(JSON.stringify(tpl.signatories)));
      setEmployeeIdMap({});
    }
    setEditingTemplateId(tpl.id);
    setTemplateName(tpl.name);
    setSavingTemplate(true);
  };

  const handleDeleteTemplate = async (id: number) => {
    const ok = await deleteRPCPPESignatoryTemplate(id);
    if (ok) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted');
    } else {
      toast.error('Failed to delete template');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-2xl !w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="border-b border-slate-200 p-6 pb-5 bg-slate-50/50">
          <DialogTitle className="text-xl text-slate-900 flex items-center gap-2 font-bold tracking-tight">
            Generate RPCPPE Report
          </DialogTitle>
          <DialogDescription className="mt-1 text-slate-500">
            Set the report filters and the signatories that will appear on the printed report.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">As of Date</Label>
              <Input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* SAVED TEMPLATES */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                Saved Signatory Templates
              </h3>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => setSavingTemplate(v => !v)}
              >
                <BookmarkPlus className="w-3 h-3" />
                Save Current as Template
              </Button>
            </div>

            {savingTemplate && (
              <div className="flex gap-2 mb-2">
                <Input
                  className="h-8 text-sm flex-1"
                  placeholder="Template name (e.g. Standard Signatories)"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTemplate(); }}
                  autoFocus
                />
                <Button size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSaveTemplate} disabled={!templateName.trim()}>
                  {editingTemplateId ? 'Update' : 'Save'}
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => { setSavingTemplate(false); setTemplateName(''); setEditingTemplateId(null); }}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}

            {templateLoading ? (
              <p className="text-xs text-slate-400 italic flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading templates...</p>
            ) : templates.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No templates saved yet. Fill in signatories below and save as a template.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {templates.map(tpl => (
                  <div key={tpl.id} className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 rounded-md px-2 py-1">
                    <button
                      className="text-xs text-indigo-700 font-medium hover:text-indigo-900 transition-colors"
                      onClick={() => handleLoadTemplate(tpl)}
                    >
                      {tpl.name}
                    </button>
                    <button
                      className="text-slate-400 hover:text-indigo-600 ml-1 transition-colors"
                      onClick={() => handleEditTemplate(tpl)}
                      title="Edit template"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      className="text-red-400 hover:text-red-600 ml-1 transition-colors"
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      title="Delete template"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100" />

          {/* SIGNATORIES */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              Signatories
            </h3>
            {(Object.keys(SIGNATORY_LABELS) as (keyof RPCPPESignatories)[]).map((key) => (
              <div key={key}>
                <h4 className="text-xs font-semibold text-slate-600 mb-1.5">{SIGNATORY_LABELS[key]}</h4>
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-600 mb-1 block">Full Name</Label>
                    <EmployeeSelector
                      employees={employees}
                      value={employeeIdMap[key] ?? null}
                      onSelect={(employeeId) => handleSelectEmployee(key, employeeId as number | null)}
                      displayValue={signatories[key].name}
                      placeholder="Search employee..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600 mb-1 block">Designation</Label>
                    <Input
                      className="h-8 text-sm"
                      value={signatories[key].designation}
                      onChange={(e) => updateSignatory(key, 'designation', e.target.value)}
                      placeholder="e.g. Inventory Committee Chairperson"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 p-4 bg-slate-50/50">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleGenerate}>Generate Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
