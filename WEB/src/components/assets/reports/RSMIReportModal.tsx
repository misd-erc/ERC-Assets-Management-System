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

// 1. Import your existing PDF library
import {
    pdf,
    Document,
    Page,
    Text,
    View,
    StyleSheet
} from '@react-pdf/renderer';

// 2. Define PDF Styles to match the Excel-style design
const pdfStyles = StyleSheet.create({
    page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica' },
    dateText: { color: '#64748b', marginBottom: 15, fontSize: 10 },

    // Table Styles
    table: {
        width: '100%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 20
    },
    tableRow: { flexDirection: 'row' },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#000' },

    // Column Widths
    colStock: { width: '15%', borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    colItem: { width: '35%', borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    colRis: { width: '20%', borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    colRc: { width: '15%', borderRightWidth: 1, borderRightColor: '#000', padding: 4 },
    colQty: { width: '15%', padding: 4 },

    // Cell Text Styles
    cellHeader: { fontFamily: 'Helvetica-Bold', textAlign: 'center', fontSize: 9 },
    cellText: { fontSize: 9 },
    cellTextCenter: { fontSize: 9, textAlign: 'center' },
    cellTextRight: { fontSize: 9, textAlign: 'right' },

    // Inner Borders for Data Rows
    rowBorderBottom: { borderBottomWidth: 0.5, borderBottomColor: '#cbd5e1' },

    // Subtotal Row
    subtotalRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', borderTopWidth: 0.5, borderTopColor: '#000', backgroundColor: '#f8fafc' },
    subtotalText: { fontFamily: 'Helvetica-Bold', fontSize: 9, textAlign: 'right', padding: 4 },
    subtotalValue: { fontFamily: 'Helvetica-Bold', fontSize: 9, textAlign: 'right', padding: 4, color: '#000' },

    // Marker Row
    markerRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    markerText: { width: '100%', fontFamily: 'Helvetica-Oblique', fontSize: 9, textAlign: 'center', padding: 6 },

    // Signature Block
    certText: { textAlign: 'center', fontSize: 10, marginTop: 10, marginBottom: 40 },
    sigContainer: { flexDirection: 'row', width: '100%' },
    sigBlock: { width: '50%', alignItems: 'center' },
    sigName: { fontFamily: 'Helvetica-Bold', fontSize: 10, textDecoration: 'underline', marginBottom: 2 },
    sigTitle: { fontSize: 10 },
    sigLine: { width: 160, borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 2 }
});

// 3. Create the PDF Document Component
const RSMIPDFDocument = ({ data }: { data: any[] }) => (
    <Document>
        <Page size="A4" style={pdfStyles.page}>
            <Text style={pdfStyles.dateText}>Created: {new Date().toLocaleDateString('en-PH')}</Text>

            <View style={pdfStyles.table}>
                {/* Table Header */}
                <View style={pdfStyles.tableHeaderRow}>
                    <View style={pdfStyles.colStock}><Text style={pdfStyles.cellHeader}>Stock No</Text></View>
                    <View style={pdfStyles.colItem}><Text style={pdfStyles.cellHeader}>Item</Text></View>
                    <View style={pdfStyles.colRis}><Text style={pdfStyles.cellHeader}>RIS No</Text></View>
                    <View style={pdfStyles.colRc}><Text style={pdfStyles.cellHeader}>RC Code</Text></View>
                    <View style={pdfStyles.colQty}><Text style={pdfStyles.cellHeader}>Qty. Issued</Text></View>
                </View>

                {/* Table Body (Grouped) */}
                {data.map((group, gIdx) => (
                    <React.Fragment key={gIdx}>
                        {(group.items || []).map((item: any, iIdx: number) => (
                            <View key={iIdx} style={[pdfStyles.tableRow, pdfStyles.rowBorderBottom]}>
                                <View style={pdfStyles.colStock}>
                                    <Text style={pdfStyles.cellText}>{iIdx === 0 ? (group.stockNumber || '') : ''}</Text>
                                </View>
                                <View style={pdfStyles.colItem}>
                                    <Text style={pdfStyles.cellText}>{iIdx === 0 ? (group.itemDescription || '') : ''}</Text>
                                </View>
                                <View style={pdfStyles.colRis}>
                                    <Text style={pdfStyles.cellTextCenter}>{item.risNumber || ''}</Text>
                                </View>
                                <View style={pdfStyles.colRc}>
                                    <Text style={pdfStyles.cellTextCenter}>{item.responsibilityCenterCode || ''}</Text>
                                </View>
                                <View style={pdfStyles.colQty}>
                                    <Text style={pdfStyles.cellTextRight}>{item.issueQuantity}</Text>
                                </View>
                            </View>
                        ))}

                        {/* Subtotal Row */}
                        <View style={pdfStyles.subtotalRow}>
                            <View style={[pdfStyles.colStock, { borderRightWidth: 0 }]}><Text>{''}</Text></View>
                            <View style={[pdfStyles.colItem, { borderRightWidth: 0 }]}><Text>{''}</Text></View>
                            <View style={[pdfStyles.colRis, { borderRightWidth: 0 }]}><Text>{''}</Text></View>
                            <View style={pdfStyles.colRc}>
                                <Text style={pdfStyles.subtotalText}></Text>
                            </View>
                            <View style={pdfStyles.colQty}>
                                <Text style={pdfStyles.subtotalValue}>{group.total}</Text>
                            </View>
                        </View>
                    </React.Fragment>
                ))}

                {/* Nothing Follows Marker */}
                <View style={pdfStyles.markerRow}>
                    <Text style={pdfStyles.markerText}>****nothing follows****</Text>
                </View>
            </View>

            {/* Certification & Signatures */}
            <Text style={pdfStyles.certText}>I hereby certify to the correctness of the above information</Text>

            <View style={pdfStyles.sigContainer}>
                <View style={pdfStyles.sigBlock}>
                    <Text style={pdfStyles.sigName}>MS. ROSELLE MALAKI GUINTU</Text>
                    <Text style={pdfStyles.sigTitle}>Administrative Officer III</Text>
                </View>
                <View style={pdfStyles.sigBlock}>
                    <View style={pdfStyles.sigLine}></View>
                    <Text style={pdfStyles.sigTitle}>Accounting Section</Text>
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
            const allStockNumbers = data.map((group, index) => group.stockNumber ?? `unknown-stock-${index}`);
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

    // 4. Generate PDF Blob and Download
    const handleExportPDF = async () => {
        if (selectedItems.size === 0) return;
        setIsGeneratingPDF(true);

        try {
            const selectedData = data.filter((group, index) =>
                selectedItems.has(group.stockNumber ?? `unknown-stock-${index}`)
            );

            // Generate blob using the @react-pdf/renderer pdf() utility
            const blob = await pdf(<RSMIPDFDocument data={selectedData} />).toBlob();

            // Trigger standard browser download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `RSMI_Report_${startDate}_to_${endDate}.pdf`;
            a.click();

            // Cleanup
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
                                    data.map((group, index) => {
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
                                                                        {(group.items || []).map((detail, idx) => (
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