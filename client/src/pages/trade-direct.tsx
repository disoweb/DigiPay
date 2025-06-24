import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Shield, 
  Star, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Users
} from "lucide-react";

export default function DirectTrade() {
  const params = useParams<{ offerId: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  // Extract offerId from params - handle both offerId and id parameters
  const offerId = params.offerId || params.id;
  console.log("DirectTrade params:", params);
  console.log("DirectTrade offerId:", offerId);
  console.log("Current URL:", window.location.pathname);
  
  // Also try to extract from window location as fallback
  const urlOfferId = window.location.pathname.split('/').pop();
  const finalOfferId = offerId || urlOfferId;
  console.log("Final offer ID:", finalOfferId);

  // Fetch offer data from API
  const { data: selectedOffer, isLoading: offerLoading, error: offerError } = useQuery({
    queryKey: ["/api/offers", finalOfferId],
    queryFn: async () => {
      if (!finalOfferId) throw new Error("No offer ID provided");
      console.log("Fetching offer for ID:", finalOfferId);
      const response = await apiRequest("GET", `/api/offers/${finalOfferId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch offer");
      }
      const data = await response.json();
      console.log("Fetched offer data:", data);
      return data;
    },
    enabled: !!finalOfferId
  });

  useEffect(() => {
    if (offerError) {
      console.error("Offer fetch error:", offerError);
      setError(`Failed to load offer: ${offerError.message}`);
    }
  }, [offerError]);

  const createTradeMutation = useMutation({
    mutationFn: async (tradeData: any) => {
      const response = await apiRequest("POST", "/api/trades", tradeData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create trade");
      }
      return response.json();
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      console.log("Trade creation response:", response);
      console.log("Navigating to trade detail with trade ID:", response.trade.id);
      const tradeUrl = `/trades/${response.trade.id}`;
      console.log("Trade URL:", tradeUrl);
      setLocation(tradeUrl);
    },
    onError: (error: any) => {
      setError(error.message);
      setLoading(false);
    },
  });

  const currentOffer = selectedOffer;

  if (offerLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Loading offer...</h2>
              <p className="text-gray-600">Please wait while we fetch the offer details.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (offerError || !currentOffer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Offer not found</h2>
              <p className="text-gray-600 mb-4">
                The requested offer could not be loaded. It may have been removed or is no longer available.
              </p>
              <p className="text-sm text-gray-500 mb-2">Offer ID: {finalOfferId || 'undefined'}</p>
              <p className="text-sm text-gray-500 mb-2">Error: {offerError?.message || 'Offer not found'}</p>
              <Button 
                onClick={() => setLocation("/market")}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Market
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleCreateTrade = async () => {
    if (!user || !currentOffer || !amount) return;

    const tradeAmount = parseFloat(amount);
    const minAmount = parseFloat(currentOffer.minAmount || "0");
    const maxAmount = parseFloat(currentOffer.maxAmount || currentOffer.amount);

    if (tradeAmount < minAmount || tradeAmount > maxAmount) {
      setError(`Amount must be between ${minAmount} and ${maxAmount} USDT`);
      return;
    }

    if (tradeAmount > parseFloat(currentOffer.amount)) {
      setError("Amount exceeds available offer amount");
      return;
    }

    setLoading(true);
    setError("");

    const tradeData = {
      offerId: currentOffer.id,
      amount: amount,
      rate: currentOffer.rate,
      fiatAmount: (tradeAmount * parseFloat(currentOffer.rate)).toString(),
      paymentMethod: currentOffer.paymentMethod,
    };

    createTradeMutation.mutate(tradeData);
  };

  const fiatAmount = amount ? parseFloat(amount) * parseFloat(currentOffer.rate || "0") : 0;
  const isValidAmount = amount && parseFloat(amount) >= parseFloat(currentOffer.minAmount || "0") && 
                       parseFloat(amount) <= parseFloat(currentOffer.maxAmount || currentOffer.amount);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button 
            onClick={() => setLocation("/dashboard")} 
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
              {currentOffer.type === 'buy' ? 'Sell USDT' : 'Buy USDT'}
            </h1>
            <p className="text-gray-600 text-sm">
              {currentOffer.type === 'buy' ? 'Sell to' : 'Buy from'} {currentOffer.user?.email}
            </p>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Trader Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Trading with {currentOffer.user?.email}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{currentOffer.user?.email}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span>{parseFloat(currentOffer.user?.averageRating || "0").toFixed(1)}</span>
                  <span>({currentOffer.user?.ratingCount || 0})</span>
                  <span>•</span>
                  <span>{currentOffer.user?.completedTrades || 0} trades</span>
                </div>
              </div>
              {currentOffer.user?.kycVerified && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Offer Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Offer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Rate</Label>
                <p className="font-semibold text-lg">₦{parseFloat(currentOffer.rate || "0").toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Available</Label>
                <p className="font-semibold text-lg">{parseFloat(currentOffer.amount || "0").toFixed(2)} USDT</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Min Amount</Label>
                <p className="font-semibold">{parseFloat(currentOffer.minAmount || "0").toFixed(2)} USDT</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Max Amount</Label>
                <p className="font-semibold">{parseFloat(currentOffer.maxAmount || currentOffer.amount).toFixed(2)} USDT</p>
              </div>
            </div>
            <div className="mt-4">
              <Label className="text-sm text-gray-600">Payment Method</Label>
              <Badge variant="outline" className="ml-2">
                <DollarSign className="h-3 w-3 mr-1" />
                {currentOffer.paymentMethod?.replace('_', ' ').toUpperCase() || 'Bank Transfer'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Trade Amount Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Enter Trade Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (USDT)</Label>
              <Input
                id="amount"
                type="number"
                placeholder={`Min: ${currentOffer.minAmount} - Max: ${currentOffer.maxAmount || currentOffer.amount}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={currentOffer.minAmount}
                max={currentOffer.maxAmount || currentOffer.amount}
                step="0.01"
                className="mt-2"
              />
            </div>

            {amount && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">You will {currentOffer.type === 'buy' ? 'sell' : 'buy'}:</span>
                  <span className="font-semibold">{parseFloat(amount).toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">You will {currentOffer.type === 'buy' ? 'receive' : 'pay'}:</span>
                  <span className="font-semibold text-lg">₦{fiatAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Exchange rate:</span>
                  <span className="text-sm">₦{parseFloat(currentOffer.rate || "0").toLocaleString()} per USDT</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Button */}
        <Card>
          <CardContent className="p-6">
            <Button
              onClick={handleCreateTrade}
              disabled={!isValidAmount || loading || currentOffer.userId === user?.id}
              className="w-full h-12 text-lg font-semibold"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating Trade...
                </div>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Create Trade
                </>
              )}
            </Button>

            {currentOffer.userId === user?.id && (
              <p className="text-center text-sm text-gray-500 mt-2">
                You cannot trade with your own offer
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}