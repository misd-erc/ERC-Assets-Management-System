import React, { useCallback, useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ppeApi } from '@/api/asset/ppe';
import { getConditions } from '@/api/asset/inventoryApi';
import { getOffices } from '@/api/office-management/officeApi';
import { getEmployeeList } from '@/api/office-management/employeeApi';
import { VwOffice, EmployeeDetail } from '@/types/office';
import { getAuthParams } from '@/utils/auth';
import { toast } from 'sonner';
import { Loader2, Printer, Download, Search, AlertTriangle, Check, ChevronsUpDown } from 'lucide-react';
import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
    pdf,
} from '@react-pdf/renderer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RLSDDPModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type PropertyStatus = 'Lost' | 'Stolen' | 'Damaged' | 'Destroyed';

interface RLSDDPRow {
    propertyNo: string;
    description: string;
    acquisitionCost: string;
}


// ─── Utilities ────────────────────────────────────────────────────────────────

const ENTITY_NAME = 'ENERGY REGULATORY COMMISSION';
const FUND_CLUSTER = 'Regular Agency Fund';

const formatCurrency = (val?: number | null): string => {
    if (val === undefined || val === null || isNaN(val)) return '';
    return val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDateDisplay = (value?: string): string => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
};

const asStr = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val === '-' ? '' : val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object' && val !== null) {
        const obj = val as Record<string, unknown>;
        return String(obj.name ?? obj.description ?? obj.code ?? '');
    }
    return String(val);
};

const buildRows = (assets: any[]): RLSDDPRow[] =>
    assets.map((a) => ({
        propertyNo: asStr(a.property_number ?? a.propertyNumber),
        description: asStr(a.description),
        acquisitionCost: formatCurrency(Number(a.unit_value ?? a.unitValue ?? 0)),
    }));

// ─── PDF Styles ────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
    page: {
        paddingTop: 20,
        paddingHorizontal: 30,
        paddingBottom: 20,
        fontSize: 9,
        fontFamily: 'Helvetica',
    },
    appendix: { textAlign: 'right', fontSize: 8, marginBottom: 6 },
    title: {
        textAlign: 'center',
        fontSize: 13,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    // Meta section
    metaSection: { marginBottom: 8 },
    metaRow: { flexDirection: 'row', marginBottom: 3 },
    metaCol: { flex: 1 },
    metaText: { fontSize: 8.5 },
    metaLabel: { fontFamily: 'Helvetica-Bold', fontSize: 8.5 },
    // Status box
    statusSection: { marginBottom: 10 },
    statusTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
    statusRow: { flexDirection: 'row', gap: 20 },
    statusItem: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 16 },
    checkbox: {
        width: 10,
        height: 10,
        borderWidth: 1,
        borderColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 3,
    },
    checkmark: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
    statusLabel: { fontSize: 8.5 },
    // Table
    table: { borderWidth: 1, borderColor: '#000', marginTop: 8, marginBottom: 8 },
    tableRow: { flexDirection: 'row' },
    headerRow: { backgroundColor: '#e5e7eb' },
    borderRight: { borderRightWidth: 1, borderRightColor: '#000' },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: '#000' },
    cell: { paddingVertical: 3, paddingHorizontal: 3, justifyContent: 'center' },
    headerText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
    cellText: { fontSize: 7.5, textAlign: 'center' },
    cellTextLeft: { fontSize: 7.5, textAlign: 'left' },
    colNo: { width: '6%' },
    colPropNo: { width: '20%' },
    colDesc: { width: '52%' },
    colCost: { width: '22%' },
    // Circumstances
    circSection: { marginTop: 6, marginBottom: 10 },
    circLabel: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
    circLine: { borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 6, paddingBottom: 2 },
    circText: { fontSize: 8.5 },
    // Certification
    certText: { fontSize: 8.5, marginBottom: 10 },
    // Signatures
    sigRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    sigCol: { width: '45%' },
    sigLabel: { fontSize: 8.5, marginBottom: 14 },
    sigLine: {
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 2,
        textAlign: 'center',
        fontSize: 7.5,
    },
});

// ─── PDF Document ──────────────────────────────────────────────────────────────

interface RLSDDPDocProps {
    rows: RLSDDPRow[];
    entityName: string;
    fundCluster: string;
    department: string;
    rlsddpNo: string;
    rlsddpDate: string;
    accountableOfficer: string;
    designation: string;
    parNo: string;
    parDate: string;
    policeNotified: boolean;
    policeStation: string;
    policeDate: string;
    propertyStatus: PropertyStatus;
    circumstances: string;
}

function RLSDDPDocument({
    rows,
    entityName,
    fundCluster,
    department,
    rlsddpNo,
    rlsddpDate,
    accountableOfficer,
    designation,
    parNo,
    parDate,
    policeNotified,
    policeStation,
    policeDate,
    propertyStatus,
    circumstances,
}: RLSDDPDocProps) {
    const statuses: PropertyStatus[] = ['Lost', 'Stolen', 'Damaged', 'Destroyed'];

    return (
        <Document>
            <Page size="LEGAL" orientation="portrait" style={S.page}>
                <Text style={S.appendix}>Appendix 75</Text>
                <Text style={S.title}>Report of Lost, Stolen, Damaged or Destroyed Property</Text>

                {/* Meta Section */}
                <View style={S.metaSection}>
                    <View style={S.metaRow}>
                        <View style={S.metaCol}>
                            <Text style={S.metaText}>
                                <Text style={S.metaLabel}>Entity Name: </Text>
                                {entityName}
                            </Text>
                        </View>
                        <View style={S.metaCol}>
                            <Text style={S.metaText}>
                                <Text style={S.metaLabel}>Fund Cluster: </Text>
                                {fundCluster}
                            </Text>
                        </View>
                    </View>
                    <View style={S.metaRow}>
                        <View style={S.metaCol}>
                            <Text style={S.metaText}>
                                <Text style={S.metaLabel}>Department/Office: </Text>
                                {department}
                            </Text>
                        </View>
                        <View style={S.metaCol}>
                            <Text style={S.metaText}>
                                <Text style={S.metaLabel}>RLSDDP No.: </Text>
                                {rlsddpNo}
                            </Text>
                        </View>
                    </View>
                    <View style={S.metaRow}>
                        <View style={S.metaCol}>
                            <Text style={S.metaText}>
                                <Text style={S.metaLabel}>Accountable Officer: </Text>
                                {accountableOfficer}
                            </Text>
                        </View>
                        <View style={S.metaCol}>
                            <Text style={S.metaText}>
                                <Text style={S.metaLabel}>RLSDDP Date: </Text>
                                {rlsddpDate}
                            </Text>
                        </View>
                    </View>
                    <View style={S.metaRow}>
                        <View style={S.metaCol}>
                            <Text style={S.metaText}>
                                <Text style={S.metaLabel}>Designation: </Text>
                                {designation}
                            </Text>
                        </View>
                        <View style={S.metaCol}>
                            <Text style={S.metaText}>
                                <Text style={S.metaLabel}>PAR No.: </Text>
                                {parNo}
                            </Text>
                        </View>
                    </View>
                    <View style={S.metaRow}>
                        <View style={[S.metaCol, { flexDirection: 'row', gap: 8 }]}>
                            <Text style={S.metaText}>
                                <Text style={S.metaLabel}>Police Notified: </Text>
                                {policeNotified ? 'Yes' : 'No'}
                            </Text>
                            {policeNotified && (
                                <Text style={S.metaText}>
                                    <Text style={S.metaLabel}>Police Station: </Text>
                                    {policeStation}
                                </Text>
                            )}
                        </View>
                        <View style={S.metaCol}>
                            <Text style={S.metaText}>
                                <Text style={S.metaLabel}>PAR Date: </Text>
                                {parDate}
                            </Text>
                        </View>
                    </View>
                    {policeNotified && (
                        <View style={S.metaRow}>
                            <View style={S.metaCol}>
                                <Text style={S.metaText}>
                                    <Text style={S.metaLabel}>Date: </Text>
                                    {policeDate}
                                </Text>
                            </View>
                            <View style={S.metaCol} />
                        </View>
                    )}
                </View>

                {/* Status of Property */}
                <View style={S.statusSection}>
                    <Text style={S.statusTitle}>Status of Property: (check applicable box)</Text>
                    <View style={S.statusRow}>
                        {statuses.map((s) => (
                            <View key={s} style={S.statusItem}>
                                <View style={S.checkbox}>
                                    {propertyStatus === s && <Text style={S.checkmark}>✓</Text>}
                                </View>
                                <Text style={S.statusLabel}>{s}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Table */}
                <View style={S.table}>
                    <View style={[S.tableRow, S.headerRow, S.borderBottom]}>
                        <View style={[S.cell, S.colNo, S.borderRight]}>
                            <Text style={S.headerText}>No.</Text>
                        </View>
                        <View style={[S.cell, S.colPropNo, S.borderRight]}>
                            <Text style={S.headerText}>Property No.</Text>
                        </View>
                        <View style={[S.cell, S.colDesc, S.borderRight]}>
                            <Text style={S.headerText}>Description</Text>
                        </View>
                        <View style={[S.cell, S.colCost]}>
                            <Text style={S.headerText}>Acquisition Cost</Text>
                        </View>
                    </View>

                    {rows.map((row, idx) => (
                        <View
                            key={idx}
                            style={[S.tableRow, idx < rows.length - 1 ? S.borderBottom : {}]}
                        >
                            <View style={[S.cell, S.colNo, S.borderRight]}>
                                <Text style={S.cellText}>{idx + 1}</Text>
                            </View>
                            <View style={[S.cell, S.colPropNo, S.borderRight]}>
                                <Text style={S.cellTextLeft}>{row.propertyNo}</Text>
                            </View>
                            <View style={[S.cell, S.colDesc, S.borderRight]}>
                                <Text style={S.cellTextLeft}>{row.description}</Text>
                            </View>
                            <View style={[S.cell, S.colCost]}>
                                <Text style={S.cellText}>{row.acquisitionCost}</Text>
                            </View>
                        </View>
                    ))}

                    {rows.length === 0 && (
                        <View style={S.tableRow}>
                            <View style={[S.cell, { width: '100%' }]}>
                                <Text style={S.cellText}> </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Circumstances */}
                <View style={S.circSection}>
                    <Text style={S.circLabel}>Circumstances:</Text>
                    {circumstances ? (
                        <Text style={S.circText}>{circumstances}</Text>
                    ) : (
                        <>
                            <View style={S.circLine} />
                            <View style={S.circLine} />
                            <View style={S.circLine} />
                            <View style={S.circLine} />
                        </>
                    )}
                </View>

                {/* Certification */}
                <Text style={S.certText}>
                    I hereby certify that the item/s and circumstances stated above are true and correct.
                </Text>

                {/* Signatures */}
                <View style={S.sigRow}>
                    <View style={S.sigCol}>
                        <Text style={S.sigLine}>Signature over Printed Name of the Accountable Officer</Text>
                    </View>
                    <View style={{ width: '10%' }} />
                    <View style={S.sigCol}>
                        <Text style={[S.sigLabel, { marginBottom: 0 }]}>Noted by:</Text>
                        <Text style={S.sigLine}>
                            Signature over Printed Name of the Immediate Supervisor
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function RLSDDPModal({ isOpen, onClose }: RLSDDPModalProps) {
    const [loadingData, setLoadingData] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const [offices, setOffices] = useState<VwOffice[]>([]);
    const [conditions, setConditions] = useState<string[]>([]);
    const [employees, setEmployees] = useState<EmployeeDetail[]>([]);
    const [employeeOpen, setEmployeeOpen] = useState(false);

    // Filter fields
    const [officeId, setOfficeId] = useState<string>('all');
    const [condition, setCondition] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Header form fields
    const [entityName, setEntityName] = useState(ENTITY_NAME);
    const [fundCluster, setFundCluster] = useState(FUND_CLUSTER);
    const [department, setDepartment] = useState('');
    const [rlsddpNo, setRlsddpNo] = useState('');
    const [rlsddpDate, setRlsddpDate] = useState('');
    const [accountableOfficer, setAccountableOfficer] = useState('');
    const [designation, setDesignation] = useState('');
    const [parNo, setParNo] = useState('');
    const [parDate, setParDate] = useState('');
    const [policeNotified, setPoliceNotified] = useState(false);
    const [policeStation, setPoliceStation] = useState('');
    const [policeDate, setPoliceDate] = useState('');
    const [propertyStatus, setPropertyStatus] = useState<PropertyStatus>('Lost');
    const [circumstances, setCircumstances] = useState('');

    const [assets, setAssets] = useState<any[]>([]);
    const [rows, setRows] = useState<RLSDDPRow[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [pdfUrl, setPdfUrl] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        getOffices().then(setOffices);
        getConditions().then(setConditions);
        getEmployeeList().then(setEmployees);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setHasSearched(false);
            setAssets([]);
            setRows([]);
            setSelectedIndices(new Set());
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
            setPdfUrl('');
        }
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    const triggerPdfBuild = useCallback(
        (builtRows: RLSDDPRow[]) => {
            setGeneratingPdf(true);
            pdf(
                <RLSDDPDocument
                    rows={builtRows}
                    entityName={entityName}
                    fundCluster={fundCluster}
                    department={department}
                    rlsddpNo={rlsddpNo}
                    rlsddpDate={rlsddpDate ? formatDateDisplay(rlsddpDate) : ''}
                    accountableOfficer={accountableOfficer}
                    designation={designation}
                    parNo={parNo}
                    parDate={parDate ? formatDateDisplay(parDate) : ''}
                    policeNotified={policeNotified}
                    policeStation={policeStation}
                    policeDate={policeDate ? formatDateDisplay(policeDate) : ''}
                    propertyStatus={propertyStatus}
                    circumstances={circumstances}
                />
            )
                .toBlob()
                .then((blob) => {
                    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
                    setPdfUrl(URL.createObjectURL(blob));
                })
                .catch(() => toast.error('Failed to generate PDF'))
                .finally(() => setGeneratingPdf(false));
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            entityName, fundCluster, department, rlsddpNo, rlsddpDate,
            accountableOfficer, designation, parNo, parDate,
            policeNotified, policeStation, policeDate, propertyStatus, circumstances,
        ]
    );

    const handleFetch = useCallback(async () => {
        const { systemUserId, sessionKey } = getAuthParams();
        setLoadingData(true);
        setHasSearched(true);
        setRows([]);
        setAssets([]);
        setPdfUrl('');
        try {
            const result = await ppeApi.list({
                PageNumber: 1,
                PageSize: 9999,
                ActionBySystemUserId: String(systemUserId),
                SessionKey: sessionKey,
                GroupName: 'PPE',
                ...(officeId !== 'all' ? { OfficeId: Number(officeId) } : {}),
                ...(condition !== 'all' ? { Condition: condition } : {}),
                ...(startDate ? { StartDate: startDate } : {}),
                ...(endDate ? { EndDate: endDate } : {}),
            });

            if (!result.items.length) {
                toast.error('No PPE assets found for the selected criteria');
                return;
            }

            const builtRows = buildRows(result.items);
            const allIndices = new Set(builtRows.map((_, i) => i));
            setAssets(result.items);
            setRows(builtRows);
            setSelectedIndices(allIndices);
            triggerPdfBuild(builtRows);
        } catch {
            toast.error('Failed to fetch PPE data');
        } finally {
            setLoadingData(false);
        }
    }, [officeId, condition, startDate, endDate, triggerPdfBuild]);

    // Rebuild PDF whenever header fields change (if rows already loaded)
    useEffect(() => {
        if (!rows.length) return;
        triggerPdfBuild(rows.filter((_, i) => selectedIndices.has(i)));
    }, [
        entityName, fundCluster, department, rlsddpNo, rlsddpDate,
        accountableOfficer, designation, parNo, parDate,
        policeNotified, policeStation, policeDate, propertyStatus, circumstances,
    ]); // eslint-disable-line react-hooks/exhaustive-deps

    // Rebuild PDF whenever selection changes
    useEffect(() => {
        if (!rows.length) return;
        triggerPdfBuild(rows.filter((_, i) => selectedIndices.has(i)));
    }, [selectedIndices]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDownload = () => {
        if (!pdfUrl) return;
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = `RLSDDP_${rlsddpNo || Date.now()}.pdf`;
        a.click();
    };

    const handlePrint = () => {
        if (!pdfUrl) return;
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;';
        iframe.src = pdfUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => document.body.removeChild(iframe), 60000);
        };
    };

    const toggleRow = (idx: number) => {
        setSelectedIndices((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx); else next.add(idx);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedIndices.size === rows.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(rows.map((_, i) => i)));
        }
    };

    const isBusy = loadingData || generatingPdf;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="!max-w-6xl !w-[95vw] max-h-[90vh] flex flex-col p-0 bg-white border-slate-200 shadow-2xl overflow-hidden">

                {/* ── Header ── */}
                <DialogHeader className="border-b border-slate-200 p-6 pb-5 bg-slate-50/50 shrink-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-left">
                            <DialogTitle className="text-2xl text-slate-900 flex items-center gap-2 font-bold tracking-tight">
                                <AlertTriangle className="w-6 h-6 text-rose-600" />
                                RLSDDP Report
                            </DialogTitle>
                            <DialogDescription className="mt-1.5 text-slate-500">
                                Report of Lost, Stolen, Damaged or Destroyed Property (Appendix 75)
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="shadow-sm font-medium"
                                disabled={isBusy || !pdfUrl}
                                onClick={handlePrint}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print Document
                            </Button>
                            <Button
                                className="shadow-sm bg-rose-600 hover:bg-rose-700 text-white font-medium"
                                disabled={isBusy || !pdfUrl}
                                onClick={handleDownload}
                            >
                                {generatingPdf
                                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    : <Download className="w-4 h-4 mr-2" />}
                                {generatingPdf ? 'Generating PDF...' : 'Save as PDF'}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* ── Scrollable Body ── */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="p-6 space-y-6">

                        {/* ── Section 1: Filters ── */}
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                Filter Assets
                            </p>
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="flex flex-col gap-1 min-w-[180px] flex-1">
                                    <Label className="text-xs text-slate-500 font-medium">Office</Label>
                                    <Select value={officeId} onValueChange={setOfficeId}>
                                        <SelectTrigger className="bg-white border-slate-300 shadow-sm">
                                            <SelectValue placeholder="All Offices" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60 overflow-y-auto">
                                            <SelectItem value="all">All Offices</SelectItem>
                                            {offices.map((o) => (
                                                <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-1 min-w-[180px] flex-1">
                                    <Label className="text-xs text-slate-500 font-medium">Condition</Label>
                                    <Select value={condition} onValueChange={setCondition}>
                                        <SelectTrigger className="bg-white border-slate-300 shadow-sm">
                                            <SelectValue placeholder="All Conditions" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60 overflow-y-auto">
                                            <SelectItem value="all">All Conditions</SelectItem>
                                            {conditions.map((c) => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-1 min-w-[140px]">
                                    <Label className="text-xs text-slate-500 font-medium">Start Date</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-white border-slate-300 shadow-sm"
                                    />
                                </div>

                                <div className="flex flex-col gap-1 min-w-[140px]">
                                    <Label className="text-xs text-slate-500 font-medium">End Date</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-white border-slate-300 shadow-sm"
                                    />
                                </div>

                                <Button
                                    onClick={handleFetch}
                                    disabled={loadingData}
                                    className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm shrink-0 px-6 self-end"
                                >
                                    {loadingData
                                        ? <Loader2 className="size-4 mr-2 animate-spin" />
                                        : <Search className="size-4 mr-2" />}
                                    Fetch Assets
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        {/* ── Section 2: Header Form ── */}
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                Report Details
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <Label className="text-xs text-slate-500 font-medium">Entity Name</Label>
                                    <Input value={entityName} onChange={(e) => setEntityName(e.target.value)} className="border-slate-300" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label className="text-xs text-slate-500 font-medium">Fund Cluster</Label>
                                    <Input value={fundCluster} onChange={(e) => setFundCluster(e.target.value)} className="border-slate-300" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label className="text-xs text-slate-500 font-medium">Department / Office</Label>
                                    <Select value={department} onValueChange={setDepartment}>
                                        <SelectTrigger className="border-slate-300">
                                            <SelectValue placeholder="Select office..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60 overflow-y-auto">
                                            {offices.map((o) => (
                                                <SelectItem key={o.id} value={o.name}>{o.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label className="text-xs text-slate-500 font-medium">RLSDDP No.</Label>
                                    <Input value={rlsddpNo} onChange={(e) => setRlsddpNo(e.target.value)} placeholder="e.g. 2026-001" className="border-slate-300" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label className="text-xs text-slate-500 font-medium">Accountable Officer</Label>
                                    <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={employeeOpen}
                                                className={cn(
                                                    'w-full justify-between font-normal border-slate-300',
                                                    !accountableOfficer && 'text-muted-foreground'
                                                )}
                                            >
                                                <span className="truncate">
                                                    {accountableOfficer || 'Select employee...'}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                            <Command className="[&_[cmdk-input-wrapper]]:border-0">
                                                <CommandInput placeholder="Search employee..." className="border-0 outline-none focus:outline-none focus:ring-0 ring-0" />
                                                <CommandList>
                                                    <CommandEmpty>No employee found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {employees
                                                            .filter((e) => e.isActive)
                                                            .map((e) => {
                                                                const display = `${e.lastName ?? ''}, ${e.firstName ?? ''}${
                                                                    e.middleName ? ' ' + e.middleName.charAt(0) + '.' : ''
                                                                }${e.suffixName ? ' ' + e.suffixName : ''}`.trim();
                                                                return (
                                                                    <CommandItem
                                                                        key={e.id}
                                                                        value={display}
                                                                        onSelect={() => {
                                                                            setAccountableOfficer(display);
                                                                            if (e.position?.name) setDesignation(e.position.name);
                                                                            setEmployeeOpen(false);
                                                                        }}
                                                                    >
                                                                        <Check className={cn('mr-2 h-4 w-4', accountableOfficer === display ? 'opacity-100' : 'opacity-0')} />
                                                                        {display}
                                                                    </CommandItem>
                                                                );
                                                            })}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label className="text-xs text-slate-500 font-medium">RLSDDP Date</Label>
                                    <Input type="date" value={rlsddpDate} onChange={(e) => setRlsddpDate(e.target.value)} className="border-slate-300" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label className="text-xs text-slate-500 font-medium">Designation</Label>
                                    <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Administrative Officer V" className="border-slate-300" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label className="text-xs text-slate-500 font-medium">PAR No.</Label>
                                    <Input value={parNo} onChange={(e) => setParNo(e.target.value)} className="border-slate-300" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label className="text-xs text-slate-500 font-medium">PAR Date</Label>
                                    <Input type="date" value={parDate} onChange={(e) => setParDate(e.target.value)} className="border-slate-300" />
                                </div>
                            </div>

                            {/* Police Info */}
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="policeNotified"
                                        checked={policeNotified}
                                        onCheckedChange={(v) => setPoliceNotified(!!v)}
                                    />
                                    <Label htmlFor="policeNotified" className="text-sm cursor-pointer">
                                        Police Notified
                                    </Label>
                                </div>
                                {policeNotified && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                                        <div className="flex flex-col gap-1">
                                            <Label className="text-xs text-slate-500 font-medium">Police Station</Label>
                                            <Input value={policeStation} onChange={(e) => setPoliceStation(e.target.value)} className="border-slate-300" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <Label className="text-xs text-slate-500 font-medium">Date Notified</Label>
                                            <Input type="date" value={policeDate} onChange={(e) => setPoliceDate(e.target.value)} className="border-slate-300" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Status of Property */}
                            <div className="mt-4">
                                <Label className="text-xs text-slate-500 font-medium block mb-2">
                                    Status of Property
                                </Label>
                                <div className="flex flex-wrap gap-4">
                                    {(['Lost', 'Stolen', 'Damaged', 'Destroyed'] as PropertyStatus[]).map((s) => (
                                        <div key={s} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`status-${s}`}
                                                checked={propertyStatus === s}
                                                onCheckedChange={() => setPropertyStatus(s)}
                                            />
                                            <Label htmlFor={`status-${s}`} className="text-sm cursor-pointer">{s}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* ── Section 3: Results Table ── */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Property Items
                                </p>
                                {rows.length > 0 && (
                                    <span className="text-xs text-slate-500">
                                        <span className="font-semibold text-slate-700">{selectedIndices.size}</span> of {rows.length} selected for report
                                    </span>
                                )}
                            </div>
                            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-slate-50/80">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-10 text-center">
                                                <Checkbox
                                                    checked={rows.length > 0 && selectedIndices.size === rows.length}
                                                    data-state={rows.length > 0 && selectedIndices.size > 0 && selectedIndices.size < rows.length ? 'indeterminate' : undefined}
                                                    onCheckedChange={toggleAll}
                                                    disabled={rows.length === 0}
                                                />
                                            </TableHead>
                                            <TableHead className="w-10 text-center font-semibold text-slate-700">#</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Property No.</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Description</TableHead>
                                            <TableHead className="font-semibold text-slate-700 text-right">Acquisition Cost</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!hasSearched ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-40 text-center">
                                                    <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                                                        <div className="p-4 bg-rose-50 rounded-full border border-rose-100 shadow-sm">
                                                            <AlertTriangle className="w-7 h-7 text-rose-400" />
                                                        </div>
                                                        <p className="text-sm text-slate-500">Set filters above and click <span className="font-medium">Fetch Assets</span>.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : loadingData ? (
                                            Array.from({ length: 4 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    {Array.from({ length: 5 }).map((_, ci) => (
                                                        <TableCell key={ci}>
                                                            <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : rows.length > 0 ? (
                                            rows.map((row, idx) => (
                                                <TableRow
                                                    key={idx}
                                                    className={`transition-colors cursor-pointer ${
                                                        selectedIndices.has(idx) ? 'bg-rose-50/40 hover:bg-rose-50/60' : 'hover:bg-slate-50'
                                                    }`}
                                                    onClick={() => toggleRow(idx)}
                                                >
                                                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                                        <Checkbox
                                                            checked={selectedIndices.has(idx)}
                                                            onCheckedChange={() => toggleRow(idx)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center text-slate-500 text-sm">{idx + 1}</TableCell>
                                                    <TableCell className="text-sm text-slate-700">{row.propertyNo}</TableCell>
                                                    <TableCell className="text-sm text-slate-900 font-medium">{row.description}</TableCell>
                                                    <TableCell className="text-sm text-right text-slate-700">{row.acquisitionCost}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-40 text-center">
                                                    <p className="text-sm text-slate-500">No assets found. Try adjusting the filters.</p>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <Separator />

                        {/* ── Section 4: Circumstances ── */}
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                Circumstances
                            </p>
                            <Textarea
                                value={circumstances}
                                onChange={(e) => setCircumstances(e.target.value)}
                                placeholder="Describe the circumstances under which the property was lost, stolen, damaged, or destroyed..."
                                rows={4}
                                className="border-slate-300 resize-none"
                            />
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
