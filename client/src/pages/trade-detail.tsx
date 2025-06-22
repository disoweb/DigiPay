
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { TradeChat } from "@/components/trade-chat";
import { PaymentInstructions } from "@/components/payment-instructions";
import { PaymentProofUpload } from "@/components/payment-proof-upload";
import { TradeTimer } from "@/components/trade-timer";
import { DisputeResolution } from "@/components/dispute-resolution";
import { RatingForm } from "@/components/rating-form";
import { RealTimeChat } from "@/components/real-time-chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Clock, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  DollarSign,
  Calendar,
  TrendingUp,
  MessageCircle,
  Star,
  ArrowLeft
} from "lucide-react";

type EnrichedTrade = {
  id: number;
  offerId: number;
  buyerId: number;
  sellerId: number;
  amount: string;
  rate: string;
  fiatAmount: string;
  status: string;
  escrowAddress: string | null;
  paymentDeadline?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  paymentReference?: string;
  paymentProof?: string;
  createdAt: string;
  offer: any;
  buyer: { id: number; email: string } | null;
  seller: { id: number; email: string } | null;
};

export default function TradeDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showRating, setShowRating] = useState(false);
  
  const tradeId = parseInt(params.id || "0");

  const { data: trade, isLoading, error } = useQuery<EnrichedTrade>({
    queryKey: [`/api/trades/${tradeId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/trades/${tradeId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch trade: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!tradeId && tradeId > 0,
    refetchInterval: 5000,
    retry: 3,
  });

  const completeTradeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/trades/${tradeId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      toast({
        title: "Success",
        description: "Trade completed successfully!",
      });
      setShowRating(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete trade",
        variant: "destructive",
      });
    },
  });

  const cancelTradeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/trades/${tradeId}/cancel`, {
        reason: "User cancelled"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      toast({
        title: "Success",
        description: "Trade cancelled successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel trade",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading trade details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Trade Not Found</h1>
            <Button onClick={() => setLocation("/trades")}>Back to Trades</Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Pending</Badge>;
      case "payment_pending":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Payment Pending</Badge>;
      case "payment_made":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Payment Made</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case "cancelled":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Cancelled</Badge>;
      case "disputed":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Disputed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
      case "payment_pending":
        return <Clock className="h-5 w-5 text-orange-600" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "disputed":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const isUserInTrade = user && (trade.buyerId === user.id || trade.sellerId === user.id);
  const isBuyer = user && trade.buyerId === user.id;
  const isSeller = user && trade.sellerId === user.id;
  const canComplete = ["payment_made"].includes(trade.status) && isSeller;
  const canCancel = ["pending", "payment_pending"].includes(trade.status) && isUserInTrade;
  const isCompleted = trade.status === "completed";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {/* Mobile Back Button */}
        <div className="mb-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/trades")}
            className="flex items-center gap-2 p-2 sm:p-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Trades</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Trade #{trade.id}
          </h1>
          <div className="flex items-center gap-2">
            {getStatusIcon(trade.status)}
            {getStatusBadge(trade.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Trade Details */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5" />
                  Trade Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Type</p>
                    <p className="font-semibold text-sm">
                      {trade.offer?.type === "buy" ? "Buy USDT" : "Sell USDT"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Amount</p>
                    <p className="font-semibold text-sm">{parseFloat(trade.amount).toFixed(2)} USDT</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Rate</p>
                    <p className="font-semibold text-sm">₦{parseFloat(trade.rate).toLocaleString()}/USDT</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Total Value</p>
                    <p className="font-semibold text-sm">
                      ₦{parseFloat(trade.fiatAmount).toLocaleString()}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">Buyer:</span>
                    </div>
                    <span className="truncate max-w-[150px]">{trade.buyer?.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">Seller:</span>
                    </div>
                    <span className="truncate max-w-[150px]">{trade.seller?.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">Created:</span>
                    </div>
                    <span className="text-xs">
                      {new Date(trade.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {trade.escrowAddress && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Escrow:</span>
                      </div>
                      <span className="font-mono text-xs">{trade.escrowAddress.slice(0, 10)}...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Instructions */}
            {isUserInTrade && ["payment_pending", "payment_made"].includes(trade.status) && (
              <PaymentInstructions
                trade={trade}
                userRole={isBuyer ? 'buyer' : 'seller'}
                onPaymentMarked={() => {
                  queryClient.invalidateQueries({ queryKey: [`/api/trades/${trade.id}`] });
                }}
              />
            )}

            {/* Trade Instructions */}
            {trade.status === "pending" && isUserInTrade && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5" />
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isBuyer ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>As the buyer:</strong> Wait for the seller to provide payment details, then send 
                        ₦{parseFloat(trade.fiatAmount).toLocaleString()} as instructed.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        <strong>As the seller:</strong> Provide your payment details to the buyer and wait for payment confirmation.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Trade Actions */}
            {isUserInTrade && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {canComplete && (
                      <Button 
                        onClick={() => completeTradeMutation.mutate()}
                        disabled={completeTradeMutation.isPending}
                        className="flex-1"
                      >
                        {completeTradeMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Completing...
                          </>
                        ) : (
                          "Complete Trade"
                        )}
                      </Button>
                    )}
                    {canCancel && (
                      <Button 
                        variant="outline"
                        onClick={() => cancelTradeMutation.mutate()}
                        disabled={cancelTradeMutation.isPending}
                        className="flex-1"
                      >
                        {cancelTradeMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                            Cancelling...
                          </>
                        ) : (
                          "Cancel Trade"
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chat Section */}
          <div className="space-y-4">
            {isUserInTrade && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="h-5 w-5" />
                    Trade Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[400px] p-4">
                    <TradeChat tradeId={trade.id} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rating Form */}
            {isCompleted && isUserInTrade && showRating && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="h-5 w-5" />
                    Rate Trading Partner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RatingForm 
                    tradeId={trade.id}
                    onSubmit={() => setShowRating(false)}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
