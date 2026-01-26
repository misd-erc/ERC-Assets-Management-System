import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Plus, ArrowRightLeft, RefreshCw, CheckCircle, Clock, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TransferForm } from './TransferForm';

export function TransfersReturns() {
  const [ptrDialogOpen, setPtrDialogOpen] = useState(false);
  const [itrDialogOpen, setItrDialogOpen] = useState(false);

  const handleTransferSuccess = () => {
    // Refetch data or show success message
    // This can be expanded to reload transfer lists
  };

  return (
    <div className="p-6 pt-20 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Transfers & Returns</h1>
          <p className="text-muted-foreground">
            Manage property transfers (PTR/ITR) and returns (RRPE/RRSP)
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Process Return
          </Button>
          <Button onClick={() => setPtrDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New PTR (PPE)
          </Button>
          <Button onClick={() => setItrDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New ITR (SE)
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active PTR</p>
                <p className="text-2xl mt-1">15</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active ITR</p>
                <p className="text-2xl mt-1">8</p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Returns</p>
                <p className="text-2xl mt-1">12</p>
              </div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl mt-1">156</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
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
            <TabsList className="grid w-full grid-cols-4">
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
                    <p className="text-sm text-blue-700">Active PTR Records: <span className="font-semibold">15</span></p>
                    <p className="text-sm text-blue-700">This Month: <span className="font-semibold">5</span></p>
                  </div>
                  <Button onClick={() => setPtrDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create PTR
                  </Button>
                </div>
              </div>
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
                    <p className="text-sm text-purple-700">Active ITR Records: <span className="font-semibold">8</span></p>
                    <p className="text-sm text-purple-700">This Month: <span className="font-semibold">3</span></p>
                  </div>
                  <Button onClick={() => setItrDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create ITR
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* RRPE Tab */}
            <TabsContent value="rrpe" className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded p-4">
                <h3 className="font-semibold text-amber-900 mb-2">Return Record - PPE (RRPE)</h3>
                <p className="text-sm text-amber-800 mb-4">
                  Process returns of Property, Plant & Equipment assets to central storage or for disposal.
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700">Pending Returns: <span className="font-semibold">7</span></p>
                    <p className="text-sm text-amber-700">This Month: <span className="font-semibold">2</span></p>
                  </div>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Process Return
                  </Button>
                </div>
              </div>
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
                    <p className="text-sm text-green-700">Pending Returns: <span className="font-semibold">5</span></p>
                    <p className="text-sm text-green-700">This Month: <span className="font-semibold">1</span></p>
                  </div>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Process Return
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Workflow Guide Card */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer Workflow Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm mr-2">1</span>
                Select Transfer Type
              </h4>
              <p className="text-sm text-muted-foreground">
                Choose between PTR for PPE assets or ITR for SE assets
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm mr-2">2</span>
                Select Asset
              </h4>
              <p className="text-sm text-muted-foreground">
                Choose the asset to transfer from the available inventory
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm mr-2">3</span>
                Assign Employee
              </h4>
              <p className="text-sm text-muted-foreground">
                Select the plantilla or non-plantilla employee receiving the asset
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm mr-2">4</span>
                Confirm Location
              </h4>
              <p className="text-sm text-muted-foreground">
                Set the office and division where the asset will be located
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Form Dialogs */}
      <TransferForm
        isOpen={ptrDialogOpen}
        onClose={() => setPtrDialogOpen(false)}
        transferType="PTR"
        onSuccess={handleTransferSuccess}
      />
      <TransferForm
        isOpen={itrDialogOpen}
        onClose={() => setItrDialogOpen(false)}
        transferType="ITR"
        onSuccess={handleTransferSuccess}
      />
    </div>
  );
}
