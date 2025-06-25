import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { initializeEnhancedPaystack, PAYSTACK_PUBLIC_KEY, getMobileOptimizedChannels, validatePaymentAmount } from "@/lib/enhanced-paystack";
import { initializeCSPBypassPayment } from "@/lib/csp-bypass-payment";
import { CreditCard, Shield, Clock, CheckCircle, AlertCircle, Loader2, Smartphone, ArrowRight } from "lucide-react";
import { PaymentStatusIndicator } from "./payment-status-indicator";
// Removed PendingDepositAlert import - no restrictions

interface EnhancedDepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

type PaymentStep = 'amount' | 'processing' | 'verifying' | 'success' | 'error';

export function EnhancedDepositModal({ open, onOpenChange, user }: EnhancedDepositModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('amount');
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const hasVerifiedRef = useRef(false);
  const verificationTimeoutRef = useRef<NodeJS.Timeout>();

  // Removed pending deposit checks - users can make unlimited deposits

  // Reset state when modal opens/closes and check for payment returns
  useEffect(() => {
    if (open) {
      setPaymentStep('amount');
      setAmount("");
      setErrorMessage("");
      setPaymentReference("");
      setIsProcessing(false);
      hasVerifiedRef.current = false;
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
      }
    } else {
      // Always ensure scroll lock is removed when modal closes
      document.body.classList.remove('paystack-open');
    }
    
    // Check for payment returns on page load
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reference') && urlParams.get('status')) {
      handlePaymentReturn();
    }
  }, [open]);

  const handlePaymentReturn = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    const status = urlParams.get('status');
    
    if (reference && status === 'success') {
      setPaymentStep('success');
      toast({
        title: "Payment Successful",
        description: "Your deposit has been processed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Initialize payment mutation
  const initializePaymentMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", "/api/payments/initialize", { 
        amount: amount,
        email: user.email,
        metadata: {
          source: 'wallet_deposit',
          timestamp: Date.now()
        }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Payment initialization failed');
      }
      return res.json();
    },
    onSuccess: async (data) => {
      if (data.success && data.data?.authorization_url) {
        setPaymentReference(data.data.reference);
        setPaymentStep('processing');
        await handlePaystackPayment(data.data);
      } else {
        throw new Error(data.message || 'Payment initialization failed');
      }
    },
    onError: (error: any) => {
      setPaymentStep('error');
      setErrorMessage(error.message);
      toast({
        title: "Payment Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: async (reference: string) => {
      const res = await apiRequest("POST", "/api/payments/verify", { reference });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Payment verification failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setPaymentStep('success');
        
        // Add a brief processing state to prevent wallet interaction
        const processingOverlay = document.createElement('div');
        processingOverlay.id = 'payment-processing-overlay';
        processingOverlay.className = 'fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center';
        processingOverlay.innerHTML = `
          <div class="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div class="flex items-center space-x-3">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
              <span class="text-slate-900 dark:text-white font-medium">Updating balance...</span>
            </div>
          </div>
        `;
        document.body.appendChild(processingOverlay);
        
        // Remove overlay after balance updates
        setTimeout(() => {
          const overlay = document.getElementById('payment-processing-overlay');
          if (overlay) {
            overlay.remove();
          }
        }, 3000);
        
        // Force immediate balance refresh - WebSocket should handle this but ensure UI updates
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          queryClient.refetchQueries({ queryKey: ["/api/user"] });
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        }, 500);
        
        // Remove paystack scroll lock to prevent freezing
        document.body.classList.remove('paystack-open');
        
        toast({
          title: "Payment Successful!",
          description: `₦${parseFloat(amount).toLocaleString()} added to your wallet instantly`,
          className: "border-green-200 bg-green-50 text-green-800",
          duration: 5000,
        });

        // Auto-close modal after success without page refresh
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      } else {
        throw new Error(data.message || 'Payment verification failed');
      }
    },
    onError: (error: any) => {
      setPaymentStep('error');
      setErrorMessage(error.message);
      hasVerifiedRef.current = false;
      
      // Remove scroll lock on error to prevent freezing
      document.body.classList.remove('paystack-open');
      
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePaystackPayment = async (paystackData: any) => {
    try {
      if (!user?.email) {
        throw new Error("User email not available. Please refresh and try again.");
      }

      // Removed comprehensive debug logging to reduce console noise
      console.log("Payment initialization - using CSP-bypass system only");
      
      console.log("🚀 USING CSP-BYPASS PAYMENT SYSTEM - NO SCRIPT LOADING");
      console.log("This will open Paystack checkout in a popup window");
      
      // Use CSP-Bypass payment system instead of enhanced paystack
      await initializeCSPBypassPayment({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: parseFloat(amount) * 100, // Convert to kobo
        currency: 'NGN',
        reference: paystackData.reference,
        callback: (response: any) => {
          console.log("CSP-Bypass payment callback received:", response);
          if (response.status === 'success') {
            setPaymentStep('verifying');
            if (!hasVerifiedRef.current) {
              hasVerifiedRef.current = true;
              verifyPaymentMutation.mutate(response.reference);
            }
          } else {
            setPaymentStep('error');
            setErrorMessage('Payment was not completed successfully');
          }
        },
        onClose: () => {
          console.log("CSP-Bypass payment cancelled or failed");
          document.body.classList.remove('paystack-open');
          if (paymentStep === 'processing') {
            setPaymentStep('amount');
            setErrorMessage('Payment was cancelled');
          }
          setIsProcessing(false);
        }
      });
      
      console.log("Paystack payment initialized successfully");

    } catch (error: any) {
      console.error("Paystack error:", error);
      setPaymentStep('error');
      setErrorMessage(error.message || "Payment initialization failed. Please try again.");
      setIsProcessing(false);
      
      // Show more detailed error in toast for debugging
      toast({
        title: "Payment Failed",
        description: error.message || "Payment system error. Please refresh and try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const depositAmount = parseFloat(amount);
    const validation = validatePaymentAmount(depositAmount);
    
    if (!validation.valid) {
      toast({
        title: "Invalid Amount",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    initializePaymentMutation.mutate(depositAmount);
  };

  const resetModal = () => {
    setPaymentStep('amount');
    setAmount("");
    setErrorMessage("");
    setIsProcessing(false);
    hasVerifiedRef.current = false;
  };

  const getStepIcon = (step: PaymentStep) => {
    switch (step) {
      case 'amount':
        return <CreditCard className="h-6 w-6 text-blue-600" />;
      case 'processing':
        return <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />;
      case 'verifying':
        return <Clock className="h-6 w-6 text-amber-600" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <CreditCard className="h-6 w-6 text-gray-600" />;
    }
  };

  const getStepTitle = (step: PaymentStep) => {
    switch (step) {
      case 'amount':
        return 'Fund Your Wallet';
      case 'processing':
        return 'Processing Payment';
      case 'verifying':
        return 'Verifying Payment';
      case 'success':
        return 'Deposit Successful';
      case 'error':
        return 'Payment Failed';
      default:
        return 'Deposit Funds';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full max-w-[95vw] mx-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            {getStepIcon(paymentStep)}
          </div>
          <DialogTitle className="text-center text-xl font-semibold">
            {getStepTitle(paymentStep)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Removed pending deposit alerts - no restrictions */}

          {/* Progress indicator */}
          <div className="flex justify-center space-x-2">
            {(['amount', 'processing', 'verifying', 'success'] as PaymentStep[]).map((step, index) => (
              <div
                key={step}
                className={`h-2 w-8 rounded-full transition-colors ${
                  paymentStep === step
                    ? 'bg-blue-600'
                    : index < (['amount', 'processing', 'verifying', 'success'] as PaymentStep[]).indexOf(paymentStep)
                    ? 'bg-green-600'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Amount Input Step */}
          {paymentStep === 'amount' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="border-blue-100 bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Secure Payment by Paystack</p>
                      <p className="text-blue-600">Your payment is protected with bank-level security</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount" className="text-base font-medium">
                    Amount to Deposit
                  </Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                      ₦
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="pl-8 text-lg h-12"
                      min="100"
                      max="1000000"
                      step="0.01"
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum: ₦100 • Maximum: ₦1,000,000
                  </p>
                </div>

                {/* Quick amount buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {[1000, 5000, 10000].map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(quickAmount.toString())}
                      className="h-8 text-xs"
                    >
                      ₦{quickAmount.toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Payment methods preview */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Available Payment Options</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-gray-600" />
                      <span>Debit Cards</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-gray-600" />
                      <span>Bank Transfer</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-gray-100 px-1 rounded">USSD</span>
                      <span>USSD Codes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-gray-100 px-1 rounded">QR</span>
                      <span>QR Payment</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={!amount || parseFloat(amount) < 100 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up payment...
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Processing Step */}
          {paymentStep === 'processing' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Redirecting to Payment</h3>
                <p className="text-gray-600">
                  Please complete your payment of ₦{parseFloat(amount || '0').toLocaleString()} securely with Paystack
                </p>
              </div>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Do not close this window. You'll be redirected back automatically after payment.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Verifying Step */}
          {paymentStep === 'verifying' && (
            <div className="space-y-4">
              <PaymentStatusIndicator
                status="verifying"
                amount={amount}
                reference={paymentReference}
                showAnimation={true}
              />
              <div className="text-center space-y-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-2 animate-spin" />
                  <p className="text-blue-800 font-medium">
                    Verifying Payment...
                  </p>
                  <p className="text-blue-600 text-sm">
                    Your balance will be credited automatically in seconds
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Step */}
          {paymentStep === 'success' && (
            <div className="space-y-4">
              <PaymentStatusIndicator
                status="completed"
                amount={amount}
                reference={paymentReference}
                showAnimation={true}
              />
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-green-800 font-bold text-xl mb-2">
                    Payment Successful!
                  </h3>
                  <p className="text-green-700 text-lg font-medium mb-2">
                    ₦{parseFloat(amount || '0').toLocaleString()} 
                  </p>
                  <p className="text-green-600 text-sm mb-4">
                    has been added to your wallet instantly
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-green-700 text-sm font-medium mb-2">
                      Refreshing your wallet...
                    </p>
                    <div className="flex justify-center">
                      <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Step */}
          {paymentStep === 'error' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-16 w-16 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-xl text-red-800">Payment Failed</h3>
                <p className="text-gray-600">{errorMessage}</p>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={resetModal}
                  variant="outline"
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="default"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}