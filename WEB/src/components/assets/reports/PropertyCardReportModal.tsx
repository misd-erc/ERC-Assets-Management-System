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
import { Label } from '@/components/ui/label';
import { ppeApi } from '@/api/asset/ppe';
import { PPEAsset } from '@/types/asset/ppe';
import { getAuthParams } from '@/utils/auth';
import { toast } from 'sonner';
import { Loader2, Printer, Search } from 'lucide-react';
import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
    pdf,
} from '@react-pdf/renderer';

interface PropertyCardReportModalProps {
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

/** Safely extract a display string — handles objects returned by the API */
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

/** Get camelCase or snake_case field, whichever is present */
const field = (obj: any, camel: string, snake: string): any =>
    obj?.[camel] ?? obj?.[snake] ?? '';

/** Format a movement's reference number (PAR/ICS or PTR/ITR) */
const movementRef = (m: any): string => {
    const par = asStr(m.parIcsNumber || m.par_itr_number);
    const ptr = asStr(m.ptrItrNumber);
    if (par && par !== '-') return par;
    if (ptr && ptr !== '-') return ptr;
    return '';
};

/** Format office/officer from a movement */
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
    receiptQty: string;
    issueQty: string;
    office: string;
    balanceQty: string;
    amount: string;
    remarks: string;
}

const buildHistoryRows = (asset: any): HistoryRow[] => {
    const rows: HistoryRow[] = [];

    // Movements: support both camelCase (actual API) and snake_case (type)
    const movements: any[] = [
        ...(asset.movements || []),
        ...(asset.history || []),
    ];

    // Sort latest first
    const sorted = [...movements].sort((a, b) => {
        const da = new Date(a.dateAssigned || a.date || 0).getTime();
        const db = new Date(b.dateAssigned || b.date || 0).getTime();
        return db - da;
    });

    const dateAcquired = field(asset, 'dateAcquired', 'date_acquired');
    const unitValue = field(asset, 'unitValue', 'unit_value');

    // First row shown = latest movement (sorted[0]); append acquisition at bottom
    let balance = sorted.length;
    sorted.forEach((m) => {
        const cond = asStr(m.condition);
        const isDisposal = ['Disposed', 'Missing', 'Unserviceable', 'IIRUP'].includes(cond);

        rows.push({
            date: formatDateDisplay(String(m.dateAssigned || m.date || '')),
            reference: movementRef(m),
            receiptQty: isDisposal ? '' : '1',
            issueQty: isDisposal ? '1' : '',
            office: movementOffice(m),
            balanceQty: isDisposal ? '0' : String(balance),
            amount: '',
            remarks: asStr(m.remarks) || cond,
        });

        if (!isDisposal) balance = Math.max(0, balance - 1);
    });

    // Last row = initial acquisition
    const lastMove = sorted[sorted.length - 1];
    rows.push({
        date: formatDateDisplay(String(dateAcquired)),
        reference: lastMove ? movementRef(lastMove) : asStr(asset.par_itr_number),
        receiptQty: '1',
        issueQty: '',
        office: lastMove ? movementOffice(lastMove) : asStr(asset.actual_division),
        balanceQty: '1',
        amount: formatCurrency(Number(unitValue) || 0),
        remarks: '',
    });

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
    // column widths (total = 100%)
    colDate: { width: '10%' },
    colRef: { width: '16%' },
    colReceipt: { width: '9%' },
    colIssue: { width: '9%' },
    colOffice: { width: '26%' },
    colBalance: { width: '9%' },
    colAmount: { width: '12%' },
    colRemarks: { width: '9%' },
});

interface PCDocumentProps {
    asset: any;
    entityName: string;
    fundCluster: string;
    rows: HistoryRow[];
}

const PCDocument: React.FC<PCDocumentProps> = ({ asset, entityName, fundCluster, rows }) => (
    <Document>
        <Page size="LEGAL" orientation="landscape" style={pdfStyles.page}>
            {/* Appendix label */}
            <Text style={pdfStyles.appendix}>Appendix 69</Text>

            {/* Title */}
            <Text style={pdfStyles.title}>PROPERTY CARD</Text>

            {/* Entity Name / Fund Cluster */}
            <View style={pdfStyles.metaRow}>
                <Text style={pdfStyles.metaText}>
                    <Text style={pdfStyles.metaLabel}>Entity Name: </Text>
                    {entityName}
                </Text>
                <Text style={pdfStyles.metaText}>
                    <Text style={pdfStyles.metaLabel}>Fund Cluster: </Text>
                    {fundCluster}
                </Text>
            </View>

            {/* Property, Plant and Equipment */}
            <View style={pdfStyles.fullRow}>
                <Text style={pdfStyles.metaText}>
                    <Text style={pdfStyles.metaLabel}>Property, Plant and Equipment: </Text>
                    {asStr(asset.category)}
                </Text>
            </View>

            {/* Description / Property Number */}
            <View style={pdfStyles.metaRow}>
                <Text style={pdfStyles.metaText}>
                    <Text style={pdfStyles.metaLabel}>Description: </Text>
                    {asStr(asset.description)}
                    {asStr(asset.brand) && asStr(asset.brand) !== '-' ? ` — ${asStr(asset.brand)}` : ''}
                    {asStr(asset.model) && asStr(asset.model) !== '-' ? ` ${asStr(asset.model)}` : ''}
                </Text>
                <Text style={pdfStyles.metaText}>
                    <Text style={pdfStyles.metaLabel}>Property Number: </Text>
                    {asStr(field(asset, 'propertyNumber', 'property_number'))}
                </Text>
            </View>

            {/* Table */}
            <View style={pdfStyles.table}>
                {/* Header row 1 */}
                <View style={[pdfStyles.tableRow, pdfStyles.headerRow, pdfStyles.borderBottom]}>
                    <View style={[pdfStyles.cell, pdfStyles.colDate, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Date</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colRef, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Reference/{'\n'}PAR No.</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colReceipt, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Receipt</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colIssue, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Issue/Transfer/{'\n'}Disposal</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colOffice, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Office/Officer</Text>
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

                {/* Sub-header row (Qty.) */}
                <View style={[pdfStyles.tableRow, pdfStyles.subHeaderRow, pdfStyles.borderBottom]}>
                    <View style={[pdfStyles.cell, pdfStyles.colDate, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}></Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colRef, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}></Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colReceipt, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Qty.</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colIssue, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}>Qty.</Text>
                    </View>
                    <View style={[pdfStyles.cell, pdfStyles.colOffice, pdfStyles.borderRight]}>
                        <Text style={pdfStyles.headerText}></Text>
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
                        <View style={[pdfStyles.cell, pdfStyles.colReceipt, pdfStyles.borderRight]}>
                            <Text style={pdfStyles.cellText}>{row.receiptQty}</Text>
                        </View>
                        <View style={[pdfStyles.cell, pdfStyles.colIssue, pdfStyles.borderRight]}>
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
export function PropertyCardReportModal({ isOpen, onClose }: PropertyCardReportModalProps) {
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [searchString, setSearchString] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

    const [entityName, setEntityName] = useState(DEFAULT_ENTITY_NAME);
    const [fundCluster, setFundCluster] = useState(DEFAULT_FUND_CLUSTER);

    const fetchAssets = useCallback(async (search: string) => {
        setLoading(true);
        try {
            const { systemUserId, sessionKey } = getAuthParams();
            const result = await ppeApi.list({
                GroupName: 'PPE',
                PageNumber: 1,
                PageSize: 100,
                SearchString: search || undefined,
                ActionBySystemUserId: String(systemUserId),
                SessionKey: sessionKey,
            });
            setAssets(result.items);
        } catch (err) {
            toast.error('Failed to load PPE assets');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchAssets('');
        }
    }, [isOpen, fetchAssets]);

    // Debounced search trigger
    useEffect(() => {
        const t = setTimeout(() => {
            if (isOpen) fetchAssets(searchString);
        }, 400);
        return () => clearTimeout(t);
    }, [searchString, isOpen, fetchAssets]);

    const handleSearch = () => {
        setSearchString(searchInput);
    };

    const handleSelectAsset = async (asset: any) => {
        // Set immediately so radio + meta shows right away
        setSelectedAsset(asset);
        // Then try to enrich with full history from getById
        try {
            const { systemUserId, sessionKey } = getAuthParams();
            const full = await ppeApi.getById(asset.id, String(systemUserId), sessionKey);
            if (full && full.id) {
                setSelectedAsset(full);
            }
        } catch {
            // keep the list item already set above
        }
    };

    const handlePrint = async () => {
        if (!selectedAsset) return;
        setPrinting(true);
        try {
            const rows = buildHistoryRows(selectedAsset);
            const blob = await pdf(
                <PCDocument
                    asset={selectedAsset}
                    entityName={entityName}
                    fundCluster={fundCluster}
                    rows={rows}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);

            // Hidden iframe print — no new tab
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
        } catch (err) {
            toast.error('Failed to generate PDF');
        } finally {
            setPrinting(false);
        }
    };

    const historyRows = selectedAsset ? buildHistoryRows(selectedAsset) : [];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="!max-w-[98vw] !w-[98vw] max-h-[95vh] h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle className="text-xl font-bold text-orange-700">
                        Property Card (Appendix 69)
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Select a PPE asset to generate its Property Card
                    </DialogDescription>
                </DialogHeader>

                {/* Body — two panels */}
                <div className="flex flex-1 min-h-0 overflow-hidden">

                    {/* Left panel — asset list */}
                    <div className="w-[520px] shrink-0 border-r flex flex-col">
                        <div className="px-4 py-3 border-b shrink-0">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search PPE assets…"
                                    value={searchInput}
                                    onChange={(e) => {
                                        setSearchInput(e.target.value);
                                        setSearchString(e.target.value);
                                    }}
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
                            <p className="text-xs text-muted-foreground mt-1">
                                {assets.length} asset{assets.length !== 1 ? 's' : ''} found
                            </p>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-white z-10">
                                    <TableRow>
                                        <TableHead className="text-xs w-[24px]"></TableHead>
                                        <TableHead className="text-xs">Property No.</TableHead>
                                        <TableHead className="text-xs">Description</TableHead>
                                        <TableHead className="text-xs">Condition</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8">
                                                <Loader2 className="size-5 animate-spin mx-auto text-orange-500" />
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
                                                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-orange-100 font-medium' : 'hover:bg-orange-50'}`}
                                                    onClick={() => handleSelectAsset(asset)}
                                                >
                                                    <TableCell className="pr-0 w-8" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="radio"
                                                            name="selected-ppe-asset"
                                                            checked={isSelected}
                                                            onChange={() => handleSelectAsset(asset)}
                                                            className="accent-orange-500 w-4 h-4 cursor-pointer"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-xs font-mono">{asStr(field(asset, 'propertyNumber', 'property_number'))}</TableCell>
                                                    <TableCell className="text-xs max-w-[200px] truncate">{asStr(asset.description)}</TableCell>
                                                    <TableCell className="text-xs">{asStr(asset.condition)}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Right panel — form + preview */}
                    <div className="flex-1 min-h-0 flex flex-col">
                        {/* Selected asset banner */}
                        <div className={`px-6 py-2 border-b shrink-0 text-sm ${selectedAsset ? 'bg-orange-50 border-orange-200' : 'bg-slate-50'}`}>
                            {selectedAsset ? (
                                <span>
                                    <span className="font-semibold text-orange-700">Selected: </span>
                                    <span className="font-mono text-xs mr-2">{asStr(field(selectedAsset, 'propertyNumber', 'property_number'))}</span>
                                    <span className="text-slate-700">{asStr(selectedAsset.description)}</span>
                                </span>
                            ) : (
                                <span className="text-muted-foreground italic">No asset selected — click a row on the left to select</span>
                            )}
                        </div>
                        {/* Form fields */}
                        <div className="px-6 py-4 border-b shrink-0 grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-orange-700">Entity Name</Label>
                                <Input
                                    value={entityName}
                                    onChange={(e) => setEntityName(e.target.value)}
                                    className="text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-orange-700">Fund Cluster</Label>
                                <Input
                                    value={fundCluster}
                                    onChange={(e) => setFundCluster(e.target.value)}
                                    className="text-sm"
                                />
                            </div>
                        </div>

                        {/* Preview area */}
                        <div className="flex-1 min-h-0 overflow-auto px-6 py-4">
                            {!selectedAsset ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                    <Search className="size-10 text-orange-300" />
                                    <p className="text-sm">Select an asset from the list to preview</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Asset meta */}
                                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 space-y-1.5 text-sm">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                            <div>
                                                <span className="font-semibold text-orange-800">Property No.: </span>
                                                <span>{asStr(field(selectedAsset, 'propertyNumber', 'property_number'))}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-orange-800">Category: </span>
                                                <span>{asStr(selectedAsset.category)}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="font-semibold text-orange-800">Description: </span>
                                                <span>{asStr(selectedAsset.description)}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-orange-800">Condition: </span>
                                                <span>{asStr(selectedAsset.condition)}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-orange-800">Serial No.: </span>
                                                <span>{asStr(field(selectedAsset, 'serialNumber', 'serial_number'))}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-orange-800">Unit Value: </span>
                                                <span>₱{formatCurrency(Number(field(selectedAsset, 'unitValue', 'unit_value')) || 0)}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-orange-800">Date Acquired: </span>
                                                <span>{formatDateDisplay(String(field(selectedAsset, 'dateAcquired', 'date_acquired')))}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="font-semibold text-orange-800">Movements: </span>
                                                <span>{(selectedAsset.movements || selectedAsset.history || []).length} record(s)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* History preview table */}
                                    <div>
                                        <p className="text-xs font-semibold text-orange-700 mb-2 uppercase tracking-wide">
                                            Movement History ({historyRows.length} entries)
                                        </p>
                                        <div className="overflow-x-auto border rounded-lg w-full">
                                            <Table className="min-w-[900px]">
                                                <TableHeader>
                                                    <TableRow className="bg-orange-50">
                                                        <TableHead className="text-xs whitespace-nowrap w-[90px]">Date</TableHead>
                                                        <TableHead className="text-xs whitespace-nowrap w-[140px]">Reference/PAR No.</TableHead>
                                                        <TableHead className="text-xs whitespace-nowrap w-[72px] text-center">Rcpt Qty</TableHead>
                                                        <TableHead className="text-xs whitespace-nowrap w-[72px] text-center">Issue Qty</TableHead>
                                                        <TableHead className="text-xs w-[220px]">Office/Officer</TableHead>
                                                        <TableHead className="text-xs whitespace-nowrap w-[72px] text-center">Bal Qty</TableHead>
                                                        <TableHead className="text-xs whitespace-nowrap w-[90px] text-right">Amount</TableHead>
                                                        <TableHead className="text-xs w-[150px]">Remarks</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {historyRows.map((row, idx) => (
                                                        <TableRow key={idx} className={idx === historyRows.length - 1 ? 'bg-orange-50/50' : ''}>
                                                            <TableCell className="text-xs whitespace-nowrap">{row.date}</TableCell>
                                                            <TableCell className="text-xs font-mono whitespace-nowrap">{row.reference}</TableCell>
                                                            <TableCell className="text-xs text-center">{row.receiptQty}</TableCell>
                                                            <TableCell className="text-xs text-center">{row.issueQty}</TableCell>
                                                            <TableCell className="text-xs">{row.office}</TableCell>
                                                            <TableCell className="text-xs text-center">{row.balanceQty}</TableCell>
                                                            <TableCell className="text-xs text-right whitespace-nowrap">{row.amount}</TableCell>
                                                            <TableCell className="text-xs break-words whitespace-normal">{row.remarks}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer actions */}
                        <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-3">
                            <Button variant="outline" onClick={onClose} disabled={printing}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                                onClick={handlePrint}
                                disabled={!selectedAsset || printing}
                            >
                                {printing ? (
                                    <Loader2 className="size-4 animate-spin mr-2" />
                                ) : (
                                    <Printer className="size-4 mr-2" />
                                )}
                                Print Property Card
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
