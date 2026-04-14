import { useMemo, useState, useEffect, useCallback } from 'react';
import { printDisposal } from './printUtils';
import { Plus, Trash2, FileText, AlertTriangle, DollarSign, CheckCircle, Clock, Archive, Eye, Printer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency } from '@/utils/formatters';
import { getStatusBadge } from '@/components/disposals/helpers';
import { toast } from 'sonner';
import {
  getDisposals,
  createDisposal,
  approveDisposal as approveDisposalApi,
  markDisposed as markDisposedApi,
  getAvailablePTAs,
  type DisposalRecord,
} from '@/api/asset/disposalApi';

export interface DisposalAsset {
  id: string;
  code: string;
  description: string;
  category: string;
  acquisitionCost: number;
  currentValue: number;
  condition: string;
  location: string;
  group: 'PPE' | 'SE';
  dateAcquired?: string;
}

export interface Disposal {
  id: string;
  disposalNumber: string;
  group: 'PPE' | 'SE';
  assets: DisposalAsset[];
  reason: 'End of Life' | 'Damaged' | 'Obsolete' | 'Lost' | 'Stolen';
  method: 'Sale' | 'Donation' | 'Destruction' | 'Return to Supplier';
  requestedBy: string;
  dateRequested: string;
  approvedBy?: string;
  dateApproved?: string;
  dateDisposed?: string;
  totalValue: number;
  proceedAmount?: number;
  buyer?: string;
  remarks?: string;
  status: 'Pending' | 'Approved' | 'Disposed' | 'Rejected';
}

function mapApiToDisposal(record: DisposalRecord): Disposal {
  const totalValue = record.items.reduce((sum, item) => sum + (item.pta?.unitValue ?? 0), 0);
  return {
    id: String(record.id),
    disposalNumber: record.disposalNumber,
    group: record.group as 'PPE' | 'SE',
    assets: record.items.map(item => ({
      id: String(item.ptaId),
      code: item.pta?.propertyNumber ?? '',
      description: item.pta?.description ?? '',
      category: item.pta?.category ?? '',
      acquisitionCost: item.pta?.unitValue ?? 0,
      currentValue: item.pta?.unitValue ?? 0,
      condition: '',
      location: '',
      group: (item.pta?.group as 'PPE' | 'SE') ?? (record.group as 'PPE' | 'SE'),
      dateAcquired: item.pta?.dateAcquired,
    })),
    reason: record.reason as Disposal['reason'],
    method: record.method as Disposal['method'],
    requestedBy: record.requestedByName ?? `User #${record.requestedBySystemUserId}`,
    dateRequested: record.dateRequested?.split('T')[0] ?? '',
    approvedBy: record.approvedByName,
    dateApproved: record.dateApproved?.split('T')[0],
    dateDisposed: record.dateDisposed?.split('T')[0],
    totalValue,
    proceedAmount: record.proceedAmount ?? undefined,
    buyer: record.buyer,
    remarks: record.remarks,
    status: record.status,
  };
}

export function Disposals() {
  const [disposals, setDisposals] = useState<Disposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showStartDialog, setShowStartDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'PPE' | 'SE'>('PPE');
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showDisposedDialog, setShowDisposedDialog] = useState(false);
  const [selectedDisposal, setSelectedDisposal] = useState<Disposal | null>(null);

  const [formData, setFormData] = useState({
    group: 'PPE' as 'PPE' | 'SE',
    reason: 'End of Life' as const,
    method: 'Sale' as const,
    requestedBy: 'Current User',
    remarks: ''
  });

  const [disposedFormData, setDisposedFormData] = useState({
    dateDisposed: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
    proceedAmount: 0,
    buyer: '',
    remarks: ''
  });

  const [availableAssets, setAvailableAssets] = useState<DisposalAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  // Load disposals from API
  const loadDisposals = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getDisposals();
      setDisposals(result.items.map(mapApiToDisposal));
    } catch {
      toast.error('Failed to load disposals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDisposals();
  }, [loadDisposals]);

  // Load available PTAs when disposal dialog is open or group changes
  useEffect(() => {
    if (!showStartDialog) return;
    let cancelled = false;
    const load = async () => {
      setAssetsLoading(true);
      try {
        const assets = await getAvailablePTAs(formData.group);
        if (!cancelled) {
          setAvailableAssets(assets.map(a => ({
            id: String(a.id),
            code: a.propertyNumber,
            description: a.description,
            category: a.category,
            acquisitionCost: a.unitValue,
            currentValue: a.unitValue,
            condition: '',
            location: '',
            group: a.group as 'PPE' | 'SE',
          })));
        }
      } catch {
        if (!cancelled) setAvailableAssets([]);
      } finally {
        if (!cancelled) setAssetsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [showStartDialog, formData.group]);

  const handleStartDisposal = () => {
    setSelectedAssets([]);
    setFormData({
      group: 'PPE',
      reason: 'End of Life',
      method: 'Sale',
      requestedBy: 'Current User',
      remarks: ''
    });
    setShowStartDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedAssets.length === 0) {
      toast.error('Please select at least one asset');
      return;
    }

    try {
      const result = await createDisposal({
        id: 0,
        group: formData.group,
        reason: formData.reason,
        method: formData.method,
        ptaIds: selectedAssets.map(id => Number(id)),
        remarks: formData.remarks || undefined,
      });

      if (result) {
        toast.success(`Disposal request ${result.disposalNumber} created successfully`);
        setShowStartDialog(false);
        await loadDisposals();
      } else {
        toast.error('Failed to create disposal request');
      }
    } catch {
      toast.error('Failed to create disposal request');
    }
  };

  const handleView = (disposal: Disposal) => {
    setSelectedDisposal(disposal);
    setShowViewDialog(true);
  };

  const handleApprove = (disposal: Disposal) => {
    setSelectedDisposal(disposal);
    setShowApproveDialog(true);
  };

  const confirmApprove = async () => {
    if (!selectedDisposal) return;
    try {
      const success = await approveDisposalApi(Number(selectedDisposal.id));
      if (success) {
        toast.success(`Disposal ${selectedDisposal.disposalNumber} approved`);
        await loadDisposals();
      } else {
        toast.error('Failed to approve disposal');
      }
    } catch {
      toast.error('Failed to approve disposal');
    } finally {
      setShowApproveDialog(false);
      setSelectedDisposal(null);
    }
  };

  const handleMarkDisposed = (disposal: Disposal) => {
    setSelectedDisposal(disposal);
    const d = new Date();
    setDisposedFormData({
      dateDisposed: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      proceedAmount: 0,
      buyer: '',
      remarks: ''
    });
    setShowDisposedDialog(true);
  };

  const confirmDisposed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisposal) return;
    try {
      const success = await markDisposedApi(Number(selectedDisposal.id), {
        dateDisposed: disposedFormData.dateDisposed,
        proceedAmount: disposedFormData.proceedAmount || undefined,
        buyer: disposedFormData.buyer || undefined,
        remarks: disposedFormData.remarks || undefined,
      });
      if (success) {
        toast.success(`Disposal ${selectedDisposal.disposalNumber} marked as disposed`);
        await loadDisposals();
      } else {
        toast.error('Failed to mark disposal as disposed');
      }
    } catch {
      toast.error('Failed to mark disposal as disposed');
    } finally {
      setShowDisposedDialog(false);
      setSelectedDisposal(null);
    }
  };

  const handlePrint = (disposal: Disposal) => {
    printDisposal(disposal);
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets(prev =>
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    );
  };

  const columns = useMemo(() => [
    { key: 'disposalNumber', label: 'Disposal Number', sortable: true },
    { 
      key: 'assets', 
      label: 'Assets', 
      render: (value: DisposalAsset[]) => `${value.length} asset(s)`
    },
    { 
      key: 'reason', 
      label: 'Reason', 
      sortable: true,
      render: (value: string) => (
        <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-0">{value}</Badge>
      )
    },
    { key: 'method', label: 'Method', sortable: true },
    { 
      key: 'totalValue', 
      label: 'Total Value', 
      sortable: true,
      render: (value: number) => formatCurrency(value)
    },
    { key: 'requestedBy', label: 'Requested By', sortable: true },
    { 
      key: 'dateRequested', 
      label: 'Date Requested', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: Disposal) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="ghost" onClick={() => handleView(row)} className="h-8 w-8 p-0">
            <Eye className="w-4 h-4" />
          </Button>
          {row.status === 'Pending' && (
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleApprove(row)}
            >
              Approve
            </Button>
          )}
          {row.status === 'Approved' && (
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => handleMarkDisposed(row)}
            >
              Mark Disposed
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => handlePrint(row)}>
            <Printer className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ], [disposals]);

  const pendingCount = disposals.filter(d => d.status === 'Pending').length;
  const approvedCount = disposals.filter(d => d.status === 'Approved').length;
  const disposedCount = disposals.filter(d => d.status === 'Disposed').length;
  const totalValue = disposals.filter(d => d.status === 'Disposed').reduce((sum, d) => sum + (d.proceedAmount || 0), 0);

  const ppeDisposals = disposals.filter(d => d.group === 'PPE');
  const seDisposals = disposals.filter(d => d.group === 'SE');
  const activeDisposals = activeTab === 'PPE' ? ppeDisposals : seDisposals;

  return (
    <div className="p-2 pt-5 md:pt-20 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Disposal of Properties</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage asset disposal evaluation, memo generation, and tracking processes
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm" onClick={handleStartDisposal}>
          <Plus className="w-4 h-4 mr-2" />
          Start Disposal Process
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200 border-2 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600">Pending Evaluation</p>
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">{pendingCount}</p>
                <p className="text-xs text-slate-500 mb-2">Awaiting review</p>
                {pendingCount > 0 && (
                  <div className="flex items-center">
                    <AlertTriangle className="w-3 h-3 text-amber-600 mr-1" />
                    <span className="text-xs font-medium text-amber-600">Needs attention</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-2 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600">Approved</p>
                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">{approvedCount}</p>
                <p className="text-xs text-slate-500 mb-2">Ready for disposal</p>
                <div className="flex items-center">
                  <FileText className="w-3 h-3 text-blue-600 mr-1" />
                  <span className="text-xs font-medium text-blue-600">Approved status</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-2 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600">Disposed</p>
                  <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                    <Archive className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">{disposedCount}</p>
                <p className="text-xs text-slate-500 mb-2">Completed disposals</p>
                <div className="flex items-center">
                  <Trash2 className="w-3 h-3 text-green-600 mr-1" />
                  <span className="text-xs font-medium text-green-600">Successfully disposed</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-2 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600">Total Proceeds</p>
                  <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-slate-500 mb-2">From sales</p>
                <div className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-purple-600 mr-1" />
                  <span className="text-xs font-medium text-purple-600">Revenue generated</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disposal Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Disposal Records</CardTitle>
          <CardDescription>
            Track all asset disposal requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'PPE' | 'SE')}>
            <TabsList className="w-full h-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5 grid grid-cols-2 gap-1">
              <TabsTrigger
                value="PPE"
                className="rounded-lg py-3 px-4 text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=inactive]:text-slate-500 dark:data-[state=inactive]:text-slate-400"
              >
                <span className="flex flex-col items-center gap-0.5">
                  <span className="font-semibold">PPE</span>
                  <span className="text-xs font-normal opacity-70">IIRUP</span>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="SE"
                className="rounded-lg py-3 px-4 text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=inactive]:text-slate-500 dark:data-[state=inactive]:text-slate-400"
              >
                <span className="flex flex-col items-center gap-0.5">
                  <span className="font-semibold">SE</span>
                  <span className="text-xs font-normal opacity-70">IIRSP</span>
                </span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="PPE">
              <p className="text-xs text-slate-500 mb-3">Inventory and Inspection Report of Unserviceable Properties — PPE</p>
              <DataTable
                data={ppeDisposals}
                columns={columns}
                title="IIRUP records"
                emptyMessage="No IIRUP disposal records found."
              />
            </TabsContent>
            <TabsContent value="SE">
              <p className="text-xs text-slate-500 mb-3">Inventory and Inspection Report of Semi-Expendable Properties — SE</p>
              <DataTable
                data={seDisposals}
                columns={columns}
                title="IIRSP records"
                emptyMessage="No IIRSP disposal records found."
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Start Disposal Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Start Disposal Process</DialogTitle>
            <DialogDescription>
              Select assets and specify disposal details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Asset Type *</Label>
                  <div className="flex gap-3">
                    {(['PPE', 'SE'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => { setFormData(prev => ({ ...prev, group: g })); setSelectedAssets([]); }}
                        className={`flex-1 rounded-lg border-2 py-2.5 text-sm font-semibold transition-colors ${
                          formData.group === g
                            ? g === 'PPE'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-input bg-background text-slate-600 hover:bg-accent'
                        }`}
                      >
                        {g === 'PPE' ? 'PPE — IIRUP' : 'SE — IIRSP'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason for Disposal *</Label>
                  <Select 
                    value={formData.reason} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, reason: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="End of Life">End of Life</SelectItem>
                      <SelectItem value="Damaged">Damaged</SelectItem>
                      <SelectItem value="Obsolete">Obsolete</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                      <SelectItem value="Stolen">Stolen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Disposal Method *</Label>
                  <Select 
                    value={formData.method} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sale">Sale</SelectItem>
                      <SelectItem value="Donation">Donation</SelectItem>
                      <SelectItem value="Destruction">Destruction</SelectItem>
                      <SelectItem value="Return to Supplier">Return to Supplier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Additional notes about the disposal..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Select Assets for Disposal *</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
                  {assetsLoading ? (
                    <p className="text-sm text-slate-500 text-center py-4">Loading assets...</p>
                  ) : availableAssets.filter(a => a.group === formData.group).length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No assets available for disposal.</p>
                  ) : (
                    availableAssets.filter(a => a.group === formData.group).map((asset) => (
                    <div key={asset.id} className="flex items-center space-x-2 p-3 border dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700/60">
                      <Checkbox
                        checked={selectedAssets.includes(asset.id)}
                        onCheckedChange={() => toggleAssetSelection(asset.id)}
                      />
                      <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="font-medium">{asset.code}</p>
                          <p className="text-xs text-slate-500">{asset.category}</p>
                        </div>
                        <div className="col-span-2">
                          <p>{asset.description}</p>
                          <p className="text-xs text-slate-500">{asset.location}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(asset.currentValue)}</p>
                          <Badge className="text-xs bg-orange-100 text-orange-800 border-0">
                            {asset.condition}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                  )}
                </div>
                {selectedAssets.length > 0 && (
                  <p className="text-sm text-slate-600 mt-2">
                    Selected {selectedAssets.length} asset(s) - Total Value: {formatCurrency(
                      availableAssets
                        .filter(a => selectedAssets.includes(a.id))
                        .reduce((sum, a) => sum + a.currentValue, 0)
                    )}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowStartDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Submit Disposal Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Disposal Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[82vw] !max-w-[82vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">Disposal Details</DialogTitle>
              {selectedDisposal && (
                <div className="flex items-center gap-3 mr-6">
                  <span className="text-sm font-mono font-semibold text-slate-700">{selectedDisposal.disposalNumber}</span>
                  {getStatusBadge(selectedDisposal.status)}
                </div>
              )}
            </div>
          </DialogHeader>
          {selectedDisposal && (
            <div className="space-y-6 pt-2">

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 sm:p-5 border dark:border-slate-700">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Reason</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{selectedDisposal.reason}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Method</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{selectedDisposal.method}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Value</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{formatCurrency(selectedDisposal.totalValue)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Requested By</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{selectedDisposal.requestedBy}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Date Requested</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{new Date(selectedDisposal.dateRequested).toLocaleDateString()}</p>
                </div>
                {selectedDisposal.approvedBy && (
                  <>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Approved By</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{selectedDisposal.approvedBy}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Date Approved</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">
                        {selectedDisposal.dateApproved && new Date(selectedDisposal.dateApproved).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
                {selectedDisposal.dateDisposed && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Date Disposed</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{new Date(selectedDisposal.dateDisposed).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedDisposal.buyer && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Buyer / Recipient</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{selectedDisposal.buyer}</p>
                  </div>
                )}
                {selectedDisposal.proceedAmount !== undefined && selectedDisposal.proceedAmount > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Proceed Amount</p>
                    <p className="text-sm font-semibold text-green-700 mt-0.5">{formatCurrency(selectedDisposal.proceedAmount)}</p>
                  </div>
                )}
              </div>

              {selectedDisposal.remarks && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">Remarks</p>
                  <p className="text-sm text-slate-700 whitespace-pre-line">{selectedDisposal.remarks}</p>
                </div>
              )}

              {/* Assets table */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Assets <span className="text-slate-400 font-normal">({selectedDisposal.assets.length})</span></p>
                <div className="border rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <th className="px-4 py-3 text-left font-medium">Code</th>
                        <th className="px-4 py-3 text-left font-medium">Description</th>
                        <th className="px-4 py-3 text-left font-medium">Category</th>
                        <th className="px-4 py-3 text-right font-medium">Acquisition Cost</th>
                        <th className="px-4 py-3 text-right font-medium">Current Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDisposal.assets.map((asset, idx) => (
                        <tr key={asset.id} className={`border-t dark:border-slate-700 ${idx % 2 === 1 ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-transparent'}`}>
                          <td className="px-4 py-3 font-mono text-xs text-slate-700">{asset.code}</td>
                          <td className="px-4 py-3 text-slate-800">{asset.description}</td>
                          <td className="px-4 py-3 text-slate-600">{asset.category}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(asset.acquisitionCost)}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(asset.currentValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            {selectedDisposal && (
              <Button variant="outline" onClick={() => handlePrint(selectedDisposal)}>
                <Printer className="w-4 h-4 mr-2" />
                Print Memo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Disposal Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve disposal request {selectedDisposal?.disposalNumber}?
              This will allow the disposal process to proceed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApprove} className="bg-green-600 hover:bg-green-700">
              Approve Disposal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark Disposed Dialog */}
      <Dialog open={showDisposedDialog} onOpenChange={setShowDisposedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Disposed</DialogTitle>
            <DialogDescription>
              Complete disposal details for {selectedDisposal?.disposalNumber}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={confirmDisposed}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Date Disposed *</Label>
                <Input
                  type="date"
                  value={disposedFormData.dateDisposed}
                  onChange={(e) => setDisposedFormData(prev => ({ ...prev, dateDisposed: e.target.value }))}
                  required
                />
              </div>
              {selectedDisposal?.method === 'Sale' && (
                <>
                  <div className="space-y-2">
                    <Label>Proceed Amount</Label>
                    <Input
                      type="number"
                      value={disposedFormData.proceedAmount}
                      onChange={(e) => setDisposedFormData(prev => ({ ...prev, proceedAmount: Number(e.target.value) }))}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Buyer</Label>
                    <Input
                      value={disposedFormData.buyer}
                      onChange={(e) => setDisposedFormData(prev => ({ ...prev, buyer: e.target.value }))}
                      placeholder="Buyer name"
                    />
                  </div>
                </>
              )}
              {selectedDisposal?.method === 'Donation' && (
                <div className="space-y-2">
                  <Label>Recipient</Label>
                  <Input
                    value={disposedFormData.buyer}
                    onChange={(e) => setDisposedFormData(prev => ({ ...prev, buyer: e.target.value }))}
                    placeholder="Recipient organization"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Final Remarks</Label>
                <Textarea
                  value={disposedFormData.remarks}
                  onChange={(e) => setDisposedFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Final notes about the disposal..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDisposedDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Mark as Disposed
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
