import React from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnderConstructionContentProps {
  onNavigate: (module: string) => void;
  moduleName?: string;
}

const UnderConstructionContent: React.FC<UnderConstructionContentProps> = ({ onNavigate, moduleName }) => {
  const location = useLocation();
  const displayModuleName = moduleName || location.state?.moduleName || 'This feature';

  const handleGoToDashboard = () => {
    onNavigate('dashboard');
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Construction className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Under Construction
          </CardTitle>
          <CardDescription className="text-gray-600">
            The <strong>{displayModuleName}</strong> module is currently being developed and will be available soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <Construction className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Coming Soon</span>
            </div>
            <p className="text-sm text-blue-700">
              We're working hard to bring you this feature. Please check back later.
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleGoToDashboard}
              className="w-full"
              variant="default"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Thank you for your patience as we improve the system.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnderConstructionContent;




