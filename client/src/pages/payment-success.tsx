import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');
  const [amount, setAmount] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      // Get reference from URL
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference');
      
      if (!reference) {
        setStatus('error');
        setMessage('No payment reference found');
        return;
      }

      const token = localStorage.getItem('digipay_token');
      if (!token) {
        setStatus('error');
        setMessage('Authentication required. Please log in again.');
        setTimeout(() => setLocation('/auth'), 2000);
        return;
      }

      try {
        const response = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reference })
        });

        const data = await response.json();
        
        if (data.success && data.data.status === 'success') {
          setStatus('success');
          setAmount(data.data.amount.toString());
          setMessage(`Payment successful! ₦${data.data.amount} has been added to your wallet.`);
          
          // Clean up pending payment data
          localStorage.removeItem('pending_payment_reference');
          localStorage.removeItem('pending_payment_amount');
          
          // Auto-redirect after 3 seconds
          setTimeout(() => setLocation('/wallet'), 3000);
        } else {
          setStatus('error');
          setMessage('Payment verification failed. Please contact support if amount was deducted.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Unable to verify payment. Please check your connection and try again.');
      }
    };

    verifyPayment();
  }, [setLocation]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {status === 'loading' && 'Processing Payment'}
            {status === 'success' && 'Payment Successful'}
            {status === 'error' && 'Payment Issue'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className={`${getStatusColor()} font-medium`}>
            {message}
          </p>
          
          {status === 'success' && amount && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 font-semibold">
                ₦{amount} credited to your wallet
              </p>
            </div>
          )}
          
          {status !== 'loading' && (
            <div className="space-y-2">
              <Button 
                onClick={() => setLocation('/wallet')} 
                className="w-full"
              >
                Go to Wallet
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/dashboard')} 
                className="w-full"
              >
                Return to Dashboard
              </Button>
            </div>
          )}
          
          {status === 'loading' && (
            <p className="text-sm text-gray-500">
              This may take a few moments...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}