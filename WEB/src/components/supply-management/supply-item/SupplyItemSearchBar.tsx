// src/components/supply-management/supply-item/SupplyItemSearchBar.tsx
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Props {
    value: string;
    onChange: (value: string) => void;
}

export const SupplyItemSearchBar = ({ value, onChange }: Props) => {
    return (
        <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
                placeholder="Search supplies by description or code..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="pl-10 bg-white"
            />
        </div>
    );
};