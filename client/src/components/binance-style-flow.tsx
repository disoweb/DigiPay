import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Shield, 
  Clock, 
  DollarSign, 
  CheckCircle,
  AlertCircle,
  Info,
  Copy,
  Upload,
  Star,
  Users,
  Wallet,
  CreditCard,
  Building,
  Smartphone,
  X
} from "lucide-react";

interface Offer {
  id: number;
  userId: number;
  amount: string;
  rate: string;
  type: string;
  paymentMethod: string;
  terms?: string;
  minAmount?: string;
  maxAmount?: string;
  timeLimit?: number;
  user: {
    id: number;
    email: string;
    averageRating: string;
    ratingCount: number;
    completedTrades?: number;
  };
}

interface BinanceStyleFlowProps {
  isOpen: boolean;
  onClose: () => void;
  offer: Offer;
}

export function BinanceStyleFlow({ isOpen, onClose, offer }: BinanceStyleFlowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [processing, setProcessing] = useState(false);

  const minAmount = parseFloat(offer.minAmount || offer.amount) || 0;
  const maxAmount = parseFloat(offer.maxAmount || offer.amount) || 0;
  const rate = parseFloat(offer.rate) || 0;
  const tradeAmount = parseFloat(amount) || 0;
  const totalCost = tradeAmount * rate;

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAmount("");
      setAgreedToTerms(false);
      setProcessing(false);
    }
  }, [isOpen]);

  const createTradeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/trades", {
        offerId: offer.id,
        amount: amount,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Trade failed' }));
        throw new Error(errorData.error || 'Failed to create trade');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });

      toast({
        title: "Trade Created Successfully!",
        description: `Trade #${data.trade?.id || 'N/A'} has been created successfully!`,
      });

      // Close modal and let user navigate to trades page
      onClose();
      
      // Optional: Navigate to trades page
      setTimeout(() => {
        window.location.href = '/trades';
      }, 1000);
    },
    onError: (error: any) => {
      setProcessing(false);
      toast({
        title: "Failed to Create Trade",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTrade = async () => {
    const validationError = validateAmount();
    if (validationError) {
      toast({
        title: "Invalid Amount",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      await createTradeMutation.mutateAsync();
    } catch (error) {
      // Error handling is done in the mutation
      setProcessing(false);
    }
  };

  const validateAmount = () => {
    if (!amount || tradeAmount <= 0) return "Please enter a valid amount";
    if (tradeAmount < minAmount) return `Minimum amount is ${minAmount.toFixed(2)} USDT`;
    if (tradeAmount > maxAmount) return `Maximum amount is ${maxAmount.toFixed(2)} USDT`;

    // Check user balance
    if (offer.type === "sell" && user) {
      const userNairaBalance = parseFloat(user.nairaBalance || "0");
      if (totalCost > userNairaBalance) {
        return `Insufficient balance. Need ₦${totalCost.toLocaleString()}`;
      }
    } else if (offer.type === "buy" && user) {
      const userUsdtBalance = parseFloat(user.usdtBalance || "0");
      if (tradeAmount > userUsdtBalance) {
        return `Insufficient USDT. Need ${tradeAmount.toFixed(2)} USDT`;
      }
    }

    return null;
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      {/* Trader Info - Mobile Optimized */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Trading with {offer.user?.email}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{offer.user?.email}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span>{parseFloat(offer.user?.averageRating || "0").toFixed(1)}</span>
                    <span>({offer.user?.ratingCount || 0})</span>
                  </div>
                  <span>•</span>
                  <span>{offer.user?.completedTrades || 0} trades</span>
                </div>
              </div>
            </div>
            {offer.user?.kycVerified && (
              <Badge variant="outline" className="text-green-600 border-green-600 w-fit">
                <Shield className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trade Details - Mobile Grid */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Trade Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <Label className="text-xs text-gray-600">Price</Label>
              <p className="font-semibold text-lg text-green-600">₦{parseFloat(offer.rate).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <Label className="text-xs text-gray-600">Available</Label>
              <p className="font-semibold text-lg">{parseFloat(offer.amount).toFixed(2)} USDT</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-600">Payment Method</Label>
              <div className="flex items-center gap-2">
                {getPaymentMethodIcon(offer.paymentMethod)}
                <span className="font-medium text-sm">{getPaymentMethodLabel(offer.paymentMethod)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-600">Time Limit</Label>
              <p className="font-semibold text-sm">{offer.timeLimit || 30} minutes</p>
            </div>
          </div>

          {offer.terms && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-blue-900 text-sm">Trading Terms</p>
                  <p className="text-blue-700 text-sm mt-1 leading-relaxed">{offer.terms}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amount Input - Mobile Optimized */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Enter Amount</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount" className="text-sm">Amount (USDT)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={offer.minAmount || "0"}
                max={offer.maxAmount || offer.amount}
                className="h-12 text-base text-center"
                inputMode="decimal"
              />
              <p className="text-xs text-gray-600 mt-2 text-center">
                Limits: {offer.minAmount ? parseFloat(offer.minAmount).toFixed(2) : '0'} - {offer.maxAmount ? parseFloat(offer.maxAmount).toFixed(2) : parseFloat(offer.amount).toFixed(2)} USDT
              </p>
            </div>

            {amount && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">
                    You will {offer.type === 'sell' ? 'pay' : 'receive'}:
                  </p>
                  <p className="font-bold text-xl text-green-700">
                    ₦{(parseFloat(amount) * parseFloat(offer.rate)).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            <Button 
              onClick={handleCreateTrade} 
              className="w-full h-12 text-base font-medium" 
              disabled={!amount || parseFloat(amount) <= 0 || processing}
            >
              {processing ? 'Creating Trade...' : `Confirm ${offer.type === 'sell' ? 'Buy' : 'Sell'} Order`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Confirm Trade Details</h3>
        <p className="text-gray-600">Please review your trade before confirming</p>
      </div>

      {/* Trade Summary */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Trading with:</span>
          <span className="font-medium">{offer.user.email}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Amount:</span>
          <span className="font-medium">{tradeAmount.toFixed(2)} USDT</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Rate:</span>
          <span className="font-medium">₦{rate.toLocaleString()}/USDT</span>
        </div>
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Total:</span>
          <span>₦{totalCost.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Payment Method:</span>
          <span className="font-medium capitalize">{offer.paymentMethod.replace('_', ' ')}</span>
        </div>
        {offer.timeLimit && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Payment Window:</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="font-medium">{offer.timeLimit} minutes</span>
            </div>
          </div>
        )}
      </div>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your funds will be secured in escrow until the trade is completed. 
          Follow the payment instructions carefully.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setStep(1)}
          className="flex-1"
        >
          Back
        </Button>
        <Button 
          onClick={handleCreateTrade}
          disabled={processing}
          className="flex-1"
          size="lg"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Creating Trade...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Trade
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0 gap-0 rounded-lg md:rounded-lg">
        {/* Mobile-Friendly Header */}
        <DialogHeader className="px-4 py-3 border-b bg-white sticky top-0 z-10 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step > 1 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(step - 1)}
                  className="p-2 h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  {offer.type === 'sell' ? 'Buy' : 'Sell'} USDT
                  <Badge 
                    variant={offer.type === 'sell' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {offer.type === 'sell' ? 'Buy' : 'Sell'}
                  </Badge>
                </DialogTitle>
                <p className="text-sm text-gray-600">
                  Step {step} of 4
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(95vh-80px)]">
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions for icons and labels
function getPaymentMethodIcon(method: string) {
  switch (method) {
    case "bank_transfer":
      return <Building className="h-4 w-4" />;
    case "mobile_money":
      return <Smartphone className="h-4 w-4" />;
    case "credit_card":
      return <CreditCard className="h-4 w-4" />;
    case "wallet":
      return <Wallet className="h-4 w-4" />;
    default:
      return <CreditCard className="h-4 w-4" />;
  }
}

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case "bank_transfer":
      return "Bank Transfer";
    case "mobile_money":
      return "Mobile Money";
    case "credit_card":
      return "Credit Card";
    case "wallet":
      return "Wallet";
    default:
      return "Unknown";
  }
}