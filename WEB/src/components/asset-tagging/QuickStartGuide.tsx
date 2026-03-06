import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export function QuickStartGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Quick Start Guide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {["Select assets from the table above using checkboxes", "Choose tag template and customize options in the configuration panel", 'Click "Generate & Print Tags" to create printable asset labels'].map((text, idx) => (
            <div key={idx} className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">{idx + 1}</div>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
