import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Plus, ArrowRightLeft, RefreshCw, CheckCircle, Clock, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TransferForm } from './TransferForm';
import { ReturnForm } from './ReturnForm';
import { MovementsList, MovementsListRef } from './MovementsList';
import { getMovementStatistics } from '@/api/asset/transferApi';

export function TransfersReturns() {
  const [ptrDialogOpen, setPtrDialogOpen] = useState(false);
  const [itrDialogOpen, setItrDialogOpen] = useState(false);
  const [rrppeDialogOpen, setRrppeDialogOpen] = useState(false);
  const [rrspDialogOpen, setRrspDialogOpen] = useState(false);
  const ptrMovementsRef = useRef<MovementsListRef>(null);
  const itrMovementsRef = useRef<MovementsListRef>(null);
  const rrppeMovementsRef = useRef<MovementsListRef>(null);
  const rrspMovementsRef = useRef<MovementsListRef>(null);
  
  // Statistics state
  const [statistics, setStatistics] = useState({
    totalPTR: 0,
    totalITR: 0,
    totalReturnsPPE: 0,
    totalReturnsSE: 0,
    totalRecords: 0,
    activePTR: 0,
    activeITR: 0,
    activeReturnsPPE: 0,
    activeReturnsSE: 0,
    totalActive: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Load statistics
  const loadStatistics = async () => {
    try {
      setStatsLoading(true);
      const stats = await getMovementStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load statistics on mount
  useEffect(() => {
    loadStatistics();
  }, []);

  const handlePtrSuccess = () => {
    // Reload PTR movements list after successful transfer
    ptrMovementsRef.current?.loadMovements();
    loadStatistics();
    setPtrDialogOpen(false);
  };

  const handleItrSuccess = () => {
    // Reload ITR movements list after successful transfer
    itrMovementsRef.current?.loadMovements();
    loadStatistics();
    setItrDialogOpen(false);
  };

  const handleRrppeSuccess = () => {
    // Reload RRPPE movements list after successful return
    rrppeMovementsRef.current?.loadMovements();
    loadStatistics();
    setRrppeDialogOpen(false);
  };

  const handleRrspSuccess = () => {
    // Reload RRSP movements list after successful return
    rrspMovementsRef.current?.loadMovements();
    loadStatistics();
    setRrspDialogOpen(false);
  };

  const statCards = [
    {
      label: 'PTR',
      description: 'Property transfers · PPE',
      value: statistics.totalPTR,
      activeValue: statistics.activePTR,
      icon: Package,
      iconClass: 'text-blue-600',
      iconBackground: 'bg-blue-50',
      borderClass: 'hover:border-blue-300',
    },
    {
      label: 'ITR',
      description: 'Inventory transfers · SE',
      value: statistics.totalITR,
      activeValue: statistics.activeITR,
      icon: Package,
      iconClass: 'text-purple-600',
      iconBackground: 'bg-purple-50',
      borderClass: 'hover:border-purple-300',
    },
    {
      label: 'Returns · PPE',
      description: 'Returned property and equipment',
      value: statistics.totalReturnsPPE,
      activeValue: statistics.activeReturnsPPE,
      icon: RefreshCw,
      iconClass: 'text-amber-600',
      iconBackground: 'bg-amber-50',
      borderClass: 'hover:border-amber-300',
    },
    {
      label: 'Returns · SE',
      description: 'Returned supplies and equipment',
      value: statistics.totalReturnsSE,
      activeValue: statistics.activeReturnsSE,
      icon: RefreshCw,
      iconClass: 'text-emerald-600',
      iconBackground: 'bg-emerald-50',
      borderClass: 'hover:border-emerald-300',
    },
  ];

  return (
    <div className="p-2 pt-5 md:pt-20 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl">Transfers & Returns</h1>
          <p className="text-sm text-muted-foreground">
            Manage property transfers (PTR/ITR) and returns (RRPE/RRSP)
          </p>
        </div>
       
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.label}
              className={`group overflow-hidden border-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${stat.borderClass}`}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Total records
                    </p>
                    <h3 className="mt-1 text-base sm:text-lg font-semibold text-slate-900 truncate">
                      {stat.label}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground truncate" title={stat.description}>
                      {stat.description}
                    </p>
                  </div>
                  <div className={`shrink-0 rounded-xl p-2.5 sm:p-3 ${stat.iconBackground}`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.iconClass}`} strokeWidth={2} />
                  </div>
                </div>
                <p className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
                  {statsLoading ? (
                    <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-200" />
                  ) : (
                    stat.value.toLocaleString()
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {statsLoading ? 'Loading current count…' : `${stat.activeValue.toLocaleString()} active currently`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Transfer Types Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer & Return Operations</CardTitle>
          <CardDescription>
            PTR (PPE), ITR (SE), RRPE, and RRSP workflow management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ptr" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="ptr">PTR (PPE)</TabsTrigger>
              <TabsTrigger value="itr">ITR (SE)</TabsTrigger>
              <TabsTrigger value="rrpe">RRPE</TabsTrigger>
              <TabsTrigger value="rrsp">RRSP</TabsTrigger>
            </TabsList>

            {/* PTR Tab */}
            <TabsContent value="ptr" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Property Transfer Record (PTR)</h3>
                <p className="text-sm text-blue-800 mb-4">
                  Use PTR to transfer Property, Plant & Equipment (PPE) assets between employees, departments, or offices.
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Active PTR Records: <span className="font-semibold">{statsLoading ? '...' : statistics.activePTR}</span></p>
                  </div>
                  <Button onClick={() => setPtrDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create PTR
                  </Button>
                </div>
              </div>
              <MovementsList ref={ptrMovementsRef} transferType="PTR" />
            </TabsContent>

            {/* ITR Tab */}
            <TabsContent value="itr" className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Inventory Transfer Record (ITR)</h3>
                <p className="text-sm text-purple-800 mb-4">
                  Use ITR to transfer Supply and Equipment (SE) assets between employees, departments, or offices.
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">Active ITR Records: <span className="font-semibold">{statsLoading ? '...' : statistics.activeITR}</span></p>
                  </div>
                  <Button onClick={() => setItrDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create ITR
                  </Button>
                </div>
              </div>
              <MovementsList ref={itrMovementsRef} transferType="ITR" />
            </TabsContent>

            {/* RRPE Tab */}
            <TabsContent value="rrpe" className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded p-4">
                <h3 className="font-semibold text-amber-900 mb-2">Return Record - PPE (RRPPE)</h3>
                <p className="text-sm text-amber-800 mb-4">
                  Process returns of Property, Plant & Equipment assets to central storage or for disposal.
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700">Active RRPPE Records: <span className="font-semibold">{statsLoading ? '...' : statistics.activeReturnsPPE}</span></p>
                  </div>
                  <Button onClick={() => setRrppeDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Process Return
                  </Button>
                </div>
              </div>
              <MovementsList ref={rrppeMovementsRef} transferType="RRPPE" />
            </TabsContent>

            {/* RRSP Tab */}
            <TabsContent value="rrsp" className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <h3 className="font-semibold text-green-900 mb-2">Return Record - SE (RRSP)</h3>
                <p className="text-sm text-green-800 mb-4">
                  Process returns of Supply and Equipment assets to central storage or for disposal.
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Active RRSP Records: <span className="font-semibold">{statsLoading ? '...' : statistics.activeReturnsSE}</span></p>
                  </div>
                  <Button onClick={() => setRrspDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Process Return
                  </Button>
                </div>
              </div>
              <MovementsList ref={rrspMovementsRef} transferType="RRSP" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Workflow Guide Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Transfer Workflow Guide</CardTitle>
          <CardDescription>Follow these 3 simple steps to complete a transfer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-3xl font-bold">1</span>
                </div>
                <h4 className="font-bold text-lg text-center mb-3 text-gray-900">Select FROM Employee</h4>
                <p className="text-sm text-gray-600 text-center leading-relaxed">
                  Choose the employee who currently holds the assets you want to transfer. Only employees with items will be available.
                </p>
              </div>
              {/* Arrow to next step */}
              <div className="hidden md:flex absolute -right-6 top-8 text-blue-400">
                <ArrowRightLeft className="w-6 h-6 rotate-0" />
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-3xl font-bold">2</span>
                </div>
                <h4 className="font-bold text-lg text-center mb-3 text-gray-900">Select Items to Transfer</h4>
                <p className="text-sm text-gray-600 text-center leading-relaxed">
                  Select one or multiple items from the employee's current inventory. Use "Select All" for convenience or pick individual items.
                </p>
              </div>
              {/* Arrow to next step */}
              <div className="hidden md:flex absolute -right-6 top-8 text-purple-400">
                <ArrowRightLeft className="w-6 h-6 rotate-0" />
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center mb-4 shadow-lg">
                <span className="text-3xl font-bold">3</span>
              </div>
              <h4 className="font-bold text-lg text-center mb-3 text-gray-900">Select TO Employee(s)</h4>
              <p className="text-sm text-gray-600 text-center leading-relaxed">
                Choose the plantilla and/or non-plantilla employee who will receive the items. Complete the transfer to finalize the record.
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-10 pt-8 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <h5 className="font-semibold text-blue-900 mb-2">📋 Transfer Types</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>PTR (Property Transfer Record)</strong> - For PPE assets</li>
                <li>• <strong>ITR (Inventory Transfer Record)</strong> - For SE assets</li>
              </ul>
            </div>
            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
              <h5 className="font-semibold text-green-900 mb-2">✓ What Happens Next</h5>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Transfer record is created with unique number</li>
                <li>• Previous holder's status marked as inactive</li>
                <li>• New holder becomes current holder</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Form Dialogs */}
      <TransferForm
        isOpen={ptrDialogOpen}
        onClose={() => setPtrDialogOpen(false)}
        transferType="PTR"
        onSuccess={handlePtrSuccess}
      />
      <TransferForm
        isOpen={itrDialogOpen}
        onClose={() => setItrDialogOpen(false)}
        transferType="ITR"
        onSuccess={handleItrSuccess}
      />

      {/* Return Form Dialogs */}
      <ReturnForm
        isOpen={rrppeDialogOpen}
        onClose={() => setRrppeDialogOpen(false)}
        returnType="RRPPE"
        onSuccess={handleRrppeSuccess}
      />
      <ReturnForm
        isOpen={rrspDialogOpen}
        onClose={() => setRrspDialogOpen(false)}
        returnType="RRSP"
        onSuccess={handleRrspSuccess}
      />
    </div>
  );
}
