
import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, AlertCircle, Loader2, CheckCircle } from "lucide-react";
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
  const [paymentStep, setPaymentStep] = useState<'amount' | 'processing' | 'verifying' | 'completed'>('amount');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [paymentReference, setPaymentReference] = useState("");
  const verificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasVerifiedRef = useRef(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setIsProcessing(false);
      setPaymentStep('amount');
      setPaymentReference("");
      hasVerifiedRef.current = false;
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
        verificationTimeoutRef.current = null;
      }
    }
  }, [open]);

  const initializePaymentMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", "/api/payments/initialize", { amount });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}: Payment initialization failed`);
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setPaymentReference(data.data.reference);
        setPaymentStep('processing');
        handlePaystackPayment(data.data);
      } else {
        throw new Error(data.message || "Payment initialization failed");
      }
    },
    onError: (error: Error) => {
      console.error("Payment initialization error:", error);
      setIsProcessing(false);
      setPaymentStep('amount');
      toast({
        title: "Payment Initialization Failed",
        description: error.message || "Unable to initialize payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (reference: string) => {
      const res = await apiRequest("POST", "/api/payments/verify", { reference });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}: Payment verification failed`);
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.success && data.data?.status === 'success') {
        const depositAmount = data.data.amount / 100;
        setPaymentStep('completed');
        
        toast({
          title: "Payment Successful!",
          description: `₦${depositAmount.toLocaleString()} has been ${data.existing ? 'already' : ''} credited to your account.`,
        });
        
        // Real-time data updates without full refresh
        queryClient.setQueryData(["/api/user"], (oldData: any) => {
          if (oldData && data.balanceUpdated) {
            const updatedBalance = (parseFloat(oldData.nairaBalance || '0') + depositAmount).toString();
            return { ...oldData, nairaBalance: updatedBalance };
          }
          return oldData;
        });
        
        // Invalidate only transactions to show the completed status
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        
        // Close modal after a short delay
        setTimeout(() => {
          resetModal();
          onOpenChange(false);
        }, 2000);
      } else {
        setPaymentStep('amount');
        setIsProcessing(false);
        toast({
          title: "Payment Verification Failed",
          description: data.message || "Please contact support if amount was deducted",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Payment verification error:", error);
      setPaymentStep('amount');
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
      if (!user?.email) {
        throw new Error("User email not available. Please refresh and try again.");
      }

      await initializePaystack({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: parseFloat(amount) * 100,
        currency: "NGN",
        reference: paystackData.reference,
        channels: ['card', 'bank', 'ussd', 'mobile_money', 'qr'],
        callback: async (response: any) => {
          console.log("Paystack callback received:", response);
          
          // Prevent duplicate verification
          if (hasVerifiedRef.current) {
            console.log("Verification already in progress, skipping...");
            return;
          }
          
          if (response.status === "success") {
            hasVerifiedRef.current = true;
            setPaymentStep('verifying');
            
            // Wait a moment then verify
            verificationTimeoutRef.current = setTimeout(async () => {
              try {
                await verifyPaymentMutation.mutateAsync(response.reference);
              } catch (error) {
                console.error("Verification error in callback:", error);
                hasVerifiedRef.current = false;
              }
            }, 1500);
          } else {
            setIsProcessing(false);
            setPaymentStep('amount');
            toast({
              title: "Payment Failed",
              description: "Payment was not completed successfully",
              variant: "destructive",
            });
          }
        },
        onClose: () => {
          console.log("Paystack payment closed");
          if (!hasVerifiedRef.current) {
            setIsProcessing(false);
            setPaymentStep('amount');
          }
        },
      });
    } catch (error) {
      console.error("Paystack payment error:", error);
      setIsProcessing(false);
      setPaymentStep('amount');
      
      // Fallback to authorization URL
      if (paystackData.authorization_url) {
        window.open(paystackData.authorization_url, '_blank');
        toast({
          title: "Payment Opened",
          description: "Complete your payment in the new tab, then return here to verify.",
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

  const handleDeposit = async () => {
    if (isProcessing || initializePaymentMutation.isPending) {
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

    setIsProcessing(true);
    try {
      await initializePaymentMutation.mutateAsync(depositAmount);
    } catch (error) {
      console.error("Deposit error:", error);
      setIsProcessing(false);
      setPaymentStep('amount');
    }
  };

  const quickAmounts = [1000, 5000, 10000, 20000];

  const resetModal = () => {
    setIsProcessing(false);
    setPaymentStep('amount');
    setPaymentReference("");
    setAmount("");
    hasVerifiedRef.current = false;
    if (verificationTimeoutRef.current) {
      clearTimeout(verificationTimeoutRef.current);
      verificationTimeoutRef.current = null;
    }
  };

  const renderContent = () => {
    switch (paymentStep) {
      case 'processing':
        return (
          <div className="space-y-6 py-8 text-center">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Payment in Progress</h3>
              <p className="text-gray-600">Complete your payment in the Paystack window</p>
              <p className="text-sm text-gray-500 mt-2">Amount: ₦{parseFloat(amount).toLocaleString()}</p>
            </div>
          </div>
        );
      
      case 'verifying':
        return (
          <div className="space-y-6 py-8 text-center">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Verifying Payment</h3>
              <p className="text-gray-600">Please wait while we confirm your payment...</p>
            </div>
          </div>
        );
      
      case 'completed':
        return (
          <div className="space-y-6 py-8 text-center">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-green-700">Payment Successful!</h3>
              <p className="text-gray-600">₦{parseFloat(amount).toLocaleString()} has been added to your wallet</p>
              <p className="text-sm text-gray-500 mt-2">This window will close automatically</p>
            </div>
          </div>
        );
      
      default:
        return (
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

            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800">
                Payment will open in a secure overlay window. Stay on this page for automatic verification.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <Button 
                type="button"
                onClick={handleDeposit}
                disabled={!amount || parseFloat(amount) < 100 || isProcessing}
                className="w-full h-12 text-base font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50"
                size="lg"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Initializing...
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
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen && !isProcessing) {
          resetModal();
          onOpenChange(newOpen);
        }
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

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
