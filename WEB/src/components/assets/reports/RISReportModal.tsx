// src/components/assets/reports/RISReportModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Download, Printer, FileText, ChevronRight, ChevronDown, Users, BookmarkPlus, BookOpen, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { useRISStore } from '@/store/supply/risStore';
import { formatDate } from '@/utils/dateUtils';
import { VwSupplyRIS, VwSupplyRISItem } from '@/types/supply/ris';
import { getEmployees } from '@/api/user-management/userApi';
import { EmployeeSelector } from '@/components/transfers-returns/EmployeeSelector';
import { ApiEmployee } from '@/types/transfer';
import { getRISSignatoryTemplates, saveRISSignatoryTemplate, deleteRISSignatoryTemplate, RISSignatoryTemplateDto } from '@/api/supply-management/signatoryTemplateApi';

import {
    pdf,
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font
} from '@react-pdf/renderer';

Font.registerHyphenationCallback((word: string) => [word]);

// --- PDF STYLES (Appendix 63 Format - Times New Roman) ---
const pdfStyles = StyleSheet.create({
    page: { padding: 35, fontSize: 9, fontFamily: 'Times-Roman' },

    // Top headers
    appendixText: { fontStyle: 'italic', textAlign: 'right', fontSize: 10, marginBottom: 15 },
    mainTitle: { fontSize: 12, fontFamily: 'Times-Bold', textAlign: 'center', marginBottom: 15 },

    entityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    entityText: { fontSize: 9, fontFamily: 'Times-Bold' },

    // Outer Table Borders
    tableContainer: { borderWidth: 1, borderColor: '#000' },

    // Header Grid (Division/Office etc)
    headerGrid: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    headerColLeft: { flex: 1, borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    headerColRight: { flex: 1, padding: 4 },
    headerText: { fontSize: 9, marginBottom: 2 },

    // Super Header (Requisition / Stock / Issue)
    superHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', backgroundColor: '#fdfdfd' },
    colReqGroup: { width: '60%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center' },
    colStockGroup: { width: '16%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center' },
    colIssueGroup: { width: '24%', padding: 4, justifyContent: 'center' },

    // Sub Header
    subHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', backgroundColor: '#fdfdfd' },
    colStockNo: { width: '12%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center', overflow: 'hidden' },
    colUnit: { width: '8%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center', overflow: 'hidden' },
    colDesc: { width: '30%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center', overflow: 'hidden' },
    colReqQty: { width: '10%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center', overflow: 'hidden' },
    colYes: { width: '8%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center', overflow: 'hidden' },
    colNo: { width: '8%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center', overflow: 'hidden' },
    colIssQty: { width: '10%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center', overflow: 'hidden' },
    colRemarks: { width: '14%', padding: 4, justifyContent: 'center', overflow: 'hidden' },

    // Row Data
    dataRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    cellTextCenter: { fontSize: 9, textAlign: 'center' },
    cellTextLeft: { fontSize: 9, textAlign: 'left' },
    cellHeaderBold: { fontSize: 9, fontFamily: 'Times-Bold', textAlign: 'center' },

    // Purpose
    purposeContainer: { padding: 4, borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 40 },
    purposeText: { fontSize: 9 },

    // --- Standard Row-Based Signature Matrix ---
    sigRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 20 },
    sigRowLast: { flexDirection: 'row', minHeight: 20 }, // Last row has no bottom border inside the main table

    sigColLabel: { width: '16%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center' },
    sigColData: { width: '21%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center' },
    sigColDataLast: { width: '21%', padding: 4, justifyContent: 'center' },

    sigHeaderText: { fontSize: 9, fontFamily: 'Times-Bold' },
    sigLabelText: { fontSize: 9 },
    sigValueText: { fontSize: 9, fontFamily: 'Times-Roman', textAlign: 'center' },
});

// --- SIGNATORY TYPES ---
export interface RISSignatory {
    name: string;
    designation: string;
}

export interface RISSignatories {
    requestedBy: RISSignatory;
    approvedBy: RISSignatory;
    issuedBy: RISSignatory;
    receivedBy: RISSignatory;
}

type RISSignatureDates = Record<keyof RISSignatories, string>;

const DEFAULT_RIS_SIGNATORIES: RISSignatories = {
    requestedBy: { name: '', designation: '' },
    approvedBy: { name: '', designation: '' },
    issuedBy: { name: '', designation: '' },
    receivedBy: { name: '', designation: '' },
};

const DEFAULT_RIS_SIGNATURE_DATES: RISSignatureDates = {
    requestedBy: '',
    approvedBy: '',
    issuedBy: '',
    receivedBy: '',
};

const formatPrintDate = (date: string) => date ? formatDate(date) : ' ';

// --- PDF DOCUMENT COMPONENT ---
interface RISPDFProps {
    ris: VwSupplyRIS;
    items: VwSupplyRISItem[];
    signatories: RISSignatories;
    signatureDates: RISSignatureDates;
}

const RISPDFDocument: React.FC<RISPDFProps> = ({ ris, items, signatories, signatureDates }) => {
    return (
        <Document>
            <Page size="A4" style={pdfStyles.page} orientation="portrait">
                <Text style={pdfStyles.appendixText}>Appendix 63</Text>
                <Text style={pdfStyles.mainTitle}>REQUISITION AND ISSUE SLIP</Text>

                <View style={pdfStyles.entityRow}>
                    <Text style={pdfStyles.entityText}>Entity Name : {ris.entityName || 'ENERGY REGULATORY COMMISSION'}</Text>
                    <Text style={pdfStyles.entityText}>Fund Cluster : {ris.fundCluster || '________________________'}</Text>
                </View>

                {/* Main Table Wrapper */}
                <View style={pdfStyles.tableContainer}>

                    {/* Header Info */}
                    <View style={pdfStyles.headerGrid}>
                        <View style={pdfStyles.headerColLeft}>
                            <Text style={pdfStyles.headerText}>Division : {ris.division?.name || ''}</Text>
                            <Text style={pdfStyles.headerText}>Office : {ris.office?.name || ''}</Text>
                        </View>
                        <View style={pdfStyles.headerColRight}>
                            <Text style={pdfStyles.headerText}>Responsibility Center Code : {ris.responsibilityCenterCode || ''}</Text>
                            <Text style={pdfStyles.headerText}>RIS No. : {ris.risNumber || ''}</Text>
                        </View>
                    </View>

                    {/* Table Headers */}
                    <View style={pdfStyles.superHeaderRow}>
                        <View style={pdfStyles.colReqGroup}><Text style={pdfStyles.cellHeaderBold}>Requisition</Text></View>
                        <View style={pdfStyles.colStockGroup}><Text style={pdfStyles.cellHeaderBold}>Stock Available?</Text></View>
                        <View style={pdfStyles.colIssueGroup}><Text style={pdfStyles.cellHeaderBold}>Issue</Text></View>
                    </View>
                    <View style={pdfStyles.subHeaderRow}>
                        <View style={pdfStyles.colStockNo}><Text style={pdfStyles.cellTextCenter}>Stock No.</Text></View>
                        <View style={pdfStyles.colUnit}><Text style={pdfStyles.cellTextCenter}>Unit</Text></View>
                        <View style={pdfStyles.colDesc}><Text style={pdfStyles.cellTextCenter}>Description</Text></View>
                        <View style={pdfStyles.colReqQty}><Text style={pdfStyles.cellTextCenter}>Quantity</Text></View>

                        <View style={pdfStyles.colYes}><Text style={pdfStyles.cellTextCenter}>Yes</Text></View>
                        <View style={pdfStyles.colNo}><Text style={pdfStyles.cellTextCenter}>No</Text></View>

                        <View style={pdfStyles.colIssQty}><Text style={pdfStyles.cellTextCenter}>Quantity</Text></View>
                        <View style={pdfStyles.colRemarks}><Text style={pdfStyles.cellTextCenter}>Remarks</Text></View>
                    </View>

                    {/* Items Data */}
                    {items.map((item, idx) => (
                        <View key={idx} style={pdfStyles.dataRow}>
                            <View style={pdfStyles.colStockNo}><Text style={pdfStyles.cellTextCenter}>{item.stockNumber}</Text></View>
                            <View style={pdfStyles.colUnit}><Text style={pdfStyles.cellTextCenter}>{item.unit?.name}</Text></View>
                            <View style={pdfStyles.colDesc}><Text style={pdfStyles.cellTextLeft}>{item.itemDescription}</Text></View>
                            <View style={pdfStyles.colReqQty}><Text style={pdfStyles.cellTextCenter}>{item.requisitionQuantity}</Text></View>

                            <View style={pdfStyles.colYes}><Text style={pdfStyles.cellTextCenter}>{item.isAvailable ? '✓' : ''}</Text></View>
                            <View style={pdfStyles.colNo}><Text style={pdfStyles.cellTextCenter}>{!item.isAvailable ? '✓' : ''}</Text></View>

                            <View style={pdfStyles.colIssQty}><Text style={pdfStyles.cellTextCenter}>{item.issueQuantity ?? ''}</Text></View>
                            <View style={pdfStyles.colRemarks}><Text style={pdfStyles.cellTextCenter}>{item.itemRemarks || ''}</Text></View>
                        </View>
                    ))}

                    {/* Purpose Section */}
                    <View style={pdfStyles.purposeContainer}>
                        <Text style={pdfStyles.purposeText}>Purpose:  {ris.risPurpose}</Text>
                    </View>

                    {/* Signature Matrix - Converted to Standard Row-Based Table */}
                    <View>
                        {/* Headers */}
                        <View style={pdfStyles.sigRow}>
                            <View style={pdfStyles.sigColLabel}><Text>{' '}</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigHeaderText}>Requested by:</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigHeaderText}>Approved by:</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigHeaderText}>Issued by:</Text></View>
                            <View style={pdfStyles.sigColDataLast}><Text style={pdfStyles.sigHeaderText}>Received by:</Text></View>
                        </View>

                        {/* Signature */}
                        <View style={[pdfStyles.sigRow, { minHeight: 35 }]}>
                            <View style={pdfStyles.sigColLabel}><Text style={pdfStyles.sigLabelText}>Signature :</Text></View>
                            <View style={pdfStyles.sigColData}><Text>{' '}</Text></View>
                            <View style={pdfStyles.sigColData}><Text>{' '}</Text></View>
                            <View style={pdfStyles.sigColData}><Text>{' '}</Text></View>
                            <View style={pdfStyles.sigColDataLast}><Text>{' '}</Text></View>
                        </View>

                        {/* Printed Name */}
                        <View style={pdfStyles.sigRow}>
                            <View style={pdfStyles.sigColLabel}><Text style={pdfStyles.sigLabelText}>Printed Name :</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}>{signatories.requestedBy.name}</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}>{signatories.approvedBy.name}</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}>{signatories.issuedBy.name}</Text></View>
                            <View style={pdfStyles.sigColDataLast}><Text style={pdfStyles.sigValueText}>{signatories.receivedBy.name}</Text></View>
                        </View>

                        {/* Designation */}
                        <View style={pdfStyles.sigRow}>
                            <View style={pdfStyles.sigColLabel}><Text style={pdfStyles.sigLabelText}>Designation :</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}>{signatories.requestedBy.designation}</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}>{signatories.approvedBy.designation}</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}>{signatories.issuedBy.designation}</Text></View>
                            <View style={pdfStyles.sigColDataLast}><Text style={pdfStyles.sigValueText}>{signatories.receivedBy.designation}</Text></View>
                        </View>

                        {/* Date */}
                        <View style={pdfStyles.sigRowLast}>
                            <View style={pdfStyles.sigColLabel}><Text style={pdfStyles.sigLabelText}>Date :</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}>{formatPrintDate(signatureDates.requestedBy)}</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}>{formatPrintDate(signatureDates.approvedBy)}</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}>{formatPrintDate(signatureDates.issuedBy)}</Text></View>
                            <View style={pdfStyles.sigColDataLast}><Text style={pdfStyles.sigValueText}>{formatPrintDate(signatureDates.receivedBy)}</Text></View>
                        </View>
                    </View>

                </View>
            </Page>
        </Document>
    );
};

// --- SIGNATORY MODAL COMPONENT ---
interface RISSignatoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (signatories: RISSignatories, signatureDates: RISSignatureDates) => void;
    actionLabel: string;
}

const RISSignatoryModal: React.FC<RISSignatoryModalProps> = ({ isOpen, onClose, onConfirm, actionLabel }) => {
    const [signatories, setSignatories] = useState<RISSignatories>(() =>
        JSON.parse(JSON.stringify(DEFAULT_RIS_SIGNATORIES))
    );
    const [signatureDates, setSignatureDates] = useState<RISSignatureDates>(() => ({ ...DEFAULT_RIS_SIGNATURE_DATES }));
    const [templates, setTemplates] = useState<RISSignatoryTemplateDto[]>([]);
    const [templateName, setTemplateName] = useState('');
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [templateLoading, setTemplateLoading] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
    const [employees, setEmployees] = useState<ApiEmployee[]>([]);
    const [requestedByEmployeeId, setRequestedByEmployeeId] = useState<number | null>(null);
    const [approvedByEmployeeId, setApprovedByEmployeeId] = useState<number | null>(null);
    const [issuedByEmployeeId, setIssuedByEmployeeId] = useState<number | null>(null);
    const [receivedByEmployeeId, setReceivedByEmployeeId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            setSignatories(JSON.parse(JSON.stringify(DEFAULT_RIS_SIGNATORIES)));
            setSignatureDates({ ...DEFAULT_RIS_SIGNATURE_DATES });
            setTemplateName('');
            setSavingTemplate(false);
            setTemplateLoading(true);
            setEditingTemplateId(null);
            setRequestedByEmployeeId(null);
            setApprovedByEmployeeId(null);
            setIssuedByEmployeeId(null);
            setReceivedByEmployeeId(null);
            getRISSignatoryTemplates()
                .then(setTemplates)
                .finally(() => setTemplateLoading(false));
            getEmployees(1, 10000).then((response) => {
                if (response.success && response.data?.items) {
                    setEmployees(response.data.items);
                }
            });
        }
    }, [isOpen]);

    const handleSaveTemplate = async () => {
        if (!templateName.trim()) return;
        const saved = await saveRISSignatoryTemplate(templateName.trim(), signatories, editingTemplateId ?? 0);
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

    const handleLoadTemplate = (tpl: RISSignatoryTemplateDto) => {
        if (tpl.signatories) {
            setSignatories(JSON.parse(JSON.stringify(tpl.signatories)));
            setRequestedByEmployeeId(null);
            setApprovedByEmployeeId(null);
            setIssuedByEmployeeId(null);
            setReceivedByEmployeeId(null);
        }
        setEditingTemplateId(null);
        setTemplateName('');
        setSavingTemplate(false);
    };

    const handleEditTemplate = (tpl: RISSignatoryTemplateDto) => {
        if (tpl.signatories) {
            setSignatories(JSON.parse(JSON.stringify(tpl.signatories)));
            setRequestedByEmployeeId(null);
            setApprovedByEmployeeId(null);
            setIssuedByEmployeeId(null);
            setReceivedByEmployeeId(null);
        }
        setEditingTemplateId(tpl.id);
        setTemplateName(tpl.name);
        setSavingTemplate(true);
    };

    const handleDeleteTemplate = async (id: number) => {
        const ok = await deleteRISSignatoryTemplate(id);
        if (ok) {
            setTemplates(prev => prev.filter(t => t.id !== id));
            toast.success('Template deleted');
        } else {
            toast.error('Failed to delete template');
        }
    };

    const updateSignatory = (key: keyof RISSignatories, field: keyof RISSignatory, value: string) => {
        setSignatories(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    const handleSelectEmployee = (key: keyof RISSignatories, employeeId: number | null) => {
        const setter = key === 'requestedBy' ? setRequestedByEmployeeId :
            key === 'approvedBy' ? setApprovedByEmployeeId :
            key === 'issuedBy' ? setIssuedByEmployeeId : setReceivedByEmployeeId;

        if (employeeId === null) {
            setter(null);
            updateSignatory(key, 'name', '');
            return;
        }

        const emp = employees.find(e => e.id === employeeId);
        if (emp) {
            updateSignatory(key, 'name', `${emp.firstName} ${emp.lastName}`.toUpperCase());
            if (emp.positionName) {
                updateSignatory(key, 'designation', emp.positionName);
            }
        }
        setter(employeeId);
    };

    const employeeIdMap: Record<string, number | null> = {
        requestedBy: requestedByEmployeeId,
        approvedBy: approvedByEmployeeId,
        issuedBy: issuedByEmployeeId,
        receivedBy: receivedByEmployeeId,
    };

    const signatoryLabels: Record<keyof RISSignatories, string> = {
        requestedBy: 'Requested by',
        approvedBy: 'Approved by',
        issuedBy: 'Issued by',
        receivedBy: 'Received by',
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="!max-w-2xl !w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 bg-white border-slate-200 shadow-2xl overflow-hidden">
                <DialogHeader className="border-b border-slate-200 p-6 pb-5 bg-slate-50/50">
                    <DialogTitle className="text-xl text-slate-900 flex items-center gap-2 font-bold tracking-tight">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Configure Signatories
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-slate-500">
                        Set the names and designations that will appear on the printed RIS.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">

                    {/* SAVED TEMPLATES */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 text-indigo-500" />
                                Saved Templates
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
                        {(Object.keys(signatoryLabels) as (keyof RISSignatories)[]).map((key) => (
                            <div key={key}>
                                <h3 className="text-sm font-semibold text-slate-800 mb-2">{signatoryLabels[key]}</h3>
                                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs text-slate-600 mb-1 block">Full Name</Label>
                                        <EmployeeSelector
                                            employees={employees}
                                            value={employeeIdMap[key] || null}
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
                                            placeholder="e.g. Chief Administrative Officer"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-slate-600 mb-1 block">Date</Label>
                                        <Input
                                            type="date"
                                            className="h-8 text-sm"
                                            value={signatureDates[key]}
                                            onChange={(e) => setSignatureDates(prev => ({ ...prev, [key]: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>

                <DialogFooter className="border-t border-slate-200 p-4 bg-slate-50/50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => onConfirm(signatories, signatureDates)}
                    >
                        {actionLabel === 'print' ? <Printer className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                        {actionLabel === 'print' ? 'Print Document' : 'Save as PDF'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- MAIN MODAL COMPONENT ---
interface RISReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RISReportModal = ({ isOpen, onClose }: RISReportModalProps) => {
    const { risList, totalRis, currentRISItems, loading, fetchRISs, fetchRISItems } = useRISStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearchQuery, setActiveSearchQuery] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 100;

    const [selectedRis, setSelectedRis] = useState<VwSupplyRIS | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setActiveSearchQuery('');
            setHasSearched(true);
            setCurrentPage(1);
            setSelectedRis(null);
            fetchRISs(1, pageSize, '');
        }
    }, [isOpen, fetchRISs]);

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setHasSearched(true);
        setActiveSearchQuery(searchTerm.trim());
        setCurrentPage(1);
        setSelectedRis(null);

        await fetchRISs(1, pageSize, searchTerm.trim());
    };

    const filteredRISList = useMemo(() => {
        if (!activeSearchQuery.trim()) return risList;

        const query = activeSearchQuery.toLowerCase();
        return risList.filter(
            (r) =>
                r.risNumber?.toLowerCase().includes(query) ||
                r.risPurpose?.toLowerCase().includes(query) ||
                r.office?.name?.toLowerCase().includes(query)
        );
    }, [risList, activeSearchQuery]);

    const handleSelectRow = async (ris: VwSupplyRIS) => {
        if (selectedRis?.id === ris.id) {
            setSelectedRis(null);
            return;
        }

        setSelectedRis(ris);
        setIsPreviewLoading(true);

        try {
            await fetchRISItems(ris.id);
        } catch (error) {
            toast.error("Failed to load RIS details.");
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const totalPages = Math.ceil(totalRis / pageSize);
    const handlePageChange = async (page: number) => {
        setCurrentPage(page);
        setSelectedRis(null);
        await fetchRISs(page, pageSize, activeSearchQuery.trim());
    };

    const [signatoryModalOpen, setSignatoryModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<'print' | 'download' | null>(null);

    const handleExportPDF = () => {
        if (!selectedRis || isPreviewLoading) return;
        setPendingAction('download');
        setSignatoryModalOpen(true);
    };

    const handlePrintPDF = () => {
        if (!selectedRis || isPreviewLoading) return;
        setPendingAction('print');
        setSignatoryModalOpen(true);
    };

    const handleSignatoryConfirm = async (signatories: RISSignatories, signatureDates: RISSignatureDates) => {
        setSignatoryModalOpen(false);
        if (!selectedRis) return;
        setIsGeneratingPDF(true);

        try {
            const blob = await pdf(
                <RISPDFDocument ris={selectedRis} items={currentRISItems} signatories={signatories} signatureDates={signatureDates} />
            ).toBlob();

            const url = URL.createObjectURL(blob);

            if (pendingAction === 'download') {
                const a = document.createElement('a');
                a.href = url;
                a.download = `RIS_${selectedRis.risNumber}.pdf`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 5000);
            } else {
                const w = window.open(url);
                if (w) { w.addEventListener('load', () => w.print()); }
                setTimeout(() => URL.revokeObjectURL(url), 60000);
            }
        } catch (err) {
            console.error("Failed to generate PDF", err);
            toast.error("Failed to generate PDF");
        } finally {
            setIsGeneratingPDF(false);
            setPendingAction(null);
        }
    };

    return (
        <>
        <RISSignatoryModal
            isOpen={signatoryModalOpen}
            onClose={() => { setSignatoryModalOpen(false); setPendingAction(null); }}
            onConfirm={handleSignatoryConfirm}
            actionLabel={pendingAction || 'print'}
        />
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="!max-w-6xl !w-[95vw] max-h-[90vh] flex flex-col p-0 bg-white border-slate-200 shadow-2xl overflow-hidden">

                <DialogHeader className="border-b border-slate-200 p-6 pb-5 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-left">
                            <DialogTitle className="text-2xl text-slate-900 flex items-center gap-2 font-bold tracking-tight">
                                <FileText className="w-6 h-6 text-indigo-600" />
                                Requisition and Issue Slip (RIS)
                            </DialogTitle>
                            <DialogDescription className="mt-1.5 text-slate-500">
                                Search and select a RIS record below to view its details and generate the official document.
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="shadow-sm font-medium transition-all"
                                disabled={!selectedRis || isGeneratingPDF || isPreviewLoading}
                                onClick={handlePrintPDF}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print Document
                            </Button>
                            <Button
                                className="shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all"
                                disabled={!selectedRis || isGeneratingPDF || isPreviewLoading}
                                onClick={handleExportPDF}
                            >
                                {isGeneratingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                {isGeneratingPDF ? 'Generating...' : 'Save as PDF'}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 flex-1 min-h-0 flex flex-col bg-white">

                    <form onSubmit={handleSearchSubmit} className="flex gap-3 w-full md:w-[500px] mb-5">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <Input
                                placeholder="Search by RIS Number, Purpose, or Office..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-white border-slate-300 focus-visible:ring-indigo-500 shadow-sm"
                                autoFocus
                            />
                        </div>
                        <Button
                            type="submit"
                            className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm shrink-0 px-6"
                        >
                            Search
                        </Button>
                    </form>

                    <div className="border border-slate-200 rounded-lg overflow-y-auto flex-1 shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[50px] px-4 text-center">Select</TableHead>
                                    <TableHead className="w-[40px] px-2"></TableHead>
                                    <TableHead className="w-[200px] font-semibold text-slate-700">RIS Number</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Purpose</TableHead>
                                    <TableHead className="w-[180px] font-semibold text-slate-700">Office</TableHead>
                                    <TableHead className="w-[140px] font-semibold text-slate-700 text-right">Requested Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!hasSearched ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-72 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500 space-y-4">
                                                <div className="p-5 bg-indigo-50 rounded-full border border-indigo-100 shadow-sm">
                                                    <Search className="w-8 h-8 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-lg">Ready to Search</p>
                                                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Type a RIS number, purpose, or office above to locate the Requisition and Issue Slip.</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : loading ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={`skeleton-${index}`}>
                                            {Array.from({ length: 6 }).map((_, colIndex) => (
                                                <TableCell key={`skel-col-${colIndex}`}>
                                                    <div className="h-4 bg-slate-100 rounded animate-pulse w-full"></div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : filteredRISList.length > 0 ? (
                                    filteredRISList.map((ris, index) => {
                                        const isSelected = selectedRis?.id === ris.id;

                                        return (
                                            <React.Fragment key={index}>
                                                <TableRow
                                                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/60 hover:bg-indigo-50/80' : 'hover:bg-slate-50'}`}
                                                    onClick={() => handleSelectRow(ris)}
                                                >
                                                    <TableCell onClick={(e) => e.stopPropagation()} className="px-4 text-center">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => handleSelectRow(ris)}
                                                            className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600 pointer-events-none">
                                                            {isSelected ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-slate-900">{ris.risNumber}</TableCell>
                                                    <TableCell className="text-slate-600 truncate max-w-[200px]">{ris.risPurpose}</TableCell>
                                                    <TableCell className="text-slate-700">{ris.office?.name || '—'}</TableCell>
                                                    <TableCell className="text-right text-slate-700">{formatDate(ris.risRequestedDate)}</TableCell>
                                                </TableRow>

                                                {isSelected && (
                                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                                        <TableCell colSpan={6} className="p-0 border-b">
                                                            <div className="bg-slate-50/80 border-l-[3px] border-indigo-500 shadow-inner px-8 py-5 max-h-[320px] overflow-y-auto">
                                                                {isPreviewLoading ? (
                                                                    <div className="flex flex-col items-center justify-center py-6 text-indigo-600">
                                                                        <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                                                        <p className="text-sm font-medium">Fetching Requisition Items...</p>
                                                                    </div>
                                                                ) : currentRISItems.length > 0 ? (
                                                                    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                                                                        <Table>
                                                                            <TableHeader className="bg-slate-100/50">
                                                                                <TableRow className="hover:bg-transparent">
                                                                                    <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600">Stock No.</TableHead>
                                                                                    <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600">Unit</TableHead>
                                                                                    <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600">Description</TableHead>
                                                                                    <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600 text-center">Req. Qty</TableHead>
                                                                                    <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600 text-center">Issue Qty</TableHead>
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                                {currentRISItems.map((item, idx) => (
                                                                                    <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                                                                                        <TableCell className="py-2.5 text-xs text-slate-600">{item.stockNumber}</TableCell>
                                                                                        <TableCell className="py-2.5 text-xs text-slate-600">{item.unit?.name}</TableCell>
                                                                                        <TableCell className="py-2.5 text-xs font-medium text-slate-800">{item.itemDescription}</TableCell>
                                                                                        <TableCell className="py-2.5 text-xs text-center font-medium text-indigo-600">{item.requisitionQuantity}</TableCell>
                                                                                        <TableCell className="py-2.5 text-xs text-center font-bold text-slate-900">{item.issueQuantity || '—'}</TableCell>
                                                                                    </TableRow>
                                                                                ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center py-6 text-slate-500 bg-white rounded-lg border border-dashed border-slate-200">
                                                                        <FileText className="w-8 h-8 text-slate-300 mb-2" />
                                                                        <p className="text-sm font-medium">No items listed for this RIS.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                                                <div className="p-4 bg-slate-50 rounded-full border border-slate-100">
                                                    <FileText className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="font-medium text-slate-900 text-lg">No records found</p>
                                                <p className="text-sm">{activeSearchQuery ? `We couldn't find anything matching "${activeSearchQuery}".` : 'No RIS records available.'}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-end gap-2 pt-4">
                            <Button variant="outline" size="sm" disabled={currentPage === 1 || loading} onClick={() => handlePageChange(currentPage - 1)}>
                                Previous
                            </Button>
                            <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
                            <Button variant="outline" size="sm" disabled={currentPage === totalPages || loading} onClick={() => handlePageChange(currentPage + 1)}>
                                Next
                            </Button>
                        </div>
                    )}

                </div>
            </DialogContent>
        </Dialog>
        </>
    );
};
