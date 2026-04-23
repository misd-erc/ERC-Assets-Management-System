// src/components/assets/reports/RISReportModal.tsx
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
import { Loader2, Search, Download, Printer, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import { useRISStore } from '@/store/supply/risStore';
import { formatDate } from '@/utils/dateUtils';
import { VwSupplyRIS, VwSupplyRISItem } from '@/types/supply/ris';

import {
    pdf,
    Document,
    Page,
    Text,
    View,
    StyleSheet
} from '@react-pdf/renderer';

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
    colStockNo: { width: '12%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center' },
    colUnit: { width: '8%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center' },
    colDesc: { width: '30%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center' },
    colReqQty: { width: '10%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center' },
    colYes: { width: '8%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center' },
    colNo: { width: '8%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center' },
    colIssQty: { width: '10%', borderRightWidth: 1, borderRightColor: '#000', padding: 4, justifyContent: 'center' },
    colRemarks: { width: '14%', padding: 4, justifyContent: 'center' },

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
    sigValueText: { fontSize: 9, fontFamily: 'Times-Bold', textAlign: 'center' },
});

// --- PDF DOCUMENT COMPONENT ---
interface RISPDFProps {
    ris: VwSupplyRIS;
    items: VwSupplyRISItem[];
}

const RISPDFDocument: React.FC<RISPDFProps> = ({ ris, items }) => {
    // Helpers for signature mapping
    const getFullName = (user: any) => user ? `${user.firstName} ${user.lastName}` : '';
    const getSafeDate = (date: any) => date ? formatDate(date) : '';

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
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}>{getFullName(ris.requestedBySystemUser)}</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}>{getFullName(ris.approvedBySystemUser)}</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}>{getFullName(ris.issuedBySystemUser)}</Text></View>
                            <View style={pdfStyles.sigColDataLast}><Text style={pdfStyles.sigValueText}>{getFullName(ris.receivedBySystemUser)}</Text></View>
                        </View>

                        {/* Designation */}
                        <View style={pdfStyles.sigRow}>
                            <View style={pdfStyles.sigColLabel}><Text style={pdfStyles.sigLabelText}>Designation :</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}> </Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}> </Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}> </Text></View>
                            <View style={pdfStyles.sigColDataLast}><Text style={pdfStyles.sigValueText}> </Text></View>
                        </View>

                        {/* Date */}
                        <View style={pdfStyles.sigRowLast}>
                            <View style={pdfStyles.sigColLabel}><Text style={pdfStyles.sigLabelText}>Date :</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}>{getSafeDate(ris.risRequestedDate)}</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}>{getSafeDate(ris.risApprovedDate)}</Text></View>
                            <View style={pdfStyles.sigColData}><Text style={pdfStyles.sigValueText}>{getSafeDate(ris.risIssuedDate)}</Text></View>
                            <View style={pdfStyles.sigColDataLast}><Text style={pdfStyles.sigValueText}>{getSafeDate(ris.risReceivedDate)}</Text></View>
                        </View>
                    </View>

                </View>
            </Page>
        </Document>
    );
};

// --- MODAL COMPONENT ---
interface RISReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RISReportModal = ({ isOpen, onClose }: RISReportModalProps) => {
    const { risList, currentRISItems, loading, fetchRISs, fetchRISItems } = useRISStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearchQuery, setActiveSearchQuery] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const [selectedRis, setSelectedRis] = useState<VwSupplyRIS | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setActiveSearchQuery('');
            setHasSearched(false);
            setSelectedRis(null);
        }
    }, [isOpen]);

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setHasSearched(true);
        setActiveSearchQuery(searchTerm);
        setSelectedRis(null);

        // Fetch data when searching
        await fetchRISs();
    };

    const filteredRISList = useMemo(() => {
        if (!activeSearchQuery.trim()) return [];

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

    const handleExportPDF = async () => {
        if (!selectedRis || isPreviewLoading) return;
        setIsGeneratingPDF(true);

        try {
            const blob = await pdf(
                <RISPDFDocument ris={selectedRis} items={currentRISItems} />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `RIS_${selectedRis.risNumber}.pdf`;
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
        if (!selectedRis || isPreviewLoading) return;
        setIsGeneratingPDF(true);

        try {
            const blob = await pdf(
                <RISPDFDocument ris={selectedRis} items={currentRISItems} />
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
                            disabled={!searchTerm.trim()}
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
                                                <p className="text-sm">We couldn't find anything matching "{activeSearchQuery}".</p>
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