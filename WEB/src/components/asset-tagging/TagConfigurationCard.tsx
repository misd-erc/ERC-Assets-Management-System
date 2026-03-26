import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TagTemplate } from "@/hooks/useAssetTagging";
import { Printer, Tag } from "lucide-react";

export type CodeType = 'none' | 'qr';

interface TagConfigurationCardProps {
  tagTemplate: string;
  tagTemplates: TagTemplate[];
  activeTemplate: TagTemplate;
  includeLogo: boolean;
  selectedCount: number;
  isGenerating: boolean;
  isLoading: boolean;
  onTemplateChange: (value: string) => void;
  onToggleLogo: (checked: boolean) => void;
  onGenerate: () => void;
}

export function TagConfigurationCard(props: TagConfigurationCardProps) {
  const {
    tagTemplate,
    tagTemplates,
    activeTemplate,
    includeLogo,
    selectedCount,
    isGenerating,
    isLoading,
    onTemplateChange,
    onToggleLogo,
    onGenerate,
  } = props;

  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Tag Configuration
        </CardTitle>
        <CardDescription>Customize tag appearance and content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Tag Template</Label>
          <Select value={tagTemplate} onValueChange={onTemplateChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tagTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {tagTemplates.find((t) => t.id === tagTemplate)?.description}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="includeLogo" checked={includeLogo} onCheckedChange={(checked) => onToggleLogo(Boolean(checked))} />
          <label htmlFor="includeLogo" className="text-sm cursor-pointer">
            ERC Logo
          </label>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Selected Assets:</span>
            <Badge variant="secondary">{selectedCount}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tag Size:</span>
            <span>
              {activeTemplate.width} x {activeTemplate.height} mm
            </span>
          </div>
        </div>

        <Button className="w-full" onClick={onGenerate} disabled={selectedCount === 0 || isGenerating || isLoading}>
          {isGenerating ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Printer className="w-4 h-4 mr-2" />
              Generate & Print Tags
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
