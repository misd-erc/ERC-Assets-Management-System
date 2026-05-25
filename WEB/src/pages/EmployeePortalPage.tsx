import { useEffect, useMemo, useState } from 'react';
import { LogOut, FileText, Package, ClipboardList, Eye, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/dateUtils';
import { getMyAccountabilities } from '@/api/asset/myAccountabilitiesApi';
import { IssuanceRecord } from '@/types/issuance';
import { useAuthStore } from '@/store/auth';
import { secureStorage } from '@/utils/secureStorage';
import { decrypt } from '@/utils/encryption';

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

  const myPARs = useMemo(() => mapToGroups(records, 'PPE'), [records]);
  const myICS  = useMemo(() => mapToGroups(records, 'SE'),  [records]);

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
            {department !== 'N/A' && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 rounded-full px-3 py-1.5 flex-shrink-0">
                <Building2 className="w-3.5 h-3.5" />
                <span>{department}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Property (PAR)', value: myPARs.length, sub: 'PAR records', icon: FileText, color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
            { label: 'Total Assets', value: totalAssets, sub: formatCurrency(totalAssetsValue), icon: Package, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
            { label: 'Supplies (ICS)', value: myICS.length, sub: 'ICS records', icon: ClipboardList, color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
            { label: 'Total Supplies', value: totalSupplies, sub: formatCurrency(totalSuppliesValue), icon: Package, color: 'bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
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
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="par">
                  Property (PAR)
                  {myPARs.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{myPARs.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="ics">
                  Supplies (ICS)
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
                    { label: 'Total Supply Items', value: <Badge>{totalSupplies}</Badge> },
                    { label: 'Total Supply Value', value: <Badge variant="secondary">{formatCurrency(totalSuppliesValue)}</Badge> },
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
                        <TableRow key={par.parIcsNumber} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
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
                        <TableRow key={ics.parIcsNumber} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
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
