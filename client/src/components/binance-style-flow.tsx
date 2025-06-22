
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  DollarSign, 
  Clock, 
  Shield, 
  CheckCircle, 
  Star,
  ArrowRight,
  CreditCard,
  Timer,
  AlertTriangle,
  Info
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
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
      
      toast({
        title: "Trade Created Successfully!",
        description: `Trade #${data.trade.id} has been created. Redirecting to trade details...`,
      });
      
      // Redirect to trade details
      setTimeout(() => {
        window.open(`/trade/${data.trade.id}`, '_blank');
        onClose();
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Trade",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setProcessing(false);
    },
  });

  const handleCreateTrade = async () => {
    setProcessing(true);
    await createTradeMutation.mutateAsync();
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
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">
          {offer.type === "sell" ? "Buy USDT" : "Sell USDT"}
        </h3>
        <p className="text-gray-600">Enter the amount you want to trade</p>
      </div>

      {/* Trader Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{offer.user.email}</p>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-3 w-3 text-yellow-400 fill-current" />
              <span>{parseFloat(offer.user.averageRating).toFixed(1)}</span>
              <span className="text-gray-500">({offer.user.ratingCount} reviews)</span>
            </div>
          </div>
          <Badge variant="outline">
            {offer.user.completedTrades || 0} trades
          </Badge>
        </div>
      </div>

      {/* Rate Display */}
      <div className="bg-green-50 p-4 rounded-lg text-center">
        <p className="text-sm text-gray-600">Exchange Rate</p>
        <p className="text-2xl font-bold text-green-600">
          ₦{rate.toLocaleString()}/USDT
        </p>
      </div>

      {/* Amount Input */}
      <div className="space-y-3">
        <Label htmlFor="amount">Amount (USDT)</Label>
        <Input
          id="amount"
          type="number"
          placeholder={`${minAmount} - ${maxAmount} USDT`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-lg font-medium"
        />
        
        {/* Quick amounts */}
        <div className="flex gap-2">
          {[0.25, 0.5, 0.75, 1].map((percentage) => {
            const quickAmount = (maxAmount * percentage).toFixed(2);
            return (
              <Button
                key={percentage}
                variant="outline"
                size="sm"
                onClick={() => setAmount(quickAmount)}
                className="flex-1"
              >
                {percentage === 1 ? 'Max' : `${percentage * 100}%`}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Trade Summary */}
      {tradeAmount > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span>You {offer.type === "sell" ? "pay" : "receive"}:</span>
            <span className="font-medium">₦{totalCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>You {offer.type === "sell" ? "receive" : "pay"}:</span>
            <span className="font-medium">{tradeAmount.toFixed(2)} USDT</span>
          </div>
        </div>
      )}

      {validateAmount() && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{validateAmount()}</AlertDescription>
        </Alert>
      )}

      <Button 
        onClick={() => setStep(2)} 
        disabled={!!validateAmount() || !agreedToTerms}
        className="w-full"
        size="lg"
      >
        Continue
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="terms"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-1"
        />
        <label htmlFor="terms" className="text-sm text-gray-600">
          I agree to the terms and conditions and understand the risks involved in P2P trading
        </label>
      </div>
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
              <Timer className="h-3 w-3" />
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Create Trade</span>
            <Badge variant="outline">Step {step} of 2</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <Progress value={(step / 2) * 100} className="w-full" />

        {step === 1 ? renderStep1() : renderStep2()}
      </DialogContent>
    </Dialog>
  );
}
