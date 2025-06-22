import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const VerifyEmailPage = () => {
  const [, navigate] = useLocation();
  const { verifyEmail, user, token } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);

  const searchParams = new URLSearchParams(window.location.search);
  const verificationToken = searchParams.get('token');

  useEffect(() => {
    if (!verificationToken) {
      setError('No verification token found in URL.');
      setStatus('error');
      return;
    }

    const attemptVerification = async () => {
      try {
        await verifyEmail(verificationToken);
        setStatus('success');
        // User and token should be updated by verifyEmail via AuthContext
        // Redirect after a short delay to allow context to update
        setTimeout(() => {
          navigate(user?.isAdmin ? '/admin' : '/dashboard');
        }, 2000);
      } catch (err: any) {
        setError(err.message || 'Failed to verify email. The link may be invalid or expired.');
        setStatus('error');
      }
    };

    attemptVerification();
  }, [verificationToken, verifyEmail, navigate, user]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-gray-800">
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'verifying' && (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="text-lg text-gray-600">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <Alert variant="default" className="bg-green-50 border-green-500">
              <AlertTitle className="font-semibold text-green-700">Verification Successful!</AlertTitle>
              <AlertDescription className="text-green-600">
                Your email has been successfully verified. You will be redirected shortly.
                If redirection doesn't happen, <Link href={user?.isAdmin ? "/admin" : "/dashboard"} className="text-blue-600 hover:underline">click here to proceed</Link>.
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && error && (
            <Alert variant="destructive">
              <AlertTitle className="font-semibold">Verification Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {(status === 'success' || status === 'error') && (
            <div className="text-center">
              <Button onClick={() => navigate(token ? (user?.isAdmin ? '/admin' : '/dashboard') : '/auth')} className="w-full bg-blue-600 hover:bg-blue-700">
                {token ? 'Go to Dashboard' : 'Back to Login'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
