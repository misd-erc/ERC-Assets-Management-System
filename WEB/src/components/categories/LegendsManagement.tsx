import { useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/common/DataTable';
import { useLegendsStore } from '@/store/supply/legendsStore';
import { Search, Plus, FolderOpen, Edit, Trash2 } from 'lucide-react';

export function LegendsManagement() {
  const {
    legends,
    stats,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    showAddDialog,
    showEditDialog,
    showDeleteDialog,
    legendToDelete,
    formData,
    openAddDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    updateFormData,
    createLegend,
    updateLegend,
    deleteLegend,
    fetchLegends,
    fetchStats,
  } = useLegendsStore();

  useEffect(() => {
    fetchLegends();
    fetchStats();
  }, [fetchLegends, fetchStats]);

  const filteredLegends = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return legends;
    return legends.filter(l =>
      (l.name || '').toLowerCase().includes(term) ||
      String(l.id).includes(term)
    );
  }, [legends, searchTerm]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createLegend();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateLegend();
  };

  const handleDelete = async () => {
    await deleteLegend();
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (value: number) => (
        <span className="font-mono text-sm text-slate-700">{value}</span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-slate-900">{value}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value: boolean | undefined) => (
        <Badge className={`${value ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      sortable: true,
      render: (value: string | undefined) => (
        <span className="text-sm text-slate-600">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openEditDialog(row)}
            className="h-8 w-8 p-0 hover:bg-orange-50"
          >
            <Edit className="w-4 h-4 text-orange-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openDeleteDialog(row)}
            className="h-8 w-8 p-0 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];


  return (
    <div className="p-6 pt-20 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Legend Management</h1>
          <p className="text-slate-600">
            Manage and organize legends used across assets and supplies
          </p>
        </div>
        <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Add Legend
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Legends</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalLegends || 0}</p>
                <p className="text-xs text-slate-500 mt-1">All legends</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <FolderOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Legends</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.activeLegends || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Currently in use</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Created This Month</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.createdThisMonth || 0}</p>
                <p className="text-xs text-slate-500 mt-1">New this month</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <Plus className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-slate-900">Legends</CardTitle>
              <CardDescription className="text-slate-600">
                Browse and manage legends with general codes and status
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search legends by name or id..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-slate-200 focus:border-blue-500"
              />

            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-6 text-sm text-slate-600">Loading legends...</div>
            ) : error ? (
              <div className="p-6 text-sm text-red-600">{error}</div>
            ) : (
              <DataTable
                data={filteredLegends}
                columns={columns as any}
                title="legends"
                emptyMessage="No legends found. Adjust your search or add your first legend."
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={closeDialogs}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Legend</DialogTitle>
            <DialogDescription>
              Enter the details for the new legend.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Legend Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="Enter legend name"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="generalCode">Account Code *</Label>
              <Input
                id="generalCode"
                value={formData.generalCode || ''}
                onChange={(e) => updateFormData({ generalCode: e.target.value })}
                placeholder="Enter account code"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(value: 'active' | 'inactive') => updateFormData({ isActive: value === 'active' })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>


            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialogs} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                Save Legend
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={closeDialogs}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Legend</DialogTitle>
            <DialogDescription>
              Update the details for the selected legend.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Legend Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="Enter legend name"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-generalCode">General Code *</Label>
              <Input
                id="edit-generalCode"
                value={formData.generalCode || ''}
                onChange={(e) => updateFormData({ generalCode: e.target.value })}
                placeholder="Enter general code"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(value: 'active' | 'inactive') => updateFormData({ isActive: value === 'active' })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>


            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialogs} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                Update Legend
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={closeDialogs}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Legend</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{legendToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
