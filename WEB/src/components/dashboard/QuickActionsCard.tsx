import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  Plus,
  Package,
  FileText,
  ArrowRightLeft,
  QrCode,
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface QuickActionsCardProps {
  onNavigate?: (module: string) => void;
}

export function QuickActionsCard({
  onNavigate,
}: QuickActionsCardProps) {
  const handleCreateRIS = () => {
    toast.success("Navigating to RIS creation");
    onNavigate?.("supplies-inventory");
  };

  const handleEncodeAsset = () => {
    toast.success("Navigating to asset encoding");
    onNavigate?.("ppe-semi-expendables");
  };

  const handleGeneratePAR = () => {
    toast.success("Navigating to PAR generation");
    onNavigate?.("par-ics");
  };

  const handleAssetTransfer = () => {
    toast.success("Navigating to asset transfer");
    onNavigate?.("transfers-returns");
  };

  const handlePrintBarcode = () => {
    // Generate a sample barcode
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      ctx.fillStyle = "#000";

      // Simple barcode pattern
      for (let i = 0; i < 50; i++) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i * 4, 10, 2, 30);
        }
      }

      // Download the barcode
      const link = document.createElement("a");
      link.download = `barcode-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
    toast.success("Barcode generated and downloaded");
  };

  const handleImportData = () => {
    // Create a sample CSV template
    const csvContent =
      "Asset Code,Description,Category,Brand,Model,Serial Number,Acquisition Date,Cost,Location\n" +
      "ICT-2024-001,Dell Laptop,ICT Equipment,Dell,Latitude 7420,DL123456,2024-01-15,65000,IT Department\n" +
      "FUR-2024-001,Office Chair,Furniture,Herman Miller,Aeron,HM789123,2024-02-01,25000,Executive Office";

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "asset-import-template.csv";
    link.click();
    window.URL.revokeObjectURL(url);

    toast.success(
      "Import template downloaded. Fill out the template and upload it in the respective modules.",
    );
  };

  const handleViewPendingApprovals = () => {
    toast.success("Navigating to pending approvals");
    onNavigate?.("pending-approvals");
  };

  const handleViewReports = () => {
    toast.success("Navigating to reports");
    onNavigate?.("reports");
  };

  const quickActions = [
    {
      title: "Create RIS",
      description: "Requisition and Issue Slip",
      icon: FileText,
      onClick: handleCreateRIS,
      variant: "outline" as const,
      priority: "high" as const,
    },
    {
      title: "Encode Asset",
      description: "Add new asset to inventory",
      icon: Plus,
      onClick: handleEncodeAsset,
      variant: "outline" as const,
      priority: "high" as const,
    },
    {
      title: "Generate PAR",
      description: "Property Acknowledgment Receipt",
      icon: Package,
      onClick: handleGeneratePAR,
      variant: "outline" as const,
      priority: "high" as const,
    },
    {
      title: "Asset Transfer",
      description: "Transfer between departments",
      icon: ArrowRightLeft,
      onClick: handleAssetTransfer,
      variant: "outline" as const,
      priority: "medium" as const,
    },
    {
      title: "Print Barcode",
      description: "Generate asset barcode labels",
      icon: QrCode,
      onClick: handlePrintBarcode,
      variant: "outline" as const,
      priority: "medium" as const,
    },
    {
      title: "Import Data",
      description: "Download Excel template",
      icon: Upload,
      onClick: handleImportData,
      variant: "outline" as const,
      priority: "low" as const,
    },
    {
      title: "Pending Approvals",
      description: "Review and approve requests",
      icon: Clock,
      onClick: handleViewPendingApprovals,
      variant: "default" as const,
      priority: "high" as const,
    },
    {
      title: "View Reports",
      description: "Generate asset reports",
      icon: CheckCircle,
      onClick: handleViewReports,
      variant: "outline" as const,
      priority: "medium" as const,
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-l-red-500 bg-red-50/50";
      case "medium":
        return "border-l-4 border-l-amber-500 bg-amber-50/50";
      case "low":
        return "border-l-4 border-l-green-500 bg-green-50/50";
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Frequently used operations for asset management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              variant={action.variant}
              className={`justify-start h-auto p-4 hover:scale-[1.02] transition-transform ${getPriorityColor(action.priority)}`}
              onClick={action.onClick}
            >
              <action.icon className="w-5 h-5 mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium">{action.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {action.description}
                </p>
              </div>
              {action.priority === "high" && (
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
