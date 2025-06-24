import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Timer, 
  CheckCircle2, 
  AlertTriangle,
  MessageCircle,
  Flag,
  Clock
} from "lucide-react";
import DisputeSystemV2 from "./dispute-system-v2";

interface Trade {
  id: number;
  offerId: number;
  buyerId: number;
  sellerId: number;
  amount: string;
  rate: string;
  fiatAmount: string;
  status: string;
  paymentDeadline?: string;
  createdAt: string;
  buyer?: { id: number; email: string; };
  seller?: { id: number; email: string; };
  offer?: { type: string; paymentMethod?: string };
}

export function TradeDetailSimple() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: trade, isLoading, error } = useQuery<Trade>({
    queryKey: ['trade', id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/trades/${id}`);
      if (!response.ok) throw new Error('Failed to fetch trade');
      return response.json();
    },
    enabled: !!user && !!id,
    refetchOnWindowFocus: false,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
            <p className="text-gray-600">Please log in to view trade details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/trades')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold">Trade Details</h1>
            <div className="w-8" />
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/trades')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold">Trade Details</h1>
            <div className="w-8" />
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <h3 className="font-medium text-red-900 mb-2">Trade not found</h3>
              <p className="text-red-700 text-sm">This trade may have been removed or you don't have access to it</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isBuyer = user.id === trade.buyerId;
  const partner = isBuyer ? trade.seller : trade.buyer;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'payment_pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'payment_made': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'disputed': return 'bg-red-100 text-red-800 border-red-200';
      case 'canceled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'payment_pending': return <Timer className="h-3 w-3" />;
      case 'payment_made': return <Clock className="h-3 w-3" />;
      case 'completed': return <CheckCircle2 className="h-3 w-3" />;
      case 'disputed': return <AlertTriangle className="h-3 w-3" />;
      default: return <Timer className="h-3 w-3" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/trades')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Trade #{trade.id}</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Badge className={`${getStatusColor(trade.status)} border`}>
                {getStatusIcon(trade.status)}
                <span className="ml-1">{formatStatus(trade.status)}</span>
              </Badge>
              <p className="text-xs text-gray-500">
                {new Date(trade.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Trade Details */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-xs text-gray-600">Amount</p>
                <p className="font-bold text-sm">{parseFloat(trade.amount).toFixed(2)}</p>
                <p className="text-xs text-gray-500">USDT</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">Rate</p>
                <p className="font-bold text-sm">₦{parseFloat(trade.rate).toLocaleString()}</p>
                <p className="text-xs text-gray-500">per USDT</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">Total</p>
                <p className="font-bold text-sm text-green-600">
                  ₦{(parseFloat(trade.amount) * parseFloat(trade.rate)).toLocaleString()}
                </p>
                <Badge variant="outline" className="text-xs mt-1">
                  {isBuyer ? 'Buyer' : 'Seller'}
                </Badge>
              </div>
            </div>

            {/* Partner Info */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">
                  {partner?.email?.split('@')[0] || 'Unknown User'}
                </p>
                <p className="text-xs text-gray-500">Trading Partner</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(`/chat/${trade.id}`)}
                className="h-8 px-3 text-xs"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Chat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Instructions */}
        {trade.status === 'payment_pending' && isBuyer && (
          <Alert>
            <Timer className="h-4 w-4" />
            <AlertDescription>
              Please send the payment and mark it as complete when done.
            </AlertDescription>
          </Alert>
        )}

        {trade.status === 'payment_made' && !isBuyer && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Please verify the payment and complete the trade.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {trade.status === 'payment_pending' && isBuyer && (
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Payment as Made
            </Button>
          )}

          {trade.status === 'payment_made' && !isBuyer && (
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Trade
            </Button>
          )}

          {['payment_pending', 'payment_made'].includes(trade.status) && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                <Flag className="h-4 w-4 mr-2" />
                Dispute
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-gray-300"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Dispute System */}
        <DisputeSystemV2
          trade={trade as any}
          userRole={isBuyer ? 'buyer' : 'seller'}
          onDisputeUpdate={() => {
            // Simple refetch without complex invalidation
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
}