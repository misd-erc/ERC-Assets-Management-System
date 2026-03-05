import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Asset, UnifiedMovement } from '@/types/asset/UnifiedAsset';
import { ArrowRight } from 'lucide-react';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

interface ItemMovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Asset | null;
  onConfirm: (item: Asset, selectedMovement: UnifiedMovement | null) => void;
}

export function ItemMovementsModal({
  isOpen,
  onClose,
  item,
  onConfirm,
}: ItemMovementsModalProps) {
  const activeMovements = useMemo(() => {
    if (!item || !item.movements) return [];
    return item.movements.filter(m => m.isActive && !m.isDeleted);
  }, [item]);

  const handleSelectMovement = (movement: UnifiedMovement) => {
    if (item) {
      onConfirm(item, movement);
    }
  };

  const getMovementDetails = (movement: UnifiedMovement) => {
    const employee = Array.isArray(movement.employee) ? movement.employee[0] : movement.employee;
    
    // Build full name
    const fullName = employee
      ? `${employee.lastName}, ${employee.firstName}${employee.middleName ? ` ${employee.middleName}` : ''}${employee.suffixName ? ` ${employee.suffixName}` : ''}`
      : 'N/A';
    
    // Get office name
    const officeName = employee?.office?.name || 'N/A';
    
    // Get original employee ID
    const employeeId = movement.plantillaEmployeeIdOriginal || movement.nonPlantillaEmployeeIdOriginal || 'N/A';
    
    return { fullName, officeName, employeeId };
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Item Movements</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Info */}
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400 font-semibold">
                  Property Number:
                </span>
                <p className="text-slate-900 dark:text-white mt-1">
                  {item.propertyNumber}
                </p>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400 font-semibold">
                  Category:
                </span>
                <p className="text-slate-900 dark:text-white mt-1">
                  {typeof item.category === 'object' && item.category ? item.category.name : item.category}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">
                  Description:
                </span>
                <p className="text-slate-900 dark:text-white mt-1">
                  {item.description}
                </p>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400 font-semibold">
                  Serial Number:
                </span>
                <p className="text-slate-900 dark:text-white mt-1">
                  {item.serialNumber || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400 font-semibold">
                  Current Condition:
                </span>
                <p className="text-slate-900 dark:text-white mt-1">
                  {item.condition || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Movements List */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
              Movements ({activeMovements.length})
            </h3>
            <ScrollArea className="h-80 border rounded-lg">
              {activeMovements.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 p-4">
                  No movements recorded for this item
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {activeMovements.map((movement, index) => {
                    const { fullName, officeName, employeeId } = getMovementDetails(movement);
                    return (
                      <div
                        key={movement.id || index}
                        onClick={() => handleSelectMovement(movement)}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {formatDate(movement.dateAssigned)}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              >
                                {movement.condition}
                              </Badge>
                            </div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                              {fullName}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              {officeName}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              Employee ID: {employeeId}
                            </div>
                            {movement.parIcsNumber && (
                              <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mt-1">
                                PAR/ICS: {movement.parIcsNumber}
                              </div>
                            )}
                            {movement.ptrItrNumber && (
                              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                PTR/ITR: {movement.ptrItrNumber}
                              </div>
                            )}
                          </div>
                          <ArrowRight className="h-5 w-5 text-slate-400 flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
