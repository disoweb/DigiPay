import { useState, useEffect } from "react";
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

  // Cleanup when modal closes
  useEffect(() => {
    if (!open) {
      setIsProcessing(false);
      setShowVerifyButton(false);
      setPaymentReference("");
    }
  }, [open]);

  // Force cleanup any stuck states
  useEffect(() => {
    const cleanup = () => {
      if (isProcessing) {
        console.log("Forcing cleanup of stuck processing state");
        setIsProcessing(false);
      }
    };

    const timer = setTimeout(cleanup, 30000); // 30 seconds max
    return () => clearTimeout(timer);
  }, [isProcessing]);

  const initializePaymentMutation = useMutation({
    mutationFn: async (amount: number) => {
      try {
        const res = await apiRequest("POST", "/api/payments/initialize", { amount });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || `HTTP ${res.status}: Payment initialization failed`);
        }
        return data;
      } catch (error) {
        console.error("Payment initialization error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      try {
        if (data.success && data.data) {
          setPaymentReference(data.data.reference);
          setShowVerifyButton(true);
          handlePaystackPayment(data.data);
        } else {
          throw new Error(data.message || "Payment initialization failed");
        }
      } catch (error) {
        console.error("Payment success handler error:", error);
        setIsProcessing(false);
        toast({
          title: "Payment Setup Failed",
          description: "Unable to setup payment. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Payment initialization mutation error:", error);
      setIsProcessing(false);
      toast({
        title: "Payment Initialization Failed",
        description: error.message || "Unable to initialize payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (reference: string) => {
      try {
        const res = await apiRequest("POST", "/api/payments/verify", { reference });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || `HTTP ${res.status}: Payment verification failed`);
        }
        return data;
      } catch (error) {
        console.error("Payment verification error:", error);
        throw error;
      }
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
        setShowVerifyButton(false);
        setPaymentReference("");
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
      console.error("Payment verification mutation error:", error);
      setIsProcessing(false);
      toast({
        title: "Payment Verification Failed",
        description: error.message || "Unable to verify payment. Please contact support.",
        variant: "destructive",
      });
    },
  });

  const handlePaystackPayment = async (paystackData: any) => {
    try {
      console.log("Setting up Paystack payment...", paystackData);

      if (!user?.email) {
        throw new Error("User email not available. Please refresh and try again.");
      }

      // Use inline payment for seamless experience
      await initializePaystack({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: parseFloat(amount) * 100,
        currency: "NGN",
        reference: paystackData.reference,
        callback: async (response: any) => {
          console.log("Paystack callback received:", response);
          try {
            if (response.status === "success") {
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
          } catch (error) {
            console.error("Paystack callback error:", error);
            setIsProcessing(false);
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

      // Fallback to authorization URL
      if (paystackData.authorization_url) {
        window.open(paystackData.authorization_url, '_blank');
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
        const depositAmount = result.data.amount / 100;

        toast({
          title: "Payment Successful!",
          description: `₦${depositAmount.toLocaleString()} has been automatically credited to your account.`,
        });

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
    // Prevent multiple clicks
    if (isProcessing || initializePaymentMutation.isPending) {
      console.log("Deposit already in progress");
      return;
    }

    const depositAmount = parseFloat(amount);
    if (depositAmount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit amount is ₦100",
        variant: "destructive",
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: "User Error",
        description: "Please refresh the page and try again",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      console.log("Initiating deposit for amount:", depositAmount);
      await initializePaymentMutation.mutateAsync(depositAmount);
    } catch (error) {
      console.error("Deposit error:", error);
      setIsProcessing(false);
    }
  };

  const quickAmounts = [1000, 5000, 10000, 20000];

  const resetModal = () => {
    setIsProcessing(false);
    setShowVerifyButton(false);
    setPaymentReference("");
    setAmount("");
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          resetModal();
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent 
        className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={(e) => {
          if (isProcessing) {
            e.preventDefault();
          }
        }}
      >
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
          {/* Quick Amount Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Quick Select</Label>
            <div className="grid grid-cols-2 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  disabled={isProcessing}
                  className="h-12 text-sm font-medium hover:bg-green-50 hover:border-green-300"
                >
                  ₦{quickAmount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
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
              disabled={isProcessing}
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
                    type="button"
                    onClick={() => handlePaymentVerification(paymentReference)}
                    disabled={verifyPaymentMutation.isPending || isProcessing}
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

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              type="button"
              onClick={handleDeposit}
              disabled={!amount || parseFloat(amount) < 100 || isProcessing || initializePaymentMutation.isPending}
              className="w-full h-12 text-base font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
              onClick={() => {
                resetModal();
                onOpenChange(false);
              }}
              className="w-full h-11 text-base"
              disabled={false}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackConfig) => {
        openIframe: () => void;
        embed?: () => void;
      };
    };
  }
}