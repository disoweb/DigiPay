import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PaymentIntegrationProps {
  onPaymentComplete?: () => void;
}

export function PaymentIntegration({ onPaymentComplete }: PaymentIntegrationProps) {
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const { toast } = useToast();

  const initializePaymentMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", "/api/payments/initialize", { amount });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.data?.authorization_url) {
        // Redirect to Paystack payment page
        window.open(data.data.authorization_url, '_blank');
        setReference(data.data.reference);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Initialization Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (reference: string) => {
      const res = await apiRequest("POST", "/api/payments/verify", { reference });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful",
        description: "Your deposit has been credited to your account.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      onPaymentComplete?.();
      setAmount("");
      setReference("");
    },
    onError: (error: any) => {
      toast({
        title: "Payment Verification Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleInitializePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    initializePaymentMutation.mutate(paymentAmount);
  };

  const handleVerifyPayment = () => {
    if (!reference) {
      toast({
        title: "No Reference",
        description: "Please complete payment first",
        variant: "destructive",
      });
      return;
    }
    verifyPaymentMutation.mutate(reference);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Deposit Funds via Paystack
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Securely deposit Naira using your bank card or bank transfer through Paystack.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleInitializePayment} className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to deposit"
                min="100"
                step="0.01"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={initializePaymentMutation.isPending}
            >
              {initializePaymentMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Initializing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay with Paystack
                </>
              )}
            </Button>
          </form>

          {reference && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Payment Reference</h4>
              <p className="text-sm text-gray-600 mb-3">{reference}</p>
              <Button
                onClick={handleVerifyPayment}
                disabled={verifyPaymentMutation.isPending}
                size="sm"
              >
                {verifyPaymentMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Payment
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}