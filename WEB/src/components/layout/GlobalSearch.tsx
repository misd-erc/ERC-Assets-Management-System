// GlobalSearch.tsx
import { useState, useEffect, useRef } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Package,
  Users,
  ShoppingCart,
  Loader2,
  ArrowRight,
  Box,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";
import { globalSearch, GlobalSearchResultItem } from "@/api/search/searchApi";
import { cn } from "@/components/ui/utils";
import { useMediaQuery } from "@/hooks";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (module: string) => void;
}

interface CategoryConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  "PPE Assets":      { icon: Box,          color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200" },
  "Semi-Expendable": { icon: Package,      color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-200" },
  "Supply Items":    { icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  "Employees":       { icon: Users,        color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200" },
};

const MODULE_LABELS: Record<string, string> = {
  "ppe-se":            "PPE / SE Assets",
  "supply-management": "Supply Management",
  "office-management": "Office Management",
};

const SUGGESTIONS = [
  { label: "PPE / Semi-Expendable Assets", icon: Box,          module: "ppe-se",            color: "text-blue-500",    bg: "bg-blue-50" },
  { label: "Supply Management",            icon: ShoppingCart, module: "supply-management", color: "text-emerald-500", bg: "bg-emerald-50" },
  { label: "Employees",                    icon: Users,        module: "office-management", color: "text-orange-500",  bg: "bg-orange-50" },
];

// Detail preview panel
function DetailPanel({
  result,
  searchQuery,
  onBack,
  onOpen,
}: {
  result: GlobalSearchResultItem;
  searchQuery: string;
  onBack: () => void;
  onOpen: (r: GlobalSearchResultItem) => void;
}) {
  const cfg = CATEGORY_CONFIG[result.category] ?? {
    icon: Search,
    color: "text-gray-500",
    bg: "bg-gray-100",
    border: "border-gray-200",
  };
  const Icon = cfg.icon;
  const moduleName = MODULE_LABELS[result.module] ?? result.module;

  // Highlight matching text
  const highlight = (text: string) => {
    if (!searchQuery) return text;
    const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-100 text-yellow-800 rounded px-0.5 not-italic font-semibold">
          {text.slice(idx, idx + searchQuery.length)}
        </mark>
        {text.slice(idx + searchQuery.length)}
      </>
    );
  };

  return (
    <div className="px-4 py-3 sm:px-5 sm:py-4 space-y-3 sm:space-y-4">
      {/* Item card */}
      <div className={cn("flex items-start gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4", cfg.border, cfg.bg)}>
        <span className={cn("flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-white shadow-sm shrink-0")}>
          <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", cfg.color)} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-snug break-words">
            {highlight(result.title)}
          </p>
          <p className="text-xs text-gray-500 mt-1 break-all leading-relaxed">
            {result.description}
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className={cn("text-xs font-medium gap-1", cfg.color)}>
          <Icon className="h-3 w-3" />
          {result.category}
        </Badge>
        <span className="text-xs text-gray-400">
          Found in{" "}
          <span className="text-gray-700 font-medium">{moduleName}</span>
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-gray-600"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          size="sm"
          className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => onOpen(result)}
        >
          <ExternalLink className="h-4 w-4" />
          Open in {moduleName}
        </Button>
      </div>
    </div>
  );
}

// Main component
export function GlobalSearch({ open, onOpenChange, onNavigate }: GlobalSearchProps) {
  const [searchQuery, setSearchQuery]       = useState("");
  const [results, setResults]               = useState<GlobalSearchResultItem[]>([]);
  const [isLoading, setIsLoading]           = useState(false);
  const [selectedResult, setSelectedResult] = useState<GlobalSearchResultItem | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setResults([]);
      setSelectedResult(null);
    }
  }, [open]);

  // Clear detail panel when query changes
  useEffect(() => {
    setSelectedResult(null);
  }, [searchQuery]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim().length < 2) { setResults([]); setIsLoading(false); return; }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await globalSearch(searchQuery.trim());
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, GlobalSearchResultItem[]>);

  // Navigate to module and pre-fill its search
  const handleOpenInModule = (result: GlobalSearchResultItem) => {
    const tab =
      result.category === "PPE Assets"      ? "PPE" :
      result.category === "Semi-Expendable" ? "SE"  : undefined;

    sessionStorage.setItem(
      "_gsq",
      JSON.stringify({ query: searchQuery.trim(), title: result.title, tab })
    );
    onNavigate?.(result.module);
    onOpenChange(false);
    setSearchQuery("");
    setSelectedResult(null);
  };

  const isEmpty       = !isLoading && searchQuery.trim().length >= 2 && results.length === 0;
  const showSuggestions = searchQuery.trim().length < 2;
  const hasResults    = !isLoading && results.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 gap-0 shadow-2xl rounded-xl border-0 sm:max-w-xl max-w-[calc(100%-1rem)] mx-auto">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <DialogDescription className="sr-only">
          Search across assets, supply items, and employees
        </DialogDescription>

        <Command shouldFilter={false} className="rounded-xl">
          {/* Input row */}
          <div className="flex items-center border-b border-gray-100 px-3 sm:px-4">
            {selectedResult ? (
              <button
                onClick={() => setSelectedResult(null)}
                className="mr-2 sm:mr-3 rounded p-0.5 hover:bg-gray-100 transition-colors"
                aria-label="Back to results"
              >
                <ChevronLeft className="h-4 w-4 text-gray-400" />
              </button>
            ) : (
              <Search className="mr-2 sm:mr-3 h-4 w-4 shrink-0 text-gray-400" />
            )}
            <CommandInput
              placeholder={isMobile ? "Search..." : "Search assets, supply, employees..."}
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-10 sm:h-12 flex-1 border-0 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            />
            {isLoading && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin text-blue-500 shrink-0" />
            )}
          </div>

          {/* Detail panel */}
          {selectedResult ? (
            <DetailPanel
              result={selectedResult}
              searchQuery={searchQuery}
              onBack={() => setSelectedResult(null)}
              onOpen={handleOpenInModule}
            />
          ) : (
            <CommandList className="max-h-[350px] sm:max-h-[400px] overflow-y-auto">
              {/* Browse modules (idle) */}
              {showSuggestions && (
                <CommandGroup heading="Browse Modules">
                  {SUGGESTIONS.map((s) => (
                    <CommandItem
                      key={s.module}
                      value={s.module}
                      onSelect={() => { onNavigate?.(s.module); onOpenChange(false); }}
                      className="group mx-1 my-0.5 flex cursor-pointer items-center gap-3 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5"
                    >
                      <span className={cn("flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg shrink-0", s.bg)}>
                        <s.icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", s.color)} />
                      </span>
                      <span className="flex-1 text-xs sm:text-sm font-medium text-gray-700">{s.label}</span>
                      <ArrowRight className="h-4 w-4 text-gray-300 shrink-0 opacity-0 group-data-[selected=true]:opacity-100 transition-opacity" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center gap-2 py-8 sm:py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  <span>Searching across all modules...</span>
                </div>
              )}

              {/* No results */}
              {isEmpty && (
                <div className="flex flex-col items-center justify-center gap-3 py-8 sm:py-10 text-center">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gray-100">
                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">No results found</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      No matches for &ldquo;
                      <span className="font-semibold text-gray-600">{searchQuery}</span>
                      &rdquo;
                    </p>
                  </div>
                </div>
              )}

              {/* Results */}
              {hasResults &&
                Object.entries(groupedResults).map(([category, items]) => {
                  const cfg = CATEGORY_CONFIG[category] ?? {
                    icon: Search,
                    color: "text-gray-500",
                    bg: "bg-gray-100",
                    border: "border-gray-200",
                  };
                  const Icon = cfg.icon;
                  return (
                    <CommandGroup key={category} heading={category}>
                      {items.map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.id}
                          onSelect={() => setSelectedResult(result)}
                          className="group mx-1 my-0.5 flex cursor-pointer items-center gap-3 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5"
                        >
                          <span className={cn("flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg shrink-0", cfg.bg)}>
                            <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", cfg.color)} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{result.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-300 shrink-0 opacity-0 group-data-[selected=true]:opacity-100 transition-opacity" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  );
                })}
            </CommandList>
          )}

          {/* Footer */}
          {!selectedResult && (
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-500 rounded-b-xl">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 px-1 py-0.5 font-mono text-[9px] sm:text-[10px] shadow-sm">↑</kbd>
                  <kbd className="rounded bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 px-1 py-0.5 font-mono text-[9px] sm:text-[10px] shadow-sm">↓</kbd>
                  <span className="hidden sm:inline">navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 px-1 py-0.5 font-mono text-[9px] sm:text-[10px] shadow-sm">↵</kbd>
                  <span className="hidden sm:inline">view details</span>
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 px-1 py-0.5 font-mono text-[9px] sm:text-[10px] shadow-sm">Esc</kbd>
                <span className="hidden sm:inline">close</span>
              </span>
            </div>
          )}
        </Command>
      </DialogContent>
    </Dialog>
  );
}