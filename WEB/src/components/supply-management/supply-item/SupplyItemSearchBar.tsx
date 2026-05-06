import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const SupplyItemSearchBar = ({ value, onChange, placeholder }: Props) => {
    const [localValue, setLocalValue] = useState(value);

    // Sync with external value (e.g. on Reset)
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Automatic Search (Debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localValue !== value) {
                onChange(localValue);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [localValue, onChange, value]);

    const handleSearch = () => {
        onChange(localValue);
    };

    const handleClear = () => {
        setLocalValue('');
        onChange('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="flex items-center gap-2 w-full max-w-xl">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder={placeholder || "Search supplies by description or code..."}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 pr-10 bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-100 transition-all"
                />
                {localValue && (
                    <button 
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
            <Button 
                onClick={handleSearch}
                className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm px-4 shrink-0"
            >
                Search
            </Button>
        </div>
    );
};