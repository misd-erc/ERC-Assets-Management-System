import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { getCategories } from '@/api/asset/inventoryApi';
import { toast } from 'sonner';
import { Check, ChevronsUpDown } from 'lucide-react';

interface RPCPPEFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (date: Date, categoryId?: number) => void;
}

export function RPCPPEFilterModal({ isOpen, onClose, onGenerate }: RPCPPEFilterModalProps) {
  const [asOfDate, setAsOfDate] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      getCategories().then(categoriesData => {
        setCategories(categoriesData);
      });
    }
  }, [isOpen]);

  const handleGenerate = () => {
    if (!asOfDate) {
      toast.error('Please select a date');
      return;
    }
    const selectedCategoryId = categoryId === 'all' ? undefined : Number(categoryId);
    onGenerate(new Date(asOfDate), selectedCategoryId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate RPCPPE REPORT</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">As of Date</Label>
            <Input 
              type="date" 
              value={asOfDate} 
              onChange={(e) => setAsOfDate(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Category</Label>
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryOpen}
                  className={cn(
                    "col-span-3 justify-between font-normal h-10 px-3 bg-white hover:bg-slate-50/80 border-slate-300 hover:border-slate-400 active:scale-[0.99] transition-all rounded-md shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500",
                    !categoryId && "text-slate-400"
                  )}
                >
                  <span className="truncate">
                    {categoryId === 'all'
                      ? 'All Categories'
                      : categories.find((cat) => cat.id.toString() === categoryId)?.name ?? 'All Categories'}
                  </span>
                  <ChevronsUpDown className={cn("ml-2 h-4 w-4 shrink-0 transition-transform duration-200 text-slate-400", categoryOpen && "text-indigo-500")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl shadow-xl border border-slate-200 bg-white overflow-hidden" align="start">
                <Command className="bg-white">
                  <div className="p-2 bg-slate-50/50 border-b border-slate-100">
                    <div className="relative rounded-md border border-slate-200 bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
                      <CommandInput
                        placeholder="Search category..."
                        className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none"
                      />
                    </div>
                  </div>
                  <CommandList className="max-h-60 overflow-y-auto p-1">
                    <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                      No category found.
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => { setCategoryId('all'); setCategoryOpen(false); }}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2.5 my-0.5 text-sm cursor-pointer transition-all duration-150 data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700 text-slate-700 hover:bg-slate-50",
                          categoryId === 'all' && "bg-indigo-50/60 font-medium text-indigo-700"
                        )}
                      >
                        <span className="truncate flex-1">All Categories</span>
                        <Check className={cn("ml-2 h-4 w-4 shrink-0 transition-all duration-200", categoryId === 'all' ? "opacity-100 scale-100 text-indigo-600" : "opacity-0 scale-75")} />
                      </CommandItem>
                      {categories.map((cat) => (
                        <CommandItem
                          key={cat.id}
                          value={cat.name}
                          onSelect={() => { setCategoryId(cat.id.toString()); setCategoryOpen(false); }}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-3 py-2.5 my-0.5 text-sm cursor-pointer transition-all duration-150 data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700 text-slate-700 hover:bg-slate-50",
                            categoryId === cat.id.toString() && "bg-indigo-50/60 font-medium text-indigo-700"
                          )}
                        >
                          <span className="truncate flex-1">{cat.name}</span>
                          <Check className={cn("ml-2 h-4 w-4 shrink-0 transition-all duration-200", categoryId === cat.id.toString() ? "opacity-100 scale-100 text-indigo-600" : "opacity-0 scale-75")} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleGenerate}>Generate Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
