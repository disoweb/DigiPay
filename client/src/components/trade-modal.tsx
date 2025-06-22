
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { 
  DollarSign, 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Star,
  User,
  CreditCard,
  Building,
  Smartphone,
  Wallet
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
  requiresVerification?: boolean;
  user: {
    id: number;
    email: string;
    averageRating: string;
    ratingCount: number;
    kycVerified?: boolean;
    completedTrades?: number;
  };
}

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: Offer;
  onSubmit: (amount: string) => void;
  isLoading: boolean;
}

const paymentMethodIcons = {
  bank_transfer: Building,
  mobile_money: Smartphone,
  digital_wallet: Wallet,
  card_payment: CreditCard,
};

const paymentMethodLabels = {
  bank_transfer: "Bank Transfer",
  mobile_money: "Mobile Money",
  digital_wallet: "Digital Wallet",
  card_payment: "Card Payment",
};

export function TradeModal({ isOpen, onClose, offer, onSubmit, isLoading }: TradeModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const minAmount = !isNaN(parseFloat(offer.minAmount || offer.amount)) ? parseFloat(offer.minAmount || offer.amount) : 0;
  const maxAmount = !isNaN(parseFloat(offer.maxAmount || offer.amount)) ? parseFloat(offer.maxAmount || offer.amount) : 0;
  const availableAmount = !isNaN(parseFloat(offer.amount)) ? parseFloat(offer.amount) : 0;
  const rate = !isNaN(parseFloat(offer.rate)) ? parseFloat(offer.rate) : 0;

  const tradeAmount = !isNaN(parseFloat(amount)) ? parseFloat(amount) : 0;
  const totalCost = tradeAmount * rate;

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setErrors([]);
    }
  }, [isOpen]);

  const validateTrade = (): string[] => {
    const newErrors: string[] = [];

    if (!amount || tradeAmount <= 0) {
      newErrors.push("Please enter a valid amount");
    }

    if (tradeAmount < minAmount) {
      newErrors.push(`Minimum amount is ${minAmount.toFixed(2)} USDT`);
    }

    if (tradeAmount > maxAmount) {
      newErrors.push(`Maximum amount is ${maxAmount.toFixed(2)} USDT`);
    }

    if (tradeAmount > availableAmount) {
      newErrors.push(`Only ${availableAmount.toFixed(2)} USDT available`);
    }

    // Check user balances
    if (offer.type === "sell" && user) {
      // User is buying USDT, needs enough Naira
      const userNairaBalance = !isNaN(parseFloat(user.nairaBalance || "0")) ? parseFloat(user.nairaBalance || "0") : 0;
      if (totalCost > userNairaBalance) {
        newErrors.push(`Insufficient Naira balance. Need ₦${totalCost.toLocaleString()}, have ₦${userNairaBalance.toLocaleString()}`);
      }
    } else if (offer.type === "buy" && user) {
      // User is selling USDT, needs enough USDT
      const userUsdtBalance = !isNaN(parseFloat(user.usdtBalance || "0")) ? parseFloat(user.usdtBalance || "0") : 0;
      if (tradeAmount > userUsdtBalance) {
        newErrors.push(`Insufficient USDT balance. Need ${tradeAmount.toFixed(2)} USDT, have ${userUsdtBalance.toFixed(8)} USDT`);
      }
    }

    // Check KYC requirement
    if (offer.requiresVerification && !user?.kycVerified) {
      newErrors.push("This offer requires KYC verification");
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateTrade();
    setErrors(validationErrors);

    if (validationErrors.length === 0) {
      try {
        await onSubmit(amount);
        // Success handled by parent component
      } catch (error: any) {
        setErrors([error.message || "Failed to create trade. Please try again."]);
      }
    }
  };

  const getPaymentMethodIcon = () => {
    const IconComponent = paymentMethodIcons[offer.paymentMethod as keyof typeof paymentMethodIcons] || Wallet;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {offer.type === "sell" ? (
              <>
                <DollarSign className="h-5 w-5 text-green-600" />
                Buy USDT
              </>
            ) : (
              <>
                <DollarSign className="h-5 w-5 text-red-600" />
                Sell USDT
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trader Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Trading Partner
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="font-medium">{offer.user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rating:</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">
                    {!isNaN(parseFloat(offer.user.averageRating)) ? parseFloat(offer.user.averageRating).toFixed(1) : '0.0'} ({offer.user.ratingCount || 0} reviews)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed Trades:</span>
                <span className="font-medium">{offer.user.completedTrades || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Verification:</span>
                {offer.user.kycVerified ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600 border-gray-600">
                    Not Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Offer Details */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Offer Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-medium capitalize">{offer.type === "sell" ? "Sell USDT (You Buy)" : "Buy USDT (You Sell)"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rate</p>
                <p className="font-medium text-lg">₦{rate.toLocaleString()}/USDT</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Amount</p>
                <p className="font-medium">{availableAmount.toFixed(2)} USDT</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <div className="flex items-center gap-1">
                  {getPaymentMethodIcon()}
                  <span className="font-medium text-sm">
                    {paymentMethodLabels[offer.paymentMethod as keyof typeof paymentMethodLabels]}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Trade Limits</p>
                <p className="font-medium">
                  {minAmount.toFixed(2)} - {maxAmount.toFixed(2)} USDT
                </p>
              </div>
              {offer.timeLimit && (
                <div>
                  <p className="text-sm text-gray-600">Payment Window</p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">{offer.timeLimit} minutes</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Terms and Conditions */}
          {offer.terms && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Terms & Conditions
              </h4>
              <p className="text-sm text-gray-700">{offer.terms}</p>
            </div>
          )}

          {/* Trade Amount Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">
                Amount to {offer.type === "sell" ? "Buy" : "Sell"} (USDT)
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder={`Min: ${minAmount}, Max: ${maxAmount}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={minAmount}
                max={maxAmount}
                step="0.01"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Min: {minAmount.toFixed(2)} USDT</span>
                <span>Max: {maxAmount.toFixed(2)} USDT</span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(minAmount.toString())}
              >
                Min
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((maxAmount * 0.25).toFixed(2))}
              >
                25%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((maxAmount * 0.5).toFixed(2))}
              >
                50%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((maxAmount * 0.75).toFixed(2))}
              >
                75%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(maxAmount.toString())}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Trade Summary */}
          {tradeAmount > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Trade Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {offer.type === "sell" ? "You pay:" : "You receive:"}
                  </span>
                  <span className="font-medium">₦{totalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {offer.type === "sell" ? "You receive:" : "You pay:"}
                  </span>
                  <span className="font-medium">{tradeAmount.toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Exchange Rate:</span>
                  <span className="font-medium">₦{rate.toLocaleString()}/USDT</span>
                </div>
              </div>
            </div>
          )}

          {/* Your Balances */}
          {user && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Your Balances</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">USDT Balance</p>
                  <p className="font-medium">
                    {!isNaN(parseFloat(user.usdtBalance || "0")) ? parseFloat(user.usdtBalance || "0").toFixed(8) : '0.00000000'} USDT
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Naira Balance</p>
                  <p className="font-medium">
                    ₦{!isNaN(parseFloat(user.nairaBalance || "0")) ? parseFloat(user.nairaBalance || "0").toLocaleString() : '0'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Notice:</strong> Your funds will be held in escrow until the trade is completed. 
              Always verify payment details before confirming any transaction.
            </AlertDescription>
          </Alert>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || errors.length > 0 || !amount}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
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
      </DialogContent>
    </Dialog>
  );
}
