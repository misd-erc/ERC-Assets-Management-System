import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getDisposals, type DisposalRecord } from '@/api/asset/disposalApi';
import { toast } from 'sonner';
import { Download, FileText, Loader2, Printer, Search } from 'lucide-react';
import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
    pdf,
} from '@react-pdf/renderer';

interface WMRReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface WMRFormState {
    entityName: string;
    fundCluster: string;
    placeOfStorage: string;
    reportDate: string;
    officialReceiptNo: string;
    officialReceiptDate: string;
    custodianName: string;
    headOfAgencyName: string;
    inspectionOfficerName: string;
    witnessName: string;
    recipientAgency: string;
    remarks: string;
}

interface WasteMaterialRow {
    itemNo: number;
    quantity: number;
    unit: string;
    description: string;
}

const DEFAULT_ENTITY_NAME = 'ENERGY REGULATORY COMMISSION';
const DEFAULT_FUND_CLUSTER = 'Regular Agency Fund';

const todayInputValue = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const startOfYearInputValue = () => {
    const now = new Date();
    return `${now.getFullYear()}-01-01`;
};

const formatDateLabel = (value?: string) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
    });
};

const getMethodLabel = (record: DisposalRecord, form: WMRFormState) => {
    const method = record.method?.toLowerCase() ?? '';

    return {
        destroyed: method === 'destruction',
        privateSale: method === 'sale' && !/auction/i.test(record.remarks ?? ''),
        publicAuction: method === 'sale' && /auction/i.test(record.remarks ?? ''),
        transferredWithoutCost: method === 'donation' || method === 'return to supplier',
        transferredLabel: form.recipientAgency || record.buyer || '____________________',
    };
};

const buildWasteRows = (record: DisposalRecord): WasteMaterialRow[] => {
    const grouped = new Map<string, WasteMaterialRow>();

    record.items.forEach((item) => {
        const description = item.pta?.description?.trim() || 'Unspecified item';
        const propertyNumber = item.pta?.propertyNumber?.trim();
        const key = `${description}::${item.pta?.group ?? record.group}`;
        const existing = grouped.get(key);

        if (existing) {
            existing.quantity += 1;
            return;
        }

        grouped.set(key, {
            itemNo: grouped.size + 1,
            quantity: 1,
            unit: 'unit',
            description: propertyNumber ? `${description} (${propertyNumber})` : description,
        });
    });

    return Array.from(grouped.values());
};

const pdfStyles = StyleSheet.create({
    page: {
        paddingTop: 18,
        paddingHorizontal: 26,
        paddingBottom: 14,
        fontSize: 9,
        fontFamily: 'Helvetica',
    },
    appendix: {
        textAlign: 'right',
        fontSize: 8,
        marginBottom: 8,
    },
    title: {
        textAlign: 'center',
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
        gap: 12,
    },
    metaText: {
        fontSize: 9,
    },
    sectionTitle: {
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: '#000',
        textAlign: 'center',
        paddingVertical: 3,
        fontFamily: 'Helvetica-Bold',
        fontSize: 9,
        marginTop: 5,
    },
    table: {
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 6,
    },
    tableRow: {
        flexDirection: 'row',
    },
    headerRow: {
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
        paddingVertical: 4,
        paddingHorizontal: 3,
        justifyContent: 'center',
    },
    headerText: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
    },
    cellText: {
        fontSize: 8,
    },
    centerText: {
        textAlign: 'center',
    },
    rightText: {
        textAlign: 'right',
    },
    colItemNo: { width: '8%' },
    colQty: { width: '10%' },
    colUnit: { width: '10%' },
    colDesc: { width: '36%' },
    colOrNo: { width: '12%' },
    colOrDate: { width: '12%' },
    colAmount: { width: '12%' },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
        gap: 16,
    },
    signatureColumn: {
        width: '48%',
    },
    footerLabel: {
        fontSize: 9,
        marginBottom: 14,
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 3,
        textAlign: 'center',
        fontSize: 7,
    },
    inspectionTitle: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        marginTop: 6,
        marginBottom: 4,
        textAlign: 'center',
    },
    inspectionBody: {
        fontSize: 8,
        marginBottom: 4,
        lineHeight: 1.3,
    },
    inspectionLine: {
        fontSize: 8,
        marginBottom: 2,
    },
    remarks: {
        marginTop: 10,
        fontSize: 8,
        fontStyle: 'italic',
    },
});

const WMRPdfDocument = ({
    record,
    form,
    rows,
}: {
    record: DisposalRecord;
    form: WMRFormState;
    rows: WasteMaterialRow[];
}) => {
    const methodLabels = getMethodLabel(record, form);
    const totalAmount = record.proceedAmount ?? 0;
    const paddedRows = rows.length >= 10
        ? rows
        : rows.concat(
            Array.from({ length: 10 - rows.length }, (_, index) => ({
                itemNo: rows.length + index + 1,
                quantity: 0,
                unit: '',
                description: '',
            }))
        );

    return (
        <Document>
            <Page size="LEGAL" orientation="landscape" style={pdfStyles.page}>
                <Text style={pdfStyles.appendix}>Appendix 65</Text>
                <Text style={pdfStyles.title}>WASTE MATERIALS REPORT</Text>

                <View style={pdfStyles.metaRow}>
                    <Text style={pdfStyles.metaText}>Entity Name : {form.entityName}</Text>
                    <Text style={pdfStyles.metaText}>Fund Cluster : {form.fundCluster}</Text>
                </View>
                <View style={pdfStyles.metaRow}>
                    <Text style={pdfStyles.metaText}>Place of Storage : {form.placeOfStorage}</Text>
                    <Text style={pdfStyles.metaText}>Date : {formatDateLabel(form.reportDate)}</Text>
                </View>

                <Text style={pdfStyles.sectionTitle}>ITEMS FOR DISPOSAL</Text>
                <View style={pdfStyles.table}>
                    <View style={[pdfStyles.tableRow, pdfStyles.headerRow, pdfStyles.borderBottom]}>
                        <View style={[pdfStyles.cell, pdfStyles.colItemNo, pdfStyles.borderRight]}><Text style={pdfStyles.headerText}>Item</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colQty, pdfStyles.borderRight]}><Text style={pdfStyles.headerText}>Quantity</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colUnit, pdfStyles.borderRight]}><Text style={pdfStyles.headerText}>Unit</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colDesc, pdfStyles.borderRight]}><Text style={pdfStyles.headerText}>Description</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colOrNo, pdfStyles.borderRight]}><Text style={pdfStyles.headerText}>Official Receipt No.</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colOrDate, pdfStyles.borderRight]}><Text style={pdfStyles.headerText}>Date</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colAmount]}><Text style={pdfStyles.headerText}>Amount</Text></View>
                    </View>

                    {paddedRows.map((row, index) => (
                        <View key={`${row.itemNo}-${index}`} style={index === paddedRows.length - 1 ? [pdfStyles.tableRow] : [pdfStyles.tableRow, pdfStyles.borderBottom]}>
                            <View style={[pdfStyles.cell, pdfStyles.colItemNo, pdfStyles.borderRight]}><Text style={[pdfStyles.cellText, pdfStyles.centerText]}>{row.itemNo}</Text></View>
                            <View style={[pdfStyles.cell, pdfStyles.colQty, pdfStyles.borderRight]}><Text style={[pdfStyles.cellText, pdfStyles.centerText]}>{row.quantity || ''}</Text></View>
                            <View style={[pdfStyles.cell, pdfStyles.colUnit, pdfStyles.borderRight]}><Text style={[pdfStyles.cellText, pdfStyles.centerText]}>{row.unit}</Text></View>
                            <View style={[pdfStyles.cell, pdfStyles.colDesc, pdfStyles.borderRight]}><Text style={pdfStyles.cellText}>{row.description}</Text></View>
                            <View style={[pdfStyles.cell, pdfStyles.colOrNo, pdfStyles.borderRight]}><Text style={[pdfStyles.cellText, pdfStyles.centerText]}>{index === 0 ? form.officialReceiptNo : ''}</Text></View>
                            <View style={[pdfStyles.cell, pdfStyles.colOrDate, pdfStyles.borderRight]}><Text style={[pdfStyles.cellText, pdfStyles.centerText]}>{index === 0 ? formatDateLabel(form.officialReceiptDate) : ''}</Text></View>
                            <View style={[pdfStyles.cell, pdfStyles.colAmount]}><Text style={[pdfStyles.cellText, pdfStyles.rightText]}>{index === 0 && totalAmount ? totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</Text></View>
                        </View>
                    ))}

                    <View style={[pdfStyles.tableRow, pdfStyles.borderBottom]}>
                        <View style={[pdfStyles.cell, pdfStyles.colItemNo, pdfStyles.borderRight]}><Text style={pdfStyles.cellText}></Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colQty, pdfStyles.borderRight]}><Text style={pdfStyles.cellText}></Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colUnit, pdfStyles.borderRight]}><Text style={pdfStyles.cellText}></Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colDesc, pdfStyles.borderRight]}><Text style={[pdfStyles.headerText, pdfStyles.rightText]}>TOTAL</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colOrNo, pdfStyles.borderRight]}><Text style={pdfStyles.cellText}></Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colOrDate, pdfStyles.borderRight]}><Text style={pdfStyles.cellText}></Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colAmount]}><Text style={[pdfStyles.cellText, pdfStyles.rightText]}>{totalAmount ? totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</Text></View>
                    </View>
                </View>

                <View style={pdfStyles.footerRow}>
                    <View style={pdfStyles.signatureColumn}>
                        <Text style={pdfStyles.footerLabel}>Certified Correct :</Text>
                        <Text style={pdfStyles.signatureLine}>{form.custodianName || ' '}</Text>
                        <Text style={[pdfStyles.signatureLine, { borderTopWidth: 0, paddingTop: 0 }]}>Signature over Printed Name of Supply and/or Property Custodian</Text>
                    </View>
                    <View style={pdfStyles.signatureColumn}>
                        <Text style={pdfStyles.footerLabel}>Disposal Approved :</Text>
                        <Text style={pdfStyles.signatureLine}>{form.headOfAgencyName || record.approvedByName || ' '}</Text>
                        <Text style={[pdfStyles.signatureLine, { borderTopWidth: 0, paddingTop: 0 }]}>Signature over Printed Name of Head of Agency/Entity or his/her Authorized Representative</Text>
                    </View>
                </View>

                <Text style={pdfStyles.inspectionTitle}>CERTIFICATE OF INSPECTION</Text>
                <Text style={pdfStyles.inspectionBody}>I hereby certify that the property enumerated above was disposed of as follows:</Text>
                <Text style={pdfStyles.inspectionLine}>[ {methodLabels.destroyed ? 'X' : ' '} ] Item Destroyed</Text>
                <Text style={pdfStyles.inspectionLine}>[ {methodLabels.privateSale ? 'X' : ' '} ] Item Sold at private sale</Text>
                <Text style={pdfStyles.inspectionLine}>[ {methodLabels.publicAuction ? 'X' : ' '} ] Item Sold at public auction</Text>
                <Text style={pdfStyles.inspectionLine}>[ {methodLabels.transferredWithoutCost ? 'X' : ' '} ] Item Transferred without cost to {methodLabels.transferredLabel}</Text>

                <View style={pdfStyles.footerRow}>
                    <View style={pdfStyles.signatureColumn}>
                        <Text style={pdfStyles.footerLabel}>Certified Correct:</Text>
                        <Text style={pdfStyles.signatureLine}>{form.inspectionOfficerName || ' '}</Text>
                        <Text style={[pdfStyles.signatureLine, { borderTopWidth: 0, paddingTop: 0 }]}>Signature over Printed Name of Inspection Officer</Text>
                    </View>
                    <View style={pdfStyles.signatureColumn}>
                        <Text style={pdfStyles.footerLabel}>Witness to Disposal:</Text>
                        <Text style={pdfStyles.signatureLine}>{form.witnessName || ' '}</Text>
                        <Text style={[pdfStyles.signatureLine, { borderTopWidth: 0, paddingTop: 0 }]}>Signature over Printed Name of Witness</Text>
                    </View>
                </View>

                {form.remarks ? <Text style={pdfStyles.remarks}>Remarks: {form.remarks}</Text> : null}
            </Page>
        </Document>
    );
};

export const WMRReportModal = ({ isOpen, onClose }: WMRReportModalProps) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [records, setRecords] = useState<DisposalRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
    const [formState, setFormState] = useState<WMRFormState>({
        entityName: DEFAULT_ENTITY_NAME,
        fundCluster: DEFAULT_FUND_CLUSTER,
        placeOfStorage: '',
        reportDate: todayInputValue(),
        officialReceiptNo: '',
        officialReceiptDate: todayInputValue(),
        custodianName: '',
        headOfAgencyName: '',
        inspectionOfficerName: '',
        witnessName: '',
        recipientAgency: '',
        remarks: '',
    });

    const selectedRecord = useMemo(
        () => records.find((record) => record.id === selectedRecordId) ?? null,
        [records, selectedRecordId]
    );

    const rows = useMemo(() => {
        if (!selectedRecord) return [];
        const filtered = {
            ...selectedRecord,
            items: selectedRecord.items.filter((item) => selectedItemIds.has(item.id)),
        };
        return buildWasteRows(filtered);
    }, [selectedRecord, selectedItemIds]);

    const fetchDisposedRecords = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getDisposals({
                status: 'Disposed',
                searchString: searchTerm.trim() || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                pageNumber: 1,
                pageSize: 100,
            });
            setRecords(response.items);
            if (!response.items.some((item) => item.id === selectedRecordId)) {
                setSelectedRecordId(response.items[0]?.id ?? null);
            }
        } catch (error) {
            console.error('Failed to fetch disposed records', error);
            toast.error('Failed to load disposed records');
        } finally {
            setLoading(false);
        }
    }, [endDate, searchTerm, selectedRecordId, startDate]);

    useEffect(() => {
        if (!isOpen) {
            setRecords([]);
            setSelectedRecordId(null);
            return;
        }

        void fetchDisposedRecords();
    }, [fetchDisposedRecords, isOpen]);

    useEffect(() => {
        if (!selectedRecord) return;
        setSelectedItemIds(new Set(selectedRecord.items.map((item) => item.id)));
    }, [selectedRecord]);

    useEffect(() => {
        if (!selectedRecord) return;

        setFormState((current) => ({
            ...current,
            reportDate: selectedRecord.dateDisposed?.split('T')[0] ?? selectedRecord.dateDisposed ?? current.reportDate,
            headOfAgencyName: current.headOfAgencyName || selectedRecord.approvedByName || '',
            recipientAgency: current.recipientAgency || selectedRecord.buyer || '',
            remarks: current.remarks || selectedRecord.remarks || '',
        }));
    }, [selectedRecord]);

    const updateFormField = (field: keyof WMRFormState, value: string) => {
        setFormState((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const generateBlob = async () => {
        if (!selectedRecord) return null;

        return pdf(<WMRPdfDocument record={selectedRecord} form={formState} rows={rows} />).toBlob();
    };

    const handleSave = async () => {
        if (!selectedRecord) return;
        setIsGenerating(true);
        try {
            const blob = await generateBlob();
            if (!blob) return;

            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `WMR_${selectedRecord.disposalNumber}.pdf`;
            anchor.click();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch (error) {
            console.error('Failed to generate WMR PDF', error);
            toast.error('Failed to generate Waste Materials Report');
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrint = async () => {
        if (!selectedRecord) return;
        setIsGenerating(true);
        try {
            const blob = await generateBlob();
            if (!blob) return;

            const url = URL.createObjectURL(blob);
            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'position:fixed;width:0;height:0;border:none;opacity:0;';
            document.body.appendChild(iframe);
            iframe.src = url;
            iframe.addEventListener('load', () => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                }, 60000);
            }, { once: true });
        } catch (error) {
            console.error('Failed to print WMR PDF', error);
            toast.error('Failed to print Waste Materials Report');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="!max-w-7xl !w-[96vw] max-h-[94vh] flex flex-col p-0 bg-white border-slate-200 shadow-2xl overflow-hidden">
                <DialogHeader className="border-b border-slate-200 p-6 pb-5 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-left">
                            <DialogTitle className="text-2xl text-slate-900 flex items-center gap-2 font-bold tracking-tight">
                                <FileText className="w-6 h-6 text-orange-600" />
                                Waste Materials Report
                            </DialogTitle>
                            <DialogDescription className="mt-1.5 text-slate-500">
                                Select a disposed record and complete the report-only fields required by the WMR template.
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="shadow-sm font-medium transition-all"
                                disabled={!selectedRecord || isGenerating}
                                onClick={handlePrint}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print Document
                            </Button>
                            <Button
                                className="shadow-sm bg-orange-600 hover:bg-orange-700 text-white font-medium transition-all"
                                disabled={!selectedRecord || isGenerating}
                                onClick={handleSave}
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                {isGenerating ? 'Generating...' : 'Save as PDF'}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 flex-1 min-h-0 flex flex-col bg-white gap-6 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm shrink-0">
                        <div className="space-y-1.5">
                            <Label className="text-slate-700 font-medium">Start Date</Label>
                            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-slate-700 font-medium">End Date</Label>
                            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-slate-700 font-medium">Search</Label>
                            <Input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Disposal no., buyer, or remarks"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                                onClick={() => void fetchDisposedRecords()}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                                Load Disposals
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6 flex-1 min-h-0">
                        <div className="border border-slate-200 rounded-xl flex flex-col min-h-0 overflow-hidden">
                            <div className="px-4 py-3 border-b bg-slate-50 shrink-0">
                                <p className="text-sm font-semibold text-slate-900">Disposed Records</p>
                                <p className="text-xs text-slate-500">Choose one disposal record to use as the source for the report.</p>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-16">Use</TableHead>
                                            <TableHead>Disposal No.</TableHead>
                                            <TableHead>Date Disposed</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead>Buyer</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                                    Loading disposed records...
                                                </TableCell>
                                            </TableRow>
                                        ) : records.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                                    No disposed records found for the selected filters.
                                                </TableCell>
                                            </TableRow>
                                        ) : records.map((record) => (
                                            <TableRow
                                                key={record.id}
                                                className={selectedRecordId === record.id ? 'bg-orange-50' : ''}
                                                onClick={() => setSelectedRecordId(record.id)}
                                            >
                                                <TableCell>
                                                    <div className={`h-4 w-4 rounded-full border ${selectedRecordId === record.id ? 'border-orange-600 bg-orange-600' : 'border-slate-300 bg-white'}`} />
                                                </TableCell>
                                                <TableCell className="font-medium">{record.disposalNumber}</TableCell>
                                                <TableCell>{formatDateLabel(record.dateDisposed)}</TableCell>
                                                <TableCell>{record.items.length}</TableCell>
                                                <TableCell>{record.buyer || 'N/A'}</TableCell>
                                                <TableCell className="text-right">{(record.proceedAmount ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {selectedRecord ? (
                                <div className="border-t bg-slate-50/70 p-4 space-y-3">
                                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                        <span><strong className="text-slate-900">Method:</strong> {selectedRecord.method}</span>
                                        <span><strong className="text-slate-900">Approved By:</strong> {selectedRecord.approvedByName || 'N/A'}</span>
                                        <span><strong className="text-slate-900">Requested By:</strong> {selectedRecord.requestedByName || 'N/A'}</span>
                                    </div>
                                    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                                        <div className="flex items-center justify-between px-3 py-2 border-b bg-slate-50">
                                            <span className="text-xs font-medium text-slate-600">{selectedItemIds.size} of {selectedRecord.items.length} item(s) selected</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs h-6 px-2"
                                                onClick={() => {
                                                    if (selectedItemIds.size === selectedRecord.items.length) {
                                                        setSelectedItemIds(new Set());
                                                    } else {
                                                        setSelectedItemIds(new Set(selectedRecord.items.map((i) => i.id)));
                                                    }
                                                }}
                                            >
                                                {selectedItemIds.size === selectedRecord.items.length ? 'Deselect All' : 'Select All'}
                                            </Button>
                                        </div>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-10">Include</TableHead>
                                                    <TableHead>Property No.</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead>Group</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedRecord.items.map((item) => (
                                                    <TableRow
                                                        key={item.id}
                                                        className="cursor-pointer"
                                                        onClick={() => setSelectedItemIds((prev) => {
                                                            const next = new Set(prev);
                                                            if (next.has(item.id)) next.delete(item.id);
                                                            else next.add(item.id);
                                                            return next;
                                                        })}
                                                    >
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedItemIds.has(item.id)}
                                                                onCheckedChange={(checked) => setSelectedItemIds((prev) => {
                                                                    const next = new Set(prev);
                                                                    if (checked) next.add(item.id);
                                                                    else next.delete(item.id);
                                                                    return next;
                                                                })}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{item.pta?.propertyNumber || 'N/A'}</TableCell>
                                                        <TableCell>{item.pta?.description || 'N/A'}</TableCell>
                                                        <TableCell>{item.pta?.group || selectedRecord.group}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="border border-slate-200 rounded-xl p-5 space-y-4 bg-slate-50/50 overflow-y-auto">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Report Details</p>
                                <p className="text-xs text-slate-500">These fields are not available from the current disposal API and are filled here for the printed template.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Entity Name</Label>
                                    <Input value={formState.entityName} onChange={(event) => updateFormField('entityName', event.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Fund Cluster</Label>
                                    <Input value={formState.fundCluster} onChange={(event) => updateFormField('fundCluster', event.target.value)} />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label>Place of Storage</Label>
                                    <Input value={formState.placeOfStorage} onChange={(event) => updateFormField('placeOfStorage', event.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Report Date</Label>
                                    <Input type="date" value={formState.reportDate} onChange={(event) => updateFormField('reportDate', event.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Official Receipt No.</Label>
                                    <Input value={formState.officialReceiptNo} onChange={(event) => updateFormField('officialReceiptNo', event.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Official Receipt Date</Label>
                                    <Input type="date" value={formState.officialReceiptDate} onChange={(event) => updateFormField('officialReceiptDate', event.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Supply / Property Custodian</Label>
                                    <Input value={formState.custodianName} onChange={(event) => updateFormField('custodianName', event.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Head of Agency / Authorized Representative</Label>
                                    <Input value={formState.headOfAgencyName} onChange={(event) => updateFormField('headOfAgencyName', event.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Inspection Officer</Label>
                                    <Input value={formState.inspectionOfficerName} onChange={(event) => updateFormField('inspectionOfficerName', event.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Witness to Disposal</Label>
                                    <Input value={formState.witnessName} onChange={(event) => updateFormField('witnessName', event.target.value)} />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label>Recipient Agency / Buyer Label</Label>
                                    <Input value={formState.recipientAgency} onChange={(event) => updateFormField('recipientAgency', event.target.value)} />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label>Remarks</Label>
                                    <Textarea value={formState.remarks} onChange={(event) => updateFormField('remarks', event.target.value)} rows={4} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};