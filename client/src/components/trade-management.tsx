import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  MessageCircle,
  Shield,
  Timer,
  TrendingUp,
  TrendingDown,
  User,
  DollarSign
} from "lucide-react";

interface Trade {
  id: number;
  offerId: number;
  buyerId: number;
  sellerId: number;
  amount: string;
  rate: string;
  fiatAmount: string;
  status: string;
  escrowAddress?: string;
  paymentDeadline?: string;
  paymentMadeAt?: string;
  sellerConfirmedAt?: string;
  disputeReason?: string;
  paymentReference?: string;
  paymentProof?: string;
  createdAt: string;
  buyer?: { id: number; email: string; averageRating: string };
  seller?: { id: number; email: string; averageRating: string };
  offer?: { type: string; paymentMethod?: string };
}

export function TradeManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'completed' | 'disputed'>('all');

  const { data: trades = [], isLoading, error, refetch } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
    queryFn: async () => {
      console.log("Fetching trades for user:", user?.id);
      const response = await apiRequest("GET", "/api/trades");
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.status}`);
      }
      const data = await response.json();
      console.log("Trades fetched:", data);
      return data;
    },
    refetchInterval: 10000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 5000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const cancelTradeMutation = useMutation({
    mutationFn: async (tradeId: number) => {
      const response = await apiRequest("POST", `/api/trades/${tradeId}/cancel`, {
        reason: "User requested cancellation"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trade Cancelled",
        description: "Trade has been cancelled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel trade",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'payment_pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'payment_made': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'disputed': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'payment_pending': return <Timer className="h-4 w-4" />;
      case 'payment_made': return <AlertTriangle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'disputed': return <AlertTriangle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'expired': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colorClass = getStatusColor(status);
    const icon = getStatusIcon(status);
    
    const statusText = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return (
      <Badge variant="secondary" className={`${colorClass} flex items-center gap-1`}>
        {icon}
        {statusText}
      </Badge>
    );
  };

  const filteredTrades = trades.filter(trade => {
    if (selectedStatus === 'all') return true;
    if (selectedStatus === 'active') {
      return ['pending', 'payment_pending', 'payment_made'].includes(trade.status);
    }
    if (selectedStatus === 'completed') return trade.status === 'completed';
    if (selectedStatus === 'disputed') return trade.status === 'disputed';
    return true;
  });

  const getTimeRemaining = (deadline: string) => {
    const now = Date.now();
    const deadlineTime = new Date(deadline).getTime();
    const remaining = Math.max(0, deadlineTime - now);

    if (remaining === 0) return "Expired";

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTradeRole = (trade: Trade): 'buyer' | 'seller' => {
    return trade.buyerId === user?.id ? 'buyer' : 'seller';
  };

  const getTradePartner = (trade: Trade) => {
    const role = getTradeRole(trade);
    return role === 'buyer' ? trade.seller : trade.buyer;
  };

  const canCancelTrade = (trade: Trade) => {
    return ['pending', 'payment_pending'].includes(trade.status) && 
           (trade.buyerId === user?.id || trade.sellerId === user?.id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading your trades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load trades. Please check your connection.</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="ml-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Filter trades by status - exclude expired trades from active
  const activeTrades = trades.filter(trade => 
    ["payment_pending", "payment_made"].includes(trade.status) &&
    trade.status !== "expired"
  );

  const completedTrades = trades.filter(trade => 
    trade.status === "completed"
  );

  const disputedTrades = trades.filter(trade => 
    trade.status === "disputed"
  );

  const expiredTrades = trades.filter(trade => 
    trade.status === "expired"
  );

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Trade Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="font-bold text-blue-600">
                  {activeTrades.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="font-bold text-green-600">
                  {trades.filter(t => t.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Disputed</p>
                <p className="font-bold text-red-600">
                  {trades.filter(t => t.status === 'disputed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Volume</p>
                <p className="font-bold text-purple-600">
                  ₦{trades
                    .filter(t => t.status === 'completed')
                    .reduce((sum, t) => {
                      const amount = parseFloat(t.fiatAmount);
                      return sum + (!isNaN(amount) ? amount : 0);
                    }, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Trades ({trades.length})</TabsTrigger>
          <TabsTrigger value="active">
            Active ({activeTrades.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({trades.filter(t => t.status === 'completed').length})
          </TabsTrigger>
          <TabsTrigger value="disputed">
            Disputed ({trades.filter(t => t.status === 'disputed').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="space-y-4">
          {filteredTrades.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No trades found in this category.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {filteredTrades.map((trade) => {
                const role = getTradeRole(trade);
                const partner = getTradePartner(trade);
                const isExpiringSoon = trade.paymentDeadline && 
                  new Date(trade.paymentDeadline).getTime() - Date.now() < 5 * 60 * 1000; // 5 minutes

                return (
                  <Card key={trade.id} className={`${isExpiringSoon ? 'border-red-300 bg-red-50' : ''} shadow-sm`}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="space-y-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Trade #{trade.id}</span>
                              <Badge className={`${getStatusColor(trade.status)} flex items-center gap-1`}>
                                {getStatusIcon(trade.status)}
                                {trade.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              {role === 'buyer' ? (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Buying
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-600 border-red-600">
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                  Selling
                                </Badge>
                              )}
                            </div>
                            {trade.escrowAddress && (
                              <Badge variant="outline" className="text-blue-600 border-blue-600">
                                <Shield className="h-3 w-3 mr-1" />
                                Escrow Protected
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-gray-600 text-xs">Amount</p>
                              <p className="font-semibold text-sm">
                                {!isNaN(parseFloat(trade.amount)) ? parseFloat(trade.amount).toFixed(2) : '0.00'} USDT
                              </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-gray-600 text-xs">Rate</p>
                              <p className="font-semibold text-sm">
                                ₦{!isNaN(parseFloat(trade.rate)) ? parseFloat(trade.rate).toLocaleString() : '0'}
                              </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-gray-600 text-xs">Total</p>
                              <p className="font-semibold text-sm">
                                ₦{!isNaN(parseFloat(trade.fiatAmount)) ? parseFloat(trade.fiatAmount).toLocaleString() : '0'}
                              </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-gray-600 text-xs">Partner</p>
                              <p className="font-semibold text-sm truncate">{partner?.email}</p>
                            </div>
                          </div>

                          {/* Payment Timer */}
                          {trade.status === 'payment_pending' && trade.paymentDeadline && (
                            <div className={`p-3 rounded-lg ${isExpiringSoon ? 'bg-red-100 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Timer className={`h-4 w-4 ${isExpiringSoon ? 'text-red-600' : 'text-blue-600'}`} />
                                  <span className={`font-medium ${isExpiringSoon ? 'text-red-900' : 'text-blue-900'}`}>
                                    Payment Deadline
                                  </span>
                                </div>
                                <span className={`font-bold ${isExpiringSoon ? 'text-red-700' : 'text-blue-700'}`}>
                                  {getTimeRemaining(trade.paymentDeadline)}
                                </span>
                              </div>
                              {isExpiringSoon && (
                                <p className="text-xs text-red-700 mt-1">
                                  ⚠️ Payment deadline approaching! Complete payment to avoid cancellation.
                                </p>
                              )}
                            </div>
                          )}

                          {/* Payment Reference */}
                          {trade.paymentReference && (
                            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              <strong>Payment Reference:</strong> {trade.paymentReference}
                            </div>
                          )}

                          {/* Trade Actions */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-1 sm:flex-none"
                              onClick={() => {
                                setLocation(`/trades/${trade.id}`);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>

                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-1 sm:flex-none"
                              onClick={() => {
                                console.log("Chat button clicked for trade:", trade);
                                if (trade && trade.id && typeof trade.id === 'number') {
                                  console.log("Navigating to chat for trade ID:", trade.id);
                                  setLocation(`/chat/${trade.id}`);
                                } else {
                                  console.error("Invalid trade data for chat navigation:", trade);
                                  toast({
                                    title: "Error",
                                    description: "Unable to open chat - invalid trade data",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Chat
                            </Button>

                            {canCancelTrade(trade) && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                className="flex-1 sm:flex-none"
                                onClick={() => cancelTradeMutation.mutate(trade.id)}
                                disabled={cancelTradeMutation.isPending}
                              >
                                {cancelTradeMutation.isPending ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                                    Cancelling...
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Cancel
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="disputed">
          <div className="space-y-4">
            {disputedTrades.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Disputed Trades</h3>
                  <p className="text-gray-600">All your trades are going smoothly!</p>
                </CardContent>
              </Card>
            ) : (
              disputedTrades.map((trade) => (
                <Card key={trade.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Trade Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getTradeRole(trade) === 'buyer' ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-blue-600" />
                            )}
                            <span className="font-medium text-sm">
                              {getTradeRole(trade) === 'buyer' ? 'Buying' : 'Selling'} USDT
                            </span>
                          </div>
                          {getStatusBadge(trade.status)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Trade #{trade.id}
                        </div>
                      </div>

                      {/* Trade Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <p className="font-medium">{parseFloat(trade.amount).toFixed(2)} USDT</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Rate:</span>
                          <p className="font-medium">₦{parseFloat(trade.rate).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Total:</span>
                          <p className="font-medium">₦{parseFloat(trade.fiatAmount).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Partner:</span>
                          <p className="font-medium truncate">{getTradePartner(trade)?.email}</p>
                        </div>
                      </div>

                      {/* Trade Actions */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => setLocation(`/trades/${trade.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => setLocation(`/chat/${trade.id}`)}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Chat
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="expired">
          <div className="space-y-4">
            {expiredTrades.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Expired Trades</h3>
                  <p className="text-gray-600">Keep up the good work with timely payments!</p>
                </CardContent>
              </Card>
            ) : (
              expiredTrades.map((trade) => (
                <Card key={trade.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Trade Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getTradeRole(trade) === 'buyer' ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-blue-600" />
                            )}
                            <span className="font-medium text-sm">
                              {getTradeRole(trade) === 'buyer' ? 'Buying' : 'Selling'} USDT
                            </span>
                          </div>
                          {getStatusBadge(trade.status)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Trade #{trade.id}
                        </div>
                      </div>

                      {/* Trade Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <p className="font-medium">{parseFloat(trade.amount).toFixed(2)} USDT</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Rate:</span>
                          <p className="font-medium">₦{parseFloat(trade.rate).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Total:</span>
                          <p className="font-medium">₦{parseFloat(trade.fiatAmount).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Partner:</span>
                          <p className="font-medium truncate">{getTradePartner(trade)?.email}</p>
                        </div>
                      </div>

                      {/* Trade Actions */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => setLocation(`/trades/${trade.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => setLocation(`/chat/${trade.id}`)}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Chat
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}