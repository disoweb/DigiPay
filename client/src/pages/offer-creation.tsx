import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Percent,
  CreditCard,
  Smartphone,
  Building,
  Loader2
} from "lucide-react";

export default function OfferCreation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  const [offerData, setOfferData] = useState({
    type: "sell" as "buy" | "sell",
    amount: "",
    rate: "",
    priceMargin: "",
    minAmount: "",
    maxAmount: "",
    paymentMethod: "",
    terms: "",
    timeLimit: "15",
  });

  const [currentMarketPrice] = useState(1487.50);

  // Track which field was last modified to avoid infinite loops
  const [lastModified, setLastModified] = useState<'rate' | 'margin' | null>(null);

  // Auto-calculate rate from price margin
  useEffect(() => {
    if (lastModified === 'margin' && offerData.priceMargin && offerData.priceMargin !== "") {
      const margin = parseFloat(offerData.priceMargin);
      if (!isNaN(margin)) {
        // For both buy and sell, positive margin = higher rate, negative margin = lower rate
        const newRate = currentMarketPrice * (1 + margin / 100);
        setOfferData(prev => ({ ...prev, rate: newRate.toFixed(2) }));
      }
    }
  }, [offerData.priceMargin, offerData.type, currentMarketPrice, lastModified]);

  // Auto-calculate price margin from rate
  useEffect(() => {
    if (lastModified === 'rate' && offerData.rate && offerData.rate !== "") {
      const rate = parseFloat(offerData.rate);
      if (!isNaN(rate)) {
        const margin = ((rate - currentMarketPrice) / currentMarketPrice) * 100;
        setOfferData(prev => ({ ...prev, priceMargin: margin.toFixed(2) }));
      }
    }
  }, [offerData.rate, currentMarketPrice, lastModified]);

  const createOfferMutation = useMutation({
    mutationFn: async (data: typeof offerData) => {
      await apiRequest("POST", "/api/offers", {
        type: data.type,
        amount: parseFloat(data.amount),
        rate: parseFloat(data.rate),
        minAmount: data.minAmount ? parseFloat(data.minAmount) : parseFloat(data.amount),
        maxAmount: data.maxAmount ? parseFloat(data.maxAmount) : parseFloat(data.amount),
        terms: data.terms,
        paymentMethod: data.paymentMethod,
        timeLimit: parseInt(data.timeLimit)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your trading offer has been published successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      setLocation("/marketplace");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create offer",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOfferMutation.mutate(offerData);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTypeChange = (value: "buy" | "sell") => {
    setLastModified(null);
    setOfferData(prev => ({ 
      ...prev, 
      type: value,
      rate: "",
      priceMargin: ""
    }));
  };

  const handleAmountPercentage = (percentage: number) => {
    if (!user) return;
    
    const balance = offerData.type === "sell" 
      ? parseFloat(user.usdtBalance || "0")
      : parseFloat(user.nairaBalance || "0") / currentMarketPrice;
    
    const amount = balance * (percentage / 100);
    setOfferData(prev => ({ ...prev, amount: amount.toFixed(8) }));
  };

  const handleRateChange = (value: string) => {
    setLastModified('rate');
    setOfferData(prev => ({ ...prev, rate: value }));
  };

  const handleMarginChange = (value: string) => {
    setLastModified('margin');
    setOfferData(prev => ({ ...prev, priceMargin: value }));
  };

  const getAvailableBalance = () => {
    if (!user) return "0";
    return offerData.type === "sell" 
      ? parseFloat(user.usdtBalance || "0").toFixed(8)
      : parseFloat(user.nairaBalance || "0").toLocaleString();
  };

  const getBalanceLabel = () => {
    return offerData.type === "sell" ? "USDT" : "NGN";
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return offerData.type && offerData.amount;
      case 2:
        return offerData.rate;
      case 3:
        return offerData.paymentMethod;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return <Building className="h-4 w-4" />;
      case "mobile_money":
        return <Smartphone className="h-4 w-4" />;
      case "card_payment":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Offer Type</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button
                    type="button"
                    variant={offerData.type === "buy" ? "default" : "outline"}
                    onClick={() => handleTypeChange("buy")}
                    className={`h-16 flex flex-col items-center justify-center space-y-1 ${
                      offerData.type === "buy" ? "bg-green-600 hover:bg-green-700" : ""
                    }`}
                  >
                    <TrendingUp className="h-5 w-5" />
                    <span>Buy USDT</span>
                  </Button>
                  <Button
                    type="button"
                    variant={offerData.type === "sell" ? "default" : "outline"}
                    onClick={() => handleTypeChange("sell")}
                    className={`h-16 flex flex-col items-center justify-center space-y-1 ${
                      offerData.type === "sell" ? "bg-red-600 hover:bg-red-700" : ""
                    }`}
                  >
                    <TrendingDown className="h-5 w-5" />
                    <span>Sell USDT</span>
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-medium">Amount (USDT)</Label>
                  <Badge variant="outline" className="text-xs">
                    <Wallet className="h-3 w-3 mr-1" />
                    {getAvailableBalance()} {getBalanceLabel()}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <Input
                    type="number"
                    step="0.00000001"
                    placeholder="Enter amount"
                    value={offerData.amount}
                    onChange={(e) => setOfferData(prev => ({ ...prev, amount: e.target.value }))}
                    className="text-lg h-12"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAmountPercentage(10)}
                      className="flex-1"
                    >
                      10%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAmountPercentage(25)}
                      className="flex-1"
                    >
                      25%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAmountPercentage(50)}
                      className="flex-1"
                    >
                      50%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAmountPercentage(100)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    >
                      MAX
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-medium">Set Your Price</span>
              </div>
              <p className="text-sm text-gray-600">
                Market Price: ₦{currentMarketPrice.toLocaleString()}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Price Margin (%)</Label>
                <div className="relative mt-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 2.5 for 2.5% above market"
                    value={offerData.priceMargin}
                    onChange={(e) => handleMarginChange(e.target.value)}
                    className="text-lg h-12 pr-12"
                  />
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Positive % = above market price, Negative % = below market price
                </p>
              </div>

              <div className="text-center text-gray-500">OR</div>

              <div>
                <Label className="text-base font-medium">Fixed Rate (₦)</Label>
                <div className="relative mt-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter your rate per USDT"
                    value={offerData.rate}
                    onChange={(e) => handleRateChange(e.target.value)}
                    className="text-lg h-12"
                  />
                </div>
              </div>

              {offerData.rate && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Your Rate</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ₦{parseFloat(offerData.rate || "0").toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {parseFloat(offerData.priceMargin || "0") > 0 ? "+" : ""}{parseFloat(offerData.priceMargin || "0").toFixed(2)}% vs market
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Payment Method</Label>
              <Select value={offerData.paymentMethod} onValueChange={(value) => setOfferData(prev => ({ ...prev, paymentMethod: value }))}>
                <SelectTrigger className="mt-2 h-12">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon("bank_transfer")}
                      <span>Bank Transfer</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="mobile_money">
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon("mobile_money")}
                      <span>Mobile Money</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="digital_wallet">
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon("digital_wallet")}
                      <span>Digital Wallet</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="card_payment">
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon("card_payment")}
                      <span>Card Payment</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Min Amount (USDT)</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  placeholder="Min"
                  value={offerData.minAmount}
                  onChange={(e) => setOfferData(prev => ({ ...prev, minAmount: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Max Amount (USDT)</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  placeholder="Max"
                  value={offerData.maxAmount}
                  onChange={(e) => setOfferData(prev => ({ ...prev, maxAmount: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Payment Time Limit</Label>
              <Select value={offerData.timeLimit} onValueChange={(value) => setOfferData(prev => ({ ...prev, timeLimit: value }))}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select time limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Trading Terms (Optional)</Label>
              <Textarea
                placeholder="Add any special requirements or terms..."
                value={offerData.terms}
                onChange={(e) => setOfferData(prev => ({ ...prev, terms: e.target.value }))}
                className="mt-2 min-h-24"
              />
            </div>

            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <CheckCircle className="h-5 w-5" />
                  Offer Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <Badge variant={offerData.type === "buy" ? "default" : "destructive"}>
                    {offerData.type === "buy" ? "Buy USDT" : "Sell USDT"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{parseFloat(offerData.amount || "0").toFixed(8)} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate:</span>
                  <span className="font-medium">₦{parseFloat(offerData.rate || "0").toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment:</span>
                  <span className="font-medium capitalize">{offerData.paymentMethod.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Limit:</span>
                  <span className="font-medium">{offerData.timeLimit} minutes</span>
                </div>
                {offerData.terms && (
                  <div>
                    <span className="text-gray-600">Terms:</span>
                    <p className="text-sm mt-1 p-2 bg-gray-100 rounded">{offerData.terms}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-center mb-2">Create Trading Offer</h1>
          <p className="text-gray-600 text-center">
            Step {currentStep} of {totalSteps}: {
              currentStep === 1 ? "Choose type and amount" :
              currentStep === 2 ? "Set your price" :
              currentStep === 3 ? "Payment details" :
              "Review and confirm"
            }
          </p>
          <div className="mt-4">
            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit}>
              {renderStep()}

              <div className="flex justify-between pt-6 mt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={createOfferMutation.isPending}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {createOfferMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create Offer
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}