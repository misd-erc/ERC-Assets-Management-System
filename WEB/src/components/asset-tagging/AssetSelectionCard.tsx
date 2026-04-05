import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TaggableAsset } from "@/hooks/useAssetTagging";
import { DataTable } from "@/components/common/DataTable";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Search } from "lucide-react";

interface AssetSelectionCardProps {
  ppeItems: TaggableAsset[];
  seItems: TaggableAsset[];
  ppePage: number;
  ppePageSize: number;
  ppeTotalCount: number;
  sePage: number;
  sePageSize: number;
  seTotalCount: number;
  onPpePageChange: (p: number) => void;
  onPpePageSizeChange: (s: number) => void;
  onSePageChange: (p: number) => void;
  onSePageSizeChange: (s: number) => void;
  selectedAssets: number[];
  isPpeLoading: boolean;
  isSeLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectAll: (items: TaggableAsset[]) => void;
  onToggleAsset: (asset: TaggableAsset) => void;
}

export function AssetSelectionCard({
  ppeItems,
  seItems,
  ppePage,
  ppePageSize,
  ppeTotalCount,
  sePage,
  sePageSize,
  seTotalCount,
  onPpePageChange,
  onPpePageSizeChange,
  onSePageChange,
  onSePageSizeChange,
  selectedAssets,
  isPpeLoading,
  isSeLoading,
  searchTerm,
  onSearchChange,
  onSelectAll,
  onToggleAsset,
}: AssetSelectionCardProps) {
  const [activeGroup, setActiveGroup] = useState<"PPE" | "SE">("PPE");

  const isPpe = activeGroup === "PPE";
  const items = isPpe ? ppeItems : seItems;
  const page = isPpe ? ppePage : sePage;
  const pageSize = isPpe ? ppePageSize : sePageSize;
  const totalCount = isPpe ? ppeTotalCount : seTotalCount;
  const isLoading = isPpe ? isPpeLoading : isSeLoading;
  const setPage = isPpe ? onPpePageChange : onSePageChange;
  const setPageSize = isPpe ? onPpePageSizeChange : onSePageSizeChange;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const allCurrentSelected = items.length > 0 && items.every((a) => selectedAssets.includes(a.id));

  const columns = [
    {
      key: "select",
      label: "",
      render: (_: unknown, asset: TaggableAsset) => (
        <Checkbox
          checked={selectedAssets.includes(asset.id)}
          onCheckedChange={() => onToggleAsset(asset)}
        />
      ),
    },
    { key: "code", label: "Asset Code" },
    { key: "description", label: "Description" },
    { key: "category", label: "Category" },
    { key: "location", label: "Location" },
  ];

  const renderTable = () => (
    <>
      <div className="border rounded-lg">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading assets...</div>
        ) : (
          <DataTable data={items} columns={columns} />
        )}
      </div>

      {!isLoading && totalCount > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <label className="text-xs">Per page:</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-7 rounded-md border border-input bg-background px-2 py-0.5 text-xs"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Prev
            </Button>
            <span>Page {page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {!isLoading && totalCount === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg mb-2">No assets found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria</p>
        </div>
      )}
    </>
  );

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Select Assets
        </CardTitle>
        <CardDescription>Choose assets to generate tags for</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by code, description, or category..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={() => onSelectAll(items)} disabled={isLoading || items.length === 0}>
            {allCurrentSelected ? "Deselect Page" : "Select Page"}
          </Button>
        </div>

        <Tabs value={activeGroup} onValueChange={(v) => setActiveGroup(v as "PPE" | "SE")}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="PPE">
              PPE
              <Badge variant="secondary" className="ml-2 text-xs">{ppeTotalCount.toLocaleString()}</Badge>
            </TabsTrigger>
            <TabsTrigger value="SE">
              SE
              <Badge variant="secondary" className="ml-2 text-xs">{seTotalCount.toLocaleString()}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="PPE" className="space-y-3 mt-3">{renderTable()}</TabsContent>
          <TabsContent value="SE" className="space-y-3 mt-3">{renderTable()}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
