import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function PaymentCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const { toast } = useToast();

  const verifyPaymentMutation = useMutation({
    mutationFn: async (reference: string) => {
      const res = await apiRequest("POST", "/api/payments/verify", { reference });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setStatus('success');
        localStorage.removeItem('pending_payment_reference');
        toast({
          title: "Payment Successful",
          description: "Your account has been credited successfully.",
        });
      } else {
        setStatus('failed');
        toast({
          title: "Payment Verification Failed",
          description: data.message || "Please contact support",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      setStatus('failed');
      toast({
        title: "Payment Verification Failed",
        description: "Unable to verify payment. Please contact support.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    const trxref = urlParams.get('trxref'); // Paystack sometimes uses this
    
    const paymentRef = reference || trxref || localStorage.getItem('pending_payment_reference');
    
    if (paymentRef) {
      verifyPaymentMutation.mutate(paymentRef);
    } else {
      setStatus('failed');
      toast({
        title: "Payment Error",
        description: "No payment reference found",
        variant: "destructive",
      });
    }
  }, []);

  const handleReturnToWallet = () => {
    setLocation('/wallet');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'verifying' && <Loader2 className="h-6 w-6 animate-spin text-blue-600" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
            {status === 'failed' && <XCircle className="h-6 w-6 text-red-600" />}
            
            {status === 'verifying' && "Verifying Payment"}
            {status === 'success' && "Payment Successful"}
            {status === 'failed' && "Payment Failed"}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {status === 'verifying' && (
            <p className="text-gray-600">
              Please wait while we verify your payment...
            </p>
          )}
          
          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-green-700 font-medium">
                Your payment has been processed successfully!
              </p>
              <p className="text-gray-600 text-sm">
                Your account balance has been updated.
              </p>
            </div>
          )}
          
          {status === 'failed' && (
            <div className="space-y-2">
              <p className="text-red-700 font-medium">
                Payment verification failed
              </p>
              <p className="text-gray-600 text-sm">
                If you completed the payment, please contact support.
              </p>
            </div>
          )}
          
          {status !== 'verifying' && (
            <Button 
              onClick={handleReturnToWallet}
              className="w-full"
            >
              Return to Wallet
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}