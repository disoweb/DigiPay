
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { RealTimeChat } from "@/components/real-time-chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft,
  MessageCircle,
  User,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
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
  createdAt: string;
  offer: any;
  buyer: { id: number; email: string } | null;
  seller: { id: number; email: string } | null;
};

export default function ChatPage() {
  const params = useParams<{ tradeId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const tradeId = parseInt(params.tradeId || "0");

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
  });

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
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "disputed":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Chat Not Available</h1>
            <p className="text-gray-600 mb-4">Unable to load trade information</p>
            <Button onClick={() => setLocation("/trades")}>Back to Trades</Button>
          </div>
        </div>
      </div>
    );
  }

  const isUserInTrade = user && (trade.buyerId === user.id || trade.sellerId === user.id);
  const isBuyer = user && trade.buyerId === user.id;
  const otherParty = isBuyer ? trade.seller : trade.buyer;

  if (!isUserInTrade) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">You don't have permission to view this chat</p>
            <Button onClick={() => setLocation("/trades")}>Back to Trades</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation(`/trades/${trade.id}`)}
            className="flex items-center gap-2 p-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Trade Details
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Trade Chat #{trade.id}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(trade.status)}
              {getStatusBadge(trade.status)}
            </div>
          </div>
        </div>

        {/* Trade Summary Card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Trade Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Type</p>
                <p className="font-semibold">
                  {trade.offer?.type === "buy" ? "Buy USDT" : "Sell USDT"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Amount</p>
                <p className="font-semibold">{parseFloat(trade.amount).toFixed(2)} USDT</p>
              </div>
              <div>
                <p className="text-gray-600">Rate</p>
                <p className="font-semibold">₦{parseFloat(trade.rate).toLocaleString()}/USDT</p>
              </div>
              <div>
                <p className="text-gray-600">Total</p>
                <p className="font-semibold">₦{parseFloat(trade.fiatAmount).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">
                  Chatting with: {otherParty?.email}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Your role: {isBuyer ? "Buyer" : "Seller"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Chat Section */}
        <div className="h-[600px]">
          <RealTimeChat tradeId={trade.id} />
        </div>
      </main>
    </div>
  );
}
