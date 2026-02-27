import { useMemo, useState } from 'react';
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

export interface DisposalAsset {
  id: string;
  code: string;
  description: string;
  category: string;
  acquisitionCost: number;
  currentValue: number;
  condition: string;
  location: string;
}

export interface Disposal {
  id: string;
  disposalNumber: string;
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

export function Disposals() {
  const [disposals, setDisposals] = useState<Disposal[]>([
    {
      id: '1',
      disposalNumber: 'DISP-2024-001',
      assets: [
        { id: '1', code: 'PPE-2019-001', description: 'HP Desktop Computer Pentium', category: 'ICT Equipment', acquisitionCost: 25000, currentValue: 2500, condition: 'For Disposal', location: 'IT Dept' }
      ],
      reason: 'End of Life',
      method: 'Donation',
      requestedBy: 'John Doe',
      dateRequested: '2024-11-15',
      approvedBy: 'Property Custodian',
      dateApproved: '2024-11-20',
      totalValue: 2500,
      status: 'Approved',
      remarks: 'To be donated to local government unit'
    },
    {
      id: '2',
      disposalNumber: 'DISP-2024-002',
      assets: [
        { id: '2', code: 'PPE-2020-015', description: 'Old Printer Canon', category: 'ICT Equipment', acquisitionCost: 8000, currentValue: 800, condition: 'Unserviceable', location: 'Admin' }
      ],
      reason: 'Obsolete',
      method: 'Destruction',
      requestedBy: 'Jane Smith',
      dateRequested: '2024-11-18',
      totalValue: 800,
      status: 'Pending'
    },
    {
      id: '3',
      disposalNumber: 'DISP-2024-003',
      assets: [
        { id: '3', code: 'PPE-2018-032', description: 'Office Chair - Damaged', category: 'Furniture', acquisitionCost: 5000, currentValue: 500, condition: 'For Disposal', location: 'Legal Dept' }
      ],
      reason: 'Damaged',
      method: 'Sale',
      requestedBy: 'Mike Johnson',
      dateRequested: '2024-11-10',
      approvedBy: 'Property Custodian',
      dateApproved: '2024-11-12',
      dateDisposed: '2024-11-25',
      totalValue: 500,
      proceedAmount: 200,
      buyer: 'Scrap Dealer Inc.',
      status: 'Disposed',
      remarks: 'Sold as scrap material'
    }
  ]);

  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showDisposedDialog, setShowDisposedDialog] = useState(false);
  const [selectedDisposal, setSelectedDisposal] = useState<Disposal | null>(null);

  const [formData, setFormData] = useState({
    reason: 'End of Life' as const,
    method: 'Sale' as const,
    requestedBy: 'Current User',
    remarks: ''
  });

  const [disposedFormData, setDisposedFormData] = useState({
    dateDisposed: new Date().toISOString().split('T')[0],
    proceedAmount: 0,
    buyer: '',
    remarks: ''
  });

  const [availableAssets] = useState<DisposalAsset[]>([
    { id: '10', code: 'PPE-2017-045', description: 'Old Monitor LCD 17"', category: 'ICT Equipment', acquisitionCost: 6000, currentValue: 600, condition: 'For Disposal', location: 'Finance' },
    { id: '11', code: 'PPE-2018-078', description: 'Broken Photocopier', category: 'ICT Equipment', acquisitionCost: 45000, currentValue: 4500, condition: 'Unserviceable', location: 'Admin' },
    { id: '12', code: 'PPE-2019-102', description: 'Damaged Filing Cabinet', category: 'Furniture', acquisitionCost: 8000, currentValue: 800, condition: 'For Disposal', location: 'HR' }
  ]);

  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  const handleStartDisposal = () => {
    setSelectedAssets([]);
    setFormData({
      reason: 'End of Life',
      method: 'Sale',
      requestedBy: 'Current User',
      remarks: ''
    });
    setShowStartDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedAssets.length === 0) {
      toast.error('Please select at least one asset');
      return;
    }

    const assets = availableAssets.filter(a => selectedAssets.includes(a.id));
    const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);

    const newDisposal: Disposal = {
      id: String(disposals.length + 1),
      disposalNumber: `DISP-${new Date().getFullYear()}-${String(disposals.length + 1).padStart(3, '0')}`,
      assets,
      reason: formData.reason,
      method: formData.method,
      requestedBy: formData.requestedBy,
      dateRequested: new Date().toISOString().split('T')[0],
      totalValue,
      status: 'Pending',
      remarks: formData.remarks
    };

    setDisposals(prev => [newDisposal, ...prev]);
    toast.success(`Disposal request ${newDisposal.disposalNumber} created successfully`);
    setShowStartDialog(false);
  };

  const handleView = (disposal: Disposal) => {
    setSelectedDisposal(disposal);
    setShowViewDialog(true);
  };

  const handleApprove = (disposal: Disposal) => {
    setSelectedDisposal(disposal);
    setShowApproveDialog(true);
  };

  const confirmApprove = () => {
    if (selectedDisposal) {
      setDisposals(prev => prev.map(d =>
        d.id === selectedDisposal.id
          ? {
              ...d,
              status: 'Approved' as const,
              approvedBy: 'Current User',
              dateApproved: new Date().toISOString().split('T')[0]
            }
          : d
      ));
      toast.success(`Disposal ${selectedDisposal.disposalNumber} approved`);
    }
    setShowApproveDialog(false);
    setSelectedDisposal(null);
  };

  const handleMarkDisposed = (disposal: Disposal) => {
    setSelectedDisposal(disposal);
    setDisposedFormData({
      dateDisposed: new Date().toISOString().split('T')[0],
      proceedAmount: 0,
      buyer: '',
      remarks: ''
    });
    setShowDisposedDialog(true);
  };

  const confirmDisposed = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedDisposal) {
      setDisposals(prev => prev.map(d =>
        d.id === selectedDisposal.id
          ? {
              ...d,
              status: 'Disposed' as const,
              dateDisposed: disposedFormData.dateDisposed,
              proceedAmount: disposedFormData.proceedAmount,
              buyer: disposedFormData.buyer,
              remarks: d.remarks + (disposedFormData.remarks ? `\n${disposedFormData.remarks}` : '')
            }
          : d
      ));
      toast.success(`Disposal ${selectedDisposal.disposalNumber} marked as disposed`);
    }
    setShowDisposedDialog(false);
    setSelectedDisposal(null);
  };

  const handlePrint = (disposal: Disposal) => {
    toast.success(`Printing disposal memo for ${disposal.disposalNumber}`);
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
        <Badge className="bg-slate-100 text-slate-800 border-0">{value}</Badge>
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

  return (
    <div className="p-6 pt-20 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Disposal of Properties</h1>
          <p className="text-slate-600 mt-1">
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
          <DataTable
            data={disposals}
            columns={columns}
            title="disposals"
            emptyMessage="No disposal records found."
          />
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
                  {availableAssets.map((asset) => (
                    <div key={asset.id} className="flex items-center space-x-2 p-3 border rounded hover:bg-slate-50">
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
                  ))}
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Disposal Details - {selectedDisposal?.disposalNumber}</DialogTitle>
          </DialogHeader>
          {selectedDisposal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-900">Disposal Number</Label>
                  <p className="text-sm text-slate-600">{selectedDisposal.disposalNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-900">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedDisposal.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-900">Reason</Label>
                  <p className="text-sm text-slate-600">{selectedDisposal.reason}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-900">Method</Label>
                  <p className="text-sm text-slate-600">{selectedDisposal.method}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-900">Requested By</Label>
                  <p className="text-sm text-slate-600">{selectedDisposal.requestedBy}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-900">Date Requested</Label>
                  <p className="text-sm text-slate-600">
                    {new Date(selectedDisposal.dateRequested).toLocaleDateString()}
                  </p>
                </div>
                {selectedDisposal.approvedBy && (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-slate-900">Approved By</Label>
                      <p className="text-sm text-slate-600">{selectedDisposal.approvedBy}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-900">Date Approved</Label>
                      <p className="text-sm text-slate-600">
                        {selectedDisposal.dateApproved && new Date(selectedDisposal.dateApproved).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
                {selectedDisposal.dateDisposed && (
                  <div>
                    <Label className="text-sm font-medium text-slate-900">Date Disposed</Label>
                    <p className="text-sm text-slate-600">
                      {new Date(selectedDisposal.dateDisposed).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedDisposal.buyer && (
                  <div>
                    <Label className="text-sm font-medium text-slate-900">Buyer/Recipient</Label>
                    <p className="text-sm text-slate-600">{selectedDisposal.buyer}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-slate-900">Total Value</Label>
                  <p className="text-sm text-slate-600">{formatCurrency(selectedDisposal.totalValue)}</p>
                </div>
                {selectedDisposal.proceedAmount !== undefined && selectedDisposal.proceedAmount > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-slate-900">Proceed Amount</Label>
                    <p className="text-sm text-slate-600">{formatCurrency(selectedDisposal.proceedAmount)}</p>
                  </div>
                )}
              </div>
              {selectedDisposal.remarks && (
                <div>
                  <Label className="text-sm font-medium text-slate-900">Remarks</Label>
                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{selectedDisposal.remarks}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-slate-900 mb-2 block">Assets ({selectedDisposal.assets.length})</Label>
                <div className="border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-2 text-left">Code</th>
                        <th className="p-2 text-left">Description</th>
                        <th className="p-2 text-left">Category</th>
                        <th className="p-2 text-right">Acquisition Cost</th>
                        <th className="p-2 text-right">Current Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDisposal.assets.map((asset) => (
                        <tr key={asset.id} className="border-t">
                          <td className="p-2">{asset.code}</td>
                          <td className="p-2">{asset.description}</td>
                          <td className="p-2">{asset.category}</td>
                          <td className="p-2 text-right">{formatCurrency(asset.acquisitionCost)}</td>
                          <td className="p-2 text-right">{formatCurrency(asset.currentValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
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
