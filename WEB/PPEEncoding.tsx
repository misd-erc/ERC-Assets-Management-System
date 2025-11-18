import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import { 
  Package, Plus, Search, Filter, Download, Upload, Eye, Edit, Trash2, 
  AlertCircle, CheckCircle, XCircle, Clock, FileText, User, MapPin,
  Calendar, DollarSign, Settings, History, ChevronDown, ChevronUp
} from 'lucide-react';
import { PPEAsset, PPEHistory } from '../DataContext';

export function PPEEncoding() {
  const [view, setView] = useState<'list' | 'add' | 'edit' | 'details'>('list');
  const [ppeAssets, setPPEAssets] = useState<PPEAsset[]>([]);
  const [selectedPPE, setSelectedPPE] = useState<PPEAsset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state based strictly on CSV template
  const [formData, setFormData] = useState({
    property_number: '',
    category: '',
    legend: '',
    description: '',
    brand: '',
    model: '',
    serial_number: '',
    parts: '',
    unit_of_measurement: '',
    unit_value: 0,
    date_acquired: '',
    estimated_useful_life: 5,
    date: new Date().toISOString().split('T')[0],
    par_itr_number: '',
    plantilla_employee_id: '',
    non_plantilla_employee_id: '',
    actual_division: '',
    condition: 'Working' as const
  });

  const resetForm = () => {
    setFormData({
      property_number: '',
      category: '',
      legend: '',
      description: '',
      brand: '',
      model: '',
      serial_number: '',
      parts: '',
      unit_of_measurement: '',
      unit_value: 0,
      date_acquired: '',
      estimated_useful_life: 5,
      date: new Date().toISOString().split('T')[0],
      par_itr_number: '',
      plantilla_employee_id: '',
      non_plantilla_employee_id: '',
      actual_division: '',
      condition: 'Working'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.property_number || !formData.description || !formData.serial_number || !formData.date_acquired) {
      toast.error('Please fill in all required fields (Property Number, Description, Serial Number, Date Acquired)');
      return;
    }

    const newPPE: PPEAsset = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      dateEncoded: new Date().toISOString(),
      history: [{
        id: '1',
        date: formData.date,
        par_itr_number: formData.par_itr_number,
        plantilla_employee_id: formData.plantilla_employee_id,
        non_plantilla_employee_id: formData.non_plantilla_employee_id,
        actual_division: formData.actual_division,
        condition: formData.condition,
        remarks: 'Initial encoding'
      }]
    };

    if (view === 'edit' && selectedPPE) {
      setPPEAssets(prev => prev.map(p => p.id === selectedPPE.id ? { ...newPPE, id: selectedPPE.id } : p));
      toast.success('PPE Asset updated successfully');
    } else {
      setPPEAssets(prev => [...prev, newPPE]);
      toast.success('PPE Asset added successfully');
    }

    resetForm();
    setView('list');
    setSelectedPPE(null);
  };

  const handleEdit = (ppe: PPEAsset) => {
    setSelectedPPE(ppe);
    setFormData({
      property_number: ppe.property_number,
      category: ppe.category,
      legend: ppe.legend,
      description: ppe.description,
      brand: ppe.brand,
      model: ppe.model,
      serial_number: ppe.serial_number,
      parts: ppe.parts,
      unit_of_measurement: ppe.unit_of_measurement,
      unit_value: ppe.unit_value,
      date_acquired: ppe.date_acquired,
      estimated_useful_life: ppe.estimated_useful_life,
      date: ppe.date,
      par_itr_number: ppe.par_itr_number,
      plantilla_employee_id: ppe.plantilla_employee_id,
      non_plantilla_employee_id: ppe.non_plantilla_employee_id,
      actual_division: ppe.actual_division,
      condition: ppe.condition
    });
    setView('edit');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this PPE asset?')) {
      setPPEAssets(prev => prev.filter(p => p.id !== id));
      toast.success('PPE Asset deleted successfully');
    }
  };

  const handleViewDetails = (ppe: PPEAsset) => {
    setSelectedPPE(ppe);
    setView('details');
  };

  const getConditionBadge = (condition: string) => {
    const styles = {
      Working: 'bg-green-100 text-green-800',
      'Not Working': 'bg-red-100 text-red-800',
      IIRUP: 'bg-yellow-100 text-yellow-800',
      Disposed: 'bg-gray-100 text-gray-800',
      Missing: 'bg-purple-100 text-purple-800'
    };
    return (
      <Badge className={styles[condition as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        {condition}
      </Badge>
    );
  };

  const hasWarning = (ppe: PPEAsset) => {
    return !ppe.serial_number || !ppe.property_number;
  };

  // Filter and search logic
  const filteredPPE = ppeAssets.filter(ppe => {
    const matchesSearch = 
      ppe.property_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ppe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ppe.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || ppe.category === filterCategory;
    const matchesCondition = filterCondition === 'all' || ppe.condition === filterCondition;
    
    return matchesSearch && matchesCategory && matchesCondition;
  });

  const totalPages = Math.ceil(filteredPPE.length / itemsPerPage);
  const paginatedPPE = filteredPPE.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // LIST VIEW
  if (view === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-slate-900">PPE Encoding</h2>
            <p className="text-sm text-slate-600">Manage Property, Plant & Equipment assets</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Upload className="size-4" />
              Import CSV
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={() => setView('add')} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="size-4" />
              Add New PPE
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  placeholder="Search PPE..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="ICT Equipment">ICT Equipment</SelectItem>
                  <SelectItem value="Office Equipment">Office Equipment</SelectItem>
                  <SelectItem value="Motor Vehicle">Motor Vehicle</SelectItem>
                  <SelectItem value="Furniture and Fixtures">Furniture and Fixtures</SelectItem>
                  <SelectItem value="Communication Equipment">Communication Equipment</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCondition} onValueChange={setFilterCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="Working">Working</SelectItem>
                  <SelectItem value="Not Working">Not Working</SelectItem>
                  <SelectItem value="IIRUP">IIRUP</SelectItem>
                  <SelectItem value="Disposed">Disposed</SelectItem>
                  <SelectItem value="Missing">Missing</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">
                  {filteredPPE.length} items
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Property #</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Legend</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Serial #</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Unit Value</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Condition</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Division</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedPPE.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                        <Package className="size-12 mx-auto mb-2 text-slate-300" />
                        <p>No PPE assets found</p>
                        <Button onClick={() => setView('add')} variant="link" className="mt-2">
                          Add your first PPE asset
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    paginatedPPE.map(ppe => (
                      <tr 
                        key={ppe.id} 
                        className={`hover:bg-slate-50 transition-colors ${hasWarning(ppe) ? 'bg-yellow-50' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            {hasWarning(ppe) && (
                              <AlertCircle className="size-4 text-yellow-600" />
                            )}
                            <span className="font-medium text-slate-900">{ppe.property_number || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{ppe.category}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{ppe.legend}</td>
                        <td className="px-4 py-3 text-sm text-slate-900 max-w-xs truncate">{ppe.description}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{ppe.serial_number || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{formatCurrency(ppe.unit_value)}</td>
                        <td className="px-4 py-3">{getConditionBadge(ppe.condition)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{ppe.actual_division}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(ppe)}
                              className="size-8 p-0"
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(ppe)}
                              className="size-8 p-0"
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(ppe.id)}
                              className="size-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-slate-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPPE.length)} of {filteredPPE.length} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ADD/EDIT FORM VIEW
  if (view === 'add' || view === 'edit') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-slate-900">{view === 'add' ? 'Add New PPE Asset' : 'Edit PPE Asset'}</h2>
            <p className="text-sm text-slate-600">Fill in the details based on the PPE template</p>
          </div>
          <Button variant="outline" onClick={() => {
            setView('list');
            resetForm();
            setSelectedPPE(null);
          }}>
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* A. Item Identification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-5 text-blue-600" />
                Item Identification
              </CardTitle>
              <CardDescription>Basic identification and classification details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="property_number">
                    Property Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="property_number"
                    value={formData.property_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, property_number: e.target.value }))}
                    placeholder="e.g., PPE-2024-0001"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ICT Equipment">ICT Equipment</SelectItem>
                      <SelectItem value="Office Equipment">Office Equipment</SelectItem>
                      <SelectItem value="Motor Vehicle">Motor Vehicle</SelectItem>
                      <SelectItem value="Furniture and Fixtures">Furniture and Fixtures</SelectItem>
                      <SelectItem value="Communication Equipment">Communication Equipment</SelectItem>
                      <SelectItem value="Technical and Scientific Equipment">Technical and Scientific Equipment</SelectItem>
                      <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legend">Legend</Label>
                  <Select value={formData.legend} onValueChange={(value) => setFormData(prev => ({ ...prev, legend: value }))}>
                    <SelectTrigger id="legend">
                      <SelectValue placeholder="Select legend" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A - Administrative</SelectItem>
                      <SelectItem value="B">B - Building</SelectItem>
                      <SelectItem value="C">C - Communication</SelectItem>
                      <SelectItem value="F">F - Furniture</SelectItem>
                      <SelectItem value="I">I - IT Equipment</SelectItem>
                      <SelectItem value="M">M - Motor Vehicle</SelectItem>
                      <SelectItem value="O">O - Office Equipment</SelectItem>
                      <SelectItem value="T">T - Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serial_number">
                    Serial Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="serial_number"
                    value={formData.serial_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                    placeholder="Serial/identification number"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the asset"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="Brand/manufacturer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="Model number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parts">Parts</Label>
                  <Input
                    id="parts"
                    value={formData.parts}
                    onChange={(e) => setFormData(prev => ({ ...prev, parts: e.target.value }))}
                    placeholder="Component parts"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* B. Classification Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="size-5 text-blue-600" />
                Classification Details
              </CardTitle>
              <CardDescription>Financial and lifecycle information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_of_measurement">Unit of Measurement</Label>
                  <Select value={formData.unit_of_measurement} onValueChange={(value) => setFormData(prev => ({ ...prev, unit_of_measurement: value }))}>
                    <SelectTrigger id="unit_of_measurement">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unit">Unit</SelectItem>
                      <SelectItem value="set">Set</SelectItem>
                      <SelectItem value="piece">Piece</SelectItem>
                      <SelectItem value="lot">Lot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_value">Unit Value (₱)</Label>
                  <Input
                    id="unit_value"
                    type="number"
                    step="0.01"
                    value={formData.unit_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit_value: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_acquired">
                    Date Acquired <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date_acquired"
                    type="date"
                    value={formData.date_acquired}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_acquired: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_useful_life">Estimated Useful Life (Years)</Label>
                  <Input
                    id="estimated_useful_life"
                    type="number"
                    value={formData.estimated_useful_life}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_useful_life: parseInt(e.target.value) || 5 }))}
                    placeholder="5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* C. Accountability Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5 text-blue-600" />
                Accountability Section
              </CardTitle>
              <CardDescription>Assignment and responsibility details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="par_itr_number">PAR/ITR Number</Label>
                  <Input
                    id="par_itr_number"
                    value={formData.par_itr_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, par_itr_number: e.target.value }))}
                    placeholder="PAR-2024-0001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actual_division">Actual Division</Label>
                  <Select value={formData.actual_division} onValueChange={(value) => setFormData(prev => ({ ...prev, actual_division: value }))}>
                    <SelectTrigger id="actual_division">
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Office of the Chairman and CEO">Office of the Chairman and CEO</SelectItem>
                      <SelectItem value="Legal Service">Legal Service</SelectItem>
                      <SelectItem value="Administrative Service">Administrative Service</SelectItem>
                      <SelectItem value="Finance Service">Finance Service</SelectItem>
                      <SelectItem value="Technical Service">Technical Service</SelectItem>
                      <SelectItem value="Planning and Policy Service">Planning and Policy Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plantilla_employee_id">Plantilla Employee ID</Label>
                  <Input
                    id="plantilla_employee_id"
                    value={formData.plantilla_employee_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, plantilla_employee_id: e.target.value }))}
                    placeholder="Employee ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="non_plantilla_employee_id">Non-Plantilla Employee ID</Label>
                  <Input
                    id="non_plantilla_employee_id"
                    value={formData.non_plantilla_employee_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, non_plantilla_employee_id: e.target.value }))}
                    placeholder="Employee ID"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select value={formData.condition} onValueChange={(value: any) => setFormData(prev => ({ ...prev, condition: value }))}>
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Working">Working</SelectItem>
                      <SelectItem value="Not Working">Not Working</SelectItem>
                      <SelectItem value="IIRUP">IIRUP (Issued for Repair Under Process)</SelectItem>
                      <SelectItem value="Disposed">Disposed</SelectItem>
                      <SelectItem value="Missing">Missing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setView('list');
                resetForm();
                setSelectedPPE(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {view === 'add' ? 'Add PPE Asset' : 'Update PPE Asset'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // DETAILS VIEW
  if (view === 'details' && selectedPPE) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-slate-900">PPE Asset Details</h2>
            <p className="text-sm text-slate-600">{selectedPPE.property_number}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleEdit(selectedPPE)}>
              <Edit className="size-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => setView('list')}>
              Back to List
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Item Identification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="size-5 text-blue-600" />
                  Item Identification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-slate-600">Property Number</Label>
                    <p className="text-slate-900">{selectedPPE.property_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Category</Label>
                    <p className="text-slate-900">{selectedPPE.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Legend</Label>
                    <Badge variant="outline">{selectedPPE.legend}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Serial Number</Label>
                    <p className="text-slate-900">{selectedPPE.serial_number}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm text-slate-600">Description</Label>
                    <p className="text-slate-900">{selectedPPE.description}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Brand</Label>
                    <p className="text-slate-900">{selectedPPE.brand || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Model</Label>
                    <p className="text-slate-900">{selectedPPE.model || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm text-slate-600">Parts</Label>
                    <p className="text-slate-900">{selectedPPE.parts || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Classification Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="size-5 text-blue-600" />
                  Classification & Financial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-slate-600">Unit of Measurement</Label>
                    <p className="text-slate-900">{selectedPPE.unit_of_measurement}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Unit Value</Label>
                    <p className="text-slate-900">{formatCurrency(selectedPPE.unit_value)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Date Acquired</Label>
                    <p className="text-slate-900">{new Date(selectedPPE.date_acquired).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Estimated Useful Life</Label>
                    <p className="text-slate-900">{selectedPPE.estimated_useful_life} years</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accountability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5 text-blue-600" />
                  Accountability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-slate-600">PAR/ITR Number</Label>
                    <p className="text-slate-900">{selectedPPE.par_itr_number || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Actual Division</Label>
                    <p className="text-slate-900">{selectedPPE.actual_division}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Plantilla Employee ID</Label>
                    <p className="text-slate-900">{selectedPPE.plantilla_employee_id || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Non-Plantilla Employee ID</Label>
                    <p className="text-slate-900">{selectedPPE.non_plantilla_employee_id || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Condition</Label>
                    <div>{getConditionBadge(selectedPPE.condition)}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Date</Label>
                    <p className="text-slate-900">{new Date(selectedPPE.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="size-5 text-blue-600" />
                  Movement History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedPPE.history && selectedPPE.history.length > 0 ? (
                    selectedPPE.history.map((item, index) => (
                      <div key={item.id} className="border-l-2 border-blue-200 pl-4 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="size-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-900">PAR/ITR: {item.par_itr_number || '-'}</p>
                          <p className="text-slate-600">Division: {item.actual_division}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600">Condition:</span>
                            {getConditionBadge(item.condition)}
                          </div>
                          {item.remarks && (
                            <p className="text-slate-500 italic">{item.remarks}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No history available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                  <FileText className="size-4" />
                  Generate PAR
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                  <Settings className="size-4" />
                  Update Condition
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                  <Download className="size-4" />
                  Export Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
