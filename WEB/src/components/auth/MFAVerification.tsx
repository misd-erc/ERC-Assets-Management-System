import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '@/hooks';

export function MFAVerification() {
  const [codes, setCodes] = useState(['', '', '', '', '', '']);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const { verifyMFA, logout, isLoading, error } = useAuth();

  const fullCode = codes.join('');

  const handleChange = (index: number, value: string) => {
    const newCodes = [...codes];
    newCodes[index] = value.replace(/\D/g, '').slice(0, 1);
    setCodes(newCodes);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCodes = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setCodes(newCodes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullCode.length === 6) {
      await verifyMFA(fullCode);
    }
  };

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Two-Factor Authentication</h1>
          <p className="text-slate-600 dark:text-slate-400">Enter the verification code sent to your email</p>
        </div>

        {/* MFA Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>Email Verification Required</span>
            </CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to your registered email address
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
                <label className="text-sm font-medium">Verification Code</label>
                <div
                  className="flex justify-center space-x-2"
                  onPaste={handlePaste}
                >
                  {codes.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => { inputsRef.current[index] = el; }}
                      type="tel"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-lg font-mono tracking-widest rounded border-2 focus:border-blue-500 focus:outline-none"
                      maxLength={1}
                      autoComplete="one-time-code"
                      placeholder="_"
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Didn't receive the code? <button type="button" className="text-blue-600 hover:underline">Resend</button>
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || fullCode.length !== 6}
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
                <li>â€¢ Check your email inbox and spam folder</li>
                <li>â€¢ The code is valid for 3 minutes</li>
                <li>â€¢ Contact IT support if you've lost access to your email</li>
                <li>â€¢ Emergency access: Contact your system administrator</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





