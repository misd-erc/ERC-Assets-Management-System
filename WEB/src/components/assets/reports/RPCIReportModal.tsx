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
import { Loader2, Filter, FileText, Download, AlertCircle, Printer, Users, BookmarkPlus, BookOpen, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { getCategories } from '@/api/asset/inventoryApi';
import { getSupplyItems, getVwSupplyGroupedItems } from '@/api/supply-management/itemApi';
import { getEmployees } from '@/api/user-management/userApi';
import { EmployeeSelector } from '@/components/transfers-returns/EmployeeSelector';
import { ApiEmployee } from '@/types/transfer';
import {
    getRPCISignatoryTemplates,
    saveRPCISignatoryTemplate,
    deleteRPCISignatoryTemplate,
    RPCISignatoryTemplateDto
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
    headerContainer: { marginBottom: 10 },
    headerTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 2 },
    headerSub: { fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 2 },
    headerAsOf: { fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 10 },

    accountableContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginBottom: 8
    },
    accountableInlineText: { fontSize: 7 },
    accountableItemBlock: { alignItems: 'center', marginHorizontal: 1 },
    accountableValue: { fontFamily: 'Helvetica-Bold', textDecoration: 'underline', fontSize: 7, textAlign: 'center' },
    accountableSubLabel: { fontSize: 6, textAlign: 'center', marginTop: 1 },

    // Table Styles
    table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', marginBottom: 15 },
    tableRow: { flexDirection: 'row' },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: '#fef08a', borderBottomWidth: 1, borderBottomColor: '#000' },

    colArticle: { width: '5%', borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    colDesc: { width: '30%', borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    colStock: { width: '12%', borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    colUom: { width: '8%', borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    colUnitValue: { width: '8%', borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    colBalance: { width: '10%', borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    colOnHand: { width: '10%', borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    colShortage: { width: '9%', borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    colRemarks: { width: '8%', padding: 4 },

    cellHeader: { fontFamily: 'Helvetica-Bold', textAlign: 'center', fontSize: 7 },
    cellText: { fontSize: 7 },
    cellTextCenter: { fontSize: 7, textAlign: 'center' },
    cellTextRight: { fontSize: 7, textAlign: 'right' },
    rowBorderBottom: { borderBottomWidth: 1, borderBottomColor: '#000' },

    // Bottom Section
    bottomSection: { flexDirection: 'row', marginTop: 10 },
    bottomCol: { width: '50%' },
    sigHeader: { fontSize: 8, marginBottom: 10 },

    sigBlock: { marginBottom: 15, alignItems: 'center', width: '80%' },
    sigName: { fontFamily: 'Helvetica-Bold', fontSize: 8, textDecoration: 'underline', marginBottom: 2, textAlign: 'center' },
    sigTitle: { fontSize: 8, textAlign: 'center' },
    stationText: { fontFamily: 'Helvetica-Bold', fontSize: 8, textAlign: 'center', marginTop: 10 }
});

export interface RPCISignatory {
    name: string;
    designation: string;
}

export interface RPCISignatories {
    member1: RPCISignatory;
    member2: RPCISignatory;
    member3: RPCISignatory;
    chairperson: RPCISignatory;
    viceChairperson: RPCISignatory;
}

const DEFAULT_RPCI_SIGNATORIES: RPCISignatories = {
    member1: { name: '', designation: '' },
    member2: { name: '', designation: '' },
    member3: { name: '', designation: '' },
    chairperson: { name: '', designation: '' },
    viceChairperson: { name: '', designation: '' },
};

interface RPCIPDFDocumentProps {
    data: any[];
    categoryInfo: any;
    reportDate: string;
    assumptionDate: string;
    signatories: RPCISignatories;
}

const RPCIPDFDocument: React.FC<RPCIPDFDocumentProps> = ({ data, categoryInfo, reportDate, assumptionDate, signatories }) => {
    const accountCode = categoryInfo ? `${categoryInfo.generalCode || ''} - ${categoryInfo.name || ''}` : '';

    return (
        <Document>
            <Page size="A4" style={pdfStyles.page} orientation="landscape">
                <View style={pdfStyles.headerContainer}>
                    <Text style={pdfStyles.headerTitle}>REPORT ON THE PHYSICAL COUNT OF INVENTORIES</Text>
                    <Text style={pdfStyles.headerSub}>Account Code {accountCode}</Text>
                    <Text style={pdfStyles.headerAsOf}>As of {reportDate}</Text>

                    <View style={pdfStyles.accountableContainer}>
                        <Text style={pdfStyles.accountableInlineText}>For which </Text>
                        <View style={pdfStyles.accountableItemBlock}>
                            <Text style={pdfStyles.accountableValue}>ROSELLE M. GUINTU</Text>
                            <Text style={pdfStyles.accountableSubLabel}>(Name of Accountable Officer)</Text>
                        </View>
                        <Text style={pdfStyles.accountableInlineText}>, </Text>
                        <View style={pdfStyles.accountableItemBlock}>
                            <Text style={pdfStyles.accountableValue}>Administrative Officer III</Text>
                            <Text style={pdfStyles.accountableSubLabel}>(Official Designation)</Text>
                        </View>
                        <Text style={pdfStyles.accountableInlineText}>, </Text>
                        <View style={pdfStyles.accountableItemBlock}>
                            <Text style={pdfStyles.accountableValue}>Energy Regulatory Commission</Text>
                            <Text style={pdfStyles.accountableSubLabel}>(Agency/Office)</Text>
                        </View>
                        <Text style={pdfStyles.accountableInlineText}>, is accountable having assumed such accountability on </Text>
                        <View style={pdfStyles.accountableItemBlock}>
                            <Text style={pdfStyles.accountableValue}>{assumptionDate}</Text>
                            <Text style={pdfStyles.accountableSubLabel}>(Date of Assumption)</Text>
                        </View>
                        <Text style={pdfStyles.accountableInlineText}>.</Text>
                    </View>
                </View>

                <View style={pdfStyles.table}>
                    <View fixed style={pdfStyles.tableHeaderRow}>
                        <View style={pdfStyles.colArticle}><Text style={pdfStyles.cellHeader}>ARTICLE</Text></View>
                        <View style={pdfStyles.colDesc}><Text style={pdfStyles.cellHeader}>DESCRIPTION</Text></View>
                        <View style={pdfStyles.colStock}><Text style={pdfStyles.cellHeader}>STOCK NUMBER</Text></View>
                        <View style={pdfStyles.colUom}><Text style={pdfStyles.cellHeader}>UNIT OF MEASURE</Text></View>
                        <View style={pdfStyles.colUnitValue}><Text style={pdfStyles.cellHeader}>UNIT VALUE</Text></View>
                        <View style={pdfStyles.colBalance}><Text style={pdfStyles.cellHeader}>BALANCE PER CARD</Text></View>
                        <View style={pdfStyles.colOnHand}><Text style={pdfStyles.cellHeader}>ON HAND PER COUNT</Text></View>
                        <View style={pdfStyles.colShortage}><Text style={pdfStyles.cellHeader}>SHORTAGE / OVERAGE</Text></View>
                        <View style={pdfStyles.colRemarks}><Text style={pdfStyles.cellHeader}>REMARKS</Text></View>
                    </View>

                    {data.map((item: any, idx: number) => (
                        <View key={item.id ? `rpci-${item.id}` : item.code ? `rpci-${item.code}-${idx}` : `rpci-${idx}`} wrap={false} style={[pdfStyles.tableRow, pdfStyles.rowBorderBottom]}>
                            <View style={pdfStyles.colArticle}><Text style={pdfStyles.cellTextCenter}>{idx + 1}</Text></View>
                            <View style={pdfStyles.colDesc}><Text style={pdfStyles.cellText}>{item.description}</Text></View>
                            <View style={pdfStyles.colStock}><Text style={pdfStyles.cellTextCenter}>{item.code}</Text></View>
                            <View style={pdfStyles.colUom}><Text style={pdfStyles.cellTextCenter}>{item.measurementUnit?.name || item.measurementUnit || ''}</Text></View>
                            <View style={pdfStyles.colUnitValue}><Text style={pdfStyles.cellTextRight}>{item.unitCost?.toFixed(2) || ''}</Text></View>
                            <View style={pdfStyles.colBalance}><Text style={pdfStyles.cellTextRight}>{item.quantity?.toLocaleString()}</Text></View>
                            <View style={pdfStyles.colOnHand}><Text style={pdfStyles.cellTextRight}>{item.quantity?.toLocaleString()}</Text></View>
                            <View style={pdfStyles.colShortage}><Text style={pdfStyles.cellText}></Text></View>
                            <View style={pdfStyles.colRemarks}><Text style={pdfStyles.cellText}></Text></View>
                        </View>
                    ))}
                </View>

                <View wrap={false} style={pdfStyles.bottomSection}>
                    <View style={pdfStyles.bottomCol}>
                        <Text style={pdfStyles.sigHeader}>Prepared by:</Text>

                        {signatories.member1.name && (
                            <View style={pdfStyles.sigBlock}>
                                <Text style={pdfStyles.sigName}>{signatories.member1.name}</Text>
                                <Text style={pdfStyles.sigTitle}>{signatories.member1.designation}</Text>
                            </View>
                        )}
                        {signatories.member2.name && (
                            <View style={pdfStyles.sigBlock}>
                                <Text style={pdfStyles.sigName}>{signatories.member2.name}</Text>
                                <Text style={pdfStyles.sigTitle}>{signatories.member2.designation}</Text>
                            </View>
                        )}
                        {signatories.member3.name && (
                            <View style={pdfStyles.sigBlock}>
                                <Text style={pdfStyles.sigName}>{signatories.member3.name}</Text>
                                <Text style={pdfStyles.sigTitle}>{signatories.member3.designation}</Text>
                            </View>
                        )}

                        <Text style={pdfStyles.stationText}>FINANCIAL AND ADMINISTRATIVE SERVICE (FAS){'\n'}Station</Text>
                    </View>

                    <View style={pdfStyles.bottomCol}>
                        <Text style={pdfStyles.sigHeader}>Verified By:</Text>

                        {signatories.chairperson.name && (
                            <View style={pdfStyles.sigBlock}>
                                <Text style={pdfStyles.sigName}>{signatories.chairperson.name}</Text>
                                <Text style={pdfStyles.sigTitle}>{signatories.chairperson.designation}</Text>
                            </View>
                        )}

                        <View style={{ marginTop: 20 }}>
                            {signatories.viceChairperson.name && (
                                <View style={pdfStyles.sigBlock}>
                                    <Text style={pdfStyles.sigName}>{signatories.viceChairperson.name}</Text>
                                    <Text style={pdfStyles.sigTitle}>{signatories.viceChairperson.designation}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

interface RPCISignatoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (signatories: RPCISignatories) => void;
    actionLabel: string;
}

const RPCISignatoryModal: React.FC<RPCISignatoryModalProps> = ({ isOpen, onClose, onConfirm, actionLabel }) => {
    const [signatories, setSignatories] = useState<RPCISignatories>(() =>
        JSON.parse(JSON.stringify(DEFAULT_RPCI_SIGNATORIES))
    );
    const [templates, setTemplates] = useState<RPCISignatoryTemplateDto[]>([]);
    const [templateName, setTemplateName] = useState('');
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
    const [employees, setEmployees] = useState<ApiEmployee[]>([]);

    const loadTemplates = async () => {
        const data = await getRPCISignatoryTemplates();
        setTemplates(data);
    };

    useEffect(() => {
        if (isOpen) {
            setSignatories(JSON.parse(JSON.stringify(DEFAULT_RPCI_SIGNATORIES)));
            setTemplateName('');
            setSavingTemplate(false);
            setEditingTemplateId(null);

            loadTemplates();

            getEmployees(1, 10000).then((response) => {
                if (response.success && response.data?.items) {
                    setEmployees(response.data.items);
                }
            });
        }
    }, [isOpen]);

    const handleSaveTemplate = async () => {
        if (!templateName.trim()) return;

        const result = await saveRPCISignatoryTemplate(
            templateName.trim(),
            JSON.parse(JSON.stringify(signatories)),
            editingTemplateId ?? 0
        );

        if (result) {
            toast.success(editingTemplateId ? 'Template updated' : 'Template saved');
            await loadTemplates();
        } else {
            toast.error('Failed to save template');
        }

        setSavingTemplate(false);
        setTemplateName('');
        setEditingTemplateId(null);
    };

    const handleLoadTemplate = (tpl: RPCISignatoryTemplateDto) => {
        if (tpl.signatories) {
            setSignatories(JSON.parse(JSON.stringify(tpl.signatories)));
        }
        setEditingTemplateId(null);
        setTemplateName('');
        setSavingTemplate(false);
    };

    const handleEditTemplate = (tpl: RPCISignatoryTemplateDto) => {
        if (tpl.signatories) {
            setSignatories(JSON.parse(JSON.stringify(tpl.signatories)));
        }
        setEditingTemplateId(tpl.id);
        setTemplateName(tpl.name);
        setSavingTemplate(true);
    };

    const handleDeleteTemplate = async (id: number) => {
        const success = await deleteRPCISignatoryTemplate(id);
        if (success) {
            toast.success('Template deleted');
            await loadTemplates();
        } else {
            toast.error('Failed to delete template');
        }
    };

    const updateSignatory = (key: keyof RPCISignatories, field: keyof RPCISignatory, value: string) => {
        setSignatories(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    const handleSelectEmployee = (key: keyof RPCISignatories, employeeId: number | null) => {
        if (employeeId === null) {
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
    };

    const signatoryLabels: Record<keyof RPCISignatories, string> = {
        member1: 'Committee Member 1',
        member2: 'Committee Member 2',
        member3: 'Committee Member 3',
        chairperson: 'Chairperson',
        viceChairperson: 'Vice Chairperson'
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
                        Set the names and designations that will appear on the printed RPCI.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
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

                        {templates.length === 0 ? (
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

                    <div className="space-y-4">
                        {(Object.keys(signatoryLabels) as (keyof RPCISignatories)[]).map((key) => (
                            <div key={key}>
                                <h3 className="text-sm font-semibold text-slate-800 mb-2">{signatoryLabels[key]}</h3>
                                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs text-slate-600 mb-1 block">Full Name</Label>
                                        <EmployeeSelector
                                            employees={employees}
                                            value={null}
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
                                            placeholder="e.g. Committee Member"
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

interface RPCIReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RPCIReportModal = ({ isOpen, onClose }: RPCIReportModalProps) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [assumptionMonth, setAssumptionMonth] = useState(() => new Date().toLocaleString('en-US', { month: 'long' }));
    const [assumptionYear, setAssumptionYear] = useState(() => String(new Date().getFullYear()));
    const [categoryId, setCategoryId] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasGenerated, setHasGenerated] = useState(false);
    const pageSize = 100;

    const [categories, setCategories] = useState<any[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [signatoryModalOpen, setSignatoryModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<'print' | 'download' | null>(null);

    const isAllSelected = data.length > 0 && data.every((item: any, index: number) => selectedItems.has(item.code ?? `unknown-${index}`));
    const totalPages = Math.ceil(totalCount / pageSize);

    useEffect(() => {
        if (isOpen) {
            getCategories('Supply').then(categoriesData => {
                setCategories(categoriesData.filter((category: any) => category.module === 'Supply'));
            });
            setCurrentPage(1);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedItems(new Set());
            setData([]);
            setCurrentPage(1);
            setTotalCount(0);
            setHasGenerated(false);
        }
    }, [isOpen]);

    const handleStartDateChange = (val: string) => {
        setStartDate(val);
        if (!endDate || endDate === startDate) setEndDate(val);
        if (!reportDate || reportDate === startDate) setReportDate(val);
    };

    const fetchReport = async (catId: number, start: string, end: string, page: number) => {
        setLoading(true);
        setError(null);
        try {
            const [response, groupedResponse] = await Promise.all([
                getSupplyItems(page, pageSize, '', catId, undefined, undefined, undefined, start, end),
                getVwSupplyGroupedItems(page, pageSize, '', undefined, catId || undefined, undefined, undefined, start, end)
            ]);

            const groupedMap = new Map<string, any>();

            for (const g of groupedResponse.items) {
                const key = `${g.code}_${g.description}`;
                groupedMap.set(key, {
                    ...g,
                    quantity: g.totalCurrentStock ?? 0,
                    measurementUnit: g.measurementUnit,
                    unitCost: g.unitCost
                });
            }

            for (const item of response.items) {
                const key = `${item.code}_${item.description}`;
                if (groupedMap.has(key)) {
                    const existing = groupedMap.get(key);
                    if (!existing.measurementUnit && item.measurementUnit) existing.measurementUnit = item.measurementUnit;
                    if ((!existing.unitCost || existing.unitCost === 0) && item.unitCost) existing.unitCost = item.unitCost;
                }
            }

            // Always exclude zero-stock items by default
            const grouped = Array.from(groupedMap.values())
                .filter((item: any) => (item.quantity ?? 0) > 0)
                .sort((a, b) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' }));

            setTotalCount(grouped.length);
            setData(grouped);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch items');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectItem = (id: string, checked: boolean) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedItems(new Set(data.map((item: any, index: number) => item.code ?? `unknown-${index}`)));
        } else {
            setSelectedItems(new Set());
        }
    };

    const handleGenerateReport = async () => {
        if (!startDate || !endDate || !categoryId) return;
        setCurrentPage(1);
        setHasGenerated(true);
        const catId = categoryId === 'all' ? 0 : parseInt(categoryId);
        await fetchReport(catId, startDate, endDate, 1);
        setSelectedItems(new Set());
    };

    const handlePageChange = async (page: number) => {
        setCurrentPage(page);
        setSelectedItems(new Set());
        const catId = categoryId === 'all' ? 0 : (parseInt(categoryId) || 0);
        await fetchReport(catId, startDate, endDate, page);
    };

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

    const handleSignatoryConfirm = async (signatories: RPCISignatories) => {
        setSignatoryModalOpen(false);
        setIsGeneratingPDF(true);
        try {
            const selectedData = data
                .filter((item: any, index: number) => selectedItems.has(item.code ?? `unknown-${index}`))
                .sort((a, b) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' }));

            const printableReportDate = reportDate
                ? new Date(reportDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: '2-digit' })
                : '';
            const assumptionDate = `${assumptionMonth} ${assumptionYear}`;
            const categoryInfo = categories.find(c => c.id.toString() === categoryId);

            const blob = await pdf(
                <RPCIPDFDocument
                    data={selectedData}
                    categoryInfo={categoryInfo}
                    reportDate={printableReportDate}
                    assumptionDate={assumptionDate}
                    signatories={signatories}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);

            if (pendingAction === 'download') {
                const a = document.createElement('a');
                a.href = url;
                a.download = `RPCI_Report_${categoryId}_${startDate}_to_${endDate}.pdf`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 5000);
            } else {
                const w = window.open(url);
                if (w) w.addEventListener('load', () => w.print());
                setTimeout(() => URL.revokeObjectURL(url), 60000);
            }
        } catch (err) {
            console.error('Failed to generate PDF', err);
            toast.error('Failed to generate PDF');
        } finally {
            setIsGeneratingPDF(false);
            setPendingAction(null);
        }
    };

    return (
        <>
            <RPCISignatoryModal
                isOpen={signatoryModalOpen}
                onClose={() => { setSignatoryModalOpen(false); setPendingAction(null); }}
                onConfirm={handleSignatoryConfirm}
                actionLabel={pendingAction ?? 'download'}
            />

            <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
                <DialogContent className="!max-w-7xl !w-[95vw] max-h-[90vh] flex flex-col p-0 bg-white border-slate-200 shadow-2xl overflow-hidden">

                    <DialogHeader className="border-b border-slate-200 p-6 pb-5 bg-slate-50/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="text-left">
                                <DialogTitle className="text-2xl text-slate-900 flex items-center gap-2 font-bold tracking-tight">
                                    <FileText className="w-6 h-6 text-indigo-600" />
                                    Report on the Physical Count of Inventories (RPCI)
                                </DialogTitle>
                                <DialogDescription className="mt-1.5 text-slate-500">
                                    Generate and print official RPCI reports filtered by category and date range.
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

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-5 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 font-medium">Category</Label>
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger className="w-full overflow-hidden">
                                        <SelectValue placeholder="Select Category" className="truncate text-left min-w-0" />
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

                            <div className="space-y-1.5">
                                <Label className="text-slate-700 font-medium">Start Date</Label>
                                <Input
                                    type="date"
                                    className="bg-white border-slate-300 focus-visible:ring-indigo-500 shadow-sm"
                                    value={startDate}
                                    onChange={(e) => handleStartDateChange(e.target.value)}
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
                                <Label className="text-slate-700 font-medium">As of Date (Report)</Label>
                                <Input
                                    type="date"
                                    className="bg-white border-slate-300 focus-visible:ring-indigo-500 shadow-sm"
                                    value={reportDate}
                                    onChange={(e) => setReportDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-slate-700 font-medium">Date of Assumption</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Select value={assumptionMonth} onValueChange={setAssumptionMonth}>
                                        <SelectTrigger className="w-full bg-white border-slate-300 focus:ring-indigo-500 shadow-sm overflow-hidden">
                                            <SelectValue placeholder="Month" className="truncate text-left min-w-0" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60 overflow-y-auto">
                                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="text"
                                        placeholder="Year"
                                        className="bg-white border-slate-300 focus-visible:ring-indigo-500 shadow-sm"
                                        value={assumptionYear}
                                        onChange={(e) => setAssumptionYear(e.target.value)}
                                    />
                                </div>
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

                        <div className="border border-slate-200 rounded-lg overflow-auto flex-1 shadow-sm max-h-[calc(100vh-420px)]">
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
                                        <TableHead className="w-[220px] font-semibold text-slate-700">Stock Number</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Item Description</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700 w-[160px]">Total Current Stock</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        Array.from({ length: 4 }).map((_, index) => (
                                            <TableRow key={`skeleton-${index}`}>
                                                {Array.from({ length: 4 }).map((_, colIndex) => (
                                                    <TableCell key={`skel-col-${colIndex}`}>
                                                        <div className="h-4 bg-slate-100 rounded animate-pulse w-full"></div>
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : data.length > 0 ? (
                                        data.map((item: any, index: number) => {
                                            const safeId = item.code ?? `unknown-${index}`;
                                            const isSelected = selectedItems.has(safeId);
                                            return (
                                                <TableRow
                                                    key={safeId}
                                                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/60 hover:bg-indigo-50/80' : 'hover:bg-slate-50'}`}
                                                >
                                                    <TableCell className="px-4 text-center">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) => handleSelectItem(safeId, !!checked)}
                                                            className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium text-slate-900">{item.code || 'N/A'}</TableCell>
                                                    <TableCell className="text-slate-600">{item.description || 'Unknown Item'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="font-bold text-indigo-600">{item.quantity}</span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-72 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-500 space-y-4">
                                                    <div className="p-5 bg-indigo-50 rounded-full border border-indigo-100 shadow-sm">
                                                        <Filter className="w-8 h-8 text-indigo-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 text-lg">
                                                            {hasGenerated ? 'No RPCI Records Found' : 'Ready to Generate'}
                                                        </p>
                                                        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                                                            {hasGenerated
                                                                ? 'No inventory items found for the selected category and date range.'
                                                                : 'Select a category and date range above to generate the RPCI report.'}
                                                        </p>
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
