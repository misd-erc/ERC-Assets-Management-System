import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Shield, Lock, User } from 'lucide-react';
import { useAuth } from '../../hooks';
import { MFAVerification } from './MFAVerification';

const ercLogo = '/images/erc-logo.png';
const microsoftLogo = '/images/microsoft-logo.png';

export function LoginScreen() {
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const { login, requireMFA, isLoading, hasError, error } = useAuth();

  const onSubmit = async (data: { username: string; password: string }) => {
    await login(data);
  };

  if (requireMFA) {
    return <MFAVerification />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 flex items-center justify-center">
            <img 
              src={ercLogo}
              alt="Energy Regulatory Commission" 
              className="w-20 h-20 object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Energy Regulatory Commission</h1>
            <p className="text-slate-600 mt-1">Asset Management System</p>
          </div>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              {/* Enter your credentials to access the Asset Management System */}
              Use your ERC-provided Microsoft account to access the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Controller
                    name="username"
                    control={control}
                    rules={{
                      required: 'Username is required',
                      minLength: { value: 3, message: 'Username must be at least 3 characters' }
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="username"
                        type="text"
                        className="pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your username"
                      />
                    )}
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Controller
                    name="password"
                    control={control}
                    rules={{
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="password"
                        type="password"
                        className="pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your password"
                      />
                    )}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
                <a
                  href="#"
                  className="text-sm text-blue-600 hover:text-blue-500 text-right block"
                >
                  Forgot Password?
                </a>
              </div> */}

              <Button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                disabled={isLoading}>
                  {isLoading ? (
                    'Signing in...'
                  ) : (
                    <>
                      <img
                        src={microsoftLogo}
                        alt="Microsoft"
                        className="w-5 h-5"
                      />
                      <span>Sign in with Microsoft</span>
                    </>
                  )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p>This system is for ERC authorized personnel only. All activities are logged and monitored.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
