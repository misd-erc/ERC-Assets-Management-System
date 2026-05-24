import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { Input } from '@/components/ui/input';

export const formatDateToMMDDYY = (dateString?: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
};

export const DateInput = ({ value, onChange, disabled, className, ...props }: any) => {
  const [open, setOpen] = useState(false);
  const displayValue = value ? formatDateToMMDDYY(value) : '';
  
  if (disabled) {
    return (
      <Input
        type="text"
        value={displayValue}
        disabled
        className={cn("bg-gray-100 cursor-not-allowed", className)}
        {...props}
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full cursor-pointer">
          <Input
            type="text"
            value={displayValue}
            placeholder="MM/DD/YY"
            readOnly
            className={cn("w-full cursor-pointer bg-white pr-10 hover:bg-slate-50", className)}
            disabled={disabled}
            {...props}
          />
          <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(d: Date | undefined) => {
            if (d) {
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              onChange(`${yyyy}-${mm}-${dd}`);
            } else {
              onChange('');
            }
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
