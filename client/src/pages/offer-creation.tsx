import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Shield,
  AlertCircle,
  Info
} from "lucide-react";

export default function OfferCreation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [offerData, setOfferData] = useState({
    type: "sell" as "buy" | "sell",
    amount: "",
    rate: "",
    minAmount: "",
    maxAmount: "",
    paymentMethod: "",
    terms: "",
    priceMargin: "0",
    requiresVerification: false,
    timeLimit: "15",
    autoReply: "",
    location: user?.location || "",
  });

  const [currentUSDTPrice] = useState(1487.50); // Mock current market price

  const createOfferMutation = useMutation({
    mutationFn: async (data: typeof offerData) => {
      await apiRequest("POST", "/api/offers", data);
    },
    onSuccess: () => {
      toast({
        title: "Offer Created",
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

  const calculateRate = () => {
    const margin = parseFloat(offerData.priceMargin) || 0;
    const basePrice = currentUSDTPrice;
    const adjustedPrice = basePrice + (basePrice * margin / 100);
    return adjustedPrice.toFixed(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!offerData.amount || !offerData.rate || !offerData.paymentMethod) {
      toast({
        title: "Incomplete Offer",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const minAmt = parseFloat(offerData.minAmount) || 0;
    const maxAmt = parseFloat(offerData.maxAmount) || parseFloat(offerData.amount);
    
    if (minAmt > maxAmt) {
      toast({
        title: "Invalid Range",
        description: "Minimum amount cannot be greater than maximum amount",
        variant: "destructive",
      });
      return;
    }

    createOfferMutation.mutate({
      ...offerData,
      rate: offerData.rate || calculateRate()
    });
  };

  const paymentMethods = [
    "Bank Transfer",
    "Mobile Money (MTN)",
    "Mobile Money (Airtel)", 
    "Opay",
    "PalmPay",
    "Kuda",
    "Cash Pickup"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto p-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Trading Offer</h1>
          <p className="text-gray-600">Set up your advertisement to start trading</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Offer Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Offer Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Offer Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={offerData.type === "sell" ? "default" : "outline"}
                      onClick={() => setOfferData(prev => ({ ...prev, type: "sell" }))}
                      className="h-16 flex-col gap-2"
                    >
                      <TrendingDown className="h-5 w-5" />
                      Sell USDT
                    </Button>
                    <Button
                      type="button"
                      variant={offerData.type === "buy" ? "default" : "outline"}
                      onClick={() => setOfferData(prev => ({ ...prev, type: "buy" }))}
                      className="h-16 flex-col gap-2"
                    >
                      <TrendingUp className="h-5 w-5" />
                      Buy USDT
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Amount and Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Amount & Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Total Amount (USDT) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={offerData.amount}
                        onChange={(e) => setOfferData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="100.00"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="rate">
                        Rate (₦/USDT) *
                        <Badge variant="outline" className="ml-2">
                          Market: ₦{currentUSDTPrice}
                        </Badge>
                      </Label>
                      <Input
                        id="rate"
                        type="number"
                        step="0.01"
                        value={offerData.rate || calculateRate()}
                        onChange={(e) => setOfferData(prev => ({ ...prev, rate: e.target.value }))}
                        placeholder={calculateRate()}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="priceMargin">
                      Price Margin (%)
                      <span className="text-xs text-gray-500 ml-2">
                        +/- from market price
                      </span>
                    </Label>
                    <Input
                      id="priceMargin"
                      type="number"
                      step="0.1"
                      value={offerData.priceMargin}
                      onChange={(e) => {
                        setOfferData(prev => ({ ...prev, priceMargin: e.target.value }));
                      }}
                      placeholder="0"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minAmount">Minimum Order (USDT)</Label>
                      <Input
                        id="minAmount"
                        type="number"
                        step="0.01"
                        value={offerData.minAmount}
                        onChange={(e) => setOfferData(prev => ({ ...prev, minAmount: e.target.value }))}
                        placeholder="10.00"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="maxAmount">Maximum Order (USDT)</Label>
                      <Input
                        id="maxAmount"
                        type="number"
                        step="0.01"
                        value={offerData.maxAmount}
                        onChange={(e) => setOfferData(prev => ({ ...prev, maxAmount: e.target.value }))}
                        placeholder="Same as total amount"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment & Terms */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment & Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select value={offerData.paymentMethod} onValueChange={(value) => setOfferData(prev => ({ ...prev, paymentMethod: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timeLimit">Payment Time Limit</Label>
                    <Select value={offerData.timeLimit} onValueChange={(value) => setOfferData(prev => ({ ...prev, timeLimit: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="terms">Terms and Instructions</Label>
                    <Textarea
                      id="terms"
                      value={offerData.terms}
                      onChange={(e) => setOfferData(prev => ({ ...prev, terms: e.target.value }))}
                      placeholder="Additional terms, payment instructions, or requirements..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="autoReply">Auto Reply Message</Label>
                    <Textarea
                      id="autoReply"
                      value={offerData.autoReply}
                      onChange={(e) => setOfferData(prev => ({ ...prev, autoReply: e.target.value }))}
                      placeholder="Automatic message sent to traders when they start a trade..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="verification">Require KYC Verification</Label>
                      <p className="text-xs text-gray-500">Only verified users can trade</p>
                    </div>
                    <Switch
                      id="verification"
                      checked={offerData.requiresVerification}
                      onCheckedChange={(checked) => setOfferData(prev => ({ ...prev, requiresVerification: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Offer Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <Badge variant={offerData.type === "sell" ? "destructive" : "default"}>
                        {offerData.type === "sell" ? "Sell" : "Buy"} USDT
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">{offerData.amount || "0"} USDT</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rate:</span>
                      <span className="font-medium">₦{offerData.rate || calculateRate()}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Value:</span>
                      <span className="font-medium">
                        ₦{((parseFloat(offerData.amount) || 0) * (parseFloat(offerData.rate) || parseFloat(calculateRate()))).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Limit:</span>
                      <span className="font-medium">{offerData.timeLimit} min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <p>• Competitive rates attract more traders</p>
                  <p>• Clear terms reduce disputes</p>
                  <p>• Auto-reply messages speed up trades</p>
                  <p>• Shorter time limits increase urgency</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/marketplace")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createOfferMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {createOfferMutation.isPending ? "Creating..." : "Publish Offer"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}