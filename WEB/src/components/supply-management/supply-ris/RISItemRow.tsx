// src/components/supply-management/ris/RISItemRow.tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Trash2 } from 'lucide-react';
import { VwSupplyGroupedItem } from '@/types';
import { FormItem } from './SupplyRISFormModal';

interface Props {
  item: FormItem;
  index: number;
  vwSupplyGroups: VwSupplyGroupedItem[];
  isViewMode: boolean;
  onUpdate: (index: number, field: keyof FormItem, value: any) => void;
  onRemove: (index: number) => void;
}

export const RISItemRow = ({
  item,
  index,
  vwSupplyGroups,
  isViewMode,
  onUpdate,
  onRemove,
}: Props) => {
  const availableUnits = item.availableUnits || [];
  const isLoadingUnits = item.isLoadingUnits || false;

  return (
    <div className="border rounded-md p-4 space-y-3 relative">
      {!isViewMode && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Stock Number</Label>
          <Select
            value={item.stockNumber}
            onValueChange={(val) => onUpdate(index, 'stockNumber', val)}
            disabled={isViewMode}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Item" />
            </SelectTrigger>
            <SelectContent>
              {vwSupplyGroups.map((g) => (
                <SelectItem key={g.code} value={g.code}>
                  {g.code} - {g.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            value={item.itemDescription}
            disabled
            className="bg-gray-100"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Unit</Label>
          {isLoadingUnits ? (
            <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-gray-50">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading units...</span>
            </div>
          ) : availableUnits.length > 0 ? (
            <Select
              value={item.unitId.toString()}
              onValueChange={(val) => onUpdate(index, 'unitId', Number(val))}
              disabled={isViewMode}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Unit" />
              </SelectTrigger>
              <SelectContent>
                {availableUnits.map((u) => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input value="—" disabled className="bg-gray-100" />
          )}
        </div>
        <div className="space-y-2">
          <Label>Requisition Quantity</Label>
          <Input
            type="number"
            value={item.requisitionQuantity}
            disabled
            className="bg-gray-100"
          />
        </div>
        <div className="space-y-2">
          <Label>Issue Quantity</Label>
          <Input
            type="number"
            value={item.issueQuantity}
            onChange={(e) => onUpdate(index, 'issueQuantity', Number(e.target.value))}
            min={0}
            max={item.requisitionQuantity}
            required
            disabled={isViewMode}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Remarks</Label>
        <Input
          value={item.itemRemarks}
          onChange={(e) => onUpdate(index, 'itemRemarks', e.target.value)}
          placeholder="Optional remarks"
          disabled={isViewMode}
        />
      </div>
    </div>
  );
};