import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Package, ClipboardList, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/dateUtils';
import { getMyAccountabilities } from '@/api/asset/myAccountabilitiesApi';
import { IssuanceRecord } from '@/types/issuance';
import { secureStorage } from '@/utils/secureStorage';
import { decrypt } from '@/utils/encryption';

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

export function MyAccountabilities() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPAR, setSelectedPAR] = useState<AccountabilityGroup | null>(null);
  const [selectedICS, setSelectedICS] = useState<AccountabilityGroup | null>(null);
  const [showPARDialog, setShowPARDialog] = useState(false);
  const [showICSDialog, setShowICSDialog] = useState(false);
  const [records, setRecords] = useState<IssuanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyAccountabilities = async () => {
      setIsLoading(true);
      try {
        const data = await getMyAccountabilities();
        setRecords(data.items ?? []);
      } catch (error) {
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyAccountabilities();
  }, []);

  const myPARs = useMemo(() => mapToGroups(records, 'PPE'), [records]);
  const myICS = useMemo(() => mapToGroups(records, 'SE'), [records]);

  const totalAssets = myPARs.reduce((sum, x) => sum + x.items.length, 0);
  const totalAssetsValue = myPARs.reduce((sum, x) => sum + x.totalValue, 0);
  const totalSupplies = myICS.reduce((sum, x) => sum + x.items.length, 0);
  const totalSuppliesValue = myICS.reduce((sum, x) => sum + x.totalValue, 0);

  const employeeName = (() => {
    try {
      const raw = secureStorage.getItem('userDetails');
      if (!raw) return records[0]?.employeeName || 'N/A';
      const d = JSON.parse(decrypt(raw));
      const name = `${d.firstName || ''} ${d.lastName || ''}`.trim();
      return name || records[0]?.employeeName || 'N/A';
    } catch {
      return records[0]?.employeeName || 'N/A';
    }
  })();
  const department = records[0]?.divisionName || records[0]?.officeName || 'N/A';

  const handleViewPAR = (par: AccountabilityGroup) => {
    setSelectedPAR(par);
    setShowPARDialog(true);
  };

  const handleViewICS = (ics: AccountabilityGroup) => {
    setSelectedICS(ics);
    setShowICSDialog(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-gradient-to-r from-slate-50 to-blue-50/40 p-5 sm:p-6">
        <h1 className="text-3xl mb-2 tracking-tight">My Accountabilities</h1>
        <p className="text-muted-foreground">View all assets and supplies assigned to you</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm min-h-[170px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Property (PAR)</CardTitle>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <FileText className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{myPARs.length}</div>
            <p className="text-xs text-muted-foreground">Active PAR records</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm min-h-[170px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Total Assets</CardTitle>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Package className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totalAssets}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(totalAssetsValue)}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm min-h-[170px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Supplies (ICS)</CardTitle>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
              <ClipboardList className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{myICS.length}</div>
            <p className="text-xs text-muted-foreground">Active ICS records</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm min-h-[170px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Total Supplies</CardTitle>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <Package className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totalSupplies}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(totalSuppliesValue)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Accountability Records</CardTitle>
          <CardDescription>All property and supplies currently assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="par">
                Property (PAR)
                {myPARs.length > 0 && <Badge variant="secondary" className="ml-2">{myPARs.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="ics">
                Supplies (ICS)
                {myICS.length > 0 && <Badge variant="secondary" className="ml-2">{myICS.length}</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="rounded-lg border p-6">
                <h3 className="mb-4 font-medium">Accountability Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Employee Name:</span>
                    <span className="font-medium">{employeeName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-medium">{department}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total PAR Records:</span>
                    <Badge>{myPARs.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Assets:</span>
                    <Badge>{totalAssets}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Asset Value:</span>
                    <Badge variant="secondary">{formatCurrency(totalAssetsValue)}</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total ICS Records:</span>
                    <Badge>{myICS.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Supply Items:</span>
                    <Badge>{totalSupplies}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Supply Value:</span>
                    <Badge variant="secondary">{formatCurrency(totalSuppliesValue)}</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span>Grand Total Value:</span>
                    <span className="text-xl font-semibold text-blue-700">{formatCurrency(totalAssetsValue + totalSuppliesValue)}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="par" className="space-y-4">
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={7}>Loading...</TableCell></TableRow>
                    ) : myPARs.length === 0 ? (
                      <TableRow><TableCell colSpan={7}>No PAR records found.</TableCell></TableRow>
                    ) : (
                      myPARs.map((par) => (
                        <TableRow key={par.parIcsNumber} className="hover:bg-slate-50/80">
                          <TableCell className="font-medium">
                            <Badge variant="outline">{formatParIcsDisplay(par.parIcsNumber)}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(par.dateIssued)}</TableCell>
                          <TableCell>{par.department}</TableCell>
                          <TableCell>{par.items.length}</TableCell>
                          <TableCell>{formatCurrency(par.totalValue)}</TableCell>
                          <TableCell><Badge variant={toStatusVariant(par.status)}>{par.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleViewPAR(par)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={handlePrint}>
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="ics" className="space-y-4">
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={7}>Loading...</TableCell></TableRow>
                    ) : myICS.length === 0 ? (
                      <TableRow><TableCell colSpan={7}>No ICS records found.</TableCell></TableRow>
                    ) : (
                      myICS.map((ics) => (
                        <TableRow key={ics.parIcsNumber} className="hover:bg-slate-50/80">
                          <TableCell className="font-medium">
                            <Badge variant="outline">{formatParIcsDisplay(ics.parIcsNumber)}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(ics.dateIssued)}</TableCell>
                          <TableCell>{ics.department}</TableCell>
                          <TableCell>{ics.items.length}</TableCell>
                          <TableCell>{formatCurrency(ics.totalValue)}</TableCell>
                          <TableCell><Badge variant={toStatusVariant(ics.status)}>{ics.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleViewICS(ics)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={handlePrint}>
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showPARDialog} onOpenChange={setShowPARDialog}>
        <DialogContent className="w-[96vw] !max-w-[96vw] sm:!max-w-[1200px] max-h-[88vh] overflow-y-auto p-0">
          <DialogHeader>
            <div className="px-5 pt-5">
              <DialogTitle>PAR Details - {selectedPAR ? formatParIcsDisplay(selectedPAR.parIcsNumber) : ''}</DialogTitle>
              <DialogDescription>Property Acknowledgement Receipt</DialogDescription>
            </div>
          </DialogHeader>

          {selectedPAR && (
            <div className="space-y-4 px-5 pb-5">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/40 rounded-lg border">
                <div>
                  <p className="text-sm text-muted-foreground">Plantilla Employee</p>
                  <p className="font-medium">{selectedPAR.plantillaEmployeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Non-Plantilla Employee</p>
                  <p className="font-medium">{selectedPAR.nonPlantillaEmployeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p>{selectedPAR.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Issued</p>
                  <p>{formatDate(selectedPAR.dateIssued)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={toStatusVariant(selectedPAR.status)}>{selectedPAR.status}</Badge>
                </div>
              </div>

              <div className="rounded-lg border overflow-x-auto">
                <Table className="min-w-[980px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Property Number</TableHead>
                      <TableHead className="whitespace-nowrap">Description</TableHead>
                      <TableHead className="whitespace-nowrap">Category</TableHead>
                      <TableHead className="whitespace-nowrap">Serial Number</TableHead>
                      <TableHead className="whitespace-nowrap">Unit Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPAR.items.map((x) => (
                      <TableRow key={x.id} className="hover:bg-slate-50/80">
                        <TableCell className="whitespace-nowrap">{x.propertyNumber || '-'}</TableCell>
                        <TableCell className="max-w-[360px] whitespace-normal break-words">{x.itemName}</TableCell>
                        <TableCell className="whitespace-nowrap">{x.category || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{x.serialNumber || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatCurrency(Number(x.unitValue || 0))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl">{formatCurrency(selectedPAR.totalValue)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showICSDialog} onOpenChange={setShowICSDialog}>
        <DialogContent className="w-[96vw] !max-w-[96vw] sm:!max-w-[1200px] max-h-[88vh] overflow-y-auto p-0">
          <DialogHeader>
            <div className="px-5 pt-5">
              <DialogTitle>ICS Details - {selectedICS ? formatParIcsDisplay(selectedICS.parIcsNumber) : ''}</DialogTitle>
              <DialogDescription>Inventory Custodian Slip</DialogDescription>
            </div>
          </DialogHeader>

          {selectedICS && (
            <div className="space-y-4 px-5 pb-5">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/40 rounded-lg border">
                <div>
                  <p className="text-sm text-muted-foreground">Plantilla Employee</p>
                  <p className="font-medium">{selectedICS.plantillaEmployeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Non-Plantilla Employee</p>
                  <p className="font-medium">{selectedICS.nonPlantillaEmployeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p>{selectedICS.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Issued</p>
                  <p>{formatDate(selectedICS.dateIssued)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={toStatusVariant(selectedICS.status)}>{selectedICS.status}</Badge>
                </div>
              </div>

              <div className="rounded-lg border overflow-x-auto">
                <Table className="min-w-[980px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Property Number</TableHead>
                      <TableHead className="whitespace-nowrap">Description</TableHead>
                      <TableHead className="whitespace-nowrap">Category</TableHead>
                      <TableHead className="whitespace-nowrap">Serial Number</TableHead>
                      <TableHead className="whitespace-nowrap">Unit Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedICS.items.map((x) => (
                      <TableRow key={x.id} className="hover:bg-slate-50/80">
                        <TableCell className="whitespace-nowrap">{x.propertyNumber || '-'}</TableCell>
                        <TableCell className="max-w-[360px] whitespace-normal break-words">{x.itemName}</TableCell>
                        <TableCell className="whitespace-nowrap">{x.category || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{x.serialNumber || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatCurrency(Number(x.unitValue || 0))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl">{formatCurrency(selectedICS.totalValue)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
