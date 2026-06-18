// src/components/assets/reports/IARReportModal.tsx
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
import { Loader2, Search, Download, Printer, FileText, ClipboardCheck, ChevronRight, ChevronDown, Package, Plus, Trash2, Users, UserCheck, BookmarkPlus, BookOpen, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { getSupplyIARs } from '@/api/supply-management/iarApi';
import { getDeliveryRecordById, getDeliveryRecords } from '@/api/delivery/deliveryApi';
import { getIARSignatoryTemplates, saveIARSignatoryTemplate, deleteIARSignatoryTemplate, IARSignatoryTemplateDto } from '@/api/supply-management/signatoryTemplateApi';
import { getEmployees } from '@/api/user-management/userApi';
import { EmployeeSelector } from '@/components/transfers-returns/EmployeeSelector';
import { ApiEmployee } from '@/types/transfer';
import { formatDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/formatters';
import { VwSupplyIAR } from '@/types';
import { VwDeliveryRecord } from '@/types/delivery/delivery';

import {
    pdf,
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    Image
} from '@react-pdf/renderer';

Font.register({
    family: 'Roboto',
    src: 'https://fonts.gstatic.com/l/font?kit=KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbWmTmgDyuGwX7VwC5k1A1f4ix0E&skey=a0a0114a1dcab3ac&v=v51'
});

// --- STRICT APPENDIX 62 SPECIFICATIONS (Times New Roman) ---
const pdfStyles = StyleSheet.create({
    page: { padding: 30, fontSize: 8.5, fontFamily: 'Times-Roman', color: '#000' },

    // Header Element Structures
    headerContainer: { position: 'relative', marginBottom: 5, textAlign: 'center' },
    stampText: { position: 'absolute', top: -10, right: 10, color: '#6b21a8', fontSize: 13, fontFamily: 'Times-Bold', opacity: 0.8 },
    logoContainer: { position: 'absolute', top: 5, left: 25, width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' },
    logoText: { fontSize: 9, fontFamily: 'Times-Bold' },

    repText: { fontSize: 8.5 },
    ercText: { fontSize: 10.5, fontFamily: 'Times-Bold', marginVertical: 1 },
    addressText: { fontSize: 8 },

    titleContainer: { borderTopWidth: 1, borderColor: '#000', paddingVertical: 3, marginTop: 12, marginBottom: 4 },
    mainTitle: { fontSize: 10.5, fontFamily: 'Times-Bold', textAlign: 'center' },

    agencySection: { textAlign: 'center', marginBottom: 12 },
    agencyText: { fontSize: 9, fontFamily: 'Times-Roman' },
    agencyLabel: { fontSize: 8.5, fontFamily: 'Times-Roman', marginTop: 1 },

    // Metadata Block Positioning (IAR No. and Date sitting stacked on top-right of metadata grid)
    iarMetaWrapper: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
    iarMetaBox: { width: 180 },
    iarMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    iarLabel: { width: 45, fontSize: 8.5 },
    iarValueLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000', fontSize: 8.5, fontFamily: 'Times-Bold', textAlign: 'center', pb: 1 },

    // Full Width Grid Implementation
    mainGrid: { borderWidth: 1, borderColor: '#000' },
    rowContainer: { flexDirection: 'row', minHeight: 18 },

    // Exact Width Splits for Matrix Info
    colSupplier: { width: '45%', padding: 3, flexDirection: 'row', alignItems: 'center' },
    colSINo: { width: '35%', padding: 3, flexDirection: 'row', alignItems: 'center' },
    colSIDate: { width: '20%', padding: 3, flexDirection: 'row', alignItems: 'center' },

    colPODate: { width: '45%', padding: 3, flexDirection: 'row', alignItems: 'center' },
    colDRNo: { width: '35%', padding: 3, flexDirection: 'row', alignItems: 'center' },
    colDRDate: { width: '20%', padding: 3, flexDirection: 'row', alignItems: 'center' },

    colReqOffice: { width: '45%', padding: 3, flexDirection: 'row', alignItems: 'center' },
    colActualDel: { width: '55%', padding: 3, flexDirection: 'row', alignItems: 'center' },

    labelText: { fontSize: 8.5 },
    valueUnderline: { fontSize: 8.5, fontFamily: 'Times-Bold', borderBottomWidth: 1, borderBottomColor: '#000', flex: 1, marginLeft: 3, textAlign: 'center', minHeight: 12 },
    valueClean: { fontSize: 8.5, fontFamily: 'Times-Bold', flex: 1, marginLeft: 3, textAlign: 'center' },

    // Tabular Alignments
    tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 18 },
    tableDataRow: { flexDirection: 'row', minHeight: 16 },

    wQty: { width: '10%', borderRightWidth: 1, borderRightColor: '#000', padding: 3, justifyContent: 'center' },
    wUnit: { width: '10%', borderRightWidth: 1, borderRightColor: '#000', padding: 3, justifyContent: 'center' },
    wDesc: { width: '50%', borderRightWidth: 1, borderRightColor: '#000', padding: 3, justifyContent: 'center' },
    wPrice: { width: '15%', borderRightWidth: 1, borderRightColor: '#000', padding: 3, justifyContent: 'center' },
    wAmount: { width: '15%', padding: 3, justifyContent: 'center' },

    textBoldCenter: { fontSize: 8.5, fontFamily: 'Times-Bold', textAlign: 'center' },
    textCenter: { fontSize: 8.5, textAlign: 'center' },
    textLeft: { fontSize: 8.5, textAlign: 'left' },
    textRight: { fontSize: 8.5, textAlign: 'right' },

    nothingFollows: { textAlign: 'center', fontSize: 8.5, fontStyle: 'italic', marginVertical: 10, width: '100%' },

    // Total Alignment Fields
    totalSummaryRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#000', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 18 },
    totalSpacer: { width: '85%', borderRightWidth: 1, borderRightColor: '#000' },
    totalValCell: { width: '15%', padding: 3, justifyContent: 'center' },

    // Lower Splitted Container Sections
    splitWrapperRow: { flexDirection: 'row', minHeight: 210 },
    splitPaneLeft: { width: '50%', borderRightWidth: 1, borderRightColor: '#000', padding: 5, position: 'relative' },
    splitPaneRight: { width: '50%', padding: 5, position: 'relative' },

    innerHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    innerLineLabel: { fontSize: 8.5 },
    innerLineValue: { fontSize: 8.5, fontFamily: 'Times-Bold', borderBottomWidth: 1, borderBottomColor: '#000', width: 90, textAlign: 'center' },

    sectionTitleText: { fontSize: 9, fontFamily: 'Times-Bold', textAlign: 'center', marginVertical: 5, letterSpacing: 0.5 },

    checkboxGroup: { flexDirection: 'row', marginTop: 8, paddingHorizontal: 4 },
    checkboxBox: { width: 9, height: 9, borderWidth: 1, borderColor: '#000', marginRight: 5, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
    checkboxMark: { fontSize: 7, fontFamily: 'Times-Bold' },
    checkboxLabel: { fontSize: 8.5, flex: 1, lineHeight: 1.2 },

    signSectionLabel: { fontSize: 8.5, marginTop: 10, paddingHorizontal: 4 },

    // Absolute signature block configurations matching image parameters
    centerSignBlock: { alignItems: 'center', marginTop: 30 },
    bottomSignBlock: { alignItems: 'center', marginTop: 25 },
    horizontalLine: { width: '75%', borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 2 },
    textSignName: { fontSize: 8.5, fontFamily: 'Times-Bold', textAlign: 'center' },
    textSignTitle: { fontSize: 8, textAlign: 'center', lineHeight: 1.2 },

    conformeWrapper: { flexDirection: 'column', marginTop: 25, paddingHorizontal: 6 },
    conformeInlineLabel: { fontSize: 8.5, marginBottom: 6 },
    conformeLineBlock: { alignItems: 'center' },

    // Footer Block Architecture
    footerRemarksPane: { padding: 4, minHeight: 45, borderTopWidth: 1, borderTopColor: '#000' },
    footerRemarksLabel: { fontSize: 8.5, fontFamily: 'Times-Bold' },
    pesoSymbol: { fontFamily: 'Roboto' }
});

const formatPDFNumber = (n = 0) =>
    n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// --- SIGNATORY TYPES ---
export interface IARInspectionSignatory {
    id: string;
    name: string;
    role: string;
    committee: string;
}

export interface IARSignatories {
    inspectionMembers: IARInspectionSignatory[];
    conformeEndUser: { name: string; title: string };
    acceptanceOfficer: { name: string; title: string };
}

const DEFAULT_SIGNATORIES: IARSignatories = {
    inspectionMembers: [
        { id: '1', name: '', role: '', committee: '' },
    ],
    conformeEndUser: { name: '', title: '' },
    acceptanceOfficer: { name: '', title: '' },
};


// --- PDF DOCUMENT COMPONENT ---
interface IARPDFProps {
    iar: VwSupplyIAR;
    items: any[];
    signatories: IARSignatories;
}

const IARPDFDocument: React.FC<IARPDFProps> = ({ iar, items, signatories }) => {
    const totalAmount = items.reduce((sum, item) => sum + ((item.itemQuantity || 0) * (item.unitCost || 0)), 0);

    return (
        <Document>
            <Page size="A4" style={pdfStyles.page} orientation="portrait">

                {/* Unified Outer Container Grid */}
                <View style={pdfStyles.mainGrid}>

                    {/* Main Identity Headers */}
                    <View style={[pdfStyles.headerContainer, { paddingTop: 10, paddingHorizontal: 10 }]}>
                        <View style={[pdfStyles.logoContainer, { top: 12, left: 15 }]}>
                            <Image src="/images/erc-logo.png" style={{ width: 34, height: 34, borderRadius: 17 }} />
                        </View>
                        <Text style={pdfStyles.repText}>Republic of the Philippines</Text>
                        <Text style={pdfStyles.ercText}>ENERGY REGULATORY COMMISSION</Text>
                        <Text style={pdfStyles.addressText}>Exquadra Tower, 1 Jade Drive, Brgy. San Antonio, Ortigas Center, Pasig City</Text>
                    </View>

                    {/* Section Header Labels */}
                    <View style={pdfStyles.titleContainer}>
                        <Text style={pdfStyles.mainTitle}>INSPECTION AND ACCEPTANCE REPORT</Text>
                    </View>
                    <View style={pdfStyles.agencySection}>
                        <Text style={pdfStyles.agencyText}>Energy Regulatory Commission</Text>
                        <Text style={pdfStyles.agencyLabel}>Agency</Text>
                    </View>

                    {/* Reference Identifiers Block */}
                    <View style={[pdfStyles.iarMetaWrapper, { paddingRight: 10, marginBottom: 0 }]}>
                        <View style={pdfStyles.iarMetaBox}>
                            <View style={pdfStyles.iarMetaRow}>
                                <Text style={pdfStyles.iarLabel}>IAR No.:</Text>
                                <Text style={pdfStyles.iarValueLine}>{iar.iarNumber}</Text>
                            </View>
                            <View style={pdfStyles.iarMetaRow}>
                                <Text style={pdfStyles.iarLabel}>Date:</Text>
                                <Text style={pdfStyles.iarValueLine}>{formatDate(iar.iarNumberDate)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Primary Logistics Mapping Row */}
                    <View style={pdfStyles.rowContainer}>
                        <View style={pdfStyles.colSupplier}>
                            <Text style={pdfStyles.labelText}>Supplier :</Text>
                            <Text style={pdfStyles.valueUnderline}>{iar.vendor?.name}</Text>
                        </View>
                        <View style={pdfStyles.colSINo}>
                            <Text style={pdfStyles.labelText}>S.I. No. :</Text>
                            <Text style={pdfStyles.valueUnderline}>{iar.iarInvoiceNumber}</Text>
                        </View>
                        <View style={pdfStyles.colSIDate}>
                            <Text style={pdfStyles.labelText}>Date :</Text>
                            <Text style={pdfStyles.valueUnderline}>{formatDate(iar.iarInvoiceNumberDate)}</Text>
                        </View>
                    </View>

                    {/* Secondary Transaction Mapping Row */}
                    <View style={pdfStyles.rowContainer}>
                        <View style={pdfStyles.colPODate}>
                            <Text style={pdfStyles.labelText}>P.O. No. :</Text>
                            <Text style={[pdfStyles.valueUnderline, { flex: 0.5 }]}>{iar.poNumber}</Text>
                            <Text style={[pdfStyles.labelText, { marginLeft: 4 }]}>Date :</Text>
                            <Text style={[pdfStyles.valueUnderline, { flex: 0.5 }]}>{formatDate(iar.poDate)}</Text>
                        </View>
                        <View style={pdfStyles.colDRNo}>
                            <Text style={pdfStyles.labelText}>D.R. No. :</Text>
                            <Text style={pdfStyles.valueUnderline}>{iar.drNumber}</Text>
                        </View>
                        <View style={pdfStyles.colDRDate}>
                            <Text style={pdfStyles.labelText}>Date :</Text>
                            <Text style={pdfStyles.valueUnderline}>{formatDate(iar.actualDeliveryDate)}</Text>
                        </View>
                    </View>

                    {/* Department Allocation Row */}
                    <View style={[pdfStyles.rowContainer, { borderBottomWidth: 1, borderBottomColor: '#000' }]}>
                        <View style={pdfStyles.colReqOffice}>
                            <Text style={pdfStyles.labelText}>Requisitioning Office :</Text>
                            <Text style={pdfStyles.valueClean}>{iar.office?.name || 'Financial and Administrative Service'}</Text>
                        </View>
                        <View style={pdfStyles.colActualDel}>
                            <Text style={pdfStyles.labelText}>Date of Actual Delivery :</Text>
                            <Text style={pdfStyles.valueUnderline}>{formatDate(iar.actualDeliveryDate)}</Text>
                        </View>
                    </View>

                    {/* Grid Core Headers */}
                    <View style={pdfStyles.tableHeaderRow}>
                        <View style={pdfStyles.wQty}><Text style={pdfStyles.textBoldCenter}>Quantity</Text></View>
                        <View style={pdfStyles.wUnit}><Text style={pdfStyles.textBoldCenter}>Unit</Text></View>
                        <View style={pdfStyles.wDesc}><Text style={pdfStyles.textBoldCenter}>Description</Text></View>
                        <View style={pdfStyles.wPrice}><Text style={pdfStyles.textBoldCenter}>Unit Price (<Text style={pdfStyles.pesoSymbol}>₱</Text>)</Text></View>
                        <View style={pdfStyles.wAmount}><Text style={pdfStyles.textBoldCenter}>Amount (<Text style={pdfStyles.pesoSymbol}>₱</Text>)</Text></View>
                    </View>

                    {/* Line Items Structural Population */}
                    {items.map((item, idx) => (
                        <View key={idx} style={pdfStyles.tableDataRow}>
                            <View style={pdfStyles.wQty}><Text style={pdfStyles.textCenter}>{item.itemQuantity ?? 0}</Text></View>
                            <View style={pdfStyles.wUnit}><Text style={pdfStyles.textCenter}>{item.measurementUnit?.name || 'pack'}</Text></View>
                            <View style={pdfStyles.wDesc}>
                                <Text style={pdfStyles.textLeft}>
                                    {item.itemDescription || ''}
                                    {item.itemSpecification ? ` (${item.itemSpecification})` : ''}
                                </Text>
                            </View>
                            <View style={pdfStyles.wPrice}><Text style={pdfStyles.textRight}><Text style={pdfStyles.pesoSymbol}>₱</Text>{formatPDFNumber(item.unitCost || 0)}</Text></View>
                            <View style={pdfStyles.wAmount}><Text style={pdfStyles.textRight}><Text style={pdfStyles.pesoSymbol}>₱</Text>{formatPDFNumber((item.itemQuantity || 0) * (item.unitCost || 0))}</Text></View>
                        </View>
                    ))}

                    {/* Nothing Follows Break Indicator Row */}
                    <View style={pdfStyles.tableDataRow}>
                        <View style={pdfStyles.wQty}><Text> </Text></View>
                        <View style={pdfStyles.wUnit}><Text> </Text></View>
                        <View style={pdfStyles.wDesc}>
                            <Text style={pdfStyles.nothingFollows}>***nothing follows***</Text>
                        </View>
                        <View style={pdfStyles.wPrice}><Text> </Text></View>
                        <View style={pdfStyles.wAmount}><Text> </Text></View>
                    </View>

                    {/* Financial Aggregate Aggregation Field Summary */}
                    <View style={pdfStyles.totalSummaryRow}>
                        <View style={pdfStyles.totalSpacer}><Text> </Text></View>
                        <View style={pdfStyles.totalValCell}>
                            <Text style={[pdfStyles.textRight, { fontFamily: 'Times-Bold' }]}><Text style={pdfStyles.pesoSymbol}>₱</Text>{formatPDFNumber(totalAmount)}</Text>
                        </View>
                    </View>

                    {/* Split Panel Architecture block (Inspection vs Acceptance workflows) */}
                    <View style={pdfStyles.splitWrapperRow}>

                        {/* LEFT SECTION: INSPECTION */}
                        <View style={pdfStyles.splitPaneLeft}>
                            <View style={pdfStyles.innerHeaderRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={pdfStyles.innerLineLabel}>Date Inspected: </Text>
                                    <Text style={pdfStyles.innerLineValue}>
                                        {iar.actualDeliveryDate ? formatDate(iar.actualDeliveryDate) : ' '}
                                    </Text>
                                </View>
                            </View>

                            <Text style={pdfStyles.sectionTitleText}>INSPECTION</Text>

                            <View style={pdfStyles.checkboxGroup}>
                                <View style={pdfStyles.checkboxBox}>
                                    <Text style={pdfStyles.checkboxMark}>✓</Text>
                                </View>
                                <Text style={pdfStyles.checkboxLabel}>Inspected, verified and found in order as to quantity and specifications</Text>
                            </View>

                            <Text style={pdfStyles.signSectionLabel}>Inspected by:</Text>

                            {signatories.inspectionMembers.map((member) => (
                                <View key={member.id} style={pdfStyles.centerSignBlock}>
                                    <View style={pdfStyles.horizontalLine}></View>
                                    <Text style={pdfStyles.textSignName}>{member.name}</Text>
                                    <Text style={pdfStyles.textSignTitle}>{member.role}</Text>
                                    <Text style={pdfStyles.textSignTitle}>{member.committee}</Text>
                                </View>
                            ))}

                            <View style={pdfStyles.conformeWrapper}>
                                <Text style={pdfStyles.conformeInlineLabel}>Conforme:</Text>
                                <View style={pdfStyles.conformeLineBlock}>
                                    <View style={pdfStyles.horizontalLine}></View>
                                    <Text style={pdfStyles.textSignName}>{signatories.conformeEndUser.name}</Text>
                                    <Text style={pdfStyles.textSignTitle}>{signatories.conformeEndUser.title}</Text>
                                </View>
                            </View>
                        </View>

                        {/* RIGHT SECTION: ACCEPTANCE */}
                        <View style={pdfStyles.splitPaneRight}>
                            <View style={pdfStyles.innerHeaderRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={pdfStyles.innerLineLabel}>Date Accepted: </Text>
                                    <Text style={pdfStyles.innerLineValue}>
                                        {iar.iarNumberDate ? formatDate(iar.iarNumberDate) : ' '}
                                    </Text>
                                </View>
                            </View>

                            <Text style={pdfStyles.sectionTitleText}>ACCEPTANCE</Text>

                            <View style={pdfStyles.checkboxGroup}>
                                <View style={pdfStyles.checkboxBox}>
                                    <Text style={pdfStyles.checkboxMark}>✓</Text>
                                </View>
                                <Text style={pdfStyles.checkboxLabel}>Complete</Text>
                            </View>

                            <View style={[pdfStyles.checkboxGroup, { marginTop: 2 }]}>
                                <View style={pdfStyles.checkboxBox}></View>
                                <Text style={pdfStyles.checkboxLabel}>Partial (Pls. specify) __________________</Text>
                            </View>

                            <View style={pdfStyles.bottomSignBlock}>
                                <View style={pdfStyles.horizontalLine}></View>
                                <Text style={pdfStyles.textSignName}>{signatories.acceptanceOfficer.name}</Text>
                                <Text style={pdfStyles.textSignTitle}>{signatories.acceptanceOfficer.title}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Supplementary Remarks Terminal Panel Field */}
                    <View style={pdfStyles.footerRemarksPane}>
                        <Text style={pdfStyles.footerRemarksLabel}>REMARKS:</Text>
                    </View>

                </View>
            </Page>
        </Document>
    );
};

// --- SIGNATORY MODAL COMPONENT ---
interface IARSignatoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (signatories: IARSignatories) => void;
    actionLabel: string;
}

const IARSignatoryModal: React.FC<IARSignatoryModalProps> = ({ isOpen, onClose, onConfirm, actionLabel }) => {
    const [signatories, setSignatories] = useState<IARSignatories>(() =>
        JSON.parse(JSON.stringify(DEFAULT_SIGNATORIES))
    );
    const [templates, setTemplates] = useState<IARSignatoryTemplateDto[]>([]);
    const [templateName, setTemplateName] = useState('');
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [templateLoading, setTemplateLoading] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
    const [employees, setEmployees] = useState<ApiEmployee[]>([]);
    const [memberEmployeeIds, setMemberEmployeeIds] = useState<Record<string, number | null>>({});
    const [conformeEmployeeId, setConformeEmployeeId] = useState<number | null>(null);
    const [acceptanceEmployeeId, setAcceptanceEmployeeId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            setSignatories(JSON.parse(JSON.stringify(DEFAULT_SIGNATORIES)));
            setTemplateName('');
            setSavingTemplate(false);
            setTemplateLoading(true);
            setEditingTemplateId(null);
            setMemberEmployeeIds({});
            setConformeEmployeeId(null);
            setAcceptanceEmployeeId(null);
            getIARSignatoryTemplates()
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
        const saved = await saveIARSignatoryTemplate(templateName.trim(), signatories, editingTemplateId ?? 0);
        if (saved) {
            if (editingTemplateId) {
                setTemplates(prev => prev.map(t => t.id === editingTemplateId ? saved : t));
                setEditingTemplateId(null);
                toast.success('Template updated');
            } else {
                setTemplates(prev => [saved, ...prev]);
                toast.success('Template saved');
            }
            setTemplateName('');
            setSavingTemplate(false);
        } else {
            toast.error('Failed to save template');
        }
    };

    const handleLoadTemplate = (tpl: IARSignatoryTemplateDto) => {
        if (tpl.signatories) {
            setSignatories(JSON.parse(JSON.stringify(tpl.signatories)));
            setMemberEmployeeIds({});
            setConformeEmployeeId(null);
            setAcceptanceEmployeeId(null);
            setEditingTemplateId(null);
            setTemplateName('');
            setSavingTemplate(false);
        }
    };

    const handleEditTemplate = (tpl: IARSignatoryTemplateDto) => {
        if (tpl.signatories) {
            setSignatories(JSON.parse(JSON.stringify(tpl.signatories)));
            setMemberEmployeeIds({});
            setConformeEmployeeId(null);
            setAcceptanceEmployeeId(null);
        }
        setEditingTemplateId(tpl.id);
        setTemplateName(tpl.name);
        setSavingTemplate(true);
    };

    const handleDeleteTemplate = async (id: number) => {
        const ok = await deleteIARSignatoryTemplate(id);
        if (ok) {
            setTemplates(prev => prev.filter(t => t.id !== id));
            toast.success('Template deleted');
        } else {
            toast.error('Failed to delete template');
        }
    };

    const updateMember = (id: string, field: keyof IARInspectionSignatory, value: string) => {
        setSignatories(prev => ({
            ...prev,
            inspectionMembers: prev.inspectionMembers.map(m =>
                m.id === id ? { ...m, [field]: value } : m
            )
        }));
    };

    const addMember = () => {
        const newId = Date.now().toString();
        setSignatories(prev => ({
            ...prev,
            inspectionMembers: [
                ...prev.inspectionMembers,
                { id: newId, name: '', role: '', committee: '' }
            ]
        }));
    };

    const removeMember = (id: string) => {
        setSignatories(prev => ({
            ...prev,
            inspectionMembers: prev.inspectionMembers.filter(m => m.id !== id)
        }));
        setMemberEmployeeIds(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const handleSelectMemberEmployee = (memberId: string, employeeId: number | null) => {
        if (employeeId === null) {
            setMemberEmployeeIds(prev => ({ ...prev, [memberId]: null }));
            updateMember(memberId, 'name', '');
            return;
        }
        const emp = employees.find(e => e.id === employeeId);
        if (emp) {
            updateMember(memberId, 'name', `${emp.firstName} ${emp.lastName}`.toUpperCase());
            if (emp.positionName) {
                updateMember(memberId, 'role', emp.positionName);
            }
        }
        setMemberEmployeeIds(prev => ({ ...prev, [memberId]: employeeId }));
    };

    const handleSelectConformeEmployee = (employeeId: number | null) => {
        if (employeeId === null) {
            setConformeEmployeeId(null);
            setSignatories(prev => ({ ...prev, conformeEndUser: { ...prev.conformeEndUser, name: '' } }));
            return;
        }
        const emp = employees.find(e => e.id === employeeId);
        if (emp) {
            setSignatories(prev => ({
                ...prev,
                conformeEndUser: {
                    ...prev.conformeEndUser,
                    name: `${emp.firstName} ${emp.lastName}`.toUpperCase(),
                    title: emp.positionName || prev.conformeEndUser.title
                }
            }));
        }
        setConformeEmployeeId(employeeId);
    };

    const handleSelectAcceptanceEmployee = (employeeId: number | null) => {
        if (employeeId === null) {
            setAcceptanceEmployeeId(null);
            setSignatories(prev => ({ ...prev, acceptanceOfficer: { ...prev.acceptanceOfficer, name: '' } }));
            return;
        }
        const emp = employees.find(e => e.id === employeeId);
        if (emp) {
            setSignatories(prev => ({
                ...prev,
                acceptanceOfficer: {
                    ...prev.acceptanceOfficer,
                    name: `${emp.firstName} ${emp.lastName}`.toUpperCase(),
                    title: emp.positionName || prev.acceptanceOfficer.title
                }
            }));
        }
        setAcceptanceEmployeeId(employeeId);
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
                        Set the names and roles that will appear on the printed IAR.
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
                                    placeholder="Template name (e.g. Standard Committee)"
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

                    {/* INSPECTION SECTION */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                <UserCheck className="w-4 h-4 text-indigo-500" />
                                Inspection Signatories
                            </h3>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                onClick={addMember}
                            >
                                <Plus className="w-3 h-3" /> Add Member
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {signatories.inspectionMembers.map((member, idx) => (
                                <div key={member.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-slate-500">Signatory #{idx + 1}</span>
                                        {signatories.inspectionMembers.length > 1 && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => removeMember(member.id)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div>
                                            <Label className="text-xs text-slate-600 mb-1 block">Full Name</Label>
                                            <EmployeeSelector
                                                employees={employees}
                                                value={memberEmployeeIds[member.id] || null}
                                                onSelect={(employeeId) => handleSelectMemberEmployee(member.id, employeeId as number | null)}
                                                displayValue={member.name}
                                                placeholder="Search employee..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-xs text-slate-600 mb-1 block">Role/Position</Label>
                                                <Input
                                                    className="h-8 text-sm"
                                                    value={member.role}
                                                    onChange={(e) => updateMember(member.id, 'role', e.target.value)}
                                                    placeholder="e.g. Chairperson"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-slate-600 mb-1 block">Committee</Label>
                                                <Input
                                                    className="h-8 text-sm"
                                                    value={member.committee}
                                                    onChange={(e) => updateMember(member.id, 'committee', e.target.value)}
                                                    placeholder="e.g. Technical Property..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CONFORME / END-USER */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800 mb-3">Conforme (End-user)</h3>
                        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs text-slate-600 mb-1 block">Full Name</Label>
                                <EmployeeSelector
                                    employees={employees}
                                    value={conformeEmployeeId}
                                    onSelect={(employeeId) => handleSelectConformeEmployee(employeeId as number | null)}
                                    displayValue={signatories.conformeEndUser.name}
                                    placeholder="Search employee..."
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-slate-600 mb-1 block">Title</Label>
                                <Input
                                    className="h-8 text-sm"
                                    value={signatories.conformeEndUser.title}
                                    onChange={(e) => setSignatories(prev => ({ ...prev, conformeEndUser: { ...prev.conformeEndUser, title: e.target.value } }))}
                                    placeholder="e.g. End-user"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ACCEPTANCE OFFICER */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800 mb-3">Acceptance Officer</h3>
                        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs text-slate-600 mb-1 block">Full Name</Label>
                                <EmployeeSelector
                                    employees={employees}
                                    value={acceptanceEmployeeId}
                                    onSelect={(employeeId) => handleSelectAcceptanceEmployee(employeeId as number | null)}
                                    displayValue={signatories.acceptanceOfficer.name}
                                    placeholder="Search employee..."
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-slate-600 mb-1 block">Title/Position</Label>
                                <Input
                                    className="h-8 text-sm"
                                    value={signatories.acceptanceOfficer.title}
                                    onChange={(e) => setSignatories(prev => ({ ...prev, acceptanceOfficer: { ...prev.acceptanceOfficer, title: e.target.value } }))}
                                    placeholder="e.g. AO III"
                                />
                            </div>
                        </div>
                    </div>

                </div>

                <DialogFooter className="border-t border-slate-200 p-4 bg-slate-50/50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => onConfirm(signatories)}
                        disabled={signatories.inspectionMembers.some(m => !m.name.trim()) || !signatories.conformeEndUser.name.trim() || !signatories.acceptanceOfficer.name.trim()}
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
interface IARReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const IARReportModal = ({ isOpen, onClose }: IARReportModalProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearchQuery, setActiveSearchQuery] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [hasSearched, setHasSearched] = useState(false);

    const [iarList, setIarList] = useState<VwSupplyIAR[]>([]);
    const [deliveryRecords, setDeliveryRecords] = useState<VwDeliveryRecord[]>([]);
    const [selectedIar, setSelectedIar] = useState<VwSupplyIAR | null>(null);
    const [selectedDelivery, setSelectedDelivery] = useState<VwDeliveryRecord | null>(null);

    const [loading, setLoading] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const [signatoryModalOpen, setSignatoryModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<'print' | 'download' | null>(null);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setActiveSearchQuery('');
            setHasSearched(true);
            setSelectedIar(null);
            setSelectedDelivery(null);

            setLoading(true);
            Promise.all([
                getSupplyIARs(1, 200, ''),
                getDeliveryRecords(1, 200, '', 'all')
            ])
                .then(([iarResult, deliveryResult]) => {
                    const iarsWithDR = iarResult.items.filter(iar => iar.drNumber !== undefined && iar.drNumber !== null && String(iar.drNumber).trim() !== '');
                    setIarList(iarsWithDR);
                    setDeliveryRecords(deliveryResult.items);
                })
                .catch(() => {
                    toast.error("Failed to load initial report records.");
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [isOpen]);

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setHasSearched(true);
        setActiveSearchQuery(searchTerm);
        setSelectedIar(null);
        setSelectedDelivery(null);
        setLoading(true);

        try {
            const [iarResult, deliveryResult] = await Promise.all([
                getSupplyIARs(1, 200, searchTerm),
                getDeliveryRecords(1, 200, searchTerm, 'all')
            ]);
            const iarsWithDR = iarResult.items.filter(iar => iar.drNumber !== undefined && iar.drNumber !== null && String(iar.drNumber).trim() !== '');
            setIarList(iarsWithDR);
            setDeliveryRecords(deliveryResult.items);
        } catch (error) {
            toast.error("Failed to load IAR records.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRow = async (iar: VwSupplyIAR) => {
        if (selectedIar?.id === iar.id) {
            setSelectedIar(null);
            setSelectedDelivery(null);
            return;
        }

        setSelectedIar(iar);

        const match = deliveryRecords.find(dr => dr.id === iar.recordId || dr.drNumber?.toString() === iar.drNumber?.toString());

        if (match && match.items && match.items.length > 0) {
            setSelectedDelivery(match);
        } else {
            setIsPreviewLoading(true);
            try {
                if (iar.recordId) {
                    const delivery = await getDeliveryRecordById(iar.recordId);
                    setSelectedDelivery(delivery);
                } else {
                    setSelectedDelivery(null);
                    toast.error("No linked delivery record details found.");
                }
            } catch (error) {
                toast.error("Failed to load delivery record items.");
            } finally {
                setIsPreviewLoading(false);
            }
        }
    };

    const handleExportPDF = () => {
        if (!selectedIar || isPreviewLoading || !selectedDelivery) return;
        setPendingAction('download');
        setSignatoryModalOpen(true);
    };

    const handlePrintPDF = () => {
        if (!selectedIar || isPreviewLoading || !selectedDelivery) return;
        setPendingAction('print');
        setSignatoryModalOpen(true);
    };

    const handleSignatoryConfirm = async (signatories: IARSignatories) => {
        setSignatoryModalOpen(false);
        if (!selectedIar || !selectedDelivery) return;
        setIsGeneratingPDF(true);

        try {
            const blob = await pdf(
                <IARPDFDocument iar={selectedIar} items={selectedDelivery.items || []} signatories={signatories} />
            ).toBlob();

            const url = URL.createObjectURL(blob);

            if (pendingAction === 'download') {
                const a = document.createElement('a');
                a.href = url;
                a.download = `IAR_${selectedIar.iarNumber}.pdf`;
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
        <IARSignatoryModal
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
                                <ClipboardCheck className="w-6 h-6 text-indigo-600" />
                                Inspection & Acceptance Report (IAR)
                            </DialogTitle>
                            <DialogDescription className="mt-1.5 text-slate-500">
                                Search and select an IAR record below to view details and generate the official PDF report.
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="shadow-sm font-medium transition-all"
                                disabled={!selectedIar || isGeneratingPDF || isPreviewLoading || !selectedDelivery}
                                onClick={handlePrintPDF}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print Document
                            </Button>
                            <Button
                                className="shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all"
                                disabled={!selectedIar || isGeneratingPDF || isPreviewLoading || !selectedDelivery}
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
                                placeholder="Search by IAR Number, DR Number, or Supplier..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-white border-slate-300 focus-visible:ring-indigo-500 shadow-sm"
                                autoFocus
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
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
                                    <TableHead className="w-[180px] font-semibold text-slate-700">IAR Number</TableHead>
                                    <TableHead className="w-[180px] font-semibold text-slate-700">Linked DR Number</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Supplier</TableHead>
                                    <TableHead className="w-[180px] font-semibold text-slate-700 text-right">Inspection Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={`skeleton-${index}`}>
                                            {Array.from({ length: 6 }).map((_, colIndex) => (
                                                <TableCell key={`skel-col-${colIndex}`}>
                                                    <div className="h-4 bg-slate-100 rounded animate-pulse w-full"></div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : iarList.length > 0 ? (
                                    iarList.map((iar, index) => {
                                        const isSelected = selectedIar?.id === iar.id;

                                        return (
                                            <React.Fragment key={index}>
                                                <TableRow
                                                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/60 hover:bg-indigo-50/80' : 'hover:bg-slate-50'}`}
                                                    onClick={() => handleSelectRow(iar)}
                                                >
                                                    <TableCell onClick={(e) => e.stopPropagation()} className="px-4 text-center">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => handleSelectRow(iar)}
                                                            className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600 pointer-events-none">
                                                            {isSelected ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-slate-900">{iar.iarNumber}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5 font-medium text-indigo-700">
                                                            <Package className="h-3.5 w-3.5 text-slate-400" />
                                                            {iar.drNumber}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 truncate max-w-[250px]" title={iar.vendor?.name}>
                                                        {iar.vendor?.name || '—'}
                                                    </TableCell>
                                                    <TableCell className="text-right text-slate-700">{iar.actualDeliveryDate ? formatDate(iar.actualDeliveryDate) : '—'}</TableCell>
                                                </TableRow>

                                                {isSelected && (
                                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                                        <TableCell colSpan={6} className="p-0 border-b">
                                                            <div className="bg-slate-50/80 border-l-[3px] border-indigo-500 shadow-inner px-8 py-5 max-h-[320px] overflow-y-auto">
                                                                {isPreviewLoading ? (
                                                                    <div className="flex flex-col items-center justify-center py-6 text-indigo-600">
                                                                        <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                                                        <p className="text-sm font-medium">Fetching delivered items list...</p>
                                                                    </div>
                                                                ) : selectedDelivery && selectedDelivery.items && selectedDelivery.items.length > 0 ? (
                                                                    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                                                                        <Table>
                                                                            <TableHeader className="bg-slate-100/50">
                                                                                <TableRow className="hover:bg-transparent">
                                                                                    <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600">Stock/Prop No.</TableHead>
                                                                                    <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600">Description</TableHead>
                                                                                    <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600">Unit</TableHead>
                                                                                    <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600 text-center">Delivered Qty</TableHead>
                                                                                    <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600 text-right">Unit Cost</TableHead>
                                                                                    <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600 text-right">Total Cost</TableHead>
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                                {selectedDelivery.items.map((item, idx) => (
                                                                                    <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                                                                                        <TableCell className="py-2.5 text-xs font-medium text-slate-700">{item.code || '—'}</TableCell>
                                                                                        <TableCell className="py-2.5 text-xs text-slate-800">
                                                                                            <span className="font-semibold">{item.itemDescription}</span>
                                                                                            {item.itemSpecification && <p className="text-[10px] text-slate-500 italic mt-0.5">Specs: {item.itemSpecification}</p>}
                                                                                        </TableCell>
                                                                                        <TableCell className="py-2.5 text-xs text-slate-600">{item.measurementUnit?.name || '—'}</TableCell>
                                                                                        <TableCell className="py-2.5 text-xs text-center font-semibold text-indigo-600">{item.itemQuantity}</TableCell>
                                                                                        <TableCell className="py-2.5 text-xs text-right font-medium text-slate-700">{formatCurrency(item.unitCost || 0)}</TableCell>
                                                                                        <TableCell className="py-2.5 text-xs text-right font-bold text-slate-900">{formatCurrency((item.itemQuantity || 0) * (item.unitCost || 0))}</TableCell>
                                                                                    </TableRow>
                                                                                ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center py-6 text-slate-500 bg-white rounded-lg border border-dashed border-slate-200">
                                                                        <FileText className="w-8 h-8 text-slate-300 mb-2" />
                                                                        <p className="text-sm font-medium">No items found for this linked Delivery Record.</p>
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
                                                <p className="text-sm">We couldn't find any linked IAR records matching "{activeSearchQuery}".</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
        </>
    );
};