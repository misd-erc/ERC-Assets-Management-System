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
import { ppeApi } from '@/api/asset/ppe';
import { getOffices } from '@/api/office-management/officeApi';
import { getCategories } from '@/api/asset/inventoryApi';
import { VwOffice } from '@/types/office';
import { getAuthParams } from '@/utils/auth';
import { toast } from 'sonner';
import { Loader2, Printer, Download, Search } from 'lucide-react';
import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
    pdf,
} from '@react-pdf/renderer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ListPPEsAtStationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface PPERow {
    article: string;
    description: string;
    assigned: string;
    personAccountable: string;
    unitCost: string;
    totalCost: string;
    remarks: string;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const ENTITY_NAME = 'ENERGY REGULATORY COMMISSION';

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

const getPersonAccountable = (asset: any): string => {
    const movements: any[] = asset.movements || asset.history || [];
    const current = movements.find((m: any) => m.isCurrent) || movements[0];
    if (!current) return '';
    const emp = Array.isArray(current.employee) ? current.employee[0] : current.employee;
    if (emp) {
        return `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim();
    }
    return '';
};

const getAssigned = (asset: any): string => {
    const movements: any[] = asset.movements || asset.history || [];
    const current = movements.find((m: any) => m.isCurrent) || movements[0];
    const parNo = asStr(current?.parIcsNumber || current?.par_itr_number);
    if (parNo && parNo !== '-') return parNo;
    return asStr(asset.par_itr_number);
};

const buildRows = (assets: any[]): PPERow[] =>
    assets.map((a) => {
        const unitVal = Number(a.unit_value ?? a.unitValue ?? 0);
        return {
            article: asStr(a.category),
            description: asStr(a.description),
            assigned: getAssigned(a),
            personAccountable: getPersonAccountable(a),
            unitCost: formatCurrency(unitVal),
            totalCost: formatCurrency(unitVal),
            remarks: asStr(a.condition),
        };
    });

// ─── PDF Styles ────────────────────────────────────────────────────────────────

const pdfStyles = StyleSheet.create({
    page: {
        paddingTop: 16,
        paddingHorizontal: 20,
        paddingBottom: 16,
        fontSize: 8,
        fontFamily: 'Helvetica',
    },
    annexLabel: { textAlign: 'right', fontSize: 7.5, marginBottom: 4 },
    orgName: { textAlign: 'center', fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
    title: { textAlign: 'center', fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
    subTitle: { textAlign: 'center', fontSize: 8.5, marginBottom: 8 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    metaText: { fontSize: 8 },
    metaLabel: { fontFamily: 'Helvetica-Bold', fontSize: 8 },
    table: { borderWidth: 1, borderColor: '#000', marginTop: 6 },
    tableRow: { flexDirection: 'row' },
    headerRow: { backgroundColor: '#e5e7eb' },
    borderRight: { borderRightWidth: 1, borderRightColor: '#000' },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: '#000' },
    cell: { paddingVertical: 3, paddingHorizontal: 2, justifyContent: 'center' },
    headerText: { fontSize: 7, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
    cellText: { fontSize: 7, textAlign: 'center' },
    cellTextLeft: { fontSize: 7, textAlign: 'left' },
    colNo: { width: '4%' },
    colArticle: { width: '11%' },
    colDesc: { width: '24%' },
    colAssigned: { width: '13%' },
    colPerson: { width: '18%' },
    colUnitCost: { width: '10%' },
    colTotalCost: { width: '10%' },
    colRemarks: { width: '10%' },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
    signatureCol: { width: '45%' },
    footerLabel: { fontSize: 8, marginBottom: 14 },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 2,
        textAlign: 'center',
        fontSize: 7,
    },
    dateRow: { marginTop: 10, fontSize: 8 },
});

// ─── PDF Document ──────────────────────────────────────────────────────────────

interface PPEStationDocProps {
    rows: PPERow[];
    stationName: string;
    categoryName: string;
    asOfDate: string;
    totalValue: number;
}

function PPEStationDocument({ rows, stationName, categoryName, asOfDate, totalValue }: PPEStationDocProps) {
    const COLS = [
        { label: 'No.',              style: pdfStyles.colNo,         center: true  },
        { label: 'Article/Item',     style: pdfStyles.colArticle,    center: false },
        { label: 'Description',      style: pdfStyles.colDesc,       center: false },
        { label: 'Assigned\n(PAR/ICS No.)', style: pdfStyles.colAssigned, center: true },
        { label: 'Person Accountable', style: pdfStyles.colPerson,   center: false },
        { label: 'Unit\nCost/Value', style: pdfStyles.colUnitCost,   center: true  },
        { label: 'Total\nCost/Value', style: pdfStyles.colTotalCost, center: true  },
        { label: 'Remarks',          style: pdfStyles.colRemarks,    center: true  },
    ];

    return (
        <Document>
            <Page size="LEGAL" orientation="landscape" style={pdfStyles.page}>
                <Text style={pdfStyles.annexLabel}>Annex B</Text>
                <Text style={pdfStyles.orgName}>{ENTITY_NAME}</Text>
                <Text style={pdfStyles.title}>LIST OF PPEs Found at Station</Text>
                <Text style={pdfStyles.subTitle}>Station: {stationName}</Text>

                <View style={pdfStyles.metaRow}>
                    <Text style={pdfStyles.metaText}>
                        <Text style={pdfStyles.metaLabel}>PPE Account Group: </Text>
                        {categoryName}
                    </Text>
                    {asOfDate ? (
                        <Text style={pdfStyles.metaText}>As of: {asOfDate}</Text>
                    ) : null}
                </View>

                {/* Table */}
                <View style={pdfStyles.table}>
                    {/* Header Row */}
                    <View style={[pdfStyles.tableRow, pdfStyles.headerRow, pdfStyles.borderBottom]}>
                        {COLS.map((col, i) => (
                            <View
                                key={i}
                                style={[
                                    pdfStyles.cell,
                                    col.style,
                                    i < COLS.length - 1 ? pdfStyles.borderRight : {},
                                ]}
                            >
                                <Text style={pdfStyles.headerText}>{col.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Data Rows */}
                    {rows.map((row, idx) => {
                        const cells = [
                            { value: String(idx + 1),          center: true  },
                            { value: row.article,              center: false },
                            { value: row.description,          center: false },
                            { value: row.assigned,             center: true  },
                            { value: row.personAccountable,    center: false },
                            { value: row.unitCost,             center: true  },
                            { value: row.totalCost,            center: true  },
                            { value: row.remarks,              center: true  },
                        ];
                        return (
                            <View
                                key={idx}
                                style={[
                                    pdfStyles.tableRow,
                                    idx < rows.length - 1 ? pdfStyles.borderBottom : {},
                                ]}
                            >
                                {cells.map((cell, ci) => (
                                    <View
                                        key={ci}
                                        style={[
                                            pdfStyles.cell,
                                            COLS[ci].style,
                                            ci < cells.length - 1 ? pdfStyles.borderRight : {},
                                        ]}
                                    >
                                        <Text style={cell.center ? pdfStyles.cellText : pdfStyles.cellTextLeft}>
                                            {cell.value}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        );
                    })}

                    {/* Total Row */}
                    <View style={[pdfStyles.tableRow, pdfStyles.borderBottom, { backgroundColor: '#f3f4f6' }]}>
                        <View
                            style={[
                                pdfStyles.cell,
                                { width: '70%' },
                                pdfStyles.borderRight,
                            ]}
                        >
                            <Text style={[pdfStyles.headerText, { textAlign: 'right' }]}>TOTAL</Text>
                        </View>
                        <View style={[pdfStyles.cell, pdfStyles.colUnitCost, pdfStyles.borderRight]}>
                            <Text style={pdfStyles.cellText}> </Text>
                        </View>
                        <View style={[pdfStyles.cell, pdfStyles.colTotalCost, pdfStyles.borderRight]}>
                            <Text style={[pdfStyles.cellText, { fontFamily: 'Helvetica-Bold' }]}>
                                {formatCurrency(totalValue)}
                            </Text>
                        </View>
                        <View style={[pdfStyles.cell, pdfStyles.colRemarks]}>
                            <Text style={pdfStyles.cellText}> </Text>
                        </View>
                    </View>
                </View>

                {/* Signature Footer */}
                <View style={pdfStyles.footerRow}>
                    <View style={pdfStyles.signatureCol}>
                        <Text style={pdfStyles.footerLabel}>Prepared by:</Text>
                        <Text style={pdfStyles.signatureLine}>Printed Name and Signature</Text>
                        <Text style={[pdfStyles.signatureLine, { marginTop: 4 }]}>
                            Concerned Inventory Committee Member
                        </Text>
                    </View>
                    <View style={pdfStyles.signatureCol}>
                        <Text style={pdfStyles.footerLabel}>Reviewed By:</Text>
                        <Text style={pdfStyles.signatureLine}>Printed Name and Signature</Text>
                        <Text style={[pdfStyles.signatureLine, { marginTop: 4 }]}>
                            Chairman, Inventory Committee
                        </Text>
                    </View>
                </View>

                <View style={pdfStyles.dateRow}>
                    <Text>Date: _________________________</Text>
                </View>
            </Page>
        </Document>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function ListPPEsAtStationModal({ isOpen, onClose }: ListPPEsAtStationModalProps) {
    const [loadingData, setLoadingData] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const [offices, setOffices] = useState<VwOffice[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

    const [officeId, setOfficeId] = useState<string>('all');
    const [categoryId, setCategoryId] = useState<string>('all');
    const [asOfDate, setAsOfDate] = useState('');

    const [assets, setAssets] = useState<any[]>([]);
    const [rows, setRows] = useState<PPERow[]>([]);
    const [pdfUrl, setPdfUrl] = useState('');

    // Load offices and categories when modal opens
    useEffect(() => {
        if (!isOpen) return;
        Promise.all([getOffices(), getCategories()]).then(([offs, cats]) => {
            setOffices(offs);
            setCategories(cats);
        });
    }, [isOpen]);

    // Reset when modal closes
    useEffect(() => {
        if (!isOpen) {
            setHasSearched(false);
            setAssets([]);
            setRows([]);
            setOfficeId('all');
            setCategoryId('all');
            setAsOfDate('');
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
            setPdfUrl('');
        }
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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
                ...(categoryId !== 'all' ? { CategoryId: Number(categoryId) } : {}),
            });

            if (!result.items.length) {
                toast.error('No PPE assets found for the selected criteria');
                return;
            }

            const builtRows = buildRows(result.items);
            setAssets(result.items);
            setRows(builtRows);

            // Build PDF in background
            const stationName =
                officeId === 'all'
                    ? 'All Offices'
                    : offices.find((o) => String(o.id) === officeId)?.name ?? '';
            const categoryName =
                categoryId === 'all'
                    ? 'All Categories'
                    : categories.find((c) => String(c.id) === categoryId)?.name ?? '';
            const totalValue = result.items.reduce(
                (sum, a: any) => sum + Number(a.unit_value ?? a.unitValue ?? 0),
                0
            );

            setGeneratingPdf(true);
            pdf(
                <PPEStationDocument
                    rows={builtRows}
                    stationName={stationName}
                    categoryName={categoryName}
                    asOfDate={asOfDate ? formatDateDisplay(asOfDate) : ''}
                    totalValue={totalValue}
                />
            )
                .toBlob()
                .then((blob) => setPdfUrl(URL.createObjectURL(blob)))
                .catch(() => toast.error('Failed to generate PDF'))
                .finally(() => setGeneratingPdf(false));
        } catch {
            toast.error('Failed to fetch PPE data');
        } finally {
            setLoadingData(false);
        }
    }, [officeId, categoryId, asOfDate, offices, categories]);

    const handleDownload = () => {
        if (!pdfUrl) return;
        const a = document.createElement('a');
        a.href = pdfUrl;
        const officePart =
            officeId === 'all'
                ? 'All'
                : offices.find((o) => String(o.id) === officeId)?.acronym ?? officeId;
        a.download = `List_of_PPEs_at_Station_${officePart}_${Date.now()}.pdf`;
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

    const isBusy = loadingData || generatingPdf;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="!max-w-6xl !w-[95vw] max-h-[90vh] flex flex-col p-0 bg-white border-slate-200 shadow-2xl overflow-hidden">

                {/* ── Header ── */}
                <DialogHeader className="border-b border-slate-200 p-6 pb-5 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-left">
                            <DialogTitle className="text-2xl text-slate-900 flex items-center gap-2 font-bold tracking-tight">
                                <Search className="w-6 h-6 text-sky-600" />
                                List of PPEs Found at Station
                            </DialogTitle>
                            <DialogDescription className="mt-1.5 text-slate-500">
                                Filter by office and category, then generate the official Annex B report.
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="shadow-sm font-medium transition-all"
                                disabled={isBusy || !pdfUrl}
                                onClick={handlePrint}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print Document
                            </Button>
                            <Button
                                className="shadow-sm bg-sky-600 hover:bg-sky-700 text-white font-medium transition-all"
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

                {/* ── Body ── */}
                <div className="p-6 flex-1 min-h-0 flex flex-col bg-white">

                    {/* Filter Row */}
                    <div className="flex flex-wrap items-end gap-3 mb-5">
                        <div className="flex flex-col gap-1 min-w-[200px] flex-1">
                            <Label className="text-xs text-slate-500 font-medium">Office / Station</Label>
                            <Select value={officeId} onValueChange={setOfficeId}>
                                <SelectTrigger className="bg-white border-slate-300 focus:ring-sky-500 shadow-sm">
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
                            <Label className="text-xs text-slate-500 font-medium">Category</Label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className="bg-white border-slate-300 focus:ring-sky-500 shadow-sm">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 overflow-y-auto">
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1 min-w-[160px]">
                            <Label className="text-xs text-slate-500 font-medium">As of Date</Label>
                            <Input
                                type="date"
                                value={asOfDate}
                                onChange={(e) => setAsOfDate(e.target.value)}
                                className="bg-white border-slate-300 shadow-sm focus-visible:ring-sky-500"
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
                            Generate Report
                        </Button>
                    </div>

                    {/* Results Table */}
                    <div className="border border-slate-200 rounded-lg overflow-y-auto flex-1 shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-12 px-4 font-semibold text-slate-700 text-center">#</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Article/Item</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Description</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Assigned (PAR/ICS)</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Person Accountable</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right">Unit Cost</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right">Total Cost</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Remarks</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!hasSearched ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-72 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500 space-y-4">
                                                <div className="p-5 bg-sky-50 rounded-full border border-sky-100 shadow-sm">
                                                    <Search className="w-8 h-8 text-sky-500" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-lg">Ready to Generate</p>
                                                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                                                        Select your filters above and click <span className="font-medium">Generate Report</span> to view PPE assets.
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : loadingData ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 8 }).map((_, ci) => (
                                                <TableCell key={ci}>
                                                    <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : rows.length > 0 ? (
                                    rows.map((row, idx) => (
                                        <TableRow key={idx} className="hover:bg-slate-50 transition-colors">
                                            <TableCell className="text-center text-slate-500 text-sm px-4">{idx + 1}</TableCell>
                                            <TableCell className="text-sm text-slate-700">{row.article}</TableCell>
                                            <TableCell className="text-sm text-slate-900 font-medium">{row.description}</TableCell>
                                            <TableCell className="text-sm text-slate-600">{row.assigned}</TableCell>
                                            <TableCell className="text-sm text-slate-600">{row.personAccountable}</TableCell>
                                            <TableCell className="text-sm text-right text-slate-700">{row.unitCost}</TableCell>
                                            <TableCell className="text-sm text-right font-semibold text-slate-900">{row.totalCost}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{row.remarks}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                                                <div className="p-4 bg-slate-50 rounded-full border border-slate-100">
                                                    <Search className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="font-medium text-slate-900 text-lg">No PPE assets found</p>
                                                <p className="text-sm">Try adjusting the filters and generating again.</p>
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
    );
}
