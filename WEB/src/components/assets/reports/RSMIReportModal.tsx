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
import { Loader2, Filter, FileText, ChevronDown, ChevronRight, Download, AlertCircle } from 'lucide-react';

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
    page: { padding: 20, fontSize: 8, fontFamily: 'Helvetica', orientation: 'landscape' },
    
    headerContainer: { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 5 },
    headerTitle: { textAlign: 'center', fontFamily: 'Helvetica-Bold', fontSize: 11, marginBottom: 2 },
    headerAgency: { textAlign: 'center', fontSize: 9, marginBottom: 3 },
    headerUnitsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    headerUnitLeft: { fontSize: 7, width: '50%', textAlign: 'left' },
    headerUnitRight: { fontSize: 7, width: '50%', textAlign: 'right' },
    headerMetaRow: { flexDirection: 'row', justifyContent: 'flex-end' },
    headerMeta: { fontSize: 8 },
    
    table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', marginBottom: 15 },
    tableRow: { flexDirection: 'row' },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderBottomWidth: 1, borderBottomColor: '#000' },
    
    colStock: { width: '14%', borderRightWidth: 0.5, borderRightColor: '#000', padding: 3 },
    colItem: { width: '26%', borderRightWidth: 0.5, borderRightColor: '#000', padding: 3 },
    colRis: { width: '11%', borderRightWidth: 0.5, borderRightColor: '#000', padding: 3 },
    colRc: { width: '8%', borderRightWidth: 0.5, borderRightColor: '#000', padding: 3 },
    colQty: { width: '9%', borderRightWidth: 0.5, borderRightColor: '#000', padding: 3 },
    colUnitCost: { width: '9%', borderRightWidth: 0.5, borderRightColor: '#000', padding: 3 },
    colTotalCost: { width: '10%', borderRightWidth: 0.5, borderRightColor: '#000', padding: 3 },
    colAccount: { width: '13%', padding: 3 },
    
    cellHeader: { fontFamily: 'Helvetica-Bold', textAlign: 'center', fontSize: 8 },
    cellText: { fontSize: 7.5 },
    cellTextCenter: { fontSize: 7.5, textAlign: 'center' },
    cellTextRight: { fontSize: 7.5, textAlign: 'right' },
    
    rowBorderBottom: { borderBottomWidth: 0.3, borderBottomColor: '#94a3b8' },
    
    subtotalRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#000', borderTopWidth: 0.5, borderTopColor: '#000', backgroundColor: '#f8fafc' },
    subtotalSpacer: { width: '77%', borderRightWidth: 0.5, borderRightColor: '#000', padding: 3 },
    subtotalLabel: { width: '10%', borderRightWidth: 0.5, borderRightColor: '#000', padding: 3, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    subtotalText: { fontFamily: 'Helvetica-Bold', fontSize: 8, textAlign: 'right' },
    subtotalValue: { width: '13%', padding: 3, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    subtotalNumber: { fontFamily: 'Helvetica-Bold', fontSize: 8, textAlign: 'right' },
    
    markerRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', borderTopWidth: 0.5, borderTopColor: '#000' },
    markerText: { width: '100%', fontFamily: 'Helvetica-Oblique', fontSize: 8, textAlign: 'center', padding: 5 },
    
    certSection: { marginTop: 15, marginBottom: 20 },
    certText: { textAlign: 'left', fontSize: 8.5, marginBottom: 3 },
    postedBy: { fontSize: 8, color: '#475569', marginBottom: 25 },
    
    sigContainer: { flexDirection: 'row', width: '100%', marginTop: 5 },
    sigBlock: { width: '50%', alignItems: 'flex-start' },
    sigName: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, textDecoration: 'underline', marginBottom: 1 },
    sigTitle: { fontSize: 7.5 },
    sigSection: { fontSize: 7.5, marginTop: 1 },
    approvedBy: { fontSize: 7.5, marginTop: 15 },
    sigLine: { width: 160, borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 2, marginTop: 8 }
});

interface RSMIPDFDocumentProps {
    data: any[];
    reportDate: string;
    rsmiNumber: string;
}

const RSMIPDFDocument: React.FC<RSMIPDFDocumentProps> = ({ data, reportDate, rsmiNumber }) => (
    <Document>
        <Page size="A4" style={pdfStyles.page} orientation="landscape">
            <View style={pdfStyles.headerContainer}>
                <Text style={pdfStyles.headerTitle}>REPORT OF SUPPLIES AND MATERIALS ISSUED</Text>
                <Text style={pdfStyles.headerAgency}>ENERGY REGULATORY COMMISSION Agency</Text>
                <View style={pdfStyles.headerMetaRow}>
                    <Text style={pdfStyles.headerMeta}>Date: {reportDate} RSMI: {rsmiNumber}</Text>
                </View>
                <View style={pdfStyles.headerUnitsRow}>
                    <Text style={pdfStyles.headerUnitLeft}>To be filled up in the Supply & Property Unit</Text>
                    <Text style={pdfStyles.headerUnitRight}>To be filled up in the Accounting Unit</Text>
                </View>
            </View>

            <View style={pdfStyles.table}>
                <View style={pdfStyles.tableHeaderRow}>
                    <View style={pdfStyles.colStock}><Text style={pdfStyles.cellHeader}>Stock No</Text></View>
                    <View style={pdfStyles.colItem}><Text style={pdfStyles.cellHeader}>Item</Text></View>
                    <View style={pdfStyles.colRis}><Text style={pdfStyles.cellHeader}>RIS No</Text></View>
                    <View style={pdfStyles.colRc}><Text style={pdfStyles.cellHeader}>RC Code</Text></View>
                    <View style={pdfStyles.colQty}><Text style={pdfStyles.cellHeader}>Qty. Issued</Text></View>
                    <View style={pdfStyles.colUnitCost}><Text style={pdfStyles.cellHeader}>Unit Cost</Text></View>
                    <View style={pdfStyles.colTotalCost}><Text style={pdfStyles.cellHeader}>Total Cost</Text></View>
                    <View style={pdfStyles.colAccount}><Text style={pdfStyles.cellHeader}>Account Code</Text></View>
                </View>

                {data.map((group: any, gIdx: number) => (
                    <React.Fragment key={gIdx}>
                        {(group.items || []).map((item: any, iIdx: number) => {
                            const showStock = iIdx === 0;
                            const unitCost = item.unitCost ?? 0;
                            const qty = item.issueQuantity ?? 0;
                            const totalCost = unitCost * qty;
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
                                    <View style={pdfStyles.colUnitCost}>
                                        <Text style={pdfStyles.cellTextRight}>{unitCost > 0 ? unitCost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</Text>
                                    </View>
                                    <View style={pdfStyles.colTotalCost}>
                                        <Text style={pdfStyles.cellTextRight}>{totalCost > 0 ? totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</Text>
                                    </View>
                                    <View style={pdfStyles.colAccount}>
                                        <Text style={pdfStyles.cellText}>{item.accountCode ?? group.accountCode ?? ''}</Text>
                                    </View>
                                </View>
                            );
                        })}

                        <View style={pdfStyles.subtotalRow}>
                            <View style={pdfStyles.subtotalSpacer}><Text>{''}</Text></View>
                            <View style={pdfStyles.subtotalLabel}>
                                <Text style={pdfStyles.subtotalText}>Total Issued:</Text>
                            </View>
                            <View style={pdfStyles.subtotalValue}>
                                <Text style={pdfStyles.subtotalNumber}>{group.total ?? 0}</Text>
                            </View>
                        </View>
                    </React.Fragment>
                ))}

                <View style={pdfStyles.markerRow}>
                    <Text style={pdfStyles.markerText}>****nothing follows****</Text>
                </View>
            </View>

            <View style={pdfStyles.certSection}>
                <Text style={pdfStyles.certText}>I hereby certify to the correctness of the above information</Text>
                <Text style={pdfStyles.postedBy}>Posted By/Date:</Text>
            </View>

            <View style={pdfStyles.sigContainer}>
                <View style={pdfStyles.sigBlock}>
                    <Text style={pdfStyles.sigName}>MS. ROSELLE MALAKI GUINTU</Text>
                    <Text style={pdfStyles.sigTitle}>Administrative Officer III</Text>
                    <Text style={pdfStyles.sigSection}>Accounting Section</Text>
                </View>
                <View style={pdfStyles.sigBlock}>
                    <View style={pdfStyles.sigLine}></View>
                    <Text style={pdfStyles.approvedBy}>Approved By:</Text>
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

    const isAllSelected = data.length > 0 && selectedItems.size === data.length;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="!max-w-7xl !w-[95vw] max-h-[90vh] flex flex-col p-0 bg-white border-slate-200 shadow-xl overflow-hidden">

                <DialogHeader className="border-b border-slate-100 p-6 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-left">
                            <DialogTitle className="text-xl text-slate-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                Report of Supplies and Materials Issued (RSMI)
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                Generate issuance reports filtered by category and date range.
                            </DialogDescription>
                        </div>
                        <Button
                            variant="outline"
                            className="shadow-sm bg-blue-50 hover:bg-blue-100 border-blue-200"
                            disabled={selectedItems.size === 0 || isGeneratingPDF}
                            onClick={handleExportPDF}
                        >
                            {isGeneratingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                            {isGeneratingPDF ? 'Generating...' : 'Export PDF'}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="p-6 flex-1 min-h-0 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                        <div className="space-y-1.5">
                            <Label className="text-slate-700">Category</Label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className="bg-white">
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
                            <Label className="text-slate-700">Start Date</Label>
                            <Input
                                type="date"
                                className="bg-white"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-slate-700">End Date</Label>
                            <Input
                                type="date"
                                className="bg-white"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        <div className="flex items-end">
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                onClick={handleGenerateReport}
                                disabled={loading || !startDate || !endDate || !categoryId}
                            >
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Filter className="w-4 h-4 mr-2" />}
                                Generate Report
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700 text-sm">
                            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/80">
                                <TableRow>
                                    <TableHead className="w-[40px] px-4 text-center">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[40px] px-2"></TableHead>
                                    <TableHead className="w-[180px]">Stock Number</TableHead>
                                    <TableHead>Item Description</TableHead>
                                    <TableHead className="text-right">Total Issued</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, index) => (
                                        <TableRow key={`skeleton-${index}`}>
                                            {Array.from({ length: 5 }).map((_, colIndex) => (
                                                <TableCell key={`skel-col-${colIndex}`}>
                                                    <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
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
                                                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                                                    onClick={() => toggleRow(safeStockNumber)}
                                                >
                                                    <TableCell onClick={(e) => e.stopPropagation()} className="px-4 text-center">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) => handleSelectItem(safeStockNumber, !!checked)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500">
                                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-slate-900">{group.stockNumber || 'N/A'}</TableCell>
                                                    <TableCell className="font-medium text-slate-700">{group.itemDescription || 'Unknown Item'}</TableCell>
                                                    <TableCell className="text-right font-bold text-red-600">{group.total}</TableCell>
                                                </TableRow>

                                                {isExpanded && (
                                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                                        <TableCell colSpan={5} className="p-0 border-b">
                                                            <div className="p-4 pl-16 border-l-4 border-blue-500 bg-white shadow-inner">
                                                                <Table>
                                                                    <TableHeader className="bg-slate-50">
                                                                        <TableRow>
                                                                            <TableHead className="h-8 py-1 text-xs">RIS Number</TableHead>
                                                                            <TableHead className="h-8 py-1 text-xs">Responsibility Center</TableHead>
                                                                            <TableHead className="h-8 py-1 text-xs text-right">Quantity Issued</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {(group.items || []).map((detail: any, idx: number) => (
                                                                            <TableRow key={idx} className="border-b-0 hover:bg-slate-50">
                                                                                <TableCell className="py-2 text-sm font-medium text-blue-600">
                                                                                    {detail.risNumber || 'N/A'}
                                                                                </TableCell>
                                                                                <TableCell className="py-2 text-sm text-slate-600">
                                                                                    {detail.responsibilityCenterCode || 'N/A'}
                                                                                </TableCell>
                                                                                <TableCell className="py-2 text-sm text-right font-medium text-slate-900">
                                                                                    {detail.issueQuantity}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                                                <div className="p-3 bg-slate-50 rounded-full">
                                                    <Filter className="w-8 h-8 text-slate-400" />
                                                </div>
                                                <p className="font-medium text-slate-900">No report data found</p>
                                                <p className="text-sm">
                                                    Select a category, start date, and end date to generate the RSMI report.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end mt-6">
                        <Button variant="outline" onClick={onClose}>Close</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};