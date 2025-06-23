import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { initializePaystack, PAYSTACK_PUBLIC_KEY } from "@/lib/paystack";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [paymentReference, setPaymentReference] = useState("");
  const [showVerifyButton, setShowVerifyButton] = useState(false);

  const initializePaymentMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", "/api/payments/initialize", { amount });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setPaymentReference(data.data.reference);
        setShowVerifyButton(true);
        handlePaystackPayment(data.data);
      } else {
        throw new Error(data.message || "Payment initialization failed");
      }
    },
    onError: (error: Error) => {
      setIsProcessing(false);
      toast({
        title: "Payment Initialization Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (reference: string) => {
      const res = await apiRequest("POST", "/api/payments/verify", { reference });
      return res.json();
    },
    onSuccess: (data) => {
      setIsProcessing(false);
      if (data.success) {
        toast({
          title: "Payment Successful",
          description: "Your account has been credited successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        setAmount("");
        onOpenChange(false);
      } else {
        toast({
          title: "Payment Verification Failed",
          description: data.message || "Please contact support",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      setIsProcessing(false);
      toast({
        title: "Payment Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePaystackPayment = async (paystackData: any) => {
    try {
      setIsProcessing(true);
      console.log("Setting up seamless Paystack payment...", paystackData);

      // Check if user email is available
      if (!user?.email) {
        throw new Error("User email not available. Please refresh and try again.");
      }

      // Use inline payment for seamless experience
      await initializePaystack({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: parseFloat(amount) * 100, // Convert to kobo
        currency: "NGN",
        reference: paystackData.reference,
        callback: async (response: any) => {
          console.log("Paystack callback received:", response);
          if (response.status === "success") {
            // Wait a moment for Paystack to process
            setTimeout(async () => {
              await handlePaymentVerification(response.reference);
            }, 2000);
          } else {
            setIsProcessing(false);
            toast({
              title: "Payment Failed",
              description: "Payment was not completed successfully",
              variant: "destructive",
            });
          }
        },
        onClose: () => {
          console.log("Paystack payment closed");
          setIsProcessing(false);
        },
      });
    } catch (error) {
      console.error("Paystack payment error:", error);
      setIsProcessing(false);
      
      // Fallback to authorization URL if inline fails
      if (paystackData.authorization_url) {
        // Create an embedded iframe for seamless experience
        const iframe = document.createElement('iframe');
        iframe.src = paystackData.authorization_url;
        iframe.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
          z-index: 9999;
          background: white;
        `;
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          border: none;
          background: #ff4444;
          color: white;
          font-size: 24px;
          border-radius: 50%;
          cursor: pointer;
          z-index: 10000;
        `;
        closeBtn.onclick = () => {
          document.body.removeChild(iframe);
          document.body.removeChild(closeBtn);
          setIsProcessing(false);
        };
        
        document.body.appendChild(iframe);
        document.body.appendChild(closeBtn);
        
        // Listen for payment completion
        window.addEventListener('message', (event) => {
          if (event.data.type === 'paystack_payment_complete') {
            document.body.removeChild(iframe);
            document.body.removeChild(closeBtn);
            if (event.data.status === 'success') {
              setTimeout(async () => {
                await handlePaymentVerification(event.data.reference);
              }, 2000);
            }
          }
        });
      } else {
        toast({
          title: "Payment Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handlePaymentVerification = async (reference: string) => {
    // Prevent double verification
    if (verifyPaymentMutation.isPending) {
      console.log("Verification already in progress, skipping...");
      return;
    }

    try {
      console.log("Verifying payment with reference:", reference);
      setIsProcessing(true);

      const res = await apiRequest("POST", "/api/payments/verify", { reference });
      const result = await res.json();

      console.log("Payment verification result:", result);

      if (result.success && result.data?.status === 'success') {
        const depositAmount = result.data.amount / 100; // Convert from kobo to naira

        toast({
          title: "Payment Successful!",
          description: `₦${depositAmount.toLocaleString()} has been automatically credited to your account.`,
        });

        // Refresh user data and close modal
        await queryClient.invalidateQueries({ queryKey: ["user"] });
        await queryClient.invalidateQueries({ queryKey: ["transactions"] });
        setAmount("");
        setShowVerifyButton(false);
        setPaymentReference("");
        onOpenChange(false);
      } else {
        throw new Error(result.message || "Payment verification failed");
      }
    } catch (error: any) {
      console.error("Payment verification error:", error);
      toast({
        title: "Verification Failed", 
        description: error.message || "Please contact support if amount was deducted",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    if (depositAmount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit amount is ₦100",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    initializePaymentMutation.mutate(depositAmount);
  };

  const quickAmounts = [1000, 5000, 10000, 20000];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            Add Funds to Wallet
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Instantly add Nigerian Naira using secure payment methods
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Quick Amount Selection - Mobile Optimized */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Quick Select</Label>
            <div className="grid grid-cols-2 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="h-12 text-sm font-medium hover:bg-green-50 hover:border-green-300"
                >
                  ₦{quickAmount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input - Mobile Optimized */}
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
              Custom Amount (NGN)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              className="h-12 text-lg text-center"
              inputMode="numeric"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Minimum: ₦100</span>
              <span>Maximum: ₦1,000,000</span>
            </div>
          </div>

          {/* Preview Card */}
          {amount && parseFloat(amount) >= 100 && (
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">You're depositing</p>
                  <p className="text-2xl font-bold text-green-700">₦{parseFloat(amount).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">No additional fees</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-blue-900 text-sm mb-1">Secure Payment via Paystack</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Support for cards, bank transfers, USSD, and mobile money. 
                    Bank-grade security with instant processing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              You'll be redirected to Paystack's secure payment page to complete your transaction.
            </AlertDescription>
          </Alert>

          {/* Manual Verification Section */}
          {showVerifyButton && paymentReference && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-amber-900 text-sm">Payment Reference</h4>
                  <p className="text-xs text-amber-800 font-mono bg-amber-100 p-2 rounded">
                    {paymentReference}
                  </p>
                  <p className="text-xs text-amber-700">
                    After completing payment, click verify to update your balance.
                  </p>
                  <Button
                    onClick={() => handlePaymentVerification(paymentReference)}
                    disabled={verifyPaymentMutation.isPending}
                    className="w-full h-10 bg-amber-600 hover:bg-amber-700"
                    size="sm"
                  >
                    {verifyPaymentMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                      </div>
                    ) : (
                      "Verify Payment"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons - Mobile Optimized */}
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeposit();
              }} 
              disabled={!amount || parseFloat(amount) < 100 || isProcessing || initializePaymentMutation.isPending}
              className="w-full h-12 text-base font-medium bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isProcessing || initializePaymentMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {initializePaymentMutation.isPending ? "Initializing..." : "Processing..."}
                </div>
              ) : (
                `Continue with ₦${amount ? parseFloat(amount).toLocaleString() : "0"}`
              )}
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsProcessing(false);
                setShowVerifyButton(false);
                setPaymentReference("");
                onOpenChange(false);
              }}
              className="w-full h-11 text-base"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}