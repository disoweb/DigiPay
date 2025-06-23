
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
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
  Wallet,
  ArrowRight,
  TrendingUp,
  TrendingDown,
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
  const [step, setStep] = useState(1);

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
      setStep(1);
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
        newErrors.push(`Insufficient USDT balance. Need ${tradeAmount.toFixed(2)} USDT, have ${userUsdtBalance.toFixed(2)} USDT`);
      }
    }

    // Check KYC requirement
    if (offer.requiresVerification && !user?.kycVerified) {
      newErrors.push("This offer requires KYC verification");
    }

    return newErrors;
  };

  const handleContinue = () => {
    const validationErrors = validateTrade();
    setErrors(validationErrors);

    if (validationErrors.length === 0) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    try {
      await onSubmit(amount);
      // Success handled by parent component
    } catch (error: any) {
      setErrors([error.message || "Failed to create trade. Please try again."]);
    }
  };

  const getPaymentMethodIcon = () => {
    const IconComponent = paymentMethodIcons[offer.paymentMethod as keyof typeof paymentMethodIcons] || Wallet;
    return <IconComponent className="h-4 w-4" />;
  };

  const getTradeTypeIcon = () => {
    return offer.type === "sell" ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {getTradeTypeIcon()}
              {offer.type === "sell" ? "Buy USDT" : "Sell USDT"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-blue-100 text-sm mt-1">
            Trade with {offer.user.email.split('@')[0]}***
          </p>
        </div>

        <div className="p-4 space-y-4">
          {step === 1 ? (
            <>
              {/* Trader Info Card */}
              <Card className="border-0 bg-gray-50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{offer.user.email}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span>{!isNaN(parseFloat(offer.user.averageRating)) ? parseFloat(offer.user.averageRating).toFixed(1) : '0.0'}</span>
                          <span>({offer.user.ratingCount || 0})</span>
                        </div>
                        <span>•</span>
                        <span>{offer.user.completedTrades || 0} trades</span>
                        {offer.user.kycVerified && (
                          <>
                            <span>•</span>
                            <Shield className="h-3 w-3 text-green-500" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Offer Details */}
              <Card className="border-0 bg-blue-50">
                <CardContent className="p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 text-xs">Rate</p>
                      <p className="font-bold text-lg text-blue-600">₦{rate.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Available</p>
                      <p className="font-medium">{availableAmount.toFixed(2)} USDT</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Limits</p>
                      <p className="font-medium text-xs">{minAmount.toFixed(2)} - {maxAmount.toFixed(2)} USDT</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Payment</p>
                      <div className="flex items-center gap-1">
                        {getPaymentMethodIcon()}
                        <span className="font-medium text-xs">
                          {paymentMethodLabels[offer.paymentMethod as keyof typeof paymentMethodLabels]}
                        </span>
                      </div>
                    </div>
                  </div>
                  {offer.timeLimit && (
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <Clock className="h-3 w-3" />
                      <span>{offer.timeLimit} min payment window</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Amount Input */}
              <div className="space-y-3">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Amount to {offer.type === "sell" ? "Buy" : "Sell"} (USDT)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder={`${minAmount} - ${maxAmount}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={minAmount}
                  max={maxAmount}
                  step="0.01"
                  className="text-center text-lg font-medium"
                />

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "25%", value: maxAmount * 0.25 },
                    { label: "50%", value: maxAmount * 0.5 },
                    { label: "75%", value: maxAmount * 0.75 },
                    { label: "Max", value: maxAmount }
                  ].map((btn) => (
                    <Button
                      key={btn.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(btn.value.toFixed(2))}
                      className="text-xs"
                    >
                      {btn.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Trade Preview */}
              {tradeAmount > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {offer.type === "sell" ? "You pay:" : "You receive:"}
                        </span>
                        <span className="font-bold text-green-600">₦{totalCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {offer.type === "sell" ? "You receive:" : "You pay:"}
                        </span>
                        <span className="font-bold text-green-600">{tradeAmount.toFixed(2)} USDT</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Your Balances */}
              {user && (
                <Card className="border-0 bg-gray-50">
                  <CardContent className="p-3">
                    <p className="text-xs text-gray-600 mb-2">Your Balances</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs">USDT</p>
                        <p className="font-medium">{!isNaN(parseFloat(user.usdtBalance || "0")) ? parseFloat(user.usdtBalance || "0").toFixed(2) : '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Naira</p>
                        <p className="font-medium">₦{!isNaN(parseFloat(user.nairaBalance || "0")) ? parseFloat(user.nairaBalance || "0").toLocaleString() : '0'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Terms */}
              {offer.terms && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">{offer.terms}</AlertDescription>
                </Alert>
              )}

              {/* Errors */}
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleContinue} 
                  disabled={!amount || errors.length > 0}
                  className="flex-1"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Confirmation */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Confirm Trade</h3>
                  <p className="text-sm text-gray-600">Please review your trade details</p>
                </div>
              </div>

              {/* Trade Summary */}
              <Card className="border-0 bg-gradient-to-r from-green-50 to-blue-50">
                <CardContent className="p-4 space-y-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{tradeAmount.toFixed(2)} USDT</p>
                    <p className="text-sm text-gray-600">for ₦{totalCost.toLocaleString()}</p>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Rate:</span>
                      <span className="font-medium">₦{rate.toLocaleString()}/USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="font-medium">{paymentMethodLabels[offer.paymentMethod as keyof typeof paymentMethodLabels]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trading Partner:</span>
                      <span className="font-medium">{offer.user.email.split('@')[0]}***</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Escrow Protection:</strong> Your funds will be securely held until trade completion.
                </AlertDescription>
              </Alert>

              {/* Final Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
