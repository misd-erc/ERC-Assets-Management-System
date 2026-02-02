import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/common/DataTable';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory, Category } from '@/api/categories/categoriesApi';
import { toast } from 'sonner';

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', generalCode: '', isActive: true });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const data = await getCategories();
    setCategories(data);
    setLoading(false);
  };

  const filtered = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.generalCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.generalCode.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    let result;

    if (editingId) {
      result = await updateCategory(editingId, formData.name, formData.generalCode, formData.isActive);
      if (result) {
        toast.success('Category updated successfully');
      } else {
        toast.error('Failed to update category');
      }
    } else {
      result = await createCategory(formData.name, formData.generalCode);
      if (result) {
        toast.success('Category created successfully');
      } else {
        toast.error('Failed to create category');
      }
    }

    setLoading(false);
    if (result) {
      await fetchCategories();
      setFormData({ name: '', generalCode: '', isActive: true });
      setEditingId(null);
      setIsOpen(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      generalCode: category.generalCode,
      isActive: category.isActive
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    const result = await deleteCategory(id);
    setLoading(false);

    if (result) {
      toast.success('Category deleted successfully');
      await fetchCategories();
    } else {
      toast.error('Failed to delete category');
    }
  };

  const columns = [
    { key: 'name', label: 'Category Name' },
    { key: 'generalCode', label: 'Code' },
    { key: 'isActive', label: 'Status', render: (v: boolean) => v ? 'Active' : 'Inactive' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: Category) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{row.name}"? This action cannot be undone.
              </AlertDialogDescription>
              <div className="flex justify-end gap-2">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(row.id)}
                  className="bg-red-600"
                >
                  Delete
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search categories..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingId(null);
              setFormData({ name: '', generalCode: '', isActive: true });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingId ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                {editingId ? 'Update the category details below' : 'Enter the details for your new category'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                  Category Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Office Supplies"
                  className="h-9"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium text-slate-700">
                  Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.generalCode}
                  onChange={(e) => setFormData({ ...formData, generalCode: e.target.value })}
                  placeholder="e.g., 10605130"
                  maxLength={5}
                  className="h-9 uppercase"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500">Max 5 characters</p>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-md">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded cursor-pointer"
                  disabled={loading}
                />
                <Label htmlFor="active" className="cursor-pointer text-sm font-medium text-slate-700 mb-0">
                  Active
                </Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Processing...' : editingId ? 'Update Category' : 'Add Category'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <DataTable
          data={filtered}
          columns={columns}
          emptyMessage="No categories found."
        />
      </div>
    </div>
  );
}
