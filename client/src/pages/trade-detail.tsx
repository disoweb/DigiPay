import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { RealTimeChat } from "@/components/real-time-chat";
import { RatingForm } from "@/components/rating-form";
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
  Star
} from "lucide-react";

type EnrichedTrade = {
  id: number;
  offerId: number;
  buyerId: number;
  sellerId: number;
  amount: string;
  rate: string;
  status: string;
  escrowAddress: string | null;
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

  const { data: trade, isLoading } = useQuery<EnrichedTrade>({
    queryKey: ["/api/trades", tradeId],
    enabled: !!tradeId,
  });

  const completeTradeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/trades/${tradeId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades", tradeId] });
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
      await apiRequest("POST", `/api/trades/${tradeId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades", tradeId] });
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
          <div className="text-center">Loading trade details...</div>
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
  const canComplete = trade.status === "pending" && isUserInTrade;
  const canCancel = trade.status === "pending" && isUserInTrade;
  const isCompleted = trade.status === "completed";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/trades")}
            className="mb-4"
          >
            ← Back to Trades
          </Button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Trade #{trade.id}
            </h1>
            <div className="flex items-center gap-2">
              {getStatusIcon(trade.status)}
              {getStatusBadge(trade.status)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trade Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Trade Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Type</p>
                    <p className="text-lg font-semibold">
                      {trade.offer?.type === "buy" ? "Buy USDT" : "Sell USDT"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Amount</p>
                    <p className="text-lg font-semibold">{parseFloat(trade.amount).toFixed(2)} USDT</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rate</p>
                    <p className="text-lg font-semibold">₦{parseFloat(trade.rate).toLocaleString()}/USDT</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                    <p className="text-lg font-semibold">
                      ₦{(parseFloat(trade.amount) * parseFloat(trade.rate)).toLocaleString()}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Buyer:</span>
                    </div>
                    <span className="text-sm">{trade.buyer?.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Seller:</span>
                    </div>
                    <span className="text-sm">{trade.seller?.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Created:</span>
                    </div>
                    <span className="text-sm">
                      {new Date(trade.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {trade.escrowAddress && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Escrow:</span>
                      </div>
                      <span className="text-sm font-mono">{trade.escrowAddress.slice(0, 10)}...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Trade Instructions */}
            {trade.status === "pending" && isUserInTrade && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trade.offer?.type === "sell" ? (
                    isBuyer ? (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>As the buyer:</strong> Send ₦{(parseFloat(trade.amount) * parseFloat(trade.rate)).toLocaleString()} 
                          to the seller's bank account. Once payment is confirmed, the seller will release the USDT from escrow.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          <strong>As the seller:</strong> Your {parseFloat(trade.amount).toFixed(2)} USDT is secured in escrow. 
                          Wait for the buyer to send payment, then confirm receipt and complete the trade.
                        </AlertDescription>
                      </Alert>
                    )
                  ) : (
                    isSeller ? (
                      <Alert>
                        <TrendingUp className="h-4 w-4" />
                        <AlertDescription>
                          <strong>As the seller:</strong> Send {parseFloat(trade.amount).toFixed(2)} USDT to the buyer's TRON address. 
                          Once confirmed, mark the trade as complete.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>As the buyer:</strong> You have paid ₦{(parseFloat(trade.amount) * parseFloat(trade.rate)).toLocaleString()}. 
                          Wait for the seller to send USDT to your TRON address.
                        </AlertDescription>
                      </Alert>
                    )
                  )}
                </CardContent>
              </Card>
            )}

            {/* Trade Actions */}
            {isUserInTrade && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    {canComplete && (
                      <Button 
                        onClick={() => completeTradeMutation.mutate()}
                        disabled={completeTradeMutation.isPending}
                        className="flex-1"
                      >
                        Complete Trade
                      </Button>
                    )}
                    {canCancel && (
                      <Button 
                        variant="outline"
                        onClick={() => cancelTradeMutation.mutate()}
                        disabled={cancelTradeMutation.isPending}
                        className="flex-1"
                      >
                        Cancel Trade
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chat */}
          <div className="space-y-6">
            {isUserInTrade && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Trade Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <RealTimeChat tradeId={trade.id} />
                </CardContent>
              </Card>
            )}

            {/* Rating Form */}
            {isCompleted && isUserInTrade && showRating && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
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