import { useEffect, useMemo, useState } from "react";
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
  filteredAssets: TaggableAsset[];
  selectedAssets: number[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectAll: () => void;
  onToggleAsset: (id: number) => void;
}

export function AssetSelectionCard({
  filteredAssets,
  selectedAssets,
  isLoading,
  searchTerm,
  onSearchChange,
  onSelectAll,
  onToggleAsset,
}: AssetSelectionCardProps) {
  const [page, setPage] = useState(1);
  const [activeGroup, setActiveGroup] = useState<"PPE" | "SE">("PPE");
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filteredAssets.length, activeGroup]);

  const groupedAssets = useMemo(
    () => filteredAssets.filter((a) => a.group === activeGroup),
    [filteredAssets, activeGroup]
  );

  const totalPages = Math.max(1, Math.ceil(groupedAssets.length / pageSize));

  const paginatedAssets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return groupedAssets.slice(start, start + pageSize);
  }, [groupedAssets, page]);

  const ppeCount = filteredAssets.filter((a) => a.group === "PPE").length;
  const seCount = filteredAssets.filter((a) => a.group === "SE").length;

  const columns = [
    {
      key: "select",
      label: "",
      render: (_: any, asset: TaggableAsset) => (
        <Checkbox checked={selectedAssets.includes(asset.id)} onCheckedChange={() => onToggleAsset(asset.id)} />
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
          <DataTable data={paginatedAssets} columns={columns} />
        )}
      </div>

      {!isLoading && groupedAssets.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, groupedAssets.length)} of {groupedAssets.length}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Prev
            </Button>
            <span>Page {page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {!isLoading && groupedAssets.length === 0 && (
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
          <Button variant="outline" onClick={onSelectAll} disabled={isLoading}>
            {selectedAssets.length === filteredAssets.length && filteredAssets.length > 0 ? "Deselect All" : "Select All"}
          </Button>
        </div>

        <Tabs value={activeGroup} onValueChange={(v) => setActiveGroup(v as "PPE" | "SE")}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="PPE">
              PPE
              <Badge variant="secondary" className="ml-2 text-xs">{ppeCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="SE">
              SE
              <Badge variant="secondary" className="ml-2 text-xs">{seCount}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="PPE" className="space-y-3 mt-3">{renderTable()}</TabsContent>
          <TabsContent value="SE" className="space-y-3 mt-3">{renderTable()}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
