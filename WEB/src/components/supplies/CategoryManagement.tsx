import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FolderOpen, Edit, Trash2, Eye, Filter, Download, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/common/DataTable';
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
import { useCategoriesStore } from '@/store/supply/categoriesStore';

export function CategoryManagement() {
  const {
    // State
    categories,
    stats,
    isLoading,
    error,
    searchTerm,
    statusFilter,
    showAddDialog,
    showEditDialog,
    showDeleteDialog,
    editingCategory,
    categoryToDelete,
    formData,

    // Actions
    setSearchTerm,
    setStatusFilter,
    openAddDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    updateFormData,
    fetchCategories,
    fetchStats,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategoriesStore();

  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, [fetchCategories, fetchStats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCategory) {
      await updateCategory();
    } else {
      await createCategory();
    }
  };

  const handleDelete = async () => {
    await deleteCategory();
  };

  const columns = [
    {
      key: 'categoryId',
      label: 'Category Code',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-sm font-medium text-slate-700">{value}</span>
      )
    },
    {
      key: 'categoryName',
      label: 'Category Name',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-slate-900">{value}</span>
      )
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (value: string) => (
        <div className="max-w-xs truncate text-slate-600" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <Badge className={`${
          value === 'Active'
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-gray-100 text-gray-800 border-gray-200'
        }`}>
          {value}
        </Badge>
      )
    },
    {
      key: 'itemCount',
      label: 'Items',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-slate-700">{value}</span>
      )
    },
    {
      key: 'dateCreated',
      label: 'Date Created',
      sortable: true,
      render: (value: string) => (
        <span className="text-slate-600">{new Date(value).toLocaleDateString()}</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {/* Handle view */}}
            className="h-8 w-8 p-0 hover:bg-blue-50"
          >
            <Eye className="w-4 h-4 text-blue-600" />
          </Button>
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
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Category Management</h1>
          <p className="text-slate-600">
            Manage asset and supply categories for organizational classification
          </p>
        </div>
        <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Categories</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalCategories || 0}</p>
                <p className="text-xs text-slate-500 mt-1">All categories</p>
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
                <p className="text-sm font-medium text-slate-600">Active Categories</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.activeCategories || 0}</p>
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
                <p className="text-sm font-medium text-slate-600">Total Items</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalItems || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Across all categories</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="w-6 h-6 bg-purple-600 rounded-lg"></div>
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

      {/* Categories Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-slate-900">Category Management</CardTitle>
              <CardDescription className="text-slate-600">
                Manage and organize asset and supply categories with status tracking
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="border-slate-200 hover:bg-slate-50">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search categories by name, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-slate-200 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] border-slate-200">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-slate-200 hover:bg-slate-50">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {/* Enhanced Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <DataTable
              data={categories}
              columns={columns}
              title="categories"
              emptyMessage="No categories found. Adjust your filters or add your first category to get started."
            />
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={closeDialogs}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the category information below.'
                : 'Enter the details for the new category.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name *</Label>
              <Input
                id="categoryName"
                value={formData.categoryName}
                onChange={(e) => updateFormData({ categoryName: e.target.value })}
                placeholder="Enter category name"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Enter category description"
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'Active' | 'Inactive') => updateFormData({ status: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialogs} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {editingCategory ? 'Update' : 'Save'} Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={closeDialogs}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category
              "{categoryToDelete?.categoryName}" and may affect related items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
