// src/components/assets/reports/IARReportModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, Download, Printer, FileText, ClipboardCheck, ChevronRight, ChevronDown, Package } from 'lucide-react';
import { toast } from 'sonner';

import { getSupplyIARs } from '@/api/supply-management/iarApi';
import { getDeliveryRecordById, getDeliveryRecords } from '@/api/delivery/deliveryApi';
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
    StyleSheet
} from '@react-pdf/renderer';

// --- PDF STYLES (Appendix 62 Format - Times New Roman) ---
const pdfStyles = StyleSheet.create({
    page: { padding: 35, fontSize: 8.5, fontFamily: 'Times-Roman' },

    appendixText: { fontStyle: 'italic', textAlign: 'right', fontSize: 9, marginBottom: 12 },
    mainTitle: { fontSize: 11, fontFamily: 'Times-Bold', textAlign: 'center', marginBottom: 12 },

    entityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    entityText: { fontSize: 8.5, fontFamily: 'Times-Bold' },

    // Outer Table Borders
    tableContainer: { borderWidth: 1, borderColor: '#000' },

    // Header Grid (Supplier / IAR Info etc)
    headerGrid: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    headerColLeft: { flex: 1.2, borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    headerColRight: { flex: 1, padding: 4 },
    headerText: { fontSize: 8.5, marginBottom: 2.5 },

    // Table Column Headers
    colHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', backgroundColor: '#fdfdfd' },
    colStockNo: { width: '18%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center' },
    colDesc: { width: '47%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center' },
    colUnit: { width: '15%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center' },
    colQty: { width: '20%', padding: 4, justifyContent: 'center' },

    cellHeaderBold: { fontSize: 8.5, fontFamily: 'Times-Bold', textAlign: 'center' },

    // Row Data
    dataRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    cellTextCenter: { fontSize: 8.5, textAlign: 'center' },
    cellTextLeft: { fontSize: 8.5, textAlign: 'left' },

    // Split Columns for Inspection & Acceptance
    splitHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', backgroundColor: '#fdfdfd' },
    splitColLeft: { flex: 1, borderRightWidth: 1, borderRightColor: '#000', padding: 5, alignItems: 'center' },
    splitColRight: { flex: 1, padding: 5, alignItems: 'center' },
    splitHeaderTitle: { fontSize: 9, fontFamily: 'Times-Bold', textTransform: 'uppercase' },

    splitContentRow: { flexDirection: 'row', minHeight: 140 },
    splitContentLeft: { flex: 1, borderRightWidth: 1, borderRightColor: '#000', padding: 6 },
    splitContentRight: { flex: 1, padding: 6 },

    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    checkboxSquare: { width: 9, height: 9, borderWidth: 1, borderColor: '#000', marginRight: 5, justifyContent: 'center', alignItems: 'center' },
    checkboxCheck: { fontSize: 7, fontFamily: 'Times-Bold' },
    labelText: { fontSize: 8 },

    signSection: { marginTop: 30, alignItems: 'center' },
    signLine: { width: '80%', borderBottomWidth: 1, borderBottomColor: '#000', marginTop: 15, marginBottom: 3 },
    signName: { fontSize: 8.5, fontFamily: 'Times-Bold', textAlign: 'center' },
    signTitle: { fontSize: 8, fontStyle: 'italic', textAlign: 'center', color: '#333' },
    signDateRow: { width: '80%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    signDateLabel: { fontSize: 8 },
    signDateVal: { fontSize: 8, fontFamily: 'Times-Bold' },
});

// --- PDF DOCUMENT COMPONENT ---
interface IARPDFProps {
    iar: VwSupplyIAR;
    items: any[];
}

const IARPDFDocument: React.FC<IARPDFProps> = ({ iar, items }) => {
    return (
        <Document>
            <Page size="A4" style={pdfStyles.page} orientation="portrait">
                <Text style={pdfStyles.appendixText}>Appendix 62</Text>
                <Text style={pdfStyles.mainTitle}>INSPECTION AND ACCEPTANCE REPORT</Text>

                <View style={pdfStyles.entityRow}>
                    <Text style={pdfStyles.entityText}>Entity Name : {iar.entityName || 'ENERGY REGULATORY COMMISSION'}</Text>
                    <Text style={pdfStyles.entityText}>Fund Cluster : {iar.fundCluster || '________________________'}</Text>
                </View>

                {/* Main Table Wrapper */}
                <View style={pdfStyles.tableContainer}>

                    {/* Header Info Grid */}
                    <View style={pdfStyles.headerGrid}>
                        <View style={pdfStyles.headerColLeft}>
                            <Text style={pdfStyles.headerText}>Supplier : {iar.vendor?.name || ''}</Text>
                            <Text style={pdfStyles.headerText}>PO No./Date : {iar.poNumber ? `${iar.poNumber} / ${formatDate(iar.poDate)}` : ''}</Text>
                            <Text style={pdfStyles.headerText}>Requisitioning Office/Dept : {iar.office?.acronym || 'N/A'} {iar.division?.acronym ? `/ ${iar.division.acronym}` : ''}</Text>
                            <Text style={pdfStyles.headerText}>Responsibility Center Code : {iar.centerCode || ''}</Text>
                        </View>
                        <View style={pdfStyles.headerColRight}>
                            <Text style={pdfStyles.headerText}>IAR No. : {iar.iarNumber || ''}</Text>
                            <Text style={pdfStyles.headerText}>Date : {formatDate(iar.iarNumberDate)}</Text>
                            <Text style={pdfStyles.headerText}>Invoice No. : {iar.iarInvoiceNumber || ''}</Text>
                            <Text style={pdfStyles.headerText}>Date : {formatDate(iar.iarInvoiceNumberDate)}</Text>
                        </View>
                    </View>

                    {/* Table Column Headers */}
                    <View style={pdfStyles.colHeaderRow}>
                        <View style={pdfStyles.colStockNo}><Text style={pdfStyles.cellHeaderBold}>Stock/Property No.</Text></View>
                        <View style={pdfStyles.colDesc}><Text style={pdfStyles.cellHeaderBold}>Description</Text></View>
                        <View style={pdfStyles.colUnit}><Text style={pdfStyles.cellHeaderBold}>Unit</Text></View>
                        <View style={pdfStyles.colQty}><Text style={pdfStyles.cellHeaderBold}>Quantity</Text></View>
                    </View>

                    {/* Items Data */}
                    {items.map((item, idx) => (
                        <View key={idx} style={pdfStyles.dataRow}>
                            <View style={pdfStyles.colStockNo}><Text style={pdfStyles.cellTextCenter}>{item.code || '—'}</Text></View>
                            <View style={pdfStyles.colDesc}>
                                <Text style={pdfStyles.cellTextLeft}>
                                    {item.itemDescription || ''}
                                    {item.itemSpecification ? ` (${item.itemSpecification})` : ''}
                                </Text>
                            </View>
                            <View style={pdfStyles.colUnit}><Text style={pdfStyles.cellTextCenter}>{item.measurementUnit?.name || '—'}</Text></View>
                            <View style={pdfStyles.colQty}><Text style={pdfStyles.cellTextCenter}>{item.itemQuantity ?? 0}</Text></View>
                        </View>
                    ))}

                    {/* Inspection & Acceptance Header split */}
                    <View style={pdfStyles.splitHeaderRow}>
                        <View style={pdfStyles.splitColLeft}>
                            <Text style={pdfStyles.splitHeaderTitle}>Inspection</Text>
                        </View>
                        <View style={pdfStyles.splitColRight}>
                            <Text style={pdfStyles.splitHeaderTitle}>Acceptance</Text>
                        </View>
                    </View>

                    {/* Inspection & Acceptance Split Content */}
                    <View style={pdfStyles.splitContentRow}>
                        {/* Inspection Box */}
                        <View style={pdfStyles.splitContentLeft}>
                            <View style={pdfStyles.checkboxContainer}>
                                <View style={pdfStyles.checkboxSquare}><Text style={pdfStyles.checkboxCheck}>✓</Text></View>
                                <Text style={pdfStyles.labelText}>Inspected, verified and found OK as to quantity</Text>
                            </View>
                            <Text style={[pdfStyles.labelText, { marginLeft: 14, marginBottom: 12 }]}>and specifications.</Text>

                            <View style={pdfStyles.signSection}>
                                <View style={pdfStyles.signLine}></View>
                                <Text style={pdfStyles.signName}>INSPECTION COMMITTEE MEMBER</Text>
                                <Text style={pdfStyles.signTitle}>Inspection Officer / Committee</Text>
                                <View style={pdfStyles.signDateRow}>
                                    <Text style={pdfStyles.signDateLabel}>Date :</Text>
                                    <Text style={pdfStyles.signDateVal}>{iar.actualDeliveryDate ? formatDate(iar.actualDeliveryDate) : '________________'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Acceptance Box */}
                        <View style={pdfStyles.splitContentRight}>
                            <View style={pdfStyles.checkboxContainer}>
                                <View style={pdfStyles.checkboxSquare}><Text style={pdfStyles.checkboxCheck}>✓</Text></View>
                                <Text style={pdfStyles.labelText}>Received :</Text>
                            </View>
                            <View style={[pdfStyles.checkboxContainer, { marginLeft: 14 }]}>
                                <View style={pdfStyles.checkboxSquare}><Text style={pdfStyles.checkboxCheck}>✓</Text></View>
                                <Text style={pdfStyles.labelText}>Complete</Text>
                            </View>
                            <View style={[pdfStyles.checkboxContainer, { marginLeft: 14 }]}>
                                <View style={pdfStyles.checkboxSquare}></View>
                                <Text style={pdfStyles.labelText}>Partial (specify quantity) : ______________</Text>
                            </View>

                            <View style={pdfStyles.signSection}>
                                <View style={pdfStyles.signLine}></View>
                                <Text style={pdfStyles.signName}>PROPERTY CUSTODIAN</Text>
                                <Text style={pdfStyles.signTitle}>Supply and/or Property Custodian</Text>
                                <View style={pdfStyles.signDateRow}>
                                    <Text style={pdfStyles.signDateLabel}>Date :</Text>
                                    <Text style={pdfStyles.signDateVal}>{iar.iarNumberDate ? formatDate(iar.iarNumberDate) : '________________'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                </View>
            </Page>
        </Document>
    );
};

// --- MODAL COMPONENT ---
interface IARReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const IARReportModal = ({ isOpen, onClose }: IARReportModalProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearchQuery, setActiveSearchQuery] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const [iarList, setIarList] = useState<VwSupplyIAR[]>([]);
    const [deliveryRecords, setDeliveryRecords] = useState<VwDeliveryRecord[]>([]);
    const [selectedIar, setSelectedIar] = useState<VwSupplyIAR | null>(null);
    const [selectedDelivery, setSelectedDelivery] = useState<VwDeliveryRecord | null>(null);

    const [loading, setLoading] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // Load initial records on open
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
                const iarsWithDR = iarResult.items.filter(iar => iar.drNumber && iar.drNumber.trim() !== '');
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
            const iarsWithDR = iarResult.items.filter(iar => iar.drNumber && iar.drNumber.trim() !== '');
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

        // Find match in our preloaded delivery records list
        const match = deliveryRecords.find(dr => dr.id === iar.recordId || dr.drNumber?.toString() === iar.drNumber?.toString());
        
        if (match && match.items && match.items.length > 0) {
            setSelectedDelivery(match);
        } else {
            // Fallback: try querying single item endpoint (might be missing items in some backend configs, but is a safe fallback)
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

    const handleExportPDF = async () => {
        if (!selectedIar || isPreviewLoading || !selectedDelivery) return;
        setIsGeneratingPDF(true);

        try {
            const blob = await pdf(
                <IARPDFDocument iar={selectedIar} items={selectedDelivery.items || []} />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `IAR_${selectedIar.iarNumber}.pdf`;
            a.click();

            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch (err) {
            console.error("Failed to generate PDF", err);
            toast.error("Failed to generate PDF");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handlePrintPDF = async () => {
        if (!selectedIar || isPreviewLoading || !selectedDelivery) return;
        setIsGeneratingPDF(true);

        try {
            const blob = await pdf(
                <IARPDFDocument iar={selectedIar} items={selectedDelivery.items || []} />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const w = window.open(url);
            if (w) { w.addEventListener('load', () => w.print()); }
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (err) {
            console.error("Failed to print PDF", err);
            toast.error("Failed to print PDF");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return (
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
                                Search and select an IAR record below to view details and generate the official Appendix 62 PDF report.
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
    );
};
