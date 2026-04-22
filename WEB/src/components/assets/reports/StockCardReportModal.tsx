// src/components/assets/reports/StockCardReportModal.tsx
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
import { Loader2, Search, Download, Printer, Archive, ChevronRight, ChevronDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useSupplyItem } from '@/hooks';
import { useStockCard } from '@/hooks/supply/useStockCard';
import { useStockCardStore } from '@/store/office/stockCardStore';
import { formatDate } from '@/utils/dateUtils';
import { SupplyStockCardItem } from '@/types/supply/stockcard';

import {
    pdf,
    Document,
    Page,
    Text,
    View,
    StyleSheet
} from '@react-pdf/renderer';

// --- HELPER FUNCTION ---
const getAcronym = (text: string | undefined | null): string => {
    if (!text) return '';
    const ignoredWords = ['and', 'of', 'the', 'in', 'for', 'on', 'with', 'at', 'to', 'a', 'an'];
    return text.split(' ').filter(word => !ignoredWords.includes(word.toLowerCase())).map(word => word.charAt(0)).join('').toUpperCase();
};

// --- PDF STYLES (Flat Headers & No Double Lines) ---
const pdfStyles = StyleSheet.create({
    page: { padding: 30, fontSize: 10, fontFamily: 'Times-Roman' },

    outerBorder: { borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#000' },

    titleSection: { textAlign: 'center', paddingTop: 15, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: '#000' },
    mainTitle: { fontSize: 16, fontFamily: 'Times-Bold', marginBottom: 6, letterSpacing: 1 },
    agencyText: { fontSize: 10, fontFamily: 'Times-Roman' },
    agencyItalic: { fontSize: 10, fontFamily: 'Times-Italic', marginTop: 2, textDecoration: 'underline' },

    infoRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    infoColLeft: { width: '60%', borderRightWidth: 1, borderRightColor: '#000', padding: 5, justifyContent: 'center' },
    infoColRight: { width: '40%', padding: 5, justifyContent: 'center' },

    tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', alignItems: 'stretch', backgroundColor: '#f8fafc' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', alignItems: 'stretch' },

    colBorderRight: { borderRightWidth: 1, borderRightColor: '#000' },

    colDate: { width: '14%', padding: 4, justifyContent: 'center' },
    colRef: { width: '16%', padding: 4, justifyContent: 'center' },
    colReceiptQty: { width: '12%', padding: 4, justifyContent: 'center' },
    colIssueQty: { width: '12%', padding: 4, justifyContent: 'center' },
    colOffice: { width: '22%', padding: 4, justifyContent: 'center' },
    colBalanceQty: { width: '12%', padding: 4, justifyContent: 'center' },
    colDays: { width: '12%', padding: 4, justifyContent: 'center' },

    cellHeaderBold: { fontFamily: 'Times-Bold', fontSize: 9, textAlign: 'center' },
    cellTextCenter: { fontSize: 9, textAlign: 'center', fontFamily: 'Times-Roman' }
});

// --- PDF DOCUMENT COMPONENT ---
interface StockCardPDFProps {
    items: SupplyStockCardItem[];
    stockNumber: string;
    description: string;
    unit: string;
    reorderPoint: string | number;
}

const StockCardPDFDocument: React.FC<StockCardPDFProps> = ({ items, stockNumber, description, unit, reorderPoint }) => {
    const safeUnit = unit || (items.length > 0 ? (items[0] as any).supplyItem?.measurementUnit?.name : '') || 'piece';
    const safeReorderPoint = reorderPoint !== undefined && reorderPoint !== null ? reorderPoint : '';

    return (
        <Document>
            <Page size="A4" style={pdfStyles.page} orientation="portrait">
                <View style={pdfStyles.outerBorder}>

                    <View fixed>
                        <View style={pdfStyles.titleSection}>
                            <Text style={pdfStyles.mainTitle}>STOCK CARD</Text>
                            <Text style={pdfStyles.agencyText}>ENERGY REGULATORY COMMISSION</Text>
                            <Text style={pdfStyles.agencyItalic}>Agency</Text>
                        </View>

                        <View style={pdfStyles.infoRow}>
                            <View style={pdfStyles.infoColLeft}>
                                <Text>{`Item Description : ${description}`}</Text>
                            </View>
                            <View style={pdfStyles.infoColRight}>
                                <Text>{`Stock No. : ${stockNumber}`}</Text>
                            </View>
                        </View>

                        <View style={pdfStyles.infoRow}>
                            <View style={pdfStyles.infoColLeft}>
                                <Text>{`Unit of Measurement : ${safeUnit}`}</Text>
                            </View>
                            <View style={pdfStyles.infoColRight}>
                                <Text>{`Re-order Point : ${safeReorderPoint}`}</Text>
                            </View>
                        </View>

                        {/* FLAT TABLE HEADER */}
                        <View style={pdfStyles.tableHeaderRow}>
                            <View style={[pdfStyles.colDate, pdfStyles.colBorderRight]}>
                                <Text style={pdfStyles.cellHeaderBold}>Date</Text>
                            </View>
                            <View style={[pdfStyles.colRef, pdfStyles.colBorderRight]}>
                                <Text style={pdfStyles.cellHeaderBold}>Reference</Text>
                            </View>
                            <View style={[pdfStyles.colReceiptQty, pdfStyles.colBorderRight]}>
                                <Text style={pdfStyles.cellHeaderBold}>Receipt{"\n"}Qty.</Text>
                            </View>
                            <View style={[pdfStyles.colIssueQty, pdfStyles.colBorderRight]}>
                                <Text style={pdfStyles.cellHeaderBold}>Issue{"\n"}Qty.</Text>
                            </View>
                            <View style={[pdfStyles.colOffice, pdfStyles.colBorderRight]}>
                                <Text style={pdfStyles.cellHeaderBold}>Office</Text>
                            </View>
                            <View style={[pdfStyles.colBalanceQty, pdfStyles.colBorderRight]}>
                                <Text style={pdfStyles.cellHeaderBold}>Balance{"\n"}Qty.</Text>
                            </View>
                            <View style={pdfStyles.colDays}>
                                <Text style={pdfStyles.cellHeaderBold}>No. of Days to{"\n"}Consume</Text>
                            </View>
                        </View>
                    </View>

                    {/* Table Data - No extra padding rows */}
                    {items.map((item, idx) => {
                        const office = item.office?.name ? `${getAcronym(item.office.name)} ${getAcronym(item.division?.name)}` : '';
                        const receipt = item.addedStockQuantity > 0 ? item.addedStockQuantity : '';
                        const issue = item.issuedStockQuantity > 0 ? item.issuedStockQuantity : '';

                        return (
                            <View key={idx} style={pdfStyles.tableRow} wrap={false}>
                                <View style={[pdfStyles.colDate, pdfStyles.colBorderRight]}><Text style={pdfStyles.cellTextCenter}>{formatDate(item.createdAt)}</Text></View>
                                <View style={[pdfStyles.colRef, pdfStyles.colBorderRight]}><Text style={pdfStyles.cellTextCenter}>{item.stockNumber}</Text></View>
                                <View style={[pdfStyles.colReceiptQty, pdfStyles.colBorderRight]}><Text style={pdfStyles.cellTextCenter}>{receipt}</Text></View>
                                <View style={[pdfStyles.colIssueQty, pdfStyles.colBorderRight]}><Text style={pdfStyles.cellTextCenter}>{issue}</Text></View>
                                <View style={[pdfStyles.colOffice, pdfStyles.colBorderRight]}><Text style={pdfStyles.cellTextCenter}>{office}</Text></View>
                                <View style={[pdfStyles.colBalanceQty, pdfStyles.colBorderRight]}><Text style={pdfStyles.cellTextCenter}>{item.newStockQuantity}</Text></View>
                                <View style={pdfStyles.colDays}><Text style={pdfStyles.cellTextCenter}>{item.issuedStockQuantity ? '30' : ''}</Text></View>
                            </View>
                        );
                    })}

                    {/* Safe fallback if empty */}
                    {items.length === 0 && (
                        <View style={pdfStyles.tableRow}>
                            <View style={{ width: '100%', padding: 10 }}>
                                <Text style={pdfStyles.cellTextCenter}>No movement records found.</Text>
                            </View>
                        </View>
                    )}

                </View>
            </Page>
        </Document>
    );
};

// --- MODAL COMPONENT ---
interface StockCardReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const StockCardReportModal = ({ isOpen, onClose }: StockCardReportModalProps) => {
    const { vwSupplyGroups, loading: loadingGroups, fetchSupplyGroupedItems } = useSupplyItem();
    const { fetchStockCardItems } = useStockCard();

    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearchQuery, setActiveSearchQuery] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const [selectedGroup, setSelectedGroup] = useState<{ stockNumber: string, description: string, unit: string, reorderPoint: string | number } | null>(null);
    const [previewData, setPreviewData] = useState<SupplyStockCardItem[]>([]);

    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setActiveSearchQuery('');
            setHasSearched(false);
            setSelectedGroup(null);
            setPreviewData([]);
        }
    }, [isOpen]);

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setHasSearched(true);
        setActiveSearchQuery(searchTerm);
        setSelectedGroup(null);
        setPreviewData([]);

        await fetchSupplyGroupedItems();
    };

    const filteredGroups = useMemo(() => {
        if (!activeSearchQuery.trim()) return [];

        const query = activeSearchQuery.toLowerCase();
        return vwSupplyGroups.filter(
            (g) =>
                g.code?.toLowerCase().includes(query) ||
                g.description?.toLowerCase().includes(query)
        );
    }, [vwSupplyGroups, activeSearchQuery]);

    const handleSelectRow = async (code: string, description: string, unit: string, reorderPoint: string | number) => {
        if (selectedGroup?.stockNumber === code) {
            setSelectedGroup(null);
            setPreviewData([]);
            return;
        }

        setSelectedGroup({ stockNumber: code, description, unit, reorderPoint });
        setIsPreviewLoading(true);

        try {
            useStockCardStore.setState({ pageSize: 9999 });
            await fetchStockCardItems(code, description, 1);
            const items = useStockCardStore.getState().stockCardItems;

            useStockCardStore.setState({ pageSize: 10 });
            useStockCardStore.getState().reset();

            setPreviewData(items);
        } catch (error) {
            toast.error("Failed to load stock ledger data.");
            setPreviewData([]);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleExportPDF = async () => {
        if (!selectedGroup || isPreviewLoading) return;
        setIsGeneratingPDF(true);

        try {
            const blob = await pdf(
                <StockCardPDFDocument
                    items={previewData}
                    stockNumber={selectedGroup.stockNumber}
                    description={selectedGroup.description}
                    unit={selectedGroup.unit}
                    reorderPoint={selectedGroup.reorderPoint}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `StockCard_${selectedGroup.stockNumber}.pdf`;
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
        if (!selectedGroup || isPreviewLoading) return;
        setIsGeneratingPDF(true);

        try {
            const blob = await pdf(
                <StockCardPDFDocument
                    items={previewData}
                    stockNumber={selectedGroup.stockNumber}
                    description={selectedGroup.description}
                    unit={selectedGroup.unit}
                    reorderPoint={selectedGroup.reorderPoint}
                />
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
                                <Archive className="w-6 h-6 text-indigo-600" />
                                Stock Card Report
                            </DialogTitle>
                            <DialogDescription className="mt-1.5 text-slate-500">
                                Search for an item below to view its real-time ledger and generate an official printable report.
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="shadow-sm font-medium transition-all"
                                disabled={!selectedGroup || isGeneratingPDF || isPreviewLoading}
                                onClick={handlePrintPDF}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print Document
                            </Button>
                            <Button
                                className="shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all"
                                disabled={!selectedGroup || isGeneratingPDF || isPreviewLoading}
                                onClick={handleExportPDF}
                            >
                                {isGeneratingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                {isGeneratingPDF ? 'Compiling Ledger...' : 'Save as PDF'}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 flex-1 min-h-0 flex flex-col bg-white">

                    <form onSubmit={handleSearchSubmit} className="flex gap-3 w-full md:w-[500px] mb-5">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <Input
                                placeholder="Enter stock number or description..."
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
                                    <TableHead className="w-[220px] font-semibold text-slate-700">Stock Number</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Item Description</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700 w-[140px]">Reorder Point</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700 w-[140px]">Current Stock</TableHead>
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
                                                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Type a stock number or item description above to locate the inventory ledger.</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : loadingGroups ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={`skeleton-${index}`}>
                                            {Array.from({ length: 6 }).map((_, colIndex) => (
                                                <TableCell key={`skel-col-${colIndex}`}>
                                                    <div className="h-4 bg-slate-100 rounded animate-pulse w-full"></div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : filteredGroups.length > 0 ? (
                                    filteredGroups.map((group, index) => {
                                        const isSelected = selectedGroup?.stockNumber === group.code;

                                        const supplyItemInfo = (group as any).supplyItem || group;
                                        const unitName = supplyItemInfo.measurementUnit?.name || supplyItemInfo.unit?.name || 'piece';

                                        // Exact Reorder Point Logic retained
                                        const rawReorderPoint = (group as any).reorderPoint ?? '';

                                        const reorderPointNum = Number(rawReorderPoint) || 0;
                                        const currentStockNum = Number(group.totalCurrentStock) || 0;

                                        // Visual flag if stock is running low
                                        const isLowStock = currentStockNum <= reorderPointNum;

                                        return (
                                            <React.Fragment key={index}>
                                                <TableRow
                                                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/60 hover:bg-indigo-50/80' : 'hover:bg-slate-50'}`}
                                                    onClick={() => handleSelectRow(group.code || '', group.description || '', unitName, rawReorderPoint)}
                                                >
                                                    <TableCell onClick={(e) => e.stopPropagation()} className="px-4 text-center">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => handleSelectRow(group.code || '', group.description || '', unitName, rawReorderPoint)}
                                                            className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600 pointer-events-none">
                                                            {isSelected ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="font-medium text-slate-900">{group.code}</TableCell>
                                                    <TableCell className="text-slate-600">{group.description}</TableCell>
                                                    <TableCell className="text-right text-slate-500">{rawReorderPoint || '—'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <span className={`inline-flex items-center font-bold ${isLowStock ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                            {isLowStock && <AlertCircle className="w-3.5 h-3.5 mr-1.5 opacity-80" />}
                                                            {group.totalCurrentStock}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>

                                                {isSelected && (
                                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                                        <TableCell colSpan={6} className="p-0 border-b">
                                                            <div className="bg-slate-50/80 border-l-[3px] border-indigo-500 shadow-inner px-8 py-5 max-h-[320px] overflow-y-auto">
                                                                {isPreviewLoading ? (
                                                                    <div className="flex flex-col items-center justify-center py-8 text-indigo-600">
                                                                        <Loader2 className="w-7 h-7 animate-spin mb-3" />
                                                                        <p className="text-sm font-medium">Fetching Stock Ledger Data...</p>
                                                                    </div>
                                                                ) : previewData.length > 0 ? (
                                                                    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                                                                        <Table>
                                                                            <TableHeader className="bg-slate-100/50">
                                                                                <TableRow className="hover:bg-transparent">
                                                                                    <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600">Date</TableHead>
                                                                                    <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600 text-center">Reference</TableHead>
                                                                                    <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600 text-center">Receipt Qty</TableHead>
                                                                                    <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600 text-center">Issue Qty</TableHead>
                                                                                    <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600 text-center">Office</TableHead>
                                                                                    <TableHead className="h-9 py-2 text-xs font-semibold text-slate-600 text-center">Balance Qty</TableHead>
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                                {previewData.map((item, idx) => (
                                                                                    <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                                                                                        <TableCell className="py-2.5 text-xs text-slate-500">{formatDate(item.createdAt)}</TableCell>
                                                                                        <TableCell className="py-2.5 text-xs text-center font-medium text-slate-700">{item.stockNumber}</TableCell>
                                                                                        <TableCell className="py-2.5 text-xs text-center font-medium text-emerald-600">{item.addedStockQuantity > 0 ? `+${item.addedStockQuantity}` : '—'}</TableCell>
                                                                                        <TableCell className="py-2.5 text-xs text-center font-medium text-rose-600">{item.issuedStockQuantity > 0 ? `-${item.issuedStockQuantity}` : '—'}</TableCell>
                                                                                        <TableCell className="py-2.5 text-xs text-center text-slate-500">{item.office?.name ? `${getAcronym(item.office?.name)} ${getAcronym(item.division?.name)}` : '—'}</TableCell>
                                                                                        <TableCell className="py-2.5 text-xs text-center font-bold text-slate-900">{item.newStockQuantity}</TableCell>
                                                                                    </TableRow>
                                                                                ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                                                                        <Archive className="w-10 h-10 text-slate-200 mb-3" />
                                                                        <p className="text-sm font-medium text-slate-500">No movement history found for this item.</p>
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
                                                    <Archive className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="font-medium text-slate-900 text-lg">No items found</p>
                                                <p className="text-sm">We couldn't find anything matching "{searchTerm}".</p>
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