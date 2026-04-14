import { useState } from 'react';
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
  AlertCircle,
  Loader2
} from 'lucide-react';
import { fetchEmployeesDirectly, Employee as GraphApiEmployee } from '@/lib/graphApi';
import { batchUpdateEmployees, EmployeeUpdatePayload } from '@/api/user-management/userApi';
import { getEmployees } from '@/api/user-management/userApi';
import { ApiEmployee } from '@/types/asset/UnifiedAsset';

interface Integration {
  name: string;
  status: 'Connected' | 'Pending' | 'Disconnected';
  type: string;
}

export function SystemSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<GraphApiEmployee[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleUpdateEmployeeList = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // Step 1: Fetch employees from Microsoft Graph
      const graphEmployeeList = await fetchEmployeesDirectly();
      setEmployees(graphEmployeeList);

      // Step 2: Fetch existing employees from database
      const dbEmployeesResponse = await getEmployees(1, 1000);
      const dbEmployees = dbEmployeesResponse.data?.items || [];

      // Step 3: Create map for quick lookup

      const dbEmployeeMap = new Map<string, ApiEmployee>();
      dbEmployees.forEach(emp => {
        if (typeof emp.employeeIdOriginal === 'string' && emp.employeeIdOriginal) {
          dbEmployeeMap.set(emp.employeeIdOriginal.toLowerCase(), emp);
        }
      });

      // Step 4: Prepare batch update payload
      let skippedCount = 0;

      const updatePayload = graphEmployeeList
        .map(graphEmp => {
          // Validate employeeId (required for employeeIdOriginal)
          if (typeof graphEmp.employeeId !== 'string' || !graphEmp.employeeId.trim()) {
            console.warn('Skipping employee with missing/empty employeeId from Graph:', graphEmp);
            skippedCount++;
            return null;
          }

          const dbEmp = dbEmployeeMap.get(graphEmp.employeeId.toLowerCase());
          if (!dbEmp) {
            console.warn(`Employee ${graphEmp.employeeId} not found in database`);
            skippedCount++;
            return null;
          }

          // Parse display name to extract first, middle, and last names
          const nameParts = graphEmp.displayName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts[nameParts.length - 1] || '';
          const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;

          const payload: EmployeeUpdatePayload = {
            employeeId: dbEmp.id,
            firstName: firstName,
            middleName: middleName,
            lastName: lastName,
            suffixName: dbEmp.suffixName || null,
            employeeIdOriginal: graphEmp.employeeId.trim(),
            officeName: dbEmp.office?.name || null,
            divisionName: null, // Not provided by Graph API
            employmentTypeName: dbEmp.employmentType?.name || null,
            positionName: dbEmp.position?.name || null,
            isActive: true
          };
          return payload;
        })
        .filter((payload): payload is EmployeeUpdatePayload => {
          // Skip if employeeIdOriginal is empty or null
          if (!payload || !payload.employeeIdOriginal || !payload.employeeIdOriginal.trim()) {
            skippedCount++;
            console.warn('Skipping employee with empty employeeIdOriginal:', payload);
            return false;
          }
          return true;
        });

      // Step 5: Call batch update endpoint
      if (updatePayload.length > 0) {
        const response = await batchUpdateEmployees(updatePayload);
        if (response.success) {
          let message = `Successfully updated ${updatePayload.length} employee(s).`;
          if (skippedCount > 0) {
            message += ` (${skippedCount} employee(s) skipped - missing employee ID in Entra ID)`;
          }
          setSuccessMessage(message);
        } else {
          setError(response.message || 'Failed to update employees');
        }
      } else {
        setError(`No employees to update. ${skippedCount} employee(s) were skipped due to missing or invalid employee IDs.`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const integrations: Integration[] = [
    { name: 'Active Directory', status: 'Connected', type: 'Authentication' },
    { name: 'Employee List', status: 'Connected', type: 'Microsoft Entra ID (Users)' },
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">System Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure system preferences, integrations, and security settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Integrations</p>
                <p className="text-2xl font-semibold mt-1">1</p>
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
                <p className="text-2xl font-semibold mt-1">0</p>
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
                <p className="text-2xl font-semibold mt-1">0</p>
              </div>
              <QrCode className="w-8 h-8 text-purple-600" />
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
              {/* <TabsTrigger value="barcode">Barcode/RFID</TabsTrigger> */}
            </TabsList>

            <TabsContent value="integrations" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-2">External System Integrations</h3>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Error</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {successMessage && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">{successMessage}</p>
                  </div>
                )}

                {/* Employee List (Microsoft Entra) Integration Row ONLY */}
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Database className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Microsoft Entra</p>
                      <p className="text-xs text-muted-foreground">Microsoft Entra ID (Users)</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={`text-xs ${getStatusColor('Connected')}`}>Connected</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUpdateEmployeeList}
                      disabled={isLoading}
                      title="Sync employee list from Microsoft Entra ID"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update'
                      )}
                    </Button>
                  </div>
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
