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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ppeApi } from '@/api/asset/ppe';
import { seApi } from '@/api/asset/se';
import { getCategories } from '@/api/asset/inventoryApi';
import { PPEAsset } from '@/types/asset/ppe';
import { SEAsset } from '@/types/supply/se';
import { getAuthParams } from '@/utils/auth';
import { toast } from 'sonner';
import {
    CalendarIcon,
    CheckSquare,
    ClipboardList,
    Download,
    Filter,
    Loader2,
    Printer,
    Search,
    Square,
    TrendingUp,
    X,
} from 'lucide-react';
import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
    pdf,
} from '@react-pdf/renderer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryCountFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type AssetGroup = 'PPE' | 'SE';
type AnyAsset = PPEAsset | SEAsset;

const CONDITIONS = ['All', 'Working', 'Not Working', 'IIRUP', 'Disposed', 'Missing'] as const;
type ConditionFilter = typeof CONDITIONS[number];

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Safely extract a display string from object or primitive */
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

const field = (obj: AnyAsset | Record<string, unknown>, camel: string, snake: string): unknown =>
    (obj as Record<string, unknown>)?.[camel] ?? (obj as Record<string, unknown>)?.[snake] ?? '';

const formatCurrency = (val?: number | null): string => {
    if (val === undefined || val === null || isNaN(val)) return '';
    return val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDateDisplay = (value?: string): string => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' });
};

const todayInputValue = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const getAssetId = (a: AnyAsset, index: number): string =>
    String((a as Record<string, unknown>).id ?? (a as SEAsset).ptaId ?? index);

const getPropertyNo = (a: AnyAsset): string =>
    asStr(field(a as Record<string, unknown>, 'propertyNumber', 'property_number'));

const getDescription = (a: AnyAsset): string =>
    asStr((a as Record<string, unknown>).description);

const getUnitValue = (a: AnyAsset): number =>
    Number(field(a as Record<string, unknown>, 'unitValue', 'unit_value')) || 0;

const getCondition = (a: AnyAsset): string =>
    asStr((a as Record<string, unknown>).condition);

const getCategory = (a: AnyAsset): string =>
    asStr((a as Record<string, unknown>).category);

// â”€â”€â”€ PDF Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    title: { textAlign: 'center', fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
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
    colDesc: { width: '22%' },
    colOldPropNo: { width: '11%' },
    colNewPropNo: { width: '11%' },
    colUOM: { width: '6%' },
    colUnitValue: { width: '8%' },
    colQtyPC: { width: '6%' },
    colQtyPhysical: { width: '6%' },
    colLocation: { width: '7%' },
    colCondition: { width: '8%' },
    colRemarks: { width: '10%' },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    signatureCol: { width: '45%' },
    footerLabel: { fontSize: 8, marginBottom: 12 },
    signatureLine: { borderTopWidth: 1, borderTopColor: '#000', paddingTop: 2, textAlign: 'center', fontSize: 7 },
});

interface ICFRow {
    article: string;
    description: string;
    oldPropertyNo: string;
    newPropertyNo: string;
    unitOfMeasurement: string;
    unitValue: string;
    qtyPropertyCard: string;
    qtyPhysicalCount: string;
    location: string;
    condition: string;
    remarks: string;
}

const buildRows = (assets: any[]): ICFRow[] =>
    assets.map((a) => ({
        article: asStr(a.category),
        description: asStr(a.description),
        oldPropertyNo: asStr(field(a, 'propertyNumber', 'property_number')),
        newPropertyNo: '',
        unitOfMeasurement: asStr(field(a, 'unitOfMeasurement', 'unit_of_measurement')) || 'pc',
        unitValue: formatCurrency(Number(field(a, 'unitValue', 'unit_value')) || 0),
        qtyPropertyCard: '1',
        qtyPhysicalCount: '',
        location: (() => {
            const movements: any[] = a.movements || a.history || [];
            const current = movements.find((m: any) => m.isCurrent) || movements[0];
            if (!current) return '';
            const div = asStr(current.division) || asStr(current.actual_division);
            const off = asStr(current.office);
            return div || off;
        })(),
        condition: asStr(a.condition),
        remarks: '',
    }));

interface ICFDocumentProps {
    rows: ICFRow[];
    group: AssetGroup;
    accountGroup: string;
    sheetNo: string;
    sheetOf: string;
    preparedBy: string;
    reviewedBy: string;
}

const ICFDocument: React.FC<ICFDocumentProps> = ({
    rows, group, accountGroup, sheetNo, sheetOf, preparedBy, reviewedBy,
}) => {
    const MIN_ROWS = 15;
    const padded = rows.length < MIN_ROWS
        ? [...rows, ...Array.from({ length: MIN_ROWS - rows.length }, (): ICFRow => ({
            article: '', description: '', oldPropertyNo: '', newPropertyNo: '',
            unitOfMeasurement: '', unitValue: '', qtyPropertyCard: '', qtyPhysicalCount: '',
            location: '', condition: '', remarks: '',
        }))]
        : rows;

    return (
        <Document>
            <Page size="LEGAL" orientation="landscape" style={pdfStyles.page}>
                <Text style={pdfStyles.annexLabel}>Annex A.</Text>
                <Text style={pdfStyles.orgName}>ENERGY REGULATORY COMMISSION</Text>
                <Text style={pdfStyles.title}>Inventory Count Form</Text>

                <View style={pdfStyles.metaRow}>
                    <Text style={pdfStyles.metaText}>
                        <Text style={pdfStyles.metaLabel}>{group === 'PPE' ? 'PPE' : 'Semi-Expendable'} Account Group: </Text>
                        {accountGroup}
                    </Text>
                    <Text style={pdfStyles.metaText}>
                        <Text style={pdfStyles.metaLabel}>Sheet No. </Text>{sheetNo}
                        <Text style={pdfStyles.metaLabel}>  of  </Text>{sheetOf}
                    </Text>
                </View>

                <View style={pdfStyles.table}>
                    {/* Header */}
                    <View style={[pdfStyles.tableRow, pdfStyles.headerRow, pdfStyles.borderBottom]}>
                        <View style={[pdfStyles.cell, pdfStyles.colNo, pdfStyles.borderRight]}><Text style={pdfStyles.headerText}>No.</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colArticle, pdfStyles.borderRight]}><Text style={pdfStyles.headerText}>Article/Item</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colDesc, pdfStyles.borderRight]}><Text style={pdfStyles.headerText}>Description</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colOldPropNo, pdfStyles.borderRight]}><Text style={pdfStyles.headerText}>Old Property{'\n'}No. Assigned</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colNewPropNo, pdfStyles.borderRight]}><Text style={pdfStyles.headerText}>New Property{'\n'}No. Assigned{'\n'}(validation)</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colUOM, pdfStyles.borderRight]}><Text style={pdfStyles.headerText}>Unit of{'\n'}Meas.</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colUnitValue, pdfStyles.borderRight]}><Text style={pdfStyles.headerText}>Unit Value</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colQtyPC, pdfStyles.borderRight]}><Text style={pdfStyles.headerText}>Qty per{'\n'}Property{'\n'}Card</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colQtyPhysical, pdfStyles.borderRight]}><Text style={pdfStyles.headerText}>Qty per{'\n'}Physical{'\n'}Count</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colLocation, pdfStyles.borderRight]}><Text style={pdfStyles.headerText}>Location/{'\n'}Whereabouts</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colCondition, pdfStyles.borderRight]}><Text style={pdfStyles.headerText}>Condition</Text></View>
                        <View style={[pdfStyles.cell, pdfStyles.colRemarks]}><Text style={pdfStyles.headerText}>Remarks</Text></View>
                    </View>

                    {/* Data rows */}
                    {padded.map((row, idx) => (
                        <View key={idx} style={[pdfStyles.tableRow, idx < padded.length - 1 ? pdfStyles.borderBottom : {}]}>
                            <View style={[pdfStyles.cell, pdfStyles.colNo, pdfStyles.borderRight]}>
                                <Text style={pdfStyles.cellText}>{idx < rows.length ? idx + 1 : ''}</Text>
                            </View>
                            <View style={[pdfStyles.cell, pdfStyles.colArticle, pdfStyles.borderRight]}>
                                <Text style={pdfStyles.cellTextLeft}>{row.article}</Text>
                            </View>
                            <View style={[pdfStyles.cell, pdfStyles.colDesc, pdfStyles.borderRight]}>
                                <Text style={pdfStyles.cellTextLeft}>{row.description}</Text>
                            </View>
                            <View style={[pdfStyles.cell, pdfStyles.colOldPropNo, pdfStyles.borderRight]}>
                                <Text style={pdfStyles.cellText}>{row.oldPropertyNo}</Text>
                            </View>
                            <View style={[pdfStyles.cell, pdfStyles.colNewPropNo, pdfStyles.borderRight]}>
                                <Text style={pdfStyles.cellText}>{row.newPropertyNo}</Text>
                            </View>
                            <View style={[pdfStyles.cell, pdfStyles.colUOM, pdfStyles.borderRight]}>
                                <Text style={pdfStyles.cellText}>{row.unitOfMeasurement}</Text>
                            </View>
                            <View style={[pdfStyles.cell, pdfStyles.colUnitValue, pdfStyles.borderRight]}>
                                <Text style={{ ...pdfStyles.cellText, textAlign: 'right' }}>{row.unitValue}</Text>
                            </View>
                            <View style={[pdfStyles.cell, pdfStyles.colQtyPC, pdfStyles.borderRight]}>
                                <Text style={pdfStyles.cellText}>{row.qtyPropertyCard}</Text>
                            </View>
                            <View style={[pdfStyles.cell, pdfStyles.colQtyPhysical, pdfStyles.borderRight]}>
                                <Text style={pdfStyles.cellText}>{row.qtyPhysicalCount}</Text>
                            </View>
                            <View style={[pdfStyles.cell, pdfStyles.colLocation, pdfStyles.borderRight]}>
                                <Text style={pdfStyles.cellTextLeft}>{row.location}</Text>
                            </View>
                            <View style={[pdfStyles.cell, pdfStyles.colCondition, pdfStyles.borderRight]}>
                                <Text style={pdfStyles.cellText}>{row.condition}</Text>
                            </View>
                            <View style={[pdfStyles.cell, pdfStyles.colRemarks]}>
                                <Text style={pdfStyles.cellTextLeft}>{row.remarks}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={pdfStyles.footerRow}>
                    <View style={pdfStyles.signatureCol}>
                        <Text style={pdfStyles.footerLabel}>Prepared By:</Text>
                        <Text style={pdfStyles.signatureLine}>{preparedBy || ' '}</Text>
                        <Text style={[pdfStyles.signatureLine, { borderTopWidth: 0, paddingTop: 0 }]}>Clerk of Court / OIC</Text>
                    </View>
                    <View style={pdfStyles.signatureCol}>
                        <Text style={pdfStyles.footerLabel}>Reviewed By:</Text>
                        <Text style={pdfStyles.signatureLine}>{reviewedBy || ' '}</Text>
                        <Text style={[pdfStyles.signatureLine, { borderTopWidth: 0, paddingTop: 0 }]}>Inventory Committee</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

// â”€â”€â”€ Main Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function InventoryCountFormModal({ isOpen, onClose }: InventoryCountFormModalProps) {
    const [group, setGroup] = useState<AssetGroup>('PPE');
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [printing, setPrinting] = useState(false);

    // Categories for Account Group dropdown
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    // Filters
    const [searchInput, setSearchInput] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Form fields
    const [accountGroup, setAccountGroup] = useState('');
    const [sheetNo, setSheetNo] = useState('1');
    const [sheetOf, setSheetOf] = useState('1');
    const [preparedBy, setPreparedBy] = useState('');
    const [reviewedBy, setReviewedBy] = useState('');

    const fetchAssets = useCallback(async (
        grp: AssetGroup,
        search: string,
        start: string,
        end: string,
        categoryId?: number,
    ) => {
        setLoading(true);
        try {
            const { systemUserId, sessionKey } = getAuthParams();
            const params = {
                GroupName: grp,
                PageNumber: 1,
                PageSize: 200,
                SearchString: search || undefined,
                StartDate: start || undefined,
                EndDate: end || undefined,
                CategoryId: categoryId || undefined,
                ActionBySystemUserId: String(systemUserId),
                SessionKey: sessionKey,
            };
            const result = grp === 'PPE'
                ? await ppeApi.list(params)
                : await seApi.list(params);
            setAssets(result.items);
            setSelectedIds(new Set());
        } catch {
            toast.error('Failed to load assets');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setAssets([]);
            setSelectedIds(new Set());
            fetchAssets(group, '', '', '');

            // Fetch categories once when modal opens
            setCategoriesLoading(true);
            getCategories()
                .then((data) => setCategories(data.filter((c) => c.isActive !== false)))
                .catch(() => toast.error('Failed to load categories'))
                .finally(() => setCategoriesLoading(false));
        }
    }, [isOpen, group, fetchAssets]);

    const handleGroupChange = (g: AssetGroup) => {
        setGroup(g);
        setSearchInput('');
        setStartDate('');
        setEndDate('');
        setCategoryFilter('all');
        setAssets([]);
        setSelectedIds(new Set());
    };

    const handleApplyFilters = () => {
        const catId = categoryFilter !== 'all' ? Number(categoryFilter) : undefined;
        fetchAssets(group, searchInput, startDate, endDate, catId);
    };

    const handleClearFilters = () => {
        setSearchInput('');
        setStartDate('');
        setEndDate('');
        setCategoryFilter('all');
        fetchAssets(group, '', '', '');
    };

    // Selection helpers
    const toggleOne = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedIds.size === assets.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(assets.map((a, i) => String(a.id ?? i))));
        }
    };

    const selectedAssets = useMemo(
        () => assets.filter((a, i) => selectedIds.has(String(a.id ?? i))),
        [assets, selectedIds],
    );

    const handlePrint = async () => {
        if (selectedAssets.length === 0) {
            toast.warning('Select at least one asset to generate the form');
            return;
        }
        setPrinting(true);
        try {
            const rows = buildRows(selectedAssets);
            const blob = await pdf(
                <ICFDocument
                    rows={rows}
                    group={group}
                    accountGroup={accountGroup}
                    sheetNo={sheetNo}
                    sheetOf={sheetOf}
                    preparedBy={preparedBy}
                    reviewedBy={reviewedBy}
                />
            ).toBlob();

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

    const [saving, setSaving] = useState(false);

    const handleSavePDF = async () => {
        if (selectedAssets.length === 0) {
            toast.warning('Select at least one asset to generate the form');
            return;
        }
        setSaving(true);
        try {
            const rows = buildRows(selectedAssets);
            const blob = await pdf(
                <ICFDocument
                    rows={rows}
                    group={group}
                    accountGroup={accountGroup}
                    sheetNo={sheetNo}
                    sheetOf={sheetOf}
                    preparedBy={preparedBy}
                    reviewedBy={reviewedBy}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const label = accountGroup ? `_${accountGroup.replace(/\s+/g, '_')}` : '';
            a.download = `Inventory_Count_Form${label}_Sheet${sheetNo}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('PDF saved successfully');
        } catch {
            toast.error('Failed to save PDF');
        } finally {
            setSaving(false);
        }
    };

    const allChecked = assets.length > 0 && selectedIds.size === assets.length;
    const someChecked = selectedIds.size > 0 && selectedIds.size < assets.length;
    const hasFilters = !!(searchInput || startDate || endDate || categoryFilter !== 'all');
    const previewRows = buildRows(selectedAssets);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="!max-w-[98vw] !w-[98vw] max-h-[95vh] h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* â”€â”€ Header â”€â”€ */}
                <DialogHeader className="px-6 py-4 border-b shrink-0 bg-teal-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-600 rounded-lg">
                            <ClipboardList className="size-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-teal-700">
                                Inventory Count Form
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                Filter assets, select items, configure details, then print
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* â”€â”€ Body â”€â”€ */}
                <div className="flex flex-1 min-h-0 overflow-hidden">

                    {/* â”€â”€ Left: Filter + Select â”€â”€ */}
                    <div className="w-[360px] shrink-0 border-r flex flex-col">
                        <div className="px-4 pt-3 pb-1 shrink-0">
                            <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                                Step 1 &mdash; Filter &amp; Select Assets
                            </span>
                        </div>

                        <div className="px-4 pb-3 shrink-0 space-y-3 border-b">
                            {/* Group toggle */}
                            <div className="flex rounded-md overflow-hidden border mt-1">
                                {(['PPE', 'SE'] as AssetGroup[]).map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => handleGroupChange(g)}
                                        className={`flex-1 py-1.5 text-sm font-semibold transition-colors ${
                                            group === g
                                                ? 'bg-teal-600 text-white'
                                                : 'bg-white text-slate-600 hover:bg-teal-50'
                                        }`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                <Input
                                    placeholder={`Search ${group} assets...`}
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                                    className="pl-8 text-sm"
                                />
                            </div>

                            {/* Category filter */}
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Filter className="size-3" /> Category
                                </Label>
                                <Select
                                    value={categoryFilter}
                                    onValueChange={setCategoryFilter}
                                    disabled={categoriesLoading}
                                >
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder={categoriesLoading ? 'Loading...' : 'All categories'} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60 overflow-y-auto">
                                        <SelectItem value="all">All categories</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={String(cat.id)}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date filters */}
                            <div className="flex gap-2">
                                <div className="flex-1 space-y-1">
                                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                        <CalendarIcon className="size-3" /> Start Date
                                    </Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                        <CalendarIcon className="size-3" /> End Date
                                    </Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                            </div>

                            {/* Filter action buttons */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                                    onClick={handleApplyFilters}
                                    disabled={loading}
                                >
                                    {loading
                                        ? <Loader2 className="size-3.5 animate-spin mr-1" />
                                        : <Search className="size-3.5 mr-1" />}
                                    Apply Filters
                                </Button>
                                {hasFilters && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleClearFilters}
                                        disabled={loading}
                                        title="Clear filters"
                                    >
                                        <X className="size-3.5" />
                                    </Button>
                                )}
                            </div>

                            {/* Status line */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{assets.length} asset{assets.length !== 1 ? 's' : ''} loaded</span>
                                {selectedIds.size > 0 && (
                                    <Badge className="bg-teal-100 text-teal-700 border-teal-200">
                                        {selectedIds.size} selected
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Asset list with checkboxes */}
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            {/* Select-all header */}
                            <div className="sticky top-0 z-10 bg-white border-b px-3 py-2 flex items-center gap-2">
                                <button
                                    onClick={toggleAll}
                                    disabled={assets.length === 0}
                                    title={allChecked ? 'Deselect all' : 'Select all'}
                                    className="inline-flex items-center justify-center shrink-0"
                                >
                                    {allChecked
                                        ? <CheckSquare className="size-4 text-teal-600" />
                                        : someChecked
                                        ? <CheckSquare className="size-4 text-teal-400" />
                                        : <Square className="size-4 text-slate-400" />}
                                </button>
                                <span className="text-xs font-medium text-slate-500">
                                    {allChecked ? 'Deselect all' : 'Select all'}
                                </span>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="size-5 animate-spin text-teal-500" />
                                </div>
                            ) : assets.length === 0 ? (
                                <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                                    No assets found
                                </div>
                            ) : (
                                <ul className="divide-y">
                                    {assets.map((a, i) => {
                                        const id = getAssetId(a, i);
                                        const checked = selectedIds.has(id);
                                        const propNo = getPropertyNo(a);
                                        const desc = getDescription(a);
                                        return (
                                            <li
                                                key={id}
                                                onClick={() => toggleOne(id)}
                                                className={`flex items-start gap-2 px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-teal-50' : 'hover:bg-slate-50'}`}
                                            >
                                                <div
                                                    className="pt-0.5 shrink-0"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Checkbox
                                                        checked={checked}
                                                        onCheckedChange={() => toggleOne(id)}
                                                        className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-mono font-medium text-slate-800 truncate" title={propNo}>
                                                        {propNo || <span className="text-muted-foreground italic">No property no.</span>}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate mt-0.5" title={desc}>
                                                        {desc || '—'}
                                                    </p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* â”€â”€ Right: Configure + Preview â”€â”€ */}
                    <div className="flex-1 min-h-0 flex flex-col">

                        {/* Step 2 */}
                        <div className="px-6 pt-3 pb-4 border-b shrink-0 space-y-3">
                            <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                                Step 2 &mdash; Configure Report Details
                            </span>
                            <div className="grid grid-cols-4 gap-3">
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                        {group === 'PPE' ? 'PPE' : 'Semi-Expendable'} Account Group
                                    </Label>
                                    <Select
                                        value={accountGroup}
                                        onValueChange={setAccountGroup}
                                        disabled={categoriesLoading}
                                    >
                                        <SelectTrigger className="text-sm">
                                            <SelectValue placeholder={
                                                categoriesLoading ? 'Loading...' : 'Select category'
                                            } />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60 overflow-y-auto">
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.name}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Sheet No.</Label>
                                    <Input value={sheetNo} onChange={(e) => setSheetNo(e.target.value)} className="text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">of</Label>
                                    <Input value={sheetOf} onChange={(e) => setSheetOf(e.target.value)} className="text-sm" />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs text-muted-foreground">Prepared By</Label>
                                    <Input value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} placeholder="Name" className="text-sm" />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs text-muted-foreground">Reviewed By</Label>
                                    <Input value={reviewedBy} onChange={(e) => setReviewedBy(e.target.value)} placeholder="Name" className="text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="px-6 pt-3 pb-1 shrink-0 flex items-center justify-between">
                            <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                                Step 3 &mdash; Preview Selected Items
                            </span>
                            {selectedIds.size > 0 && (
                                <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-xs">
                                    {previewRows.length} item{previewRows.length !== 1 ? 's' : ''} in form
                                </Badge>
                            )}
                        </div>

                        <div className="flex-1 min-h-0 overflow-auto px-6 pb-2">
                            {selectedAssets.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                                    <ClipboardList className="size-12 text-teal-200" />
                                    <p className="text-sm font-medium">No items selected</p>
                                    <p className="text-xs text-center">
                                        Use the left panel to load and check assets.<br />
                                        Selected items will appear here before printing.
                                    </p>
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-x-auto">
                                    <Table className="min-w-[1200px] table-fixed">
                                        <TableHeader>
                                            <TableRow className="bg-teal-50">
                                                <TableHead className="text-xs w-10 text-center">#</TableHead>
                                                <TableHead className="text-xs w-[14%]">Article/Item</TableHead>
                                                <TableHead className="text-xs w-[20%]">Description</TableHead>
                                                <TableHead className="text-xs w-[14%] whitespace-nowrap">Old Property No.</TableHead>
                                                <TableHead className="text-xs w-[14%] whitespace-nowrap">New Property No.</TableHead>
                                                <TableHead className="text-xs w-[5%]">UOM</TableHead>
                                                <TableHead className="text-xs w-[8%] text-right whitespace-nowrap">Unit Value</TableHead>
                                                <TableHead className="text-xs w-[6%] text-center">Qty (PC)</TableHead>
                                                <TableHead className="text-xs w-[7%] text-center">Qty (Physical)</TableHead>
                                                <TableHead className="text-xs w-[7%]">Location</TableHead>
                                                <TableHead className="text-xs w-[7%]">Condition</TableHead>
                                                <TableHead className="text-xs w-[8%]">Remarks</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {previewRows.map((row, idx) => (
                                                <TableRow key={idx} className="text-xs">
                                                    <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                                                    <TableCell className="truncate" title={row.article}>{row.article}</TableCell>
                                                    <TableCell className="truncate" title={row.description}>{row.description}</TableCell>
                                                    <TableCell className="font-mono truncate" title={row.oldPropertyNo}>{row.oldPropertyNo}</TableCell>
                                                    <TableCell className="text-muted-foreground italic">—</TableCell>
                                                    <TableCell>{row.unitOfMeasurement}</TableCell>
                                                    <TableCell className="text-right tabular-nums">{row.unitValue}</TableCell>
                                                    <TableCell className="text-center">{row.qtyPropertyCard}</TableCell>
                                                    <TableCell className="text-center text-muted-foreground">—</TableCell>
                                                    <TableCell className="truncate" title={row.location}>{row.location}</TableCell>
                                                    <TableCell className="truncate" title={row.condition}>{row.condition}</TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                {selectedIds.size > 0
                                    ? `${selectedIds.size} of ${assets.length} asset${assets.length !== 1 ? 's' : ''} selected`
                                    : 'Check assets on the left to include them in the form'}
                            </p>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={onClose} disabled={printing || saving}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-teal-600 text-teal-700 hover:bg-teal-50"
                                    onClick={handleSavePDF}
                                    disabled={selectedAssets.length === 0 || saving || printing}
                                >
                                    {saving
                                        ? <Loader2 className="size-4 animate-spin mr-2" />
                                        : <Download className="size-4 mr-2" />}
                                    Save as PDF
                                    {selectedAssets.length > 0 && (
                                        <Badge className="ml-2 bg-teal-100 text-teal-700 border-0 text-xs">
                                            {selectedAssets.length}
                                        </Badge>
                                    )}
                                </Button>
                                <Button
                                    className="bg-teal-600 hover:bg-teal-700 text-white"
                                    onClick={handlePrint}
                                    disabled={selectedAssets.length === 0 || printing || saving}
                                >
                                    {printing
                                        ? <Loader2 className="size-4 animate-spin mr-2" />
                                        : <Printer className="size-4 mr-2" />}
                                    Print Inventory Count Form
                                    {selectedAssets.length > 0 && (
                                        <Badge className="ml-2 bg-white/20 text-white border-0 text-xs">
                                            {selectedAssets.length}
                                        </Badge>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


