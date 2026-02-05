import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, Search, Eye, User, Package } from 'lucide-react';
import { toast } from 'sonner';
import { getMovementsList, getPTRMovements, getITRMovements } from '@/api/asset/transferApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface MovementsListProps {
  transferType?: 'PTR' | 'ITR';
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
  paricsNumber?: string;
  employee?: EmployeeInfo[];
  office?: any;
  division?: any;
  items?: PTAItem[];
  remarks?: string;
  status?: string;
  condition?: string;
  isActive: boolean;
  createdAt?: string;
}

export const MovementsList = forwardRef<MovementsListRef, MovementsListProps>(
  function MovementsListComponent({ transferType }, ref) {
  const [searchInput, setSearchInput] = useState('');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Load movements
  const loadMovements = async (search?: string, page: number = 1) => {
    try {
      setLoading(true);
      
      let result;
      if (transferType === 'PTR') {
        result = await getPTRMovements(search, page, pageSize);
      } else if (transferType === 'ITR') {
        result = await getITRMovements(search, page, pageSize);
      } else {
        result = await getMovementsList(search, undefined, undefined, page, pageSize);
      }

      setMovements(result.items || []);
      setTotalCount(result.totalCount || 0);
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
    loadMovements,
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transfer Number</TableHead>
                      <TableHead>PAR/ICS Number</TableHead>
                      <TableHead>From Employee</TableHead>
                      <TableHead>To Employee</TableHead>
                      <TableHead>Date Assigned</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold">
                          {movement.ptritrNumber || 'N/A'}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(movement)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {pageNumber} of {totalPages}
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
                      disabled={pageNumber === totalPages || loading}
                      onClick={() => loadMovements(searchInput, pageNumber + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Movement Details</DialogTitle>
            <DialogDescription>
              Transfer Number: {selectedMovement?.ptritrNumber || 'N/A'}
            </DialogDescription>
          </DialogHeader>

          {selectedMovement ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm">
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
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">PAR/ICS Number</p>
                  <p className="font-semibold">{selectedMovement.paricsNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Status</p>
                  <Badge className={getStatusBadgeColor(selectedMovement.status)}>
                    {selectedMovement.status || 'Active'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Date Assigned</p>
                  <p className="font-semibold">
                    {selectedMovement.dateAssigned
                      ? new Date(selectedMovement.dateAssigned).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                {(selectedMovement.remarks || selectedMovement.condition) && (
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Condition/Remarks</p>
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
    </div>
  );
}
);
