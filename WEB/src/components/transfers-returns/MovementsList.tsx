import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, Search, Eye, User, Package, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { getMovementsList, getPTRMovements, getITRMovements, getRRPPEMovements, getRRSPMovements, getPTATransferList, getPTAReturnList, editMovement } from '@/api/asset/transferApi';
import { getConditions } from '@/api/asset/inventoryApi';
import { getEmployees } from '@/api/user-management/userApi';
import { ApiEmployee } from '@/types/transfer';
import { EmployeeSelector } from './EmployeeSelector';
import { PTRGenerator } from '@/components/assets/reports/PTRGenerator';
import { ITRGenerator } from '@/components/assets/reports/ITRGenerator';
import { ReturnReceiptGenerator } from '@/components/assets/reports/ReturnReceiptGenerator';
import { type NormalizedEmployee } from '@/types/asset/UnifiedAsset';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface MovementsListProps {
  transferType?: 'PTR' | 'ITR' | 'RRPPE' | 'RRSP';
}

export interface MovementsListRef {
  loadMovements: (search?: string, page?: number) => Promise<void>;
}

interface EmployeeInfo {
  id: number;
  fullName?: string;
  employeeIdOriginal?: string | null;
  employeeType?: string;
  position?: any;
  office?: any;
  division?: any;
}

interface PTAItem {
  id: number;
  propertyNumber?: string;
  description?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  category?: string;
  unitOfMeasurement?: string;
  unitValue?: number;
  dateAcquired?: string;
  group?: string;
}

interface Movement {
  id?: number;
  movementId?: number;
  ptaId?: number;
  dateAssigned?: string;
  ptritrNumber?: string;
  rrppeRrspNumber?: string;
  rrpperrspNumber?: string;
  paricsNumber?: string;
  plantillaEmployeeId?: number | null;
  nonPlantillaEmployeeId?: number | null;
  employee?: EmployeeInfo[];
  office?: any;
  division?: any;
  items?: PTAItem[];
  remarks?: string;
  status?: string;
  condition?: string;
  isActive: boolean;
  createdAt?: string;
  allMovementIds?: number[];
}

// Normalize a single item from the new getPTATransferList response shape into Movement
const normalizeTransferListItem = (raw: any): Movement => ({
  id: raw.id,
  movementId: raw.id,
  ptaId: raw.ptaId,
  ptritrNumber: raw.ptrItrNumber,
  rrppeRrspNumber: raw.rrppeRrspNumber || raw.rrpperrspNumber,
  paricsNumber: raw.parIcsNumber,
  dateAssigned: raw.dateAssigned,
  status: raw.status,
  remarks: raw.remarks,
  isActive: raw.isActive,
  createdAt: raw.createdAt,
  office: raw.office,
  division: raw.division,
  plantillaEmployeeId: raw.plantillaEmployeeId ?? null,
  nonPlantillaEmployeeId: raw.nonPlantillaEmployeeId ?? null,
  employee: [
    ...(raw.plantillaEmployeeName || raw.plantillaEmployeeId
      ? [{ id: raw.plantillaEmployeeId ?? 0, fullName: raw.plantillaEmployeeName, employeeIdOriginal: raw.plantillaEmployeeIdOriginal, employeeType: 'Plantilla' }]
      : []),
    ...(raw.nonPlantillaEmployeeName || raw.nonPlantillaEmployeeId
      ? [{ id: raw.nonPlantillaEmployeeId ?? 0, fullName: raw.nonPlantillaEmployeeName, employeeIdOriginal: raw.nonPlantillaEmployeeIdOriginal, employeeType: 'Non-Plantilla' }]
      : []),
  ],
  items: raw.item ? [raw.item] : [],
});

// Merge movements that share the same transfer number so UI shows a single row per PTR/ITR
const mergeMovementsByTransfer = (items: Movement[]): Movement[] => {
  const map = new Map<string, Movement>();

  items.forEach(item => {
    const key =
      item.ptritrNumber ||
      item.rrppeRrspNumber ||
      item.rrpperrspNumber ||
      item.paricsNumber ||
      String(item.movementId ?? item.id ?? Math.random());
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        ...item,
        items: item.items ? [...item.items] : [],
        employee: item.employee ? [...item.employee] : [],
        allMovementIds: item.id ? [item.id] : [],
      });
      return;
    }

    // Merge items (unique by id if present)
    const mergedItems = [...(existing.items || [])];
    (item.items || []).forEach(it => {
      const already = mergedItems.find(m => m.id === it.id);
      if (!already) mergedItems.push(it);
    });

    // Merge employees (unique by id)
    const mergedEmployees = [...(existing.employee || [])];
    (item.employee || []).forEach(emp => {
      const already = mergedEmployees.find(m => m.id === emp.id);
      if (!already) mergedEmployees.push(emp);
    });

    const mergedIds = [...(existing.allMovementIds || [])]
    if (item.id && !mergedIds.includes(item.id)) mergedIds.push(item.id);

    map.set(key, {
      ...existing,
      ...item,
      items: mergedItems,
      employee: mergedEmployees,
      allMovementIds: mergedIds,
    });
  });

  return Array.from(map.values());
};

export const MovementsList = forwardRef<MovementsListRef, MovementsListProps>(
  function MovementsListComponent({ transferType }, ref) {
  const [searchInput, setSearchInput] = useState('');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [conditions, setConditions] = useState<string[]>([]);
  const [editEmployees, setEditEmployees] = useState<ApiEmployee[]>([]);
  const [editEmployeesLoading, setEditEmployeesLoading] = useState(false);
  const [editFields, setEditFields] = useState<{
    dateAssigned: string;
    transferNumber: string;
    parIcsNumber: string;
    status: string;
    condition: string;
    remarks: string;
    plantillaEmployeeId: number | null;
    nonPlantillaEmployeeId: number | null;
  }>({
    dateAssigned: '',
    transferNumber: '',
    parIcsNumber: '',
    status: '',
    condition: '',
    remarks: '',
    plantillaEmployeeId: null,
    nonPlantillaEmployeeId: null,
  });

  // Load movements
  const loadMovements = async (search?: string, page: number = 1, size: number = pageSize) => {
    try {
      setLoading(true);
      
      let result;
      if (transferType === 'PTR' || transferType === 'ITR') {
        const group = transferType === 'PTR' ? 'PPE' : 'SE';
        const raw = await getPTATransferList({
          group: group as 'PPE' | 'SE',
          ptrItrFilter: search || undefined,
          pageNumber: page,
          pageSize: size,
        });
        result = {
          items: raw.items.map(normalizeTransferListItem),
          totalCount: raw.totalCount,
        };
      } else if (transferType === 'RRPPE' || transferType === 'RRSP') {
        const group = transferType === 'RRPPE' ? 'PPE' : 'SE';
        const raw = await getPTAReturnList({
          group,
          rrppeRrspFilter: search || transferType,
          pageNumber: page,
          pageSize: size,
        });
        result = {
          items: raw.items.map(normalizeTransferListItem),
          totalCount: raw.totalCount,
        };
      } else {
        result = await getMovementsList(search, undefined, undefined, page, size);
      }

      const serverTotal = result.totalCount ?? 0;
      const mergedItems = mergeMovementsByTransfer(result.items || []);
      setMovements(mergedItems);
      setTotalCount(serverTotal);
      setPageNumber(page);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load movements';
      toast.error(message);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  // Expose loadMovements via ref
  useImperativeHandle(ref, () => ({
    loadMovements: (search?: string, page?: number) => loadMovements(search, page),
  }));

  // Initial load
  useEffect(() => {
    loadMovements();
  }, [transferType]);

  // Handle search
  const handleSearch = async () => {
    if (!searchInput.trim()) {
      toast.error('Please enter a transfer number');
      return;
    }
    loadMovements(searchInput, 1);
  };

  // Handle view details
  const handleViewDetails = (movement: Movement) => {
    setSelectedMovement(movement);
    setDetailsDialogOpen(true);
  };

  // Handle edit details
  const handleEditDetails = async (movement: Movement) => {
    setEditingMovement(movement);
    setEditFields({
      dateAssigned: movement.dateAssigned
        ? new Date(movement.dateAssigned).toISOString().split('T')[0]
        : '',
      transferNumber:
        movement.ptritrNumber ||
        movement.rrppeRrspNumber ||
        movement.rrpperrspNumber ||
        '',
      parIcsNumber: movement.paricsNumber || '',
      status: movement.status || '',
      condition: movement.condition || '',
      remarks: movement.remarks || '',
      plantillaEmployeeId:
        movement.plantillaEmployeeId ??
        movement.employee?.find(e => e.employeeType === 'Plantilla')?.id ??
        null,
      nonPlantillaEmployeeId:
        movement.nonPlantillaEmployeeId ??
        movement.employee?.find(e => e.employeeType === 'Non-Plantilla')?.id ??
        null,
    });

    const loads: Promise<any>[] = [];

    if (conditions.length === 0) {
      loads.push(
        getConditions()
          .then(conds => setConditions(conds || []))
          .catch(() => {})
      );
    }

    if (editEmployees.length === 0) {
      setEditEmployeesLoading(true);
      loads.push(
        getEmployees()
          .then(res => setEditEmployees(res.data?.items || []))
          .catch(() => {})
          .finally(() => setEditEmployeesLoading(false))
      );
    }

    await Promise.all(loads);
    setEditDialogOpen(true);
  };

  // Save edited movement details
  const handleSaveEdit = async () => {
    if (!editingMovement) return;
    const ids = editingMovement.allMovementIds?.length
      ? editingMovement.allMovementIds
      : editingMovement.id
      ? [editingMovement.id]
      : [];

    if (ids.length === 0) {
      toast.error('No movement IDs available to update');
      return;
    }

    const isReturn =
      !editFields.transferNumber.toUpperCase().startsWith('PTR') &&
      !editFields.transferNumber.toUpperCase().startsWith('ITR');

    try {
      setEditSaving(true);
      for (const id of ids) {
        await editMovement({
          id,
          ptaId: editingMovement.ptaId ?? 0,
          dateAssigned: editFields.dateAssigned
            ? new Date(editFields.dateAssigned).toISOString()
            : editingMovement.dateAssigned || new Date().toISOString(),
          ptrItrNumber: isReturn
            ? (editingMovement.ptritrNumber || (editingMovement as any).ptrItrNumber || '')
            : editFields.transferNumber,
          parIcsNumber: editFields.parIcsNumber,
          rrppeRrspNumber: isReturn
            ? editFields.transferNumber
            : (editingMovement.rrppeRrspNumber || (editingMovement as any).rrppeRrspNumber || editingMovement.rrpperrspNumber || undefined),
          status: editFields.status,
          condition: editFields.condition,
          actualOfficeId: (editingMovement as any).actualOfficeId ?? null,
          actualDivisionId: (editingMovement as any).actualDivisionId ?? null,
          plantillaEmployeeId: editFields.plantillaEmployeeId ?? null,
          nonPlantillaEmployeeId: editFields.nonPlantillaEmployeeId ?? null,
          isActive: editingMovement.isActive,
          isCurrent: true,
        });
      }
      toast.success('Movement details updated successfully');
      setEditDialogOpen(false);
      loadMovements(searchInput, pageNumber);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update movement';
      toast.error(message);
    } finally {
      setEditSaving(false);
    }
  };

  const buildEmployee = (emp?: EmployeeInfo): NormalizedEmployee => {
    const nameParts = (emp?.fullName || '').split(' ');
    return {
      id: emp?.id || 0,
      firstName: nameParts.slice(0, -1).join(' ') || emp?.fullName || '',
      middleName: '',
      lastName: nameParts.slice(-1).join(' ') || '',
      suffixName: '',
      employeeIdOriginal: emp?.employeeIdOriginal || '',
      employmentTypeId: 0,
      employmentTypeName: '',
      label: emp?.fullName || '',
    };
  };

  const handleGenerateReport = async (movement: Movement) => {
    if (!movement) return;
    const transferNumber =
      movement.ptritrNumber ||
      movement.rrppeRrspNumber ||
      movement.rrpperrspNumber ||
      '';
    const prefix = transferNumber.toUpperCase();
    const items = movement.items || [];
    const fromEmp = buildEmployee(movement.employee?.[0]);
    const toEmp = buildEmployee(movement.employee?.[1]);
    const transferDate = movement.dateAssigned || new Date().toISOString();
    const transferType = (movement.status || 'REASSIGNMENT') as any;

    const returnedByName = movement.employee?.[0]?.fullName || fromEmp.label || 'Unknown';
    const returnedByPosition = (movement.employee?.[0] as any)?.position?.name || movement.employee?.[0]?.employeeType || '';

    try {
      setGenerating(true);
      if (prefix.startsWith('PTR')) {
        const url = await PTRGenerator.generatePTRPreviewMultiple(fromEmp, toEmp, items as any, transferDate, transferType, transferNumber);
        const blob = await fetch(url).then(r => r.blob());
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = `${transferNumber || 'PTR-report'}.pdf`;
        a.click();
        URL.revokeObjectURL(dlUrl);
      } else if (prefix.startsWith('ITR')) {
        const url = await ITRGenerator.generateITRPreviewMultiple(fromEmp, toEmp, items as any, transferDate, transferType, transferNumber);
        const blob = await fetch(url).then(r => r.blob());
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = `${transferNumber || 'ITR-report'}.pdf`;
        a.click();
        URL.revokeObjectURL(dlUrl);
      } else if (prefix.startsWith('RRPPE') || prefix.startsWith('RRSP')) {
        const url = await ReturnReceiptGenerator.generateReturnPreview(
          prefix.startsWith('RRPPE') ? 'RRPPE' : 'RRSP',
          items as any,
          transferNumber,
          transferDate,
          returnedByName,
          returnedByPosition
        );
        const blob = await fetch(url).then(r => r.blob());
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = `${transferNumber || 'return-report'}.pdf`;
        a.click();
        URL.revokeObjectURL(dlUrl);
      } else {
        toast.error('Report generation is available for PTR/ITR/RRPPE/RRSP only.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate report';
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadgeColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toUpperCase()) {
      case 'T':
      case 'TRANSFER':
        return 'bg-blue-100 text-blue-800';
      case 'R':
      case 'RETURN':
        return 'bg-amber-100 text-amber-800';
      case 'C':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search {transferType ? `${transferType} Movements` : 'Movements'}</CardTitle>
          <CardDescription>
            Enter a specific {transferType || 'transfer'} number to view all related items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder={`Enter ${transferType || 'PTR/ITR'} number (e.g., PTR2024001 or ITR2024001)`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearchInput('');
                loadMovements();
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            {transferType ? `${transferType} Movements` : 'All Movements'}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({totalCount} total)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchInput
                ? 'No movements found matching your search'
                : 'No movements found'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="text-sm md:text-base">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm md:text-base">Transfer Number</TableHead>
                      <TableHead className="text-sm md:text-base">Return Number</TableHead>
                      <TableHead className="text-sm md:text-base">PAR/ICS Number</TableHead>
                      <TableHead className="text-sm md:text-base">From Employee</TableHead>
                      <TableHead className="text-sm md:text-base">To Employee</TableHead>
                      <TableHead className="text-sm md:text-base">Date Assigned</TableHead>
                      <TableHead className="text-sm md:text-base">Status</TableHead>
                      <TableHead className="text-sm md:text-base">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold">
                          { movement.ptritrNumber || 'N/A'}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {movement.rrppeRrspNumber || movement.rrpperrspNumber || 'N/A'}
                        </TableCell>
                        <TableCell>{movement.paricsNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {movement.employee?.[0]?.fullName || 'Unknown'}
                            </p>
                            {movement.employee?.[0]?.employeeType && (
                              <p className="text-xs text-muted-foreground">
                                {movement.employee[0].employeeType}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {movement.employee?.[1]?.fullName || 'Unknown'}
                            </p>
                            {movement.employee?.[1]?.employeeType && (
                              <p className="text-xs text-muted-foreground">
                                {movement.employee[1].employeeType}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {movement.dateAssigned
                            ? new Date(movement.dateAssigned).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(movement.status)}>
                            {movement.status || 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(movement)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDetails(movement)}
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Size:</span>
                  <select
                    className="border rounded px-2 py-1 text-sm bg-background"
                    value={pageSize}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      setPageSize(newSize);
                      loadMovements(searchInput, 1, newSize);
                    }}
                  >
                    {[5, 10, 25, 50, 100].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <span>Page {pageNumber} of {totalPages || 1}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageNumber === 1 || loading}
                    onClick={() => loadMovements(searchInput, pageNumber - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageNumber >= (totalPages || 1) || loading}
                    onClick={() => loadMovements(searchInput, pageNumber + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[1200px] max-w-[95vw] max-h-[95vh] overflow-y-auto text-base">
          <DialogHeader>
            <DialogTitle className="text-xl">Movement Details</DialogTitle>
            <DialogDescription className="text-sm md:text-base">
              Transfer Number: {selectedMovement?.ptritrNumber || 'N/A'}
            </DialogDescription>
            {selectedMovement && (
              <div className="mt-2">
                <Button
                  size="sm"
                  onClick={() => handleGenerateReport(selectedMovement)}
                  disabled={generating}
                >
                  {generating ? 'Generating…' : 'Generate Report'}
                </Button>
              </div>
            )}
          </DialogHeader>

          {selectedMovement ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4 text-base">
                <p>
                  <span className="font-semibold">Total Items:</span>{' '}
                  {selectedMovement.items?.length || 0}
                </p>
              </div>

              {/* From Employee */}
              {selectedMovement.employee?.[0] && (
                <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded">
                  <h4 className="font-semibold text-amber-900 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    From Employee
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Name:</span>{' '}
                      <span className="font-semibold">{selectedMovement.employee[0]?.fullName || 'Unknown'}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Type:</span>{' '}
                      <span className="font-semibold">{selectedMovement.employee[0]?.employeeType || 'N/A'}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Employee ID:</span>{' '}
                      <span className="font-semibold">{selectedMovement.employee[0]?.employeeIdOriginal || 'N/A'}</span>
                    </p>
                    {selectedMovement.employee[0]?.position && (
                      <p>
                        <span className="text-muted-foreground">Position:</span>{' '}
                        <span className="font-semibold">{selectedMovement.employee[0].position.name || 'N/A'}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* To Employee */}
              {selectedMovement.employee?.[1] && (
                <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    To Employee
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Name:</span>{' '}
                      <span className="font-semibold">{selectedMovement.employee[1]?.fullName || 'Unknown'}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Type:</span>{' '}
                      <span className="font-semibold">{selectedMovement.employee[1]?.employeeType || 'N/A'}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Employee ID:</span>{' '}
                      <span className="font-semibold">{selectedMovement.employee[1]?.employeeIdOriginal || 'N/A'}</span>
                    </p>
                    {selectedMovement.employee[1]?.position && (
                      <p>
                        <span className="text-muted-foreground">Position:</span>{' '}
                        <span className="font-semibold">{selectedMovement.employee[1].position.name || 'N/A'}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Transfer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded text-base">
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">PAR/ICS Number</p>
                  <p className="font-semibold">{selectedMovement.paricsNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">Status</p>
                  <Badge className={getStatusBadgeColor(selectedMovement.status)}>
                    {selectedMovement.status || 'Active'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">Date Assigned</p>
                  <p className="font-semibold">
                    {selectedMovement.dateAssigned
                      ? new Date(selectedMovement.dateAssigned).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                {(selectedMovement.remarks || selectedMovement.condition) && (
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold">Condition/Remarks</p>
                    <p className="font-semibold">{selectedMovement.condition || selectedMovement.remarks || 'N/A'}</p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center">
                  <Package className="w-4 h-4 mr-2 text-blue-600" />
                  Items in this Movement ({selectedMovement.items?.length || 0})
                </h3>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {selectedMovement.items && selectedMovement.items.length > 0 ? (
                    selectedMovement.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="border rounded p-4 bg-gradient-to-r from-gray-50 to-transparent hover:bg-gray-100 transition"
                      >
                        <div className="space-y-3">
                          <div className="border-b pb-3">
                            <h5 className="font-semibold text-blue-700 mb-2 flex items-center text-sm">
                              <Package className="w-4 h-4 mr-2" />
                              Asset Details
                            </h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground font-semibold">Property Number</p>
                                <p className="font-mono font-semibold">{item.propertyNumber || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-semibold">Description</p>
                                <p className="text-sm">{item.description || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-semibold">Category</p>
                                <p className="text-sm">{item.category || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-semibold">Brand</p>
                                <p className="text-sm">{item.brand || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-semibold">Model</p>
                                <p className="text-sm">{item.model || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-semibold">Serial Number</p>
                                <p className="text-sm font-mono">{item.serialNumber || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-semibold">Group</p>
                                <p className="text-sm font-semibold">{item.group || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-semibold">Date Acquired</p>
                                <p className="text-sm">
                                  {item.dateAcquired
                                    ? new Date(item.dateAcquired).toLocaleDateString()
                                    : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground font-semibold">Unit Value</p>
                              <p className="text-sm font-semibold">
                                ₱ {item.unitValue?.toLocaleString() || 'N/A'} {item.unitOfMeasurement || ''}
                              </p>
                            </div>
                            {selectedMovement.condition && (
                              <div>
                                <p className="text-xs text-muted-foreground font-semibold">Condition</p>
                                <p className="text-sm font-semibold">{selectedMovement.condition}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No items found for this movement
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      {/* Edit Details Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Update Movement Details</DialogTitle>
            <DialogDescription className="text-sm">
              Edit the details for{' '}
              <span className="font-semibold">
                {editingMovement?.ptritrNumber ||
                  editingMovement?.rrppeRrspNumber ||
                  editingMovement?.rrpperrspNumber ||
                  'this movement'}
              </span>
              {editingMovement?.allMovementIds && editingMovement.allMovementIds.length > 1 && (
                <span className="text-muted-foreground">
                  {' '}({editingMovement.allMovementIds.length} records will be updated)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Transfer / Return Number */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                {transferType === 'RRPPE' || transferType === 'RRSP'
                  ? 'Return Number'
                  : 'Transfer Number'}
              </label>
              <Input
                value={editFields.transferNumber}
                onChange={(e) =>
                  setEditFields(f => ({ ...f, transferNumber: e.target.value }))
                }
                placeholder="e.g. PTR-2024-001"
              />
            </div>

            {/* PAR/ICS Number (only for PTR/ITR) */}
            {(transferType === 'PTR' || transferType === 'ITR' || !transferType) && (
              <div className="space-y-1">
                <label className="text-sm font-medium">PAR/ICS Number</label>
                <Input
                  value={editFields.parIcsNumber}
                  onChange={(e) =>
                    setEditFields(f => ({ ...f, parIcsNumber: e.target.value }))
                  }
                  placeholder="e.g. PAR-2024-001"
                />
              </div>
            )}

            {/* Date Assigned */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Date Assigned</label>
              <Input
                type="date"
                value={editFields.dateAssigned}
                onChange={(e) =>
                  setEditFields(f => ({ ...f, dateAssigned: e.target.value }))
                }
              />
            </div>

            {/* Accountable Person — Plantilla */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Plantilla Employee (Accountable Person)
              </label>
              {editEmployeesLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading employees…
                </div>
              ) : (
                <EmployeeSelector
                  employees={editEmployees.filter(e => {
                    const typeName = (e.employmentTypeName || e.employmentType?.name || '').toLowerCase();
                    if (e.employmentType?.id) return e.employmentType.id === 1;
                    return typeName.includes('plantilla') && !typeName.includes('non');
                  })}
                  value={editFields.plantillaEmployeeId}
                  onSelect={(id) => setEditFields(f => ({ ...f, plantillaEmployeeId: id }))}
                  placeholder="Search plantilla employee…"
                />
              )}
            </div>

            {/* Accountable Person — Non-Plantilla (optional) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Non-Plantilla Employee <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                {editFields.nonPlantillaEmployeeId !== null && (
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline"
                    onClick={() => setEditFields(f => ({ ...f, nonPlantillaEmployeeId: null }))}
                  >
                    Clear
                  </button>
                )}
              </div>
              {editEmployeesLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading employees…
                </div>
              ) : (
                <EmployeeSelector
                  employees={editEmployees.filter(e => {
                    const typeName = (e.employmentTypeName || e.employmentType?.name || '').toLowerCase();
                    if (e.employmentType?.id) return e.employmentType.id !== 1;
                    return !typeName.includes('plantilla') || typeName.includes('non');
                  })}
                  value={editFields.nonPlantillaEmployeeId}
                  onSelect={(id) => setEditFields(f => ({ ...f, nonPlantillaEmployeeId: id }))}
                  placeholder="Search non-plantilla employee…"
                />
              )}
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm bg-background"
                value={editFields.status}
                onChange={(e) =>
                  setEditFields(f => ({ ...f, status: e.target.value }))
                }
              >
                <option value="">— Select Status —</option>
                <option value="T">Transfer</option>
                <option value="R">Return</option>
                <option value="C">Completed</option>
              </select>
            </div>

            {/* Condition */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Condition</label>
              {conditions.length > 0 ? (
                <select
                  className="w-full border rounded px-3 py-2 text-sm bg-background"
                  value={editFields.condition}
                  onChange={(e) =>
                    setEditFields(f => ({ ...f, condition: e.target.value }))
                  }
                >
                  <option value="">— Select Condition —</option>
                  {conditions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <Input
                  value={editFields.condition}
                  onChange={(e) =>
                    setEditFields(f => ({ ...f, condition: e.target.value }))
                  }
                  placeholder="e.g. Good"
                />
              )}
            </div>

            {/* Remarks */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Remarks</label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm bg-background resize-none"
                rows={3}
                value={editFields.remarks}
                onChange={(e) =>
                  setEditFields(f => ({ ...f, remarks: e.target.value }))
                }
                placeholder="Optional remarks..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={editSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={editSaving}>
              {editSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
);
