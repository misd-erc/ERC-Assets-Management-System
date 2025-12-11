import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { NormalizedEmployee } from '@/types/asset/UnifiedAsset';

interface EmployeeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: NormalizedEmployee[];
  onSelect: (employee: NormalizedEmployee) => void;
}

export function EmployeeSelectModal({ isOpen, onClose, employees, onSelect }: EmployeeSelectModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string>('');

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
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Employee</DialogTitle>
          <DialogDescription>
            Choose the employee who will be listed as "Received by" in the report.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            {employees.map((employee) => (
              <div key={employee.id} className="flex items-center space-x-2">
                <RadioGroupItem value={employee.id.toString()} id={`employee-${employee.id}`} />
                <Label htmlFor={`employee-${employee.id}`} className="text-sm font-normal">
                  {employee.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
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
