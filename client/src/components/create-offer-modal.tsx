import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Loader2, 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Percent,
  CreditCard,
  Smartphone,
  Building
} from "lucide-react";

interface CreateOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOfferModal({ open, onOpenChange }: CreateOfferModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    type: "sell" as "buy" | "sell",
    amount: "",
    rate: "",
    priceMargin: "",
    minAmount: "",
    maxAmount: "",
    terms: "",
    paymentMethod: "",
    timeLimit: "15",
  });

  const [currentMarketPrice] = useState(1487.5);

  // Auto-calculate rate from price margin
  useEffect(() => {
    if (formData.priceMargin && formData.priceMargin !== "") {
      const margin = parseFloat(formData.priceMargin);
      if (!isNaN(margin)) {
        const newRate = formData.type === "sell" 
          ? currentMarketPrice * (1 + margin / 100)
          : currentMarketPrice * (1 - margin / 100);
        setFormData(prev => ({ ...prev, rate: newRate.toFixed(2) }));
      }
    }
  }, [formData.priceMargin, formData.type, currentMarketPrice]);

  // Auto-calculate price margin from rate
  useEffect(() => {
    if (formData.rate && formData.rate !== "" && formData.priceMargin === "") {
      const rate = parseFloat(formData.rate);
      if (!isNaN(rate) && rate !== currentMarketPrice) {
        const margin = ((rate - currentMarketPrice) / currentMarketPrice) * 100;
        setFormData(prev => ({ ...prev, priceMargin: margin.toFixed(2) }));
      }
    }
  }, [formData.rate, currentMarketPrice, formData.priceMargin]);

  const createOfferMutation = useMutation({
    mutationFn: async (data: any) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({
        title: "Success",
        description: "Offer created successfully!",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create offer",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      type: "sell" as "buy" | "sell",
      amount: "",
      rate: "",
      priceMargin: "",
      minAmount: "",
      maxAmount: "",
      terms: "",
      paymentMethod: "",
      timeLimit: "15",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.rate || !formData.paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createOfferMutation.mutate(formData);
  };

  const handleTypeChange = (value: "buy" | "sell") => {
    setFormData(prev => ({ 
      ...prev, 
      type: value,
      rate: "",
      priceMargin: ""
    }));
  };

  const handleAmountPercentage = (percentage: number) => {
    if (!user) return;
    
    const balance = formData.type === "sell" 
      ? parseFloat(user.usdtBalance || "0")
      : parseFloat(user.nairaBalance || "0") / currentMarketPrice;
    
    const amount = balance * (percentage / 100);
    setFormData(prev => ({ ...prev, amount: amount.toFixed(8) }));
  };

  const handleRateChange = (value: string) => {
    setFormData(prev => ({ ...prev, rate: value, priceMargin: "" }));
  };

  const handleMarginChange = (value: string) => {
    setFormData(prev => ({ ...prev, priceMargin: value, rate: "" }));
  };

  const getAvailableBalance = () => {
    if (!user) return "0";
    return formData.type === "sell" 
      ? parseFloat(user.usdtBalance || "0").toFixed(8)
      : parseFloat(user.nairaBalance || "0").toLocaleString();
  };

  const getBalanceLabel = () => {
    return formData.type === "sell" ? "USDT" : "NGN";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-y-auto p-0">
        <div className="p-6 space-y-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-center">Create Trading Offer</DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Set up your advertisement to start trading
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Offer Type Section */}
            <Card className="p-6 bg-gray-50">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Offer Type</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={formData.type === "sell" ? "default" : "outline"}
                    onClick={() => handleTypeChange("sell")}
                    className={`h-16 flex flex-col items-center justify-center space-y-2 text-base font-medium ${
                      formData.type === "sell" 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <TrendingDown className="h-6 w-6" />
                    <span>Sell USDT</span>
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === "buy" ? "default" : "outline"}
                    onClick={() => handleTypeChange("buy")}
                    className={`h-16 flex flex-col items-center justify-center space-y-2 text-base font-medium ${
                      formData.type === "buy" 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <TrendingUp className="h-6 w-6" />
                    <span>Buy USDT</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Amount & Pricing Section */}
            <Card className="p-6 bg-gray-50">
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <h3 className="text-xl font-semibold">Amount & Pricing</h3>
                </div>
                
                <div className="space-y-4">
                  {/* Total Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base font-medium">Total Amount (USDT) *</Label>
                      <Badge variant="outline" className="text-xs">
                        <Wallet className="h-3 w-3 mr-1" />
                        {getAvailableBalance()} {getBalanceLabel()}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="100.00"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        className="h-12 text-lg"
                        required
                      />
                      <div className="grid grid-cols-4 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAmountPercentage(10)}
                          className="text-xs"
                        >
                          10%
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAmountPercentage(25)}
                          className="text-xs"
                        >
                          25%
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAmountPercentage(50)}
                          className="text-xs"
                        >
                          50%
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAmountPercentage(100)}
                          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        >
                          MAX
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base font-medium">Rate (₦/USDT) *</Label>
                      <span className="text-sm text-gray-500">Market: ₦{currentMarketPrice}</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1487.50"
                      value={formData.rate}
                      onChange={(e) => handleRateChange(e.target.value)}
                      className="h-12 text-lg"
                      required
                    />
                  </div>

                  {/* Price Margin */}
                  <div>
                    <Label className="text-base font-medium">Price Margin (%) +/- from market price</Label>
                    <div className="relative mt-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={formData.priceMargin}
                        onChange={(e) => handleMarginChange(e.target.value)}
                        className="h-12 text-lg pr-12"
                      />
                      <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Trading Limits */}
            <Card className="p-6 bg-gray-50">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Trading Limits</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-base font-medium">Min Amount (USDT)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1.00"
                      value={formData.minAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, minAmount: e.target.value }))}
                      className="mt-2 h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium">Max Amount (USDT)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1000.00"
                      value={formData.maxAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxAmount: e.target.value }))}
                      className="mt-2 h-12"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment & Terms */}
            <Card className="p-6 bg-gray-50">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Payment & Terms</h3>
                
                <div>
                  <Label className="text-base font-medium">Payment Method *</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
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

                <div>
                  <Label className="text-base font-medium">Payment Time Limit</Label>
                  <Select value={formData.timeLimit} onValueChange={(value) => setFormData(prev => ({ ...prev, timeLimit: value }))}>
                    <SelectTrigger className="mt-2 h-12">
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

                <div>
                  <Label className="text-base font-medium">Trading Terms (Optional)</Label>
                  <Textarea
                    placeholder="Add any special requirements or terms for your offer..."
                    value={formData.terms}
                    onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                    className="mt-2 min-h-24"
                  />
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12 text-base"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createOfferMutation.isPending || !formData.amount || !formData.rate || !formData.paymentMethod}
                className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700"
              >
                {createOfferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Offer
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}