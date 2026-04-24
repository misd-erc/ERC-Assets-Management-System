// src/components/assets/reports/RSMIReportModal.tsx
import React, { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Filter, FileText, ChevronDown, ChevronRight, Download, AlertCircle, Printer } from 'lucide-react';

import { useRSMIReport } from '@/hooks/supply/useRSMIReport';
import { getCategories } from '@/api/asset/inventoryApi';

import {
    pdf,
    Document,
    Page,
    Text,
    View,
    StyleSheet
} from '@react-pdf/renderer';

const pdfStyles = StyleSheet.create({
    page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica' },

    // Header Styles
    headerContainer: { marginBottom: 10 },
    headerTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
    headerAgency: { fontSize: 10, textAlign: 'center', marginBottom: 10 },

    headerCombinedRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 5
    },
    headerUnitLeft: { fontSize: 10, fontStyle: 'italic' },
    headerMeta: { fontSize: 10 },

    // Table Styles
    table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', marginBottom: 20, marginTop: 5 },
    tableRow: { flexDirection: 'row' },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#000' },

    colStock: { width: '15%', borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    colItem: { width: '40%', borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    colRis: { width: '15%', borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    colRc: { width: '15%', borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    colQty: { width: '15%', padding: 4 },

    cellHeader: { fontFamily: 'Helvetica-Bold', textAlign: 'center', fontSize: 9 },
    cellText: { fontSize: 9 },
    cellTextCenter: { fontSize: 9, textAlign: 'center' },
    cellTextRight: { fontSize: 9, textAlign: 'right' },
    rowBorderBottom: { borderBottomWidth: 0.5, borderBottomColor: '#cbd5e1' },

    markerRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    markerText: { width: '100%', fontFamily: 'Helvetica-Oblique', fontSize: 9, textAlign: 'center', padding: 6 },

    // --- BOTTOM SECTION ---
    bottomSection: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        marginTop: 15,
        height: 70
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
    certText: { fontSize: 10 },
    sigBlockLeft: {
        alignItems: 'center',
        width: '80%'
    },
    sigName: { fontFamily: 'Helvetica-Bold', fontSize: 10, textDecoration: 'underline', marginBottom: 2 },
    sigTitle: { fontSize: 10, textAlign: 'center' },
    sigSection: { fontSize: 10, textAlign: 'center' },

    // Right Column Elements
    postedByText: {
        fontSize: 10,
        width: 150,
        textAlign: 'left'
    },
    sigBlockRight: {
        width: 150,
        alignItems: 'center'
    },
    sigLineRight: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        marginBottom: 2,
        height: 10
    },
    approvedBy: {
        fontSize: 10,
        textAlign: 'center'
    }
});

interface RSMIPDFDocumentProps {
    data: any[];
    reportDate: string;
    rsmiNumber: string;
}

const RSMIPDFDocument: React.FC<RSMIPDFDocumentProps> = ({ data, reportDate, rsmiNumber }) => (
    <Document>
        <Page size="A4" style={pdfStyles.page} orientation="landscape">

            {/* HEADER */}
            <View style={pdfStyles.headerContainer}>
                <Text style={pdfStyles.headerTitle}>REPORT OF SUPPLIES AND MATERIALS ISSUED</Text>
                <Text style={pdfStyles.headerAgency}>ENERGY REGULATORY COMMISSION Agency</Text>

                {/* Combined Row for Y-Axis alignment */}
                <View style={pdfStyles.headerCombinedRow}>
                    <Text style={pdfStyles.headerUnitLeft}>To be filled up in the Supply & Property Unit</Text>
                    <Text style={pdfStyles.headerMeta}>Date: {reportDate}   RSMI: {rsmiNumber}</Text>
                </View>
            </View>

            {/* TABLE */}
            <View style={pdfStyles.table}>
                <View style={pdfStyles.tableHeaderRow}>
                    <View style={pdfStyles.colStock}><Text style={pdfStyles.cellHeader}>Stock No</Text></View>
                    <View style={pdfStyles.colItem}><Text style={pdfStyles.cellHeader}>Item</Text></View>
                    <View style={pdfStyles.colRis}><Text style={pdfStyles.cellHeader}>RIS No</Text></View>
                    <View style={pdfStyles.colRc}><Text style={pdfStyles.cellHeader}>RC Code</Text></View>
                    <View style={pdfStyles.colQty}><Text style={pdfStyles.cellHeader}>Qty. Issued</Text></View>
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
                                        <Text style={pdfStyles.cellTextCenter}>{item.responsibilityCenterCode ?? ''}</Text>
                                    </View>
                                    <View style={pdfStyles.colQty}>
                                        <Text style={pdfStyles.cellTextRight}>{qty}</Text>
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
                        <Text style={pdfStyles.sigName}>MS. ROSELLE MALAKI GUINTU</Text>
                        <Text style={pdfStyles.sigTitle}>Administrative Officer III</Text>
                        <Text style={pdfStyles.sigSection}>Accounting Section</Text>
                    </View>
                </View>

                <View style={pdfStyles.bottomColRight}>
                    <Text style={pdfStyles.postedByText}>Posted By/Date:</Text>
                    <View style={pdfStyles.sigBlockRight}>
                        <View style={pdfStyles.sigLineRight}></View>
                        <Text style={pdfStyles.approvedBy}>Approved By:</Text>
                    </View>
                </View>

            </View>

        </Page>
    </Document>
);

interface RSMIReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RSMIReportModal = ({ isOpen, onClose }: RSMIReportModalProps) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');

    const [categories, setCategories] = useState<any[]>([]);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const { data, loading, error, fetchReport } = useRSMIReport();

    useEffect(() => {
        if (isOpen) {
            getCategories().then(categoriesData => {
                setCategories(categoriesData);
            });
        }
    }, [isOpen]);

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
        await fetchReport(categoryId, startDate, endDate);
        setExpandedRows({});
        setSelectedItems(new Set());
    };

    const handleExportPDF = async () => {
        if (selectedItems.size === 0) return;
        setIsGeneratingPDF(true);

        try {
            const selectedData = data.filter((group: any, index: number) =>
                selectedItems.has(group.stockNumber ?? `unknown-stock-${index}`)
            );

            const reportDate = startDate ? new Date(startDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: '2-digit' }) : new Date().toLocaleDateString('en-PH');
            const rsmiNumber = `RSMI-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

            const blob = await pdf(<RSMIPDFDocument data={selectedData} reportDate={reportDate} rsmiNumber={rsmiNumber} />).toBlob();

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `RSMI_Report_${startDate}_to_${endDate}.pdf`;
            a.click();

            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch (err) {
            console.error("Failed to generate PDF", err);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handlePrintPDF = async () => {
        if (selectedItems.size === 0) return;
        setIsGeneratingPDF(true);

        try {
            const selectedData = data.filter((group: any, index: number) =>
                selectedItems.has(group.stockNumber ?? `unknown-stock-${index}`)
            );

            const reportDate = startDate ? new Date(startDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: '2-digit' }) : new Date().toLocaleDateString('en-PH');
            const rsmiNumber = `RSMI-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

            const blob = await pdf(<RSMIPDFDocument data={selectedData} reportDate={reportDate} rsmiNumber={rsmiNumber} />).toBlob();
            const url = URL.createObjectURL(blob);
            const w = window.open(url);
            if (w) { w.addEventListener('load', () => w.print()); }
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (err) {
            console.error("Failed to print PDF", err);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const isAllSelected = data.length > 0 && selectedItems.size === data.length;

    return (
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="space-y-1.5">
                            <Label className="text-slate-700 font-medium">Category</Label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className="bg-white border-slate-300 focus:ring-indigo-500 shadow-sm">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
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
                                                                                <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600">Responsibility Center</TableHead>
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
                                                                                        {detail.responsibilityCenterCode || 'N/A'}
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

                </div>
            </DialogContent>
        </Dialog>
    );
};