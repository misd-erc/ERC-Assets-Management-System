import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { NormalizedEmployee } from '@/types/asset/UnifiedAsset';

interface EmployeeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: NormalizedEmployee[];
  onSelect: (employee: NormalizedEmployee) => void;
}

export function EmployeeSelectModal({ isOpen, onClose, employees, onSelect }: EmployeeSelectModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    return employees.filter(employee =>
      employee.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeIdOriginal?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handleContinue = () => {
    const selectedEmployee = employees.find(emp => emp.id.toString() === selectedEmployeeId);
    if (selectedEmployee) {
      onSelect(selectedEmployee);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setSelectedEmployeeId('');
      setSearchTerm('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Employee</DialogTitle>
          <DialogDescription>
            Choose the employee who will be listed as "Received by" in the report.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            <RadioGroup value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              {filteredEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={employee.id.toString()} id={`employee-${employee.id}`} />
                  <Label htmlFor={`employee-${employee.id}`} className="text-sm font-normal">
                    {employee.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={!selectedEmployeeId}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
