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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { seApi } from '@/api/asset/se';
import { getAuthParams } from '@/utils/auth';
import { toast } from 'sonner';
import { Loader2, Printer, Download, Search, FileSpreadsheet } from 'lucide-react';
import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
    pdf,
} from '@react-pdf/renderer';
import { downloadReportExcel } from '@/utils/reportExcelExport';

const logoSrc =
    typeof window !== 'undefined'
        ? `${window.location.origin}/images/erc-logo.png`
        : '/mnt/data/erc-logo.png';

interface SEPropertyCardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DEFAULT_ENTITY_NAME = 'ENERGY REGULATORY COMMISSION';
const DEFAULT_FUND_CLUSTER = 'Regular Agency Fund';

const formatDateDisplay = (value?: string) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    });
};

const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '';
    return val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

const field = (obj: any, camel: string, snake: string): any =>
    obj?.[camel] ?? obj?.[snake] ?? '';

const movementRef = (m: any): string => {
    const ics = asStr(m.parIcsNumber || m.par_itr_number);
    const itr = asStr(m.ptrItrNumber);
    if (ics && ics !== '-') return ics;
    if (itr && itr !== '-') return itr;
    return '';
};

const movementOffice = (m: any): string => {
    const emp = Array.isArray(m.employee) ? m.employee[0] : null;
    const empName = emp
        ? `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim()
        : '';
    const divName = asStr(m.division) || asStr(emp?.division) || asStr(m.actual_division);
    const offName = asStr(m.office) || asStr(emp?.office);
    const location = divName || offName;
    return empName && location ? `${empName} / ${location}` : empName || location;
};

interface HistoryRow {
    date: string;
    reference: string;
    dateOfExpiration: string;
    receiptItemNo: string;
    receiptQty: string;
    unitCost: string;
    totalCost: string;
    issueItemNo: string;
    issueQty: string;
    office: string;
    balanceQty: string;
    amount: string;
    remarks: string;
}

const buildHistoryRows = (asset: any): HistoryRow[] => {
    const rows: HistoryRow[] = [];

    const movements: any[] = [
        ...(asset.movements || []),
        ...(asset.history || []),
    ];

    const sorted = [...movements].sort((a, b) => {
        const da = new Date(a.dateAssigned || a.date || 0).getTime();
        const db = new Date(b.dateAssigned || b.date || 0).getTime();
        return db - da;
    });

    const dateAcquired = field(asset, 'dateAcquired', 'date_acquired');
    const unitValue = field(asset, 'unitValue', 'unit_value');
    const formattedUnitValue = formatCurrency(Number(unitValue) || 0);

    sorted.forEach((m) => {
        const cond = asStr(m.condition);
        const isDisposal = ['Disposed', 'Missing', 'Unserviceable', 'IIRUP'].includes(cond);

        rows.push({
            date: formatDateDisplay(String(m.dateAssigned || m.date || '')),
            reference: movementRef(m),
            dateOfExpiration: '',
            receiptItemNo: '',
            receiptQty: isDisposal ? '' : '1',
            unitCost: isDisposal ? '' : formattedUnitValue,
            totalCost: isDisposal ? '' : formattedUnitValue,
            issueItemNo: '',
            issueQty: isDisposal ? '1' : '',
            office: movementOffice(m),
            // SE property card is per-asset (qty 1), so balance should not depend on movement count.
            balanceQty: isDisposal ? '0' : '1',
            amount: isDisposal ? '' : formattedUnitValue,
            remarks: asStr(m.remarks) || cond,
        });
    });

    const normalizeDateOnly = (value: unknown): string => {
        const raw = asStr(value);
        if (!raw) return '';
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
        return d.toISOString().slice(0, 10);
    };

    const acquisitionDateOnly = normalizeDateOnly(dateAcquired);
    const hasAcquisitionInMovements = sorted.some((m) => normalizeDateOnly(m.dateAssigned || m.date) === acquisitionDateOnly);

    // Add initial acquisition row only when not already represented by a movement entry.
    if (!hasAcquisitionInMovements) {
        const lastMove = sorted[sorted.length - 1];
        rows.push({
            date: formatDateDisplay(String(dateAcquired)),
            reference: lastMove ? movementRef(lastMove) : asStr(asset.par_itr_number),
            dateOfExpiration: '',
            receiptItemNo: '',
            receiptQty: '1',
            unitCost: formattedUnitValue,
            totalCost: formattedUnitValue,
            issueItemNo: '',
            issueQty: '',
            office: lastMove ? movementOffice(lastMove) : asStr(asset.actual_division),
            balanceQty: '1',
            amount: formattedUnitValue,
            remarks: '',
        });
    }

    return rows;
};

// ─── PDF Styles ───────────────────────────────────────────────────────────────
const pdfStyles = StyleSheet.create({
    page: {
        paddingTop: 18,
        paddingHorizontal: 24,
        paddingBottom: 14,
        fontSize: 9,
        fontFamily: 'Helvetica',
    },
    appendix: {
        textAlign: 'right',
        fontSize: 8,
        marginBottom: 6,
    },
    title: {
        textAlign: 'center',
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 10,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    metaColLeft: {
        width: '68%',
        paddingRight: 8,
    },
    metaColRight: {
        width: '32%',
    },
    metaText: {
        fontSize: 8.5,
    },
    metaLabel: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 8.5,
    },
    fullRow: {
        marginBottom: 4,
    },
    table: {
        borderWidth: 1,
        borderColor: '#000',
        marginTop: 8,
    },
    tableRow: {
        flexDirection: 'row',
    },
    headerRow: {
        backgroundColor: '#e5e7eb',
    },
    subHeaderRow: {
        backgroundColor: '#f3f4f6',
    },
    borderRight: {
        borderRightWidth: 1,
        borderRightColor: '#000',
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    cell: {
        paddingVertical: 3,
        paddingHorizontal: 3,
        justifyContent: 'center',
    },
    headerText: {
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
    },
    cellText: {
        fontSize: 7.5,
        textAlign: 'center',
    },
    cellTextLeft: {
        fontSize: 7.5,
        textAlign: 'left',
    },
    colDate: { width: '7%' },
    colRef: { width: '9%' },
    colExpiration: { width: '7%' },
    colReceiptItemNo: { width: '6%' },
    colReceiptQty: { width: '5%' },
    colUnitCost: { width: '7%' },
    colTotalCost: { width: '7%' },
    colIssueItemNo: { width: '6%' },
    colIssueQty: { width: '5%' },
    colOffice: { width: '16%' },
    colBalance: { width: '5%' },
    colAmount: { width: '8%' },
    colRemarks: { width: '12%' },
});

interface SEPCDocumentProps {
    asset: any;
    entityName: string;
    fundCluster: string;
    rows: HistoryRow[];
}

const SEPCDocument: React.FC<SEPCDocumentProps> = ({ asset, entityName, fundCluster, rows }) => (
    <Document>
        <Page size="LEGAL" orientation="landscape" style={pdfStyles.page}>
            {/* Annex label */}
            <Text style={pdfStyles.appendix}>Annex A.2</Text>

            {/* Title */}
            <Text style={pdfStyles.title}>SEMI-EXPENDABLE PROPERTY CARD</Text>

            {/* LGU / Fund */}
            <View style={pdfStyles.metaRow}>
                <Text style={[pdfStyles.metaText, pdfStyles.metaColLeft]}>
                    <Text style={pdfStyles.metaLabel}>LGU: </Text>
                    {entityName}
                </Text>
                <Text style={[pdfStyles.metaText, pdfStyles.metaColRight]}>
                    <Text style={pdfStyles.metaLabel}>Fund: </Text>
                    {fundCluster}
                </Text>
            </View>

            {/* Semi-expendable Property / Semi-expendable Property Number */}
            <View style={pdfStyles.metaRow}>
                <Text style={[pdfStyles.metaText, pdfStyles.metaColLeft]}>
                    <Text style={pdfStyles.metaLabel}>Semi-expendable Property: </Text>
                    {asStr(asset.category)}
                </Text>
                <Text style={[pdfStyles.metaText, pdfStyles.metaColRight]}>
                    <Text style={pdfStyles.metaLabel}>Semi-expendable Property Number: </Text>
                    {asStr(field(asset, 'propertyNumber', 'property_number'))}
                </Text>
            </View>

            {/* Description / Estimated Useful Life */}
            <View style={pdfStyles.metaRow}>
                <Text style={[pdfStyles.metaText, pdfStyles.metaColLeft]}>
                    <Text style={pdfStyles.metaLabel}>Description: </Text>
                    {asStr(asset.description)}
                    {asStr(asset.brand) && asStr(asset.brand) !== '-' ? ` — ${asStr(asset.brand)}` : ''}
                    {asStr(asset.model) && asStr(asset.model) !== '-' ? ` ${asStr(asset.model)}` : ''}
                    {asStr(field(asset, 'serialNumber', 'serial_number')) ? ` (S/N: ${asStr(field(asset, 'serialNumber', 'serial_number'))})` : ''}
                </Text>
                <Text style={[pdfStyles.metaText, pdfStyles.metaColRight]}>
                    <Text style={pdfStyles.metaLabel}>Estimated Useful Life: </Text>
                    {field(asset, 'estimatedUsefulLife', 'estimated_useful_life') || ''}
                </Text>
            </View>

            {/* Table */}
            <View style={pdfStyles.table}>
                {/* Header row */}
                <View style={[pdfStyles.tableRow, pdfStyles.headerRow, pdfStyles.borderBottom]}>
                    <View style={[pdfStyles.cell, pdfStyles.colDate, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Date</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colRef, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Reference</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colExpiration, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Date of{'\n'}Expiration</Text>
                    </View>
                    <View
                        style={[
                            pdfStyles.cell,
                            pdfStyles.borderRight,
                            { width: '25%', flexDirection: 'row' },
                        ]}
                    >
                        <Text style={pdfStyles.headerText}>Receipt</Text>
                    </View>
                    <View
                        style={[
                            pdfStyles.cell,
                            pdfStyles.borderRight,
                            { width: '27%', flexDirection: 'row' },
                        ]}
                    >
                        <Text style={pdfStyles.headerText}>Issue/Transfer/{'\n'}Disposal</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colBalance, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Balance</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colAmount, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Amount</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colRemarks]}>
                        <Text style={pdfStyles.headerText}>Remarks</Text>
                    </View>
                </View>

                {/* Sub-header row */}
                <View style={[pdfStyles.tableRow, pdfStyles.subHeaderRow, pdfStyles.borderBottom]}>
                    <View style={[pdfStyles.cell, pdfStyles.colDate, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}></Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colRef, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}></Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colExpiration, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}></Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colReceiptItemNo, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Item No.</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colReceiptQty, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Qty.</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colUnitCost, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Unit Cost</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colTotalCost, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Total Cost</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colIssueItemNo, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Item No.</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colIssueQty, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Qty.</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colOffice, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Office/Officer</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colBalance, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Qty.</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colAmount, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}></Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colRemarks]}>
                        <Text style={pdfStyles.headerText}></Text>
                    </View>
                </View>

                {/* Data rows */}
                {rows.map((row, idx) => (
                    <View
                        key={idx}
                        style={[
                            pdfStyles.tableRow,
                            idx < rows.length - 1 ? pdfStyles.borderBottom : {},
                        ]}
                    >
                        <View style={[pdfStyles.cell, pdfStyles.colDate, pdfStyles.borderRight]}>
                            <Text style={pdfStyles.cellText}>{row.date}</Text>
                        </View>
                        <View style={[pdfStyles.cell, pdfStyles.colRef, pdfStyles.borderRight]}>
                            <Text style={pdfStyles.cellTextLeft}>{row.reference}</Text>
                        </View>
                        <View style={[pdfStyles.cell, pdfStyles.colExpiration, pdfStyles.borderRight]}>
                            <Text style={pdfStyles.cellText}>{row.dateOfExpiration}</Text>
                        </View>
                        <View style={[pdfStyles.cell, pdfStyles.colReceiptItemNo, pdfStyles.borderRight]}>
                            <Text style={pdfStyles.cellText}>{row.receiptItemNo}</Text>
                        </View>
                        <View style={[pdfStyles.cell, pdfStyles.colReceiptQty, pdfStyles.borderRight]}>
                            <Text style={pdfStyles.cellText}>{row.receiptQty}</Text>
                        </View>
                        <View style={[pdfStyles.cell, pdfStyles.colUnitCost, pdfStyles.borderRight]}>
                            <Text style={pdfStyles.cellText}>{row.unitCost}</Text>
                        </View>
                        <View style={[pdfStyles.cell, pdfStyles.colTotalCost, pdfStyles.borderRight]}>
                            <Text style={pdfStyles.cellText}>{row.totalCost}</Text>
                        </View>
                        <View style={[pdfStyles.cell, pdfStyles.colIssueItemNo, pdfStyles.borderRight]}>
                            <Text style={pdfStyles.cellText}>{row.issueItemNo}</Text>
                        </View>
                        <View style={[pdfStyles.cell, pdfStyles.colIssueQty, pdfStyles.borderRight]}>
                            <Text style={pdfStyles.cellText}>{row.issueQty}</Text>
                        </View>
                        <View style={[pdfStyles.cell, pdfStyles.colOffice, pdfStyles.borderRight]}>
                            <Text style={pdfStyles.cellTextLeft}>{row.office}</Text>
                        </View>
                        <View style={[pdfStyles.cell, pdfStyles.colBalance, pdfStyles.borderRight]}>
                            <Text style={pdfStyles.cellText}>{row.balanceQty}</Text>
                        </View>
                        <View style={[pdfStyles.cell, pdfStyles.colAmount, pdfStyles.borderRight]}>
                            <Text style={pdfStyles.cellText}>{row.amount}</Text>
                        </View>
                        <View style={[pdfStyles.cell, pdfStyles.colRemarks]}>
                            <Text style={pdfStyles.cellTextLeft}>{row.remarks}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </Page>
    </Document>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────
const SE_PAGE_SIZE = 100;

export function SEPropertyCardModal({ isOpen, onClose }: SEPropertyCardModalProps) {
    const [assets, setAssets] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savingExcel, setSavingExcel] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

    const [entityName, setEntityName] = useState(DEFAULT_ENTITY_NAME);
    const [fundCluster, setFundCluster] = useState(DEFAULT_FUND_CLUSTER);

    const totalPages = Math.max(1, Math.ceil(totalCount / SE_PAGE_SIZE));

    const fetchAssets = useCallback(async (search: string, page: number) => {
        setLoading(true);
        try {
            const { systemUserId, sessionKey } = getAuthParams();
            const result = await seApi.list({
                GroupName: 'SE',
                PageNumber: page,
                PageSize: SE_PAGE_SIZE,
                SearchString: search || undefined,
                ActionBySystemUserId: String(systemUserId),
                SessionKey: sessionKey,
            });
            setAssets(result.items);
            setTotalCount(result.totalCount);
        } catch {
            toast.error('Failed to load SE assets');
        } finally {
            setLoading(false);
        }
    }, []);

    // Reset to page 1 (and reset list state) each time the modal is opened
    useEffect(() => {
        if (isOpen) {
            setSearchInput('');
            setDebouncedSearch('');
            setPageNumber(1);
        }
    }, [isOpen]);

    // Debounce raw typing into a search term, and jump back to page 1 on every new search
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(searchInput);
            setPageNumber(1);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Single source of truth for fetching: re-run whenever the page or the debounced search changes
    useEffect(() => {
        if (isOpen) fetchAssets(debouncedSearch, pageNumber);
    }, [isOpen, pageNumber, debouncedSearch, fetchAssets]);

    const handleSearch = () => {
        setDebouncedSearch(searchInput);
        setPageNumber(1);
    };

    const handleSelectAsset = async (asset: any) => {
        setSelectedAsset(asset);
        try {
            const { systemUserId, sessionKey } = getAuthParams();
            const full = await seApi.getById(String(asset.id), String(systemUserId), sessionKey);
            if (full && full.id) {
                setSelectedAsset(full);
            }
        } catch {
            // keep the list item already set above
        }
    };

    const buildDoc = () => {
        const rows = buildHistoryRows(selectedAsset);
        return (
            <SEPCDocument
                asset={selectedAsset}
                entityName={entityName}
                fundCluster={fundCluster}
                rows={rows}
            />
        );
    };

    const handlePrint = async () => {
        if (!selectedAsset) return;
        setPrinting(true);
        try {
            const blob = await pdf(buildDoc()).toBlob();
            const url = URL.createObjectURL(blob);
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.top = '-9999px';
            iframe.style.left = '-9999px';
            iframe.style.width = '1px';
            iframe.style.height = '1px';
            iframe.src = url;
            document.body.appendChild(iframe);
            iframe.onload = () => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                }, 2000);
            };
        } catch {
            toast.error('Failed to generate PDF');
        } finally {
            setPrinting(false);
        }
    };

    const handleSavePDF = async () => {
        if (!selectedAsset) return;
        setSaving(true);
        try {
            const blob = await pdf(buildDoc()).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const propNo = asStr(field(selectedAsset, 'propertyNumber', 'property_number')) || String(selectedAsset.id);
            a.download = `SE-Property-Card_${propNo}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('PDF saved successfully');
        } catch {
            toast.error('Failed to save PDF');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveExcel = async () => {
        if (!selectedAsset) return;
        setSavingExcel(true);
        try {
            const rows = buildHistoryRows(selectedAsset);
            const propNo = asStr(field(selectedAsset, 'propertyNumber', 'property_number')) || String(selectedAsset.id);
            await downloadReportExcel({
                filename: `SE-Property-Card_${propNo}.xlsx`,
                sheetName: 'SE Property Card',
                logoUrl: logoSrc,
                logoColOffset: 3,
                titleLines: ['SEMI-EXPENDABLE PROPERTY CARD'],
                infoLines: [
                    `LGU: ${entityName}`,
                    `Semi-expendable Property: ${asStr(selectedAsset.category)}`,
                    `Description: ${asStr(selectedAsset.description)}${asStr(selectedAsset.brand) && asStr(selectedAsset.brand) !== '-' ? ` — ${asStr(selectedAsset.brand)}` : ''}${asStr(selectedAsset.model) && asStr(selectedAsset.model) !== '-' ? ` ${asStr(selectedAsset.model)}` : ''}${asStr(field(selectedAsset, 'serialNumber', 'serial_number')) ? ` (S/N: ${asStr(field(selectedAsset, 'serialNumber', 'serial_number'))})` : ''}`,
                ],
                metaRight: [
                    `Fund: ${fundCluster}`,
                    `Semi-expendable Property Number: ${propNo}`,
                    `Estimated Useful Life: ${field(selectedAsset, 'estimatedUsefulLife', 'estimated_useful_life') || ''}`,
                ],
                columns: [
                    'Date', 'Reference', 'Date of Expiration',
                    'Receipt - Item No.', 'Receipt - Qty.', 'Receipt - Unit Cost', 'Receipt - Total Cost',
                    'Issue/Transfer/Disposal - Item No.', 'Issue/Transfer/Disposal - Qty.', 'Office/Officer',
                    'Balance - Qty.', 'Amount', 'Remarks',
                ],
                rows: rows.map((row) => [
                    row.date, row.reference, row.dateOfExpiration,
                    row.receiptItemNo, row.receiptQty, row.unitCost, row.totalCost,
                    row.issueItemNo, row.issueQty, row.office,
                    row.balanceQty, row.amount, row.remarks,
                ]),
            });
            toast.success('Excel file saved successfully');
        } catch {
            toast.error('Failed to save Excel file');
        } finally {
            setSavingExcel(false);
        }
    };

    const historyRows = selectedAsset ? buildHistoryRows(selectedAsset) : [];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="!max-w-[98vw] !w-[98vw] max-h-[95vh] h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle className="text-xl font-semibold text-slate-800">
                        Semi-Expendable Property Card
                        <span className="ml-2 text-xs font-normal text-lime-600 bg-lime-50 border border-lime-200 rounded px-2 py-0.5">Annex A.2</span>
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Select an SE asset to generate its Semi-Expendable Property Card
                    </DialogDescription>
                </DialogHeader>

                {/* Body — two panels */}
                <div className="flex flex-1 min-h-0 overflow-hidden">

                    {/* Left panel — asset list */}
                    <div className="w-[520px] shrink-0 border-r flex flex-col">
                        <div className="px-4 py-3 border-b shrink-0">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search SE assets…"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="flex-1"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleSearch}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                                </Button>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-muted-foreground">
                                    {totalCount.toLocaleString()} asset{totalCount !== 1 ? 's' : ''} found
                                </p>
                                {totalCount > SE_PAGE_SIZE && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 px-2 text-xs"
                                            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                                            disabled={loading || pageNumber <= 1}
                                        >
                                            Prev
                                        </Button>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            Page {pageNumber} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 px-2 text-xs"
                                            onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                                            disabled={loading || pageNumber >= totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-white z-10">
                                    <TableRow>
                                        <TableHead className="text-xs w-[24px]"></TableHead>
                                        <TableHead className="text-xs">Property No.</TableHead>
                                        <TableHead className="text-xs">Description</TableHead>
                                        <TableHead className="text-xs">Serial No.</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8">
                                                <Loader2 className="size-5 animate-spin mx-auto text-lime-600" />
                                            </TableCell>
                                        </TableRow>
                                    ) : assets.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                No assets found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        assets.map((asset) => {
                                            const isSelected = selectedAsset?.id === asset.id;
                                            return (
                                                <TableRow
                                                    key={asset.id}
                                                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-lime-50 font-medium' : 'hover:bg-slate-50'}`}
                                                    onClick={() => handleSelectAsset(asset)}
                                                >
                                                    <TableCell className="pr-0 w-8" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="radio"
                                                            name="selected-se-asset"
                                                            checked={isSelected}
                                                            onChange={() => handleSelectAsset(asset)}
                                                            className="accent-lime-600 w-4 h-4 cursor-pointer"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-xs font-mono">{asStr(field(asset, 'propertyNumber', 'property_number'))}</TableCell>
                                                    <TableCell className="text-xs max-w-[200px] truncate">{asStr(asset.description)}</TableCell>
                                                    <TableCell className="text-xs font-mono">{asStr(field(asset, 'serialNumber', 'serial_number'))}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Right panel — form + preview */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                        {!selectedAsset ? (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                                Select an asset from the list to preview its property card
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                {/* Meta fields */}
                                <div className="px-6 py-4 border-b shrink-0 space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground block mb-1">LGU</label>
                                            <Input
                                                value={entityName}
                                                onChange={(e) => setEntityName(e.target.value)}
                                                className="text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground block mb-1">Fund</label>
                                            <Input
                                                value={fundCluster}
                                                onChange={(e) => setFundCluster(e.target.value)}
                                                className="text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Asset info */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-md px-4 py-3 space-y-1 text-sm">
                                        <div className="break-words">
                                            <span className="font-medium">Semi-Expendable Property: </span>
                                            <span className="break-words">{asStr(selectedAsset.category)}</span>
                                        </div>
                                        <div className="break-words">
                                            <span className="font-medium">Description: </span>
                                            <span className="break-words">
                                                {asStr(selectedAsset.description)}
                                                {asStr(selectedAsset.brand) && asStr(selectedAsset.brand) !== '-' ? ` — ${asStr(selectedAsset.brand)}` : ''}
                                                {asStr(selectedAsset.model) && asStr(selectedAsset.model) !== '-' ? ` ${asStr(selectedAsset.model)}` : ''}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-6 gap-y-1">
                                            <span className="break-all">
                                                <span className="font-medium">Property No.: </span>
                                                {asStr(field(selectedAsset, 'propertyNumber', 'property_number'))}
                                            </span>
                                            <span className="break-all">
                                                <span className="font-medium">Serial No.: </span>
                                                {asStr(field(selectedAsset, 'serialNumber', 'serial_number'))}
                                            </span>
                                            <span className="break-all">
                                                <span className="font-medium">Estimated Useful Life: </span>
                                                {field(selectedAsset, 'estimatedUsefulLife', 'estimated_useful_life') || ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* History preview table */}
                                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                        History ({historyRows.length} row{historyRows.length !== 1 ? 's' : ''})
                                    </p>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-xs">Date</TableHead>
                                                <TableHead className="text-xs">Reference</TableHead>
                                                <TableHead className="text-xs text-center">Receipt Qty.</TableHead>
                                                <TableHead className="text-xs text-center">Issue Qty.</TableHead>
                                                <TableHead className="text-xs">Office / Officer</TableHead>
                                                <TableHead className="text-xs text-center">Balance Qty.</TableHead>
                                                <TableHead className="text-xs text-right">Amount</TableHead>
                                                <TableHead className="text-xs">Remarks</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {historyRows.map((row, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="text-xs">{row.date}</TableCell>
                                                    <TableCell className="text-xs font-mono">{row.reference}</TableCell>
                                                    <TableCell className="text-xs text-center">{row.receiptQty}</TableCell>
                                                    <TableCell className="text-xs text-center">{row.issueQty}</TableCell>
                                                    <TableCell className="text-xs max-w-[180px] break-words whitespace-normal">{row.office}</TableCell>
                                                    <TableCell className="text-xs text-center">{row.balanceQty}</TableCell>
                                                    <TableCell className="text-xs text-right">{row.amount}</TableCell>
                                                    <TableCell className="text-xs">{row.remarks}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Action buttons */}
                                <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrint}
                                        disabled={printing || saving || !selectedAsset}
                                        className="gap-2"
                                    >
                                        {printing ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Printer className="size-4" />
                                        )}
                                        {printing ? 'Printing…' : 'Print'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleSaveExcel}
                                        disabled={savingExcel || printing || saving || !selectedAsset}
                                        className="gap-2"
                                    >
                                        {savingExcel ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <FileSpreadsheet className="size-4" />
                                        )}
                                        {savingExcel ? 'Saving…' : 'Export to Excel'}
                                    </Button>
                                    <Button
                                        onClick={handleSavePDF}
                                        disabled={saving || printing || !selectedAsset}
                                        className="gap-2 bg-lime-600 hover:bg-lime-700"
                                    >
                                        {saving ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Download className="size-4" />
                                        )}
                                        {saving ? 'Saving…' : 'Save to PDF'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
