import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Shield, Smartphone, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export function MFAVerification() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { verifyMFA, logout } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await verifyMFA(code);
      if (!success) {
        setError('Invalid verification code. Please try again.');
        setCode('');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl">Two-Factor Authentication</h1>
          <p className="text-muted-foreground">Enter the verification code to continue</p>
        </div>

        {/* MFA Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5" />
              <span>Verification Required</span>
            </CardTitle>
            <CardDescription>
              Enter the 6-digit code from your authenticator app or SMS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center tracking-widest text-lg"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </Button>

              <Button 
                type="button" 
                variant="ghost" 
                className="w-full"
                onClick={logout}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="text-sm text-blue-800">
              <p className="mb-2">Having trouble?</p>
              <ul className="space-y-1 text-xs">
                <li>• Make sure your device time is correct</li>
                <li>• Contact IT support if you've lost access to your authenticator</li>
                <li>• Emergency access: Contact your system administrator</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
