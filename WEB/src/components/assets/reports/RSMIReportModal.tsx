// src/components/assets/reports/RSMIReportModal.tsx
import React, { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getAcronym } from '@/utils/formatters';
import { Loader2, Filter, FileText, ChevronDown, ChevronRight, Download, AlertCircle, Printer, Users, BookmarkPlus, BookOpen, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { useRSMIReport } from '@/hooks/supply/useRSMIReport';
import { getCategories } from '@/api/asset/inventoryApi';
import { getEmployees } from '@/api/user-management/userApi';
import { EmployeeSelector } from '@/components/transfers-returns/EmployeeSelector';
import { ApiEmployee } from '@/types/transfer';
import {
    getRSMISignatoryTemplates,
    saveRSMISignatoryTemplate,
    deleteRSMISignatoryTemplate,
    RSMISignatoryTemplateDto,
} from '@/api/supply-management/signatoryTemplateApi';

import {
    pdf,
    Document,
    Page,
    Text,
    View,
    StyleSheet
} from '@react-pdf/renderer';

const pdfStyles = StyleSheet.create({
    page: { padding: 20, fontSize: 8, fontFamily: 'Helvetica' },

    // Header Styles
    headerContainer: { marginBottom: 3 },
    headerTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 1 },
    headerCommission: { fontSize: 8, textAlign: 'center', marginBottom: 1 },
    headerAgency: { fontSize: 8, textAlign: 'center', marginBottom: 5 },

    headerDateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 3
    },
    headerDateLeft: { fontSize: 8 },
    headerDateRight: { fontSize: 8 },

    // Table Styles
    table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', marginBottom: 15, marginTop: 3 },
    tableRow: { flexDirection: 'row' },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#000' },

    colStock: { width: '12%', borderRightWidth: 1, borderRightColor: '#000', padding: 2 },
    colItem: { width: '30%', borderRightWidth: 1, borderRightColor: '#000', padding: 2 },
    colRis: { width: '15%', borderRightWidth: 1, borderRightColor: '#000', padding: 2 },
    colRc: { width: '13%', borderRightWidth: 1, borderRightColor: '#000', padding: 2 },
    colQty: { width: '10%', borderRightWidth: 1, borderRightColor: '#000', padding: 2 },
    colUnitCost: { width: '10%', borderRightWidth: 1, borderRightColor: '#000', padding: 2 },
    colTotalCost: { width: '10%', borderRightWidth: 1, borderRightColor: '#000', padding: 2 },
    colAccountCode: { width: '10%', padding: 2 },

    cellHeader: { fontFamily: 'Helvetica-Bold', textAlign: 'center', fontSize: 7 },
    cellText: { fontSize: 7 },
    cellTextCenter: { fontSize: 7, textAlign: 'center' },
    cellTextRight: { fontSize: 7, textAlign: 'right' },
    rowBorderBottom: { borderBottomWidth: 0.5, borderBottomColor: '#cbd5e1' },

    markerRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    markerText: { width: '100%', fontFamily: 'Helvetica-Oblique', fontSize: 7, textAlign: 'center', padding: 4 },

    // --- BOTTOM SECTION ---
    bottomSection: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        marginTop: 10,
        height: 60
    },
    bottomColLeft: {
        width: '50%',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    bottomColRight: {
        width: '50%',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },

    // Left Column Elements
    certText: { fontSize: 8, marginBottom: 15 },
    sigBlockLeft: {
        alignItems: 'center',
        width: '80%',
        marginTop: 8
    },
    sigName: { fontFamily: 'Helvetica-Bold', fontSize: 8, textDecoration: 'underline', marginBottom: 1, textAlign: 'center' },
    sigTitle: { fontSize: 8, textAlign: 'center' },
    sigSection: { fontSize: 8, textAlign: 'center' },

    // Right Column Elements
    postedByText: {
        fontSize: 8,
        width: 120,
        textAlign: 'left',
        marginBottom: 15
    },
    sigBlockRight: {
        width: 120,
        alignItems: 'center',
        marginTop: 8
    },
    sigLineRight: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        marginBottom: 1,
        height: 8
    },
    approvedBy: {
        fontSize: 8,
        textAlign: 'center'
    },
    accountingSection: {
        fontSize: 8,
        textAlign: 'center',
        marginTop: 8
    }
});

const DEFAULT_RSMI_START_DATE = '1900-01-01';
const DEFAULT_RSMI_END_DATE = '9999-12-31';

// --- SIGNATORY TYPES ---
export interface RSMISignatory {
    name: string;
    designation: string;
    section?: string;
}

export interface RSMISignatories {
    certifiedBy: RSMISignatory;
    approvedBy: RSMISignatory;
}

const DEFAULT_RSMI_SIGNATORIES: RSMISignatories = {
    certifiedBy: { name: 'MS. ROSELLE MALAKI GUINTU', designation: 'Administrative Officer III', section: 'Accounting Section' },
    approvedBy: { name: '', designation: '' },
};

interface RSMIPDFDocumentProps {
    data: any[];
    reportDate: string;
    rsmiNumber: string;
    signatories: RSMISignatories;
}

const RSMIPDFDocument: React.FC<RSMIPDFDocumentProps> = ({ data, reportDate, rsmiNumber, signatories }) => (
    <Document>
        <Page size="A4" style={pdfStyles.page} orientation="landscape">

            {/* HEADER */}
            <View style={pdfStyles.headerContainer}>
                <Text style={pdfStyles.headerTitle}>REPORT OF SUPPLIES AND MATERIALS ISSUED</Text>
                <Text style={pdfStyles.headerCommission}>ENERGY REGULATORY COMMISSION</Text>
                <Text style={pdfStyles.headerAgency}>Agency</Text>

                <View style={pdfStyles.headerDateRow}>
                    <Text style={pdfStyles.headerDateLeft}>Date: {reportDate}</Text>
                    <Text style={pdfStyles.headerDateRight}>RSMI: {rsmiNumber}</Text>
                </View>
            </View>

            {/* TABLE */}
            <View style={pdfStyles.table}>
                <View style={[pdfStyles.tableRow, { borderBottomWidth: 1, borderBottomColor: '#000' }]}>
                    <View style={{ width: '70%', borderRightWidth: 1, borderRightColor: '#000', padding: 2 }}>
                        <Text style={{ fontSize: 7, fontStyle: 'italic' }}>To be filled up in the Supply & Property Unit</Text>
                    </View>
                    <View style={{ width: '30%', padding: 2 }}>
                        <Text style={{ fontSize: 7, fontStyle: 'italic' }}>To be filled up in the Accounting Unit</Text>
                    </View>
                </View>
                <View style={pdfStyles.tableHeaderRow}>
                    <View style={pdfStyles.colStock}><Text style={pdfStyles.cellHeader}>Stock No</Text></View>
                    <View style={pdfStyles.colItem}><Text style={pdfStyles.cellHeader}>Item</Text></View>
                    <View style={pdfStyles.colRis}><Text style={pdfStyles.cellHeader}>RIS No</Text></View>
                    <View style={pdfStyles.colRc}><Text style={pdfStyles.cellHeader}>RC Code</Text></View>
                    <View style={pdfStyles.colQty}><Text style={pdfStyles.cellHeader}>Qty. Issued</Text></View>
                    <View style={pdfStyles.colUnitCost}><Text style={pdfStyles.cellHeader}>Unit Cost</Text></View>
                    <View style={pdfStyles.colTotalCost}><Text style={pdfStyles.cellHeader}>Total Cost</Text></View>
                    <View style={pdfStyles.colAccountCode}><Text style={pdfStyles.cellHeader}>Account Code</Text></View>
                </View>

                {data.map((group: any, gIdx: number) => (
                    <React.Fragment key={gIdx}>
                        {(group.items || []).map((item: any, iIdx: number) => {
                            const showStock = iIdx === 0;
                            const qty = item.issueQuantity ?? 0;

                            return (
                                <View key={iIdx} style={[pdfStyles.tableRow, pdfStyles.rowBorderBottom]}>
                                    <View style={pdfStyles.colStock}>
                                        <Text style={pdfStyles.cellText}>{showStock ? (group.stockNumber ?? '') : ''}</Text>
                                    </View>
                                    <View style={pdfStyles.colItem}>
                                        <Text style={pdfStyles.cellText}>{showStock ? (group.itemDescription ?? '') : ''}</Text>
                                    </View>
                                    <View style={pdfStyles.colRis}>
                                        <Text style={pdfStyles.cellTextCenter}>{item.risNumber ?? ''}</Text>
                                    </View>
                                    <View style={pdfStyles.colRc}>
                                        <Text style={pdfStyles.cellTextCenter}>{item.officeName ? `${getAcronym(item.officeName)} ${getAcronym(item.divisionName)}` : ''}</Text>
                                    </View>
                                    <View style={pdfStyles.colQty}>
                                        <Text style={pdfStyles.cellTextRight}>{qty}</Text>
                                    </View>
                                    <View style={pdfStyles.colUnitCost}>
                                        <Text style={pdfStyles.cellTextRight}></Text>
                                    </View>
                                    <View style={pdfStyles.colTotalCost}>
                                        <Text style={pdfStyles.cellTextRight}></Text>
                                    </View>
                                    <View style={pdfStyles.colAccountCode}>
                                        <Text style={pdfStyles.cellText}></Text>
                                    </View>
                                </View>
                            );
                        })}
                    </React.Fragment>
                ))}

                <View style={pdfStyles.markerRow}>
                    <Text style={pdfStyles.markerText}>****nothing follows****</Text>
                </View>
            </View>

            {/* BOTTOM SECTION */}
            <View style={pdfStyles.bottomSection}>

                <View style={pdfStyles.bottomColLeft}>
                    <Text style={pdfStyles.certText}>I hereby certify to the correctness of the above information</Text>
                    <View style={pdfStyles.sigBlockLeft}>
                        <Text style={pdfStyles.sigName}>{signatories.certifiedBy.name || ' '}</Text>
                        <Text style={pdfStyles.sigTitle}>{signatories.certifiedBy.designation || ' '}</Text>
                        <Text style={pdfStyles.sigSection}>{signatories.certifiedBy.section || ' '}</Text>
                    </View>
                </View>

                <View style={pdfStyles.bottomColRight}>
                    <Text style={pdfStyles.postedByText}>Posted By/Date:</Text>
                    <View style={pdfStyles.sigBlockRight}>
                        <View style={pdfStyles.sigLineRight}></View>
                        <Text style={pdfStyles.approvedBy}>{signatories.approvedBy.name ? `${signatories.approvedBy.name}` : 'Approved By:'}</Text>
                        <Text style={pdfStyles.accountingSection}>Accounting Section</Text>
                    </View>
                </View>

            </View>

        </Page>
    </Document>
);

// --- SIGNATORY MODAL COMPONENT ---
interface RSMISignatoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (signatories: RSMISignatories) => void;
    actionLabel: string;
}

const RSMISignatoryModal: React.FC<RSMISignatoryModalProps> = ({ isOpen, onClose, onConfirm, actionLabel }) => {
    const [signatories, setSignatories] = useState<RSMISignatories>(() =>
        JSON.parse(JSON.stringify(DEFAULT_RSMI_SIGNATORIES))
    );
    const [templates, setTemplates] = useState<RSMISignatoryTemplateDto[]>([]);
    const [templateName, setTemplateName] = useState('');
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [templateLoading, setTemplateLoading] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
    const [employees, setEmployees] = useState<ApiEmployee[]>([]);
    const [certifiedByEmployeeId, setCertifiedByEmployeeId] = useState<number | null>(null);
    const [approvedByEmployeeId, setApprovedByEmployeeId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            setSignatories(JSON.parse(JSON.stringify(DEFAULT_RSMI_SIGNATORIES)));
            setTemplateName('');
            setSavingTemplate(false);
            setTemplateLoading(true);
            setEditingTemplateId(null);
            setCertifiedByEmployeeId(null);
            setApprovedByEmployeeId(null);
            getRSMISignatoryTemplates()
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
        const saved = await saveRSMISignatoryTemplate(templateName.trim(), signatories, editingTemplateId ?? 0);
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

    const handleLoadTemplate = (tpl: RSMISignatoryTemplateDto) => {
        if (tpl.signatories) {
            setSignatories(JSON.parse(JSON.stringify(tpl.signatories)));
            setCertifiedByEmployeeId(null);
            setApprovedByEmployeeId(null);
        }
        setEditingTemplateId(null);
        setTemplateName('');
        setSavingTemplate(false);
    };

    const handleEditTemplate = (tpl: RSMISignatoryTemplateDto) => {
        if (tpl.signatories) {
            setSignatories(JSON.parse(JSON.stringify(tpl.signatories)));
            setCertifiedByEmployeeId(null);
            setApprovedByEmployeeId(null);
        }
        setEditingTemplateId(tpl.id);
        setTemplateName(tpl.name);
        setSavingTemplate(true);
    };

    const handleDeleteTemplate = async (id: number) => {
        const ok = await deleteRSMISignatoryTemplate(id);
        if (ok) {
            setTemplates(prev => prev.filter(t => t.id !== id));
            toast.success('Template deleted');
        } else {
            toast.error('Failed to delete template');
        }
    };

    const updateSignatory = (key: keyof RSMISignatories, field: keyof RSMISignatory, value: string) => {
        setSignatories(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    const handleSelectEmployee = (key: keyof RSMISignatories, employeeId: number | null) => {
        const setter = key === 'certifiedBy' ? setCertifiedByEmployeeId : setApprovedByEmployeeId;

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
        certifiedBy: certifiedByEmployeeId,
        approvedBy: approvedByEmployeeId,
    };

    const signatoryLabels: Record<keyof RSMISignatories, string> = {
        certifiedBy: 'Certified by',
        approvedBy: 'Approved by',
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
                        Set the names and designations that will appear on the printed RSMI.
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
                        {(Object.keys(signatoryLabels) as (keyof RSMISignatories)[]).map((key) => (
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
                                    {key === 'certifiedBy' && (
                                        <div className="md:col-span-2">
                                            <Label className="text-xs text-slate-600 mb-1 block">Section / Office</Label>
                                            <Input
                                                className="h-8 text-sm"
                                                value={signatories[key].section || ''}
                                                onChange={(e) => updateSignatory(key, 'section', e.target.value)}
                                                placeholder="e.g. Accounting Section"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>

                <DialogFooter className="border-t border-slate-200 p-4 bg-slate-50/50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => onConfirm(signatories)}
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
interface RSMIReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RSMIReportModal = ({ isOpen, onClose }: RSMIReportModalProps) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [categoryId, setCategoryId] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 100;

    const [categories, setCategories] = useState<any[]>([]);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const { data, totalCount, loading, error, fetchReport } = useRSMIReport();
    useEffect(() => {
        if (isOpen) {
            getCategories('Supply').then(categoriesData => {
                setCategories(categoriesData.filter((category: any) => category.module === 'Supply'));
            });
            setCurrentPage(1);
            fetchReport(0, DEFAULT_RSMI_START_DATE, DEFAULT_RSMI_END_DATE, 1, pageSize);
        }
    }, [isOpen, fetchReport]);

    useEffect(() => {
        if (!isOpen) {
            setExpandedRows({});
            setSelectedItems(new Set());
        }
    }, [isOpen]);

    const toggleRow = (stockNumber: string) => {
        setExpandedRows(prev => ({
            ...prev,
            [stockNumber]: !prev[stockNumber]
        }));
    };

    const handleSelectItem = (stockNumber: string, checked: boolean) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (checked) next.add(stockNumber);
            else next.delete(stockNumber);
            return next;
        });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allStockNumbers = data.map((group: any, index: number) => group.stockNumber ?? `unknown-stock-${index}`);
            setSelectedItems(new Set(allStockNumbers));
        } else {
            setSelectedItems(new Set());
        }
    };

    const handleGenerateReport = async () => {
        if (!startDate || !endDate || !categoryId) return;
        setCurrentPage(1);
        await fetchReport(categoryId, startDate, endDate, 1, pageSize);
        setExpandedRows({});
        setSelectedItems(new Set());
    };

    const totalPages = Math.ceil(totalCount / pageSize);
    const handlePageChange = async (page: number) => {
        setCurrentPage(page);
        setExpandedRows({});
        setSelectedItems(new Set());
        await fetchReport(categoryId || 0, startDate || DEFAULT_RSMI_START_DATE, endDate || DEFAULT_RSMI_END_DATE, page, pageSize);
    };

    const [signatoryModalOpen, setSignatoryModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<'print' | 'download' | null>(null);

    const handleExportPDF = () => {
        if (selectedItems.size === 0) return;
        setPendingAction('download');
        setSignatoryModalOpen(true);
    };

    const handlePrintPDF = () => {
        if (selectedItems.size === 0) return;
        setPendingAction('print');
        setSignatoryModalOpen(true);
    };

    const handleSignatoryConfirm = async (signatories: RSMISignatories) => {
        setSignatoryModalOpen(false);
        setIsGeneratingPDF(true);

        try {
            const selectedData = data.filter((group: any, index: number) =>
                selectedItems.has(group.stockNumber ?? `unknown-stock-${index}`)
            );

            const printableReportDate = reportDate ? new Date(reportDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: '2-digit' }) : '';
            const rsmiNumber = `RSMI-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

            const blob = await pdf(
                <RSMIPDFDocument data={selectedData} reportDate={printableReportDate} rsmiNumber={rsmiNumber} signatories={signatories} />
            ).toBlob();

            const url = URL.createObjectURL(blob);

            if (pendingAction === 'download') {
                const a = document.createElement('a');
                a.href = url;
                a.download = `RSMI_Report_${startDate}_to_${endDate}.pdf`;
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

    const isAllSelected = data.length > 0 && selectedItems.size === data.length;

    return (
        <>
        <RSMISignatoryModal
            isOpen={signatoryModalOpen}
            onClose={() => { setSignatoryModalOpen(false); setPendingAction(null); }}
            onConfirm={handleSignatoryConfirm}
            actionLabel={pendingAction || 'print'}
        />
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="!max-w-7xl !w-[95vw] max-h-[90vh] flex flex-col p-0 bg-white border-slate-200 shadow-2xl overflow-hidden">

                {/* HEADER - Updated to match new design */}
                <DialogHeader className="border-b border-slate-200 p-6 pb-5 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-left">
                            <DialogTitle className="text-2xl text-slate-900 flex items-center gap-2 font-bold tracking-tight">
                                <FileText className="w-6 h-6 text-indigo-600" />
                                Report of Supplies and Materials Issued
                            </DialogTitle>
                            <DialogDescription className="mt-1.5 text-slate-500">
                                Generate and print official RSMI issuance reports filtered by category and date range.
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="shadow-sm font-medium transition-all"
                                disabled={selectedItems.size === 0 || isGeneratingPDF}
                                onClick={handlePrintPDF}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print Document
                            </Button>
                            <Button
                                className="shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all"
                                disabled={selectedItems.size === 0 || isGeneratingPDF}
                                onClick={handleExportPDF}
                            >
                                {isGeneratingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                {isGeneratingPDF ? 'Generating...' : 'Save as PDF'}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 flex-1 min-h-0 flex flex-col bg-white overflow-y-auto">

                    {/* FILTER SECTION - Polished Card Look */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="space-y-1.5">
                            <Label className="text-slate-700 font-medium">Category</Label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 overflow-y-auto">
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-slate-700 font-medium">Start Date</Label>
                            <Input
                                type="date"
                                className="bg-white border-slate-300 focus-visible:ring-indigo-500 shadow-sm"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-slate-700 font-medium">End Date</Label>
                            <Input
                                type="date"
                                className="bg-white border-slate-300 focus-visible:ring-indigo-500 shadow-sm"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-slate-700 font-medium">Report Date</Label>
                            <Input
                                type="date"
                                className="bg-white border-slate-300 focus-visible:ring-indigo-500 shadow-sm"
                                value={reportDate}
                                onChange={(e) => setReportDate(e.target.value)}
                            />
                        </div>

                        <div className="flex items-end">
                            <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                onClick={handleGenerateReport}
                                disabled={loading || !startDate || !endDate || !categoryId}
                            >
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Filter className="w-4 h-4 mr-2" />}
                                Generate Report
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center text-rose-700 text-sm font-medium shadow-sm">
                            <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* TABLE WRAPPER */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden flex-1 shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[50px] px-4 text-center">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                            className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                        />
                                    </TableHead>
                                    <TableHead className="w-[40px] px-2"></TableHead>
                                    <TableHead className="w-[220px] font-semibold text-slate-700">Stock Number</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Item Description</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700 w-[160px]">Total Issued</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, index) => (
                                        <TableRow key={`skeleton-${index}`}>
                                            {Array.from({ length: 5 }).map((_, colIndex) => (
                                                <TableCell key={`skel-col-${colIndex}`}>
                                                    <div className="h-4 bg-slate-100 rounded animate-pulse w-full"></div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : data.length > 0 ? (
                                    data.map((group: any, index: number) => {
                                        const safeStockNumber = group.stockNumber ?? `unknown-stock-${index}`;
                                        const isExpanded = expandedRows[safeStockNumber];
                                        const isSelected = selectedItems.has(safeStockNumber);

                                        return (
                                            <React.Fragment key={safeStockNumber}>
                                                <TableRow
                                                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/60 hover:bg-indigo-50/80' : 'hover:bg-slate-50'}`}
                                                    onClick={() => toggleRow(safeStockNumber)}
                                                >
                                                    <TableCell onClick={(e) => e.stopPropagation()} className="px-4 text-center">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) => handleSelectItem(safeStockNumber, !!checked)}
                                                            className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600 pointer-events-none">
                                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="font-medium text-slate-900">{group.stockNumber || 'N/A'}</TableCell>
                                                    <TableCell className="text-slate-600">{group.itemDescription || 'Unknown Item'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="font-bold text-rose-600">{group.total}</span>
                                                    </TableCell>
                                                </TableRow>

                                                {/* EXPANDED ROW (Polished inner table) */}
                                                {isExpanded && (
                                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                                        <TableCell colSpan={5} className="p-0 border-b">
                                                            <div className="bg-slate-50/80 border-l-[3px] border-indigo-500 shadow-inner px-8 py-5">
                                                                <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                                                                    <Table>
                                                                        <TableHeader className="bg-slate-100/50">
                                                                            <TableRow className="hover:bg-transparent">
                                                                                <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600">RIS Number</TableHead>
                                                                                <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600">Office</TableHead>
                                                                                <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600 text-right">Quantity Issued</TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {(group.items || []).map((detail: any, idx: number) => (
                                                                                <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                                                                                    <TableCell className="py-2.5 text-xs font-medium text-indigo-600">
                                                                                        {detail.risNumber || 'N/A'}
                                                                                    </TableCell>
                                                                                    <TableCell className="py-2.5 text-xs text-slate-600">
                                                                                        {detail.officeName ? `${getAcronym(detail.officeName)} ${getAcronym(detail.divisionName)}` : 'N/A'}
                                                                                    </TableCell>
                                                                                    <TableCell className="py-2.5 text-xs text-right font-bold text-slate-900">
                                                                                        {detail.issueQuantity}
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-72 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500 space-y-4">
                                                <div className="p-5 bg-indigo-50 rounded-full border border-indigo-100 shadow-sm">
                                                    <Filter className="w-8 h-8 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-lg">Ready to Generate</p>
                                                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Select a category and date range above to generate the RSMI report.</p>
                                                </div>
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
