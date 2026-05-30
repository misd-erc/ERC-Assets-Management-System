import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Eye, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  AssetRequestRecord,
  AssetRequestStatus,
  getAllAssetRequests,
  getAssetRequestById,
  getAssetRequestProcessors,
  updateAssetRequestAssignment,
  updateAssetRequestStatus,
  addAssetRequestHistory,
} from '@/api/asset/assetRequestApi';
import { formatDate } from '@/utils/dateUtils';

const allStatuses: AssetRequestStatus[] = [
  'Pending',
  'UnderReview',
  'Assigned',
  'InProgress',
  'Resolved',
  'Rejected',
  'Completed',
];

const toStatusVariant = (status: AssetRequestStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (status === 'Rejected') return 'destructive';
  if (status === 'Completed' || status === 'Resolved') return 'secondary';
  if (status === 'Pending') return 'outline';
  return 'default';
};

export default function ApprovalsPage() {
  const [rows, setRows] = useState<AssetRequestRecord[]>([]);
  const [processors, setProcessors] = useState<Array<{ id: number; fullName: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<AssetRequestRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [committeeId, setCommitteeId] = useState<number | ''>('');
  const [personnelId, setPersonnelId] = useState<number | ''>('');
  const [assignRemarks, setAssignRemarks] = useState('');

  const [nextStatus, setNextStatus] = useState<AssetRequestStatus>('UnderReview');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [comment, setComment] = useState('');

  const loadRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reqRes, procRes] = await Promise.all([
        getAllAssetRequests({ status: statusFilter as AssetRequestStatus | undefined, pageSize: 100 }),
        getAssetRequestProcessors(),
      ]);
      setRows(reqRes.items);
      setProcessors(procRes.map((x) => ({ id: x.id, fullName: x.fullName })));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const openDetails = async (requestId: number) => {
    setSelectedId(requestId);
    setShowDetails(true);
    const data = await getAssetRequestById(requestId);
    setSelected(data);
    if (data) {
      setCommitteeId(data.assignedCommitteeSystemUserId ?? '');
      setPersonnelId(data.assignedPersonnelSystemUserId ?? '');
      setNextStatus(data.status === 'Pending' ? 'UnderReview' : data.status);
    }
  };

  const reloadSelected = async () => {
    if (!selectedId) return;
    const data = await getAssetRequestById(selectedId);
    setSelected(data);
    await loadRows();
  };

  const handleAssign = async () => {
    if (!selected) return;
    const ok = await updateAssetRequestAssignment({
      requestId: selected.id,
      assignedCommitteeSystemUserId: committeeId === '' ? undefined : Number(committeeId),
      assignedPersonnelSystemUserId: personnelId === '' ? undefined : Number(personnelId),
      remarks: assignRemarks || undefined,
    });

    if (!ok) {
      toast.error('Failed to update assignment.');
      return;
    }

    toast.success('Assignment updated.');
    setAssignRemarks('');
    await reloadSelected();
  };

  const handleStatus = async () => {
    if (!selected) return;
    const ok = await updateAssetRequestStatus({
      requestId: selected.id,
      status: nextStatus,
      remarks: statusRemarks || undefined,
    });

    if (!ok) {
      toast.error('Failed to update status.');
      return;
    }

    toast.success('Status updated.');
    setStatusRemarks('');
    await reloadSelected();
  };

  const handleComment = async () => {
    if (!selected || !comment.trim()) return;
    const ok = await addAssetRequestHistory({ requestId: selected.id, remarks: comment.trim() });
    if (!ok) {
      toast.error('Failed to add comment.');
      return;
    }
    toast.success('Comment added.');
    setComment('');
    await reloadSelected();
  };

  const statusSummary = useMemo(() => {
    return allStatuses.map((status) => ({
      status,
      count: rows.filter((x) => x.status === status).length,
    }));
  }, [rows]);

  return (
    <div className="p-2 pt-5 md:pt-20 space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Approval Request Management</CardTitle>
          <CardDescription>Review, assign, and update employee asset concern requests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Label>Status</Label>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              {allStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {statusSummary.map((x) => (
              <div key={x.status} className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">{x.status}</p>
                <p className="text-xl font-semibold">{x.count}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request #</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading requests...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      No requests found.
                    </TableCell>
                  </TableRow>
                ) : rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.requestNumber}</TableCell>
                    <TableCell>{row.employeeName || 'N/A'}</TableCell>
                    <TableCell><Badge variant={toStatusVariant(row.status)}>{row.status}</Badge></TableCell>
                    <TableCell>{row.assignedPersonnelName || row.assignedCommitteeName || 'Unassigned'}</TableCell>
                    <TableCell>{formatDate(row.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetails(row.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="w-[95vw] !max-w-[95vw] sm:!max-w-[1100px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details {selected?.requestNumber ? `- ${selected.requestNumber}` : ''}</DialogTitle>
            <DialogDescription>Assignment, status updates, and timeline logs.</DialogDescription>
          </DialogHeader>

          {!selected ? (
            <div className="py-8 text-center text-muted-foreground">Loading details...</div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Employee</p>
                  <p className="font-medium">{selected.employeeName || 'N/A'}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={toStatusVariant(selected.status)}>{selected.status}</Badge>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(selected.createdAt)}</p>
                </div>
              </div>

              <div className="rounded-md border p-4 space-y-3">
                <p className="font-medium">Assignment</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Committee</Label>
                    <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={committeeId} onChange={(e) => setCommitteeId(e.target.value ? Number(e.target.value) : '')}>
                      <option value="">Unassigned</option>
                      {processors.map((p) => (
                        <option key={p.id} value={p.id}>{p.fullName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>AMS Personnel</Label>
                    <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={personnelId} onChange={(e) => setPersonnelId(e.target.value ? Number(e.target.value) : '')}>
                      <option value="">Unassigned</option>
                      {processors.map((p) => (
                        <option key={p.id} value={p.id}>{p.fullName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Textarea value={assignRemarks} onChange={(e) => setAssignRemarks(e.target.value)} placeholder="Assignment remarks (optional)" />
                <div>
                  <Button onClick={handleAssign}>Save Assignment</Button>
                </div>
              </div>

              <div className="rounded-md border p-4 space-y-3">
                <p className="font-medium">Status Update</p>
                <div className="grid gap-3 md:grid-cols-[200px_1fr]">
                  <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={nextStatus} onChange={(e) => setNextStatus(e.target.value as AssetRequestStatus)}>
                    {allStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <Input value={statusRemarks} onChange={(e) => setStatusRemarks(e.target.value)} placeholder="Status update remarks (optional)" />
                </div>
                <div>
                  <Button onClick={handleStatus}>Update Status</Button>
                </div>
              </div>

              <div className="rounded-md border p-4 space-y-3">
                <p className="font-medium">Items</p>
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
                      {selected.items.map((x) => (
                        <TableRow key={x.id}>
                          <TableCell>{x.propertyNumber}</TableCell>
                          <TableCell>{x.item?.description || '-'}</TableCell>
                          <TableCell>{x.remarks}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="rounded-md border p-4 space-y-3">
                <p className="font-medium">Timeline / History</p>
                <div className="flex items-center gap-2">
                  <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add comment" />
                  <Button onClick={handleComment}>Add</Button>
                </div>
                <div className="space-y-2">
                  {selected.history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No history yet.</p>
                  ) : selected.history.map((h) => (
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
