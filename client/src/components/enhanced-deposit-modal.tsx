import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PAYSTACK_PUBLIC_KEY, validatePaymentAmount } from "@/lib/enhanced-paystack";
import { initializeCSPBypassPayment } from "@/lib/csp-bypass-payment";
import { CreditCard, Shield, CheckCircle, Loader2, Smartphone, ArrowRight } from "lucide-react";

interface EnhancedDepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

type PaymentStep = 'input' | 'paying' | 'success';

export function EnhancedDepositModal({ open, onOpenChange, user }: EnhancedDepositModalProps) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<PaymentStep>('input');
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const processingRef = useRef(false);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStep('input');
      setAmount("");
      setIsLoading(false);
      processingRef.current = false;
    }
  }, [open]);

  // Payment mutation - handles both initialization and verification
  const paymentMutation = useMutation({
    mutationFn: async (depositAmount: number) => {
      if (processingRef.current) return;
      processingRef.current = true;

      // Initialize payment
      const initRes = await apiRequest("POST", "/api/payments/initialize", { 
        amount: depositAmount,
        email: user.email,
        metadata: { source: 'wallet_deposit' }
      });

      if (!initRes.ok) {
        const errorData = await initRes.json();
        throw new Error(errorData.message || 'Payment setup failed');
      }

      const initData = await initRes.json();
      if (!initData.success || !initData.data?.authorization_url) {
        throw new Error('Invalid payment response');
      }

      // Open payment window
      return new Promise((resolve, reject) => {
        initializeCSPBypassPayment({
          key: PAYSTACK_PUBLIC_KEY,
          email: user.email,
          amount: depositAmount * 100,
          currency: 'NGN',
          reference: initData.data.reference,
          callback: async (response: any) => {
            if (response.status === 'success') {
              try {
                // Verify payment immediately
                const verifyRes = await apiRequest("POST", "/api/payments/verify", { 
                  reference: response.reference 
                });
                const verifyData = await verifyRes.json();

                if (verifyData.success) {
                  resolve(verifyData);
                } else {
                  reject(new Error('Payment verification failed'));
                }
              } catch (error) {
                reject(error);
              }
            } else {
              reject(new Error('Payment cancelled'));
            }
          },
          onClose: () => {
            processingRef.current = false;
            if (step === 'paying') {
              setStep('input');
              setIsLoading(false);
            }
          }
        });
      });
    },
    onSuccess: () => {
      // Immediate state transition
      setStep('success');
      setIsLoading(false);

      // Refresh balance immediately
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });

      toast({
        title: "Success!",
        description: `₦${parseFloat(amount).toLocaleString()} added to your wallet`,
        className: "border-green-200 bg-green-50 text-green-800",
      });

      // Auto-close after 2.5 seconds to show success state
      setTimeout(() => {
        onOpenChange(false);
      }, 2500);
    },
    onError: (error: any) => {
      processingRef.current = false;
      setStep('input');
      setIsLoading(false);

      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

    setStep('paying');
    setIsLoading(true);
    paymentMutation.mutate(depositAmount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full max-w-[95vw] mx-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-center">
            {step === 'input' && <CreditCard className="h-8 w-8 text-blue-600" />}
            {step === 'paying' && <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />}
            {step === 'success' && <CheckCircle className="h-8 w-8 text-green-600" />}
          </div>
          <DialogTitle className="text-center text-xl font-semibold">
            {step === 'input' && 'Add Money'}
            {step === 'paying' && 'Complete Payment'}
            {step === 'success' && 'Success!'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Step */}
          {step === 'input' && (
            <>
              <Card className="border-blue-100 bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Secure Payment by Paystack</p>
                      <p className="text-blue-600">Bank-level security guaranteed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="amount" className="text-base font-medium">
                    Amount
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
                    Min: ₦100 • Max: ₦1,000,000
                  </p>
                </div>

                {/* Quick amounts */}
                <div className="grid grid-cols-3 gap-2">
                  {[1000, 5000, 10000].map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(quickAmount.toString())}
                      className="h-10"
                    >
                      ₦{quickAmount.toLocaleString()}
                    </Button>
                  ))}
                </div>

                {/* Payment methods preview */}
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">Payment Options</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                        <span>Cards</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4 text-gray-600" />
                        <span>Transfer</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs px-1">USSD</Badge>
                        <span>*737#</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs px-1">QR</Badge>
                        <span>Scan</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium"
                  disabled={!amount || parseFloat(amount) < 100 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Paying Step */}
          {step === 'paying' && (
            <div className="text-center space-y-4 py-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <h3 className="text-blue-800 font-bold text-lg mb-2">
                  Complete Payment
                </h3>
                <p className="text-blue-700 text-base mb-2">
                  ₦{parseFloat(amount || '0').toLocaleString()}
                </p>
                <p className="text-blue-600 text-sm">
                  Secure payment window opened
                </p>
              </div>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Complete your payment in the secure Paystack window. Do not close this dialog.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center space-y-4 py-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4 animate-bounce" />
                <h3 className="text-green-800 font-bold text-xl mb-2">
                  Payment Successful!
                </h3>
                <p className="text-green-700 text-lg font-medium mb-2">
                  ₦{parseFloat(amount || '0').toLocaleString()}
                </p>
                <p className="text-green-600 text-sm">
                  Added to your wallet instantly
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}