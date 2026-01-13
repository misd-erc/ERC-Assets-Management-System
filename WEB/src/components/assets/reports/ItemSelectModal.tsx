import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search } from 'lucide-react';
import { Asset } from '@/types/asset/UnifiedAsset';
import { UnifiedAssetService } from '@/services/UnifiedAssetService';
import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';

interface ItemSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: Asset) => void;
  groupType: 'PPE' | 'SE';
  title?: string;
}

export function ItemSelectModal({
  isOpen,
  onClose,
  onSelect,
  groupType,
  title = `Select ${groupType} Item`,
}: ItemSelectModalProps) {
  const [items, setItems] = useState<Asset[]>([]);
  const [filteredItems, setFilteredItems] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectingItem, setIsSelectingItem] = useState(false);

  // Load items when modal opens
  useEffect(() => {
    if (isOpen && items.length === 0) {
      loadItems();
    }
  }, [isOpen]);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const result = await UnifiedAssetService.getAll({
        group: groupType,
        PageNumber: 1,
        PageSize: 1000,
      });
      setItems(result.items);
      setFilteredItems(result.items);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredItems(items);
      return;
    }

    const lowerTerm = term.toLowerCase();
    const filtered = items.filter(item =>
      item.propertyNumber.toLowerCase().includes(lowerTerm) ||
      item.description.toLowerCase().includes(lowerTerm) ||
      item.serialNumber.toLowerCase().includes(lowerTerm) ||
      item.category?.toLowerCase().includes(lowerTerm)
    );
    setFilteredItems(filtered);
  };

  const handleSelectItem = async (item: Asset) => {
    setIsSelectingItem(true);
    try {
      // Fetch detailed item data using ptaId
      const { systemUserId, sessionKey } = getAuthParams();
      const response = await axiosInstance.get<any>(`/Inventory/pta/se-ppe/all/${item.id}`, {
        params: {
          ActionBySystemUserId: systemUserId,
          SessionKey: sessionKey,
        },
      });

      if (response.data.success && response.data.data) {
        // API returns an array, so extract the first item
        const apiItem = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
        
        if (apiItem) {
          // Map the API response to Asset type with proper category handling
          const detailedItem: Asset = {
            id: apiItem.id,
            group: apiItem.group,
            propertyNumber: apiItem.propertyNumber || '',
            categoryId: apiItem.category?.id || 0,
            legendId: apiItem.legend?.id || 0,
            category: apiItem.category?.name || '',
            legend: apiItem.legend?.name || '',
            condition: apiItem.movements?.[0]?.condition || 'Good',
            description: apiItem.description || '',
            brand: apiItem.brand || '',
            model: apiItem.model || '',
            serialNumber: apiItem.serialNumber || '',
            parts: apiItem.parts || [],
            unitOfMeasurement: apiItem.unitOfMeasurement || '',
            unitValue: apiItem.unitValue || 0,
            dateAcquired: apiItem.dateAcquired || '',
            movements: apiItem.movements || [],
            estimatedUsefulLife: apiItem.estimatedUsefulLife || 5,
            fiscalYear: apiItem.fiscalYear || 0,
          };
          
          onSelect(detailedItem);
        } else {
          onSelect(item);
        }
      } else {
        // Fallback to the item if API call fails
        onSelect(item);
      }

      setSearchTerm('');
      setFilteredItems(items);
      onClose();
    } catch (error) {
      console.error('Failed to fetch detailed item data:', error);
      // Fallback to the item if API call fails
      onSelect(item);
      setSearchTerm('');
      setFilteredItems(items);
      onClose();
    } finally {
      setIsSelectingItem(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by property number, description, serial number..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>

          {/* Items List */}
          <ScrollArea className="h-96 border rounded-lg">
            {isLoading || isSelectingItem ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                {searchTerm ? 'No items found' : 'No items available'}
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    style={{ pointerEvents: isSelectingItem ? 'none' : 'auto', opacity: isSelectingItem ? 0.5 : 1 }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-semibold text-sm">
                        {item.propertyNumber}
                      </div>
                      <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        {item.category}
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      {item.description}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500 flex justify-between">
                      <span>SN: {item.serialNumber || 'N/A'}</span>
                      <span>Condition: {item.condition}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
