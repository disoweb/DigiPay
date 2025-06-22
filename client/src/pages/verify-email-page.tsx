import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const VerifyEmailPage = () => {
  const [location] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Verification token not found in URL.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully! You can now log in.');
          toast({
            title: 'Success',
            description: data.message || 'Email verified successfully!',
          });
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email. The link may be invalid or expired.');
          toast({
            variant: 'destructive',
            title: 'Error',
            description: data.error || 'Email verification failed.',
          });
        }
      } catch (err) {
        setStatus('error');
        setMessage('An unexpected error occurred during email verification.');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'An unexpected error occurred.',
        });
        console.error(err);
      }
    };

    verifyEmail();
  }, [location, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">
            {status === 'verifying' && 'Verifying your email address...'}
            {status === 'success' && 'Verification Successful!'}
            {status === 'error' && 'Verification Failed!'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'verifying' && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="ml-3">Please wait...</p>
            </div>
          )}
          {status !== 'verifying' && (
            <p className={`text-center ${status === 'error' ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}
          {status === 'success' && (
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
              <Link href="/auth">Proceed to Login</Link>
            </Button>
          )}
          {status === 'error' && (
            <Button asChild className="w-full">
              <Link href="/">Go to Homepage</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
