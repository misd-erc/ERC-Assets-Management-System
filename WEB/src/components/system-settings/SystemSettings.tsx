import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Settings, 
  QrCode, 
  Wifi, 
  Database, 
  Shield,
  Printer,
  Link,
  AlertCircle
} from 'lucide-react';

interface Integration {
  name: string;
  status: 'Connected' | 'Pending' | 'Disconnected';
  type: string;
}

export function SystemSettings() {
  const integrations: Integration[] = [
    { name: 'Active Directory', status: 'Connected', type: 'Authentication' },
    { name: 'eNGAS', status: 'Connected', type: 'Budgeting' },
    { name: 'eBudget', status: 'Connected', type: 'Financial' },
    { name: 'HRIS', status: 'Pending', type: 'HR System' },
    { name: 'ProcurementPH', status: 'Disconnected', type: 'Procurement' },
    { name: 'Website/Transparency', status: 'Connected', type: 'Public Portal' }
  ];

  const getStatusColor = (status: 'Connected' | 'Pending' | 'Disconnected'): string => {
    switch (status) {
      case 'Connected':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-amber-100 text-amber-800';
      case 'Disconnected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system preferences, integrations, and security settings
          </p>
        </div>
        <Button>
          <Settings className="w-4 h-4 mr-2" />
          Configure
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Integrations</p>
                <p className="text-2xl font-semibold mt-1">6</p>
              </div>
              <Link className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Printers</p>
                <p className="text-2xl font-semibold mt-1">8</p>
              </div>
              <Printer className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scanners</p>
                <p className="text-2xl font-semibold mt-1">4</p>
              </div>
              <QrCode className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Security Level</p>
                <p className="text-2xl font-semibold mt-1">HIGH</p>
              </div>
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>
            Manage system-wide settings, integrations, and hardware configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="integrations">
            <TabsList>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="barcode">Barcode/RFID</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>

            <TabsContent value="integrations" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">External System Integrations</h3>
                  <Button variant="outline" size="sm">
                    Test All Connections
                  </Button>
                </div>
                <div className="grid gap-4">
                  {integrations.map((integration) => (
                    <div 
                      key={integration.name} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Database className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{integration.name}</p>
                          <p className="text-xs text-muted-foreground">{integration.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={`text-xs ${getStatusColor(integration.status)}`}>
                          {integration.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Configure
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="barcode" className="mt-6">
              <div className="text-center py-12">
                <QrCode className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Barcode & RFID Configuration</h3>
                <p className="text-muted-foreground mb-4">
                  Configure barcode formats, printer profiles, and scanner settings
                </p>
                <Button>
                  <QrCode className="w-4 h-4 mr-2" />
                  Configure Hardware
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <div className="text-center py-12">
                <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Security Settings</h3>
                <p className="text-muted-foreground mb-4">
                  Password policies, session timeouts, and security protocols
                </p>
                <Button>
                  <Shield className="w-4 h-4 mr-2" />
                  Manage Security
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="general" className="mt-6">
              <div className="text-center py-12">
                <Settings className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">General Settings</h3>
                <p className="text-muted-foreground mb-4">
                  System preferences, allocation rules, and operational parameters
                </p>
                <Button>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure System
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
