import { useEffect, useMemo, useState } from 'react';
import { LogOut, FileText, Package, ClipboardList, Eye, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/dateUtils';
import { getMyAccountabilities } from '@/api/asset/myAccountabilitiesApi';
import {
  AssetLookupItem,
  AssetRequestRecord,
  AssetRequestStatus,
  createAssetRequest,
  getAssetRequestById,
  getAssetRequestProcessors,
  getMyAssetRequests,
  lookupAssetByPropertyNumber,
} from '@/api/asset/assetRequestApi';
import { IssuanceRecord } from '@/types/issuance';
import { useAuthStore } from '@/store/auth';
import { secureStorage } from '@/utils/secureStorage';
import { decrypt } from '@/utils/encryption';
import { toast } from 'sonner';

const ercLogo = '/images/erc-logo.png';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AccountabilityGroup {
  parIcsNumber: string;
  dateIssued: string;
  department: string;
  employeeName: string;
  plantillaEmployeeName: string;
  nonPlantillaEmployeeName: string;
  items: IssuanceRecord[];
  totalValue: number;
  status: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const s = status.toUpperCase();
  if (s === 'ACTIVE' || s === 'NEW' || s === 'RENEW') return 'default';
  if (s === 'INACTIVE') return 'secondary';
  return 'outline';
};

const formatParIcsDisplay = (value: string) => {
  if (!value) return 'Unassigned';
  if (value.includes('UNASSIGNED')) {
    return value.startsWith('ICS') ? 'ICS (Pending Assignment)' : 'PAR (Pending Assignment)';
  }
  return value;
};

type RequestDraftItem = {
  propertyNumber: string;
  remarks: string;
  lookup?: AssetLookupItem | null;
  isLookingUp?: boolean;
};

const toRequestStatusVariant = (status: AssetRequestStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (status === 'Rejected') return 'destructive';
  if (status === 'Resolved' || status === 'Completed') return 'secondary';
  if (status === 'Pending') return 'outline';
  return 'default';
};

const mapToGroups = (records: IssuanceRecord[], group: 'PPE' | 'SE'): AccountabilityGroup[] => {
  const grouped = new Map<string, AccountabilityGroup>();
  records
    .filter((x) => x.itemGroup === group)
    .forEach((x) => {
      const existing = grouped.get(x.parIcsNumber);
      const itemValue = Number(x.unitValue || 0);
      if (existing) {
        existing.items.push(x);
        existing.totalValue += itemValue;
      } else {
        grouped.set(x.parIcsNumber, {
          parIcsNumber: x.parIcsNumber,
          dateIssued: x.issuedDate,
          department: x.divisionName || x.officeName || '-',
          employeeName: x.employeeName,
          plantillaEmployeeName: x.plantillaEmployeeName || '-',
          nonPlantillaEmployeeName: x.nonPlantillaEmployeeName || '-',
          items: [x],
          totalValue: itemValue,
          status: x.status,
        });
      }
    });
  return Array.from(grouped.values()).sort((a, b) => (a.dateIssued < b.dateIssued ? 1 : -1));
};

// ─── Item Details Dialog ─────────────────────────────────────────────────────

function ItemDetailsDialog({
  open,
  onOpenChange,
  group,
  title,
  subtitle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  group: AccountabilityGroup | null;
  title: string;
  subtitle: string;
}) {
  if (!group) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] !max-w-[96vw] sm:!max-w-[1100px] max-h-[88vh] overflow-y-auto p-0">
        <DialogHeader>
          <div className="px-6 pt-6 pb-2">
            <DialogTitle className="text-lg">{title} — {formatParIcsDisplay(group.parIcsNumber)}</DialogTitle>
            <DialogDescription>{subtitle}</DialogDescription>
          </div>
        </DialogHeader>
        <div className="space-y-4 px-6 pb-6">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/40 rounded-lg border text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Plantilla Employee</p>
              <p className="font-medium">{group.plantillaEmployeeName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Non-Plantilla Employee</p>
              <p className="font-medium">{group.nonPlantillaEmployeeName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Department</p>
              <p className="font-medium">{group.department}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Date Issued</p>
              <p className="font-medium">{formatDate(group.dateIssued)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Status</p>
              <Badge variant={toStatusVariant(group.status)}>{group.status}</Badge>
            </div>
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Property Number</TableHead>
                  <TableHead className="whitespace-nowrap">Description</TableHead>
                  <TableHead className="whitespace-nowrap">Category</TableHead>
                  <TableHead className="whitespace-nowrap">Serial Number</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Unit Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.items.map((x) => (
                  <TableRow key={x.id}>
                    <TableCell className="whitespace-nowrap text-sm">{x.propertyNumber || '—'}</TableCell>
                    <TableCell className="max-w-[340px] whitespace-normal break-words text-sm">{x.itemName}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{x.category || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{x.serialNumber || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-right">{formatCurrency(Number(x.unitValue || 0))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end pt-3 border-t">
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-0.5">Total Value</p>
              <p className="text-2xl font-semibold">{formatCurrency(group.totalValue)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmployeePortalPage() {
  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPAR, setSelectedPAR] = useState<AccountabilityGroup | null>(null);
  const [selectedICS, setSelectedICS] = useState<AccountabilityGroup | null>(null);
  const [showPARDialog, setShowPARDialog] = useState(false);
  const [showICSDialog, setShowICSDialog] = useState(false);
  const [records, setRecords] = useState<IssuanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [parPage, setParPage] = useState(1);
  const [icsPage, setIcsPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(10);

  const [showCreateRequestDialog, setShowCreateRequestDialog] = useState(false);
  const [draftItems, setDraftItems] = useState<RequestDraftItem[]>([{ propertyNumber: '', remarks: '' }]);
  const [committeeUsers, setCommitteeUsers] = useState<Array<{ id: number; fullName: string }>>([]);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<number | ''>('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const [myRequests, setMyRequests] = useState<AssetRequestRecord[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AssetRequestRecord | null>(null);

  // Pull display name from stored user details
  const userDisplayName = (() => {
    try {
      const raw = secureStorage.getItem('userDetails');
      if (!raw) return '';
      const d = JSON.parse(decrypt(raw));
      return `${d.firstName || ''} ${d.lastName || ''}`.trim();
    } catch {
      return '';
    }
  })();

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const data = await getMyAccountabilities();
        setRecords(data.items ?? []);
      } catch {
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const loadRequestDependencies = async () => {
    const [reqRes, committeeRes] = await Promise.all([
      getMyAssetRequests({ pageSize: 100 }),
      getAssetRequestProcessors(),
    ]);

    setMyRequests(reqRes.items);
    setCommitteeUsers(committeeRes.map((x) => ({ id: x.id, fullName: x.fullName })));
  };

  useEffect(() => {
    (async () => {
      setRequestsLoading(true);
      try {
        await loadRequestDependencies();
      } finally {
        setRequestsLoading(false);
      }
    })();
  }, []);

  const myPARs = useMemo(() => mapToGroups(records, 'PPE'), [records]);
  const myICS  = useMemo(() => mapToGroups(records, 'SE'),  [records]);

  const myLinkedItems = useMemo(() => {
    const unique = new Map<string, AssetLookupItem>();

    records.forEach((r) => {
      const pn = (r.propertyNumber || '').trim();
      if (!pn || unique.has(pn)) return;

      unique.set(pn, {
        id: r.ptaId,
        group: r.itemGroup,
        propertyNumber: pn,
        description: r.itemName,
        serialNumber: r.serialNumber,
        unitValue: r.unitValue,
      });
    });

    return Array.from(unique.values()).sort((a, b) => a.propertyNumber.localeCompare(b.propertyNumber));
  }, [records]);

  const parTotalPages = Math.max(1, Math.ceil(myPARs.length / listPageSize));
  const icsTotalPages = Math.max(1, Math.ceil(myICS.length / listPageSize));

  const pagedPARs = useMemo(() => {
    const start = (parPage - 1) * listPageSize;
    return myPARs.slice(start, start + listPageSize);
  }, [myPARs, parPage, listPageSize]);

  const pagedICS = useMemo(() => {
    const start = (icsPage - 1) * listPageSize;
    return myICS.slice(start, start + listPageSize);
  }, [myICS, icsPage, listPageSize]);

  useEffect(() => {
    if (parPage > parTotalPages) setParPage(parTotalPages);
  }, [parPage, parTotalPages]);

  useEffect(() => {
    if (icsPage > icsTotalPages) setIcsPage(icsTotalPages);
  }, [icsPage, icsTotalPages]);

  const totalAssets        = myPARs.reduce((s, x) => s + x.items.length, 0);
  const totalAssetsValue   = myPARs.reduce((s, x) => s + x.totalValue, 0);
  const totalSupplies      = myICS.reduce((s, x) => s + x.items.length, 0);
  const totalSuppliesValue = myICS.reduce((s, x) => s + x.totalValue, 0);

  const employeeName = userDisplayName || records[0]?.employeeName || 'N/A';
  const department   = records[0]?.divisionName || records[0]?.officeName || 'N/A';

  const updateDraftItem = (index: number, patch: Partial<RequestDraftItem>) => {
    setDraftItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addDraftItem = () => {
    setDraftItems((prev) => [...prev, { propertyNumber: '', remarks: '' }]);
  };

  const removeDraftItem = (index: number) => {
    setDraftItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleLookup = async (index: number) => {
    const item = draftItems[index];
    if (!item.propertyNumber.trim()) {
      toast.error('Enter property number first.');
      return;
    }

    updateDraftItem(index, { isLookingUp: true });
    try {
      const found = await lookupAssetByPropertyNumber(item.propertyNumber.trim());
      if (!found) {
        updateDraftItem(index, { lookup: null });
        toast.error(`No asset found for ${item.propertyNumber}.`);
        return;
      }
      updateDraftItem(index, { lookup: found, propertyNumber: found.propertyNumber || item.propertyNumber });
      toast.success('Asset matched.');
    } finally {
      updateDraftItem(index, { isLookingUp: false });
    }
  };

  const resetRequestDraft = () => {
    setDraftItems([{ propertyNumber: '', remarks: '' }]);
    setSelectedCommitteeId('');
  };

  const handleSubmitRequest = async () => {
    if (!selectedCommitteeId) {
      toast.error('Please select an assignee.');
      return;
    }

    const hasInvalid = draftItems.some((x) => !x.propertyNumber.trim() || !x.remarks.trim());
    if (hasInvalid) {
      toast.error('Property number and remarks are required for all items.');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const result = await createAssetRequest({
        assignedCommitteeSystemUserId: Number(selectedCommitteeId),
        items: draftItems.map((x) => ({
          ptaId: x.lookup?.id,
          propertyNumber: x.propertyNumber.trim(),
          remarks: x.remarks.trim(),
        })),
      });

      if (!result) {
        toast.error('Failed to submit request.');
        return;
      }

      toast.success(`Request ${result.requestNumber} submitted.`);
      setShowCreateRequestDialog(false);
      resetRequestDraft();
      setRequestsLoading(true);
      await loadRequestDependencies();
      setActiveTab('requests');
    } finally {
      setIsSubmittingRequest(false);
      setRequestsLoading(false);
    }
  };

  const openRequestDetails = async (requestId: number) => {
    setShowRequestDetails(true);
    setSelectedRequest(null);
    const request = await getAssetRequestById(requestId);
    setSelectedRequest(request);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">

      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex h-14 items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <img src={ercLogo} alt="ERC" className="h-8 w-8 object-contain flex-shrink-0" />
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-none">
                Energy Regulatory Commission
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                Asset Management System — Employee Portal
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {userDisplayName && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-xs">
                  {userDisplayName.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[160px] truncate">{userDisplayName}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-300 dark:hover:text-red-400 dark:hover:bg-red-950/30 gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 space-y-6">

        {/* Page Title */}
        <div className="rounded-xl border bg-white dark:bg-slate-800 shadow-sm px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                My Accountabilities
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Property and supplies currently assigned to you
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {department !== 'N/A' && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 rounded-full px-3 py-1.5 flex-shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{department}</span>
                </div>
              )}
              <Button size="sm" onClick={() => setShowCreateRequestDialog(true)}>
                Create Request
              </Button>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Property (PAR)', value: myPARs.length, sub: 'PAR records', icon: FileText, color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
            { label: 'Total Assets', value: totalAssets, sub: formatCurrency(totalAssetsValue), icon: Package, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
            { label: 'Semi Expandables (ICS)', value: myICS.length, sub: 'ICS records', icon: ClipboardList, color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
            { label: 'Total Semi Expandables', value: totalSupplies, sub: formatCurrency(totalSuppliesValue), icon: Package, color: 'bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <Card key={label} className="shadow-sm bg-white dark:bg-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</CardTitle>
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{value}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Records Card */}
        <Card className="shadow-sm bg-white dark:bg-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Accountability Records</CardTitle>
            <CardDescription>All property and supplies currently assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="requests">
                  My Requests
                  {myRequests.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{myRequests.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="par">
                  Property (PAR)
                  {myPARs.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{myPARs.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="ics">
                  Semi Expandables (ICS)
                  {myICS.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{myICS.length}</Badge>}
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="rounded-lg border p-5 space-y-3 text-sm">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">Summary</h3>
                  {[
                    { label: 'Employee Name', value: <span className="font-medium">{employeeName}</span> },
                    { label: 'Department', value: <span className="font-medium">{department}</span>, sep: true },
                    { label: 'PAR Records', value: <Badge>{myPARs.length}</Badge> },
                    { label: 'Total Assets', value: <Badge>{totalAssets}</Badge> },
                    { label: 'Total Asset Value', value: <Badge variant="secondary">{formatCurrency(totalAssetsValue)}</Badge>, sep: true },
                    { label: 'ICS Records', value: <Badge>{myICS.length}</Badge> },
                    { label: 'Total Semi Expandable Items', value: <Badge>{totalSupplies}</Badge> },
                    { label: 'Total Semi Expandable Value', value: <Badge variant="secondary">{formatCurrency(totalSuppliesValue)}</Badge> },
                  ].map(({ label, value, sep }, i) => (
                    <div key={i}>
                      {sep && <Separator className="mb-3" />}
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{label}</span>
                        {value}
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-medium text-slate-800 dark:text-slate-100">Grand Total Value</span>
                    <span className="text-xl font-bold text-blue-700 dark:text-blue-400">
                      {formatCurrency(totalAssetsValue + totalSuppliesValue)}
                    </span>
                  </div>
                </div>
              </TabsContent>

              {/* My Requests Tab */}
              <TabsContent value="requests">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request #</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requestsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <div className="animate-spin h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent" />
                              Loading requests...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : myRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                            No requests yet.
                          </TableCell>
                        </TableRow>
                      ) : myRequests.map((request) => (
                        <TableRow key={request.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                          <TableCell className="font-medium">{request.requestNumber}</TableCell>
                          <TableCell>
                            <Badge variant={toRequestStatusVariant(request.status)}>{request.status}</Badge>
                          </TableCell>
                          <TableCell>{request.assignedPersonnelName || request.assignedCommitteeName || 'Unassigned'}</TableCell>
                          <TableCell>{request.items.length}</TableCell>
                          <TableCell>{formatDate(request.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => openRequestDetails(request.id)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* PAR Tab */}
              <TabsContent value="par">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PAR Number</TableHead>
                        <TableHead>Date Issued</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <div className="animate-spin h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent" />
                              Loading records…
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : myPARs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                            No PAR records found.
                          </TableCell>
                        </TableRow>
                      ) : pagedPARs.map((par) => (
                        <TableRow key={par.parIcsNumber} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 cursor-pointer" onClick={() => { setSelectedPAR(par); setShowPARDialog(true); }}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">{formatParIcsDisplay(par.parIcsNumber)}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(par.dateIssued)}</TableCell>
                          <TableCell className="text-sm">{par.department}</TableCell>
                          <TableCell className="text-sm">{par.items.length}</TableCell>
                          <TableCell className="text-sm">{formatCurrency(par.totalValue)}</TableCell>
                          <TableCell><Badge variant={toStatusVariant(par.status)}>{par.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedPAR(par); setShowPARDialog(true); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {!isLoading && myPARs.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Showing {((parPage - 1) * listPageSize) + 1} to {Math.min(parPage * listPageSize, myPARs.length)} of {myPARs.length} PAR records
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs sm:text-sm text-muted-foreground">Size:</label>
                      <select
                        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                        value={listPageSize}
                        onChange={(e) => {
                          const size = Number(e.target.value);
                          setListPageSize(size);
                          setParPage(1);
                          setIcsPage(1);
                        }}
                      >
                        {[5, 10, 20, 50, 100].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <span className="text-xs sm:text-sm text-muted-foreground">Page {parPage} of {parTotalPages}</span>
                      <Button variant="outline" size="sm" disabled={parPage === 1} onClick={() => setParPage((p) => Math.max(1, p - 1))}>
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" disabled={parPage >= parTotalPages} onClick={() => setParPage((p) => Math.min(parTotalPages, p + 1))}>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ICS Tab */}
              <TabsContent value="ics">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ICS Number</TableHead>
                        <TableHead>Date Issued</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <div className="animate-spin h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent" />
                              Loading records…
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : myICS.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                            No ICS records found.
                          </TableCell>
                        </TableRow>
                      ) : pagedICS.map((ics) => (
                        <TableRow key={ics.parIcsNumber} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 cursor-pointer" onClick={() => { setSelectedICS(ics); setShowICSDialog(true); }}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">{formatParIcsDisplay(ics.parIcsNumber)}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(ics.dateIssued)}</TableCell>
                          <TableCell className="text-sm">{ics.department}</TableCell>
                          <TableCell className="text-sm">{ics.items.length}</TableCell>
                          <TableCell className="text-sm">{formatCurrency(ics.totalValue)}</TableCell>
                          <TableCell><Badge variant={toStatusVariant(ics.status)}>{ics.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedICS(ics); setShowICSDialog(true); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {!isLoading && myICS.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Showing {((icsPage - 1) * listPageSize) + 1} to {Math.min(icsPage * listPageSize, myICS.length)} of {myICS.length} ICS records
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs sm:text-sm text-muted-foreground">Size:</label>
                      <select
                        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                        value={listPageSize}
                        onChange={(e) => {
                          const size = Number(e.target.value);
                          setListPageSize(size);
                          setParPage(1);
                          setIcsPage(1);
                        }}
                      >
                        {[5, 10, 20, 50, 100].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <span className="text-xs sm:text-sm text-muted-foreground">Page {icsPage} of {icsTotalPages}</span>
                      <Button variant="outline" size="sm" disabled={icsPage === 1} onClick={() => setIcsPage((p) => Math.max(1, p - 1))}>
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" disabled={icsPage >= icsTotalPages} onClick={() => setIcsPage((p) => Math.min(icsTotalPages, p + 1))}>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3">
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} Energy Regulatory Commission · Asset Management System
        </p>
      </footer>

      {/* ── Dialogs ── */}
      <Dialog open={showCreateRequestDialog} onOpenChange={setShowCreateRequestDialog}>
        <DialogContent className="w-[96vw] !max-w-[96vw] sm:!max-w-[980px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Request</DialogTitle>
            <DialogDescription>Submit asset concerns with multiple items and required remarks.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Assign To (Committee / Processor)</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={selectedCommitteeId}
                onChange={(e) => setSelectedCommitteeId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Select assignee</option>
                {committeeUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              {draftItems.map((item, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Item {index + 1}</p>
                    <Button variant="outline" size="sm" onClick={() => removeDraftItem(index)} disabled={draftItems.length === 1}>
                      Remove
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">My linked items</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={item.lookup?.propertyNumber || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value) {
                          updateDraftItem(index, { lookup: undefined });
                          return;
                        }

                        const selected = myLinkedItems.find((x) => x.propertyNumber === value);
                        if (!selected) return;

                        updateDraftItem(index, {
                          propertyNumber: selected.propertyNumber,
                          lookup: selected,
                        });
                      }}
                    >
                      <option value="">Select from your assigned items</option>
                      {myLinkedItems.map((linked) => (
                        <option key={linked.id} value={linked.propertyNumber}>
                          {linked.propertyNumber} - {linked.description || linked.group}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <Input
                      value={item.propertyNumber}
                      onChange={(e) => updateDraftItem(index, { propertyNumber: e.target.value, lookup: undefined })}
                      placeholder="Property number"
                    />
                    <Button variant="secondary" onClick={() => handleLookup(index)} disabled={item.isLookingUp}>
                      {item.isLookingUp ? 'Looking up...' : 'Lookup'}
                    </Button>
                  </div>

                  {item.lookup && (
                    <div className="rounded-md bg-muted/40 border p-3 text-xs sm:text-sm space-y-0.5">
                      <p><span className="text-muted-foreground">Description:</span> {item.lookup.description || '-'}</p>
                      <p><span className="text-muted-foreground">Group:</span> {item.lookup.group || '-'}</p>
                      <p><span className="text-muted-foreground">Serial:</span> {item.lookup.serialNumber || '-'}</p>
                    </div>
                  )}

                  <Textarea
                    value={item.remarks}
                    onChange={(e) => updateDraftItem(index, { remarks: e.target.value })}
                    placeholder="Remarks / concern (required)"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" onClick={addDraftItem}>Add Item</Button>
              <Button onClick={handleSubmitRequest} disabled={isSubmittingRequest}>
                {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRequestDetails} onOpenChange={setShowRequestDetails}>
        <DialogContent className="w-[96vw] !max-w-[96vw] sm:!max-w-[980px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Request Details {selectedRequest?.requestNumber ? `- ${selectedRequest.requestNumber}` : ''}
            </DialogTitle>
            <DialogDescription>Items, status tracking, and history logs.</DialogDescription>
          </DialogHeader>

          {!selectedRequest ? (
            <div className="py-8 text-center text-muted-foreground">Loading details...</div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={toRequestStatusVariant(selectedRequest.status)}>{selectedRequest.status}</Badge>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Assigned To</p>
                  <p className="font-medium">{selectedRequest.assignedPersonnelName || selectedRequest.assignedCommitteeName || 'Unassigned'}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(selectedRequest.createdAt)}</p>
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property Number</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRequest.items.map((x) => (
                      <TableRow key={x.id}>
                        <TableCell>{x.propertyNumber}</TableCell>
                        <TableCell>{x.item?.description || '-'}</TableCell>
                        <TableCell>{x.remarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-sm">Timeline</p>
                {selectedRequest.history.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No history yet.</div>
                ) : selectedRequest.history.map((h) => (
                  <div key={h.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{h.actionType}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(h.actionAt)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">By: {h.updatedByName || 'Unknown'}</p>
                    {(h.fromStatus || h.toStatus) && (
                      <p className="text-xs text-muted-foreground">{h.fromStatus || '-'} → {h.toStatus || '-'}</p>
                    )}
                    {h.remarks && <p className="text-sm mt-1">{h.remarks}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ItemDetailsDialog
        open={showPARDialog}
        onOpenChange={setShowPARDialog}
        group={selectedPAR}
        title="PAR Details"
        subtitle="Property Acknowledgement Receipt"
      />
      <ItemDetailsDialog
        open={showICSDialog}
        onOpenChange={setShowICSDialog}
        group={selectedICS}
        title="ICS Details"
        subtitle="Inventory Custodian Slip"
      />
    </div>
  );
}
