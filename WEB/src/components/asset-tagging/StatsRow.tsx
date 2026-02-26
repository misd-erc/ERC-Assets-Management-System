import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Grid3x3, Package, QrCode } from "lucide-react";

interface StatsRowProps {
  totalAssets: number;
  ppeAssets: number;
  selected: number;
  ready: number;
}

export function StatsRow({ totalAssets, ppeAssets, selected, ready }: StatsRowProps) {
  const cards = [
    { label: "Total Assets", value: totalAssets, icon: Package, color: "text-blue-600" },
    { label: "PPE Assets", value: ppeAssets, icon: Grid3x3, color: "text-green-600" },
    { label: "Selected", value: selected, icon: CheckCircle, color: "text-purple-600" },
    { label: "Tags Ready", value: ready, icon: QrCode, color: "text-orange-600" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl mt-1">{card.value}</p>
              </div>
              <card.icon className={`w-8 h-8 ${card.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
