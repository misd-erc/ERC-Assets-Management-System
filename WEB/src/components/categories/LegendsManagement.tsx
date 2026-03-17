import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/common/DataTable';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { getLegends, createLegend, updateLegend, deleteLegend, Legend } from '@/api/categories/categoriesApi';
import { toast } from 'sonner';

export function LegendsManagement() {
  const [legends, setLegends] = useState<Legend[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', generalCode: '', description: '', isActive: true });

  // Fetch legends on mount
  useEffect(() => {
    fetchLegends();
  }, []);

  const fetchLegends = async () => {
    setLoading(true);
    const data = await getLegends();
    setLegends(data);
    setLoading(false);
  };

  const filtered = legends.filter(l =>
    (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(l.id).includes(searchTerm)
  );

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a legend name');
      return;
    }
    setLoading(true);
    let result;

    if (editingId) {
      result = await updateLegend(editingId, formData.name, formData.generalCode, formData.isActive, formData.description || undefined);
      if (result) {
        toast.success('Legend updated successfully');
      } else {
        toast.error('Failed to update legend');
      }
    } else {
      result = await createLegend(formData.name, formData.generalCode, formData.description || undefined);
      if (result) {
        toast.success('Legend created successfully');
      } else {
        toast.error('Failed to create legend');
      }
    }

    setLoading(false);
    if (result) {
      await fetchLegends();
      setFormData({ name: '', generalCode: '', description: '', isActive: true });
      setEditingId(null);
      setIsOpen(false);
    }
  };

  const handleEdit = (legend: Legend) => {
    setEditingId(legend.id);
    setFormData({
      name: legend.name,
      generalCode: legend.generalCode,
      description: legend.description || '',
      isActive: legend.isActive
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    const result = await deleteLegend(id);
    setLoading(false);

    if (result) {
      toast.success('Legend deleted successfully');
      await fetchLegends();
    } else {
      toast.error('Failed to delete legend');
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Legend Name' },
    { key: 'generalCode', label: 'General Code' },
    { key: 'description', label: 'Description', render: (v: string) => v || '—' },
    { key: 'isActive', label: 'Status', render: (v: boolean) => v ? 'Active' : 'Inactive' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: Legend) => (
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
              <AlertDialogTitle>Delete Legend</AlertDialogTitle>
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
            placeholder="Search legends..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingId(null);
              setFormData({ name: '', generalCode: '', description: '', isActive: true });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Legend
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingId ? 'Edit Legend' : 'Add New Legend'}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                {editingId ? 'Update the legend details below' : 'Enter the details for your new legend'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                  Legend Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Legend Name"
                  className="h-9"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="generalCode" className="text-sm font-medium text-slate-700">
                  General Code
                </Label>
                <Input
                  id="generalCode"
                  value={formData.generalCode}
                  onChange={(e) => setFormData({ ...formData, generalCode: e.target.value })}
                  placeholder="e.g., LGD001"
                  className="h-9 uppercase"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Description
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Brief description of this legend"
                  className="h-9"
                  disabled={loading}
                />
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
                  {loading ? 'Processing...' : editingId ? 'Update Legend' : 'Add Legend'}
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
          emptyMessage="No legends found."
        />
      </div>
    </div>
  );
}
