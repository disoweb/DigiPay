import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { useCurrencyPreference } from "@/hooks/use-currency-preference";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { TransactionDetailModal } from "@/components/transaction-detail-modal";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  MessageCircle,
  Plus,
  ArrowRight,
  Wallet,
  Activity,
  DollarSign,
  Users,
  BarChart3,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Shield,
  Edit,
  Trash2,
  Calendar
} from "lucide-react";

export function TradingDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { currency: portfolioCurrency, toggleCurrency } = useCurrencyPreference();

  // Exchange rates from database
  const { USDT_TO_NGN_RATE, NGN_TO_USD_RATE } = useExchangeRates();

  const { data: trades = [], error: tradesError, refetch: refetchTrades, isLoading: tradesLoading } = useQuery({
    queryKey: ['/api/trades'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/trades");
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user?.id, // Only fetch when user is available
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0, // Don't cache data
    retry: 1,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/transactions");
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Force refetch when component mounts and user is available
  useEffect(() => {
    if (user?.id && refetchTrades) {
      const timer = setTimeout(() => {
        refetchTrades();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user?.id, refetchTrades]);

  const { data: allUserOffers = [], error: offersError } = useQuery({
    queryKey: [`/api/users/${user?.id}/offers`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user?.id}/offers`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user offers: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  });

  // Filter and sort offers - latest first
  const offers = allUserOffers
    .filter((offer: any) => !offer.isFullyTraded)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const { data: featuredOffers } = useQuery({
    queryKey: ['/api/offers/featured'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/offers/featured");
      if (!response.ok) {
        throw new Error(`Failed to fetch featured offers: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const { data: marketStats, error: statsError, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/market/stats'],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/market/stats");
        if (!response.ok) {
          throw new Error(`Failed to fetch market stats: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error("Market stats error:", error);
        // Return default stats instead of throwing
        return {
          totalOffers: 0,
          bestBuyRate: null,
          bestSellRate: null,
          last24hVolume: 0
        };
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: 10000,
    refetchOnWindowFocus: false,
    staleTime: 5000,
  });

  // Handle any API errors
  if (tradesError || offersError || statsError) {
    console.error('Dashboard API errors:', { tradesError, offersError, statsError });
  }

  // Show loading state
  if (tradesLoading && trades.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your trading data...</p>
        </div>
      </div>
    );
  }

  // Calculate user statistics
  const completedTrades = trades.filter((t: any) => t.status === 'completed');
  const activeTrades = trades.filter((t: any) => 
    ['pending', 'payment_pending', 'payment_made'].includes(t.status)
  );
  const disputedTrades = trades.filter((t: any) => t.status === 'disputed');

  const totalVolume = completedTrades.reduce((sum: number, trade: any) => 
    sum + parseFloat(trade.fiatAmount), 0
  );

  const successRate = trades.length > 0 
    ? (completedTrades.length / trades.length) * 100 
    : 0;

  const activeOffers = Array.isArray(offers) ? offers.filter((o: any) => o.status === 'active') : [];
  const buyOffers = activeOffers.filter((o: any) => o.type === 'buy');
  const sellOffers = activeOffers.filter((o: any) => o.type === 'sell');

  // Recent activity
  const recentTrades = trades
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'payment_pending': return 'text-blue-600 bg-blue-100';
      case 'payment_made': return 'text-orange-600 bg-orange-100';
      case 'disputed': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      case 'canceled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  const formatStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'payment_pending': 'Payment Pending',
      'payment_made': 'Payment Made',
      'completed': 'Completed',
      'expired': 'Expired',
      'disputed': 'Disputed',
      'canceled': 'Canceled',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calculate total portfolio value
  const usdtInNgn = parseFloat(user?.usdtBalance || "0") * USDT_TO_NGN_RATE;
  const ngnBalance = parseFloat(user?.nairaBalance || "0");

  let totalPortfolioValue;
  let ngnBalanceInPreferredCurrency;
  let usdtBalanceInPreferredCurrency;
  let currencySymbol;

  if (portfolioCurrency === "NGN") {
    totalPortfolioValue = usdtInNgn + ngnBalance;
    ngnBalanceInPreferredCurrency = ngnBalance;
    usdtBalanceInPreferredCurrency = parseFloat(user?.usdtBalance || "0")
    currencySymbol = "₦";
  } else {
    totalPortfolioValue = (usdtInNgn + ngnBalance) * NGN_TO_USD_RATE;
    ngnBalanceInPreferredCurrency = ngnBalance * NGN_TO_USD_RATE
    usdtBalanceInPreferredCurrency = parseFloat(user?.usdtBalance || "0")
    currencySymbol = "$";
  }

  // Portfolio calculation logic (same as wallet)
  const calculatePortfolioValue = () => {
    const usdtBalance = parseFloat(user.usdtBalance || "0");
    const ngnBalance = parseFloat(user.nairaBalance || "0");
    
    if (portfolioCurrency === "USD") {
      const usdtInUsd = usdtBalance; // USDT is 1:1 with USD
      const ngnInUsd = ngnBalance * NGN_TO_USD_RATE;
      return usdtInUsd + ngnInUsd;
    } else {
      const usdtInNgn = usdtBalance * USDT_TO_NGN_RATE;
      return ngnBalance + usdtInNgn;
    }
  };

  const formatPortfolioValue = (value: number) => {
    if (portfolioCurrency === "USD") {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `₦${value.toLocaleString()}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Total Portfolio Card - Same as Wallet */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <p className="text-blue-100 text-sm">Total Portfolio Value</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCurrency}
                className="h-6 w-auto px-2 bg-white/10 hover:bg-white/20 text-white text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {portfolioCurrency}
              </Button>
            </div>
            
            {/* Main Portfolio Value */}
            <p className="text-4xl font-bold">
              {formatPortfolioValue(calculatePortfolioValue())}
            </p>
            
            {/* Currency Breakdown */}
            <div className="flex justify-center space-x-6 text-sm">
              <div className="text-center">
                <p className="text-blue-100">NGN</p>
                <p className="font-semibold">₦{parseFloat(user.nairaBalance || "0").toLocaleString()}</p>
                {portfolioCurrency === "USD" && (
                  <p className="text-xs text-blue-200">
                    ≈ ${(parseFloat(user.nairaBalance || "0") * NGN_TO_USD_RATE).toFixed(2)}
                  </p>
                )}
              </div>
              <div className="text-center">
                <p className="text-blue-100">USDT</p>
                <p className="font-semibold">${parseFloat(user.usdtBalance || "0").toFixed(2)}</p>
                {portfolioCurrency === "NGN" && (
                  <p className="text-xs text-blue-200">
                    ≈ ₦{(parseFloat(user.usdtBalance || "0") * USDT_TO_NGN_RATE).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Trades</p>
                  <p className="font-bold text-xl">{trades.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Volume</p>
                  <p className="font-bold text-xl">₦{totalVolume.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="font-bold text-xl">{successRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Offers</p>
                  <p className="font-bold text-xl">{activeOffers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>



      {/* Active Trading Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Trades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Active Trades ({activeTrades.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTrades.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active trades</p>
            ) : (
              <div className="space-y-3">
                {activeTrades.slice(0, 3).map((trade: any) => (
                  <div 
                    key={trade.id} 
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      if (trade && trade.id) {
                        console.log("Card clicked - navigating to trade detail for trade ID:", trade.id);
                        setLocation(`/trades/${trade.id}`);
                      } else {
                        console.error("Invalid trade data for detail navigation:", trade);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium">Trade #{trade.id}</p>
                        <p className="text-sm text-gray-600">
                          ${parseFloat(trade.amount || 0).toFixed(2)} @ ₦{parseFloat(trade.rate || 0).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(trade.status)}>
                        {formatStatusDisplay(trade.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      {trade.paymentDeadline && (
                        <p className="text-xs text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(trade.paymentDeadline).toLocaleTimeString()}
                        </p>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation(); // Prevent card click
                          console.log("Dashboard chat button clicked for trade:", trade.id);
                          console.log("About to navigate to:", `/chat/${trade.id}`);
                          if (trade && trade.id) {
                            setLocation(`/chat/${trade.id}`);
                            console.log("Navigation command sent to:", `/chat/${trade.id}`);
                          } else {
                            console.error("Invalid trade data for chat navigation:", trade);
                          }
                        }}
                        className="px-3 py-1 h-7 text-xs ml-auto z-10 relative"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </div>
                ))}
                {activeTrades.length > 3 && (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setLocation('/trades')}>
                    View All Active Trades
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Offers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              My Offers ({activeOffers.length})
              {offersError && (
                <span className="text-xs text-red-500">(Error loading)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {offersError ? (
              <div className="text-center py-4">
                <p className="text-red-500 mb-2">Failed to load offers</p>
                <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            ) : activeOffers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">
                  {Array.isArray(offers) && offers.length > 0 
                    ? `${offers.length} offers found, but none are active` 
                    : "No offers created yet"
                  }
                </p>
                <div className="space-y-2">
                  <Button size="sm" onClick={() => setLocation('/marketplace')}>
                    Create Your First Offer
                  </Button>
                  {offers.length > 0 && (
                    <Button size="sm" variant="outline" onClick={() => setLocation('/manage-offers')}>
                      Manage Offers ({offers.length})
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="text-sm text-gray-600">Buy Offers</p>
                    <p className="font-bold text-green-600">{buyOffers.length}</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <p className="text-sm text-gray-600">Sell Offers</p>
                    <p className="font-bold text-red-600">{sellOffers.length}</p>
                  </div>
                </div>
                {activeOffers.slice(0, 3).map((offer: any) => (
                  <div 
                    key={offer.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 hover:border hover:border-blue-300 transition-all duration-200"
                    onClick={() => {
                      setSelectedOffer(offer);
                      setShowOfferModal(true);
                    }}
                  >
                    <div>
                      <p className="font-medium capitalize">{offer.type} USDT</p>
                      <p className="text-sm text-gray-600">
                        ${parseFloat(offer.amount || 0).toFixed(2)} @ ₦{parseFloat(offer.rate || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Min: ${parseFloat(offer.minAmount || 0).toFixed(2)} - Max: ${parseFloat(offer.maxAmount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={offer.type === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}>
                        {offer.type === 'buy' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {offer.type.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(offer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" onClick={() => setLocation('/manage-offers')}>
                  Manage All Offers ({offers.length})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Recent Trading Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTrades.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentTrades.map((trade: any) => {
                const isUserBuyer = trade.buyerId === user?.id;
                const partner = isUserBuyer ? trade.seller : trade.buyer;

                return (
                  <div 
                    key={trade.id} 
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors"
                    onClick={() => setLocation(`/trades/${trade.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        trade.status === 'completed' ? 'bg-green-500' :
                        trade.status === 'disputed' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="font-medium">
                          {isUserBuyer ? 'Bought' : 'Sold'} ${parseFloat(trade.amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {isUserBuyer ? 'from' : 'to'} {partner?.username || partner?.email} • {new Date(trade.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₦{parseFloat(trade.fiatAmount).toLocaleString()}</p>
                      <Badge className={getStatusColor(trade.status)} size="sm">
                        {formatStatusDisplay(trade.status)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-500 text-sm">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction: any) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setShowTransactionModal(true);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === "deposit" 
                        ? "bg-green-100" 
                        : "bg-red-100"
                    }`}>
                      {transaction.type === "deposit" ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {transaction.type === "deposit" ? "Deposit" : "Withdrawal"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === "deposit" ? "text-green-600" : "text-red-600"
                    }`}>
                      {transaction.type === "deposit" ? "+" : "-"}₦{parseFloat(transaction.amount).toLocaleString()}
                    </p>
                    <Badge variant={transaction.status === "completed" ? "default" : "secondary"} className="text-xs">
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {transactions.length > 5 && (
                <div className="text-center pt-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => setLocation('/wallet')}
                  >
                    View All Transactions
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Featured Offers with Filter Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Featured Offers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy">Buy USDT</TabsTrigger>
              <TabsTrigger value="sell">Sell USDT</TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-3 sm:space-y-4 mt-4">
              {featuredOffers?.buyOffers?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No buy offers available</p>
                  <Button onClick={() => setLocation('/marketplace')}>
                    View All Offers
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {featuredOffers?.buyOffers?.map((offer: any) => (
                    <Card key={offer.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3 sm:p-4">
                        <div className="space-y-3">
                          {/* Mobile optimized header */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${offer.user && offer.user.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                  <span className="font-medium text-sm sm:text-base truncate">{offer.user?.username || offer.user?.firstName || offer.user?.email?.split('@')[0] || 'Unknown'}</span>
                                  {offer.user && offer.user.isOnline ? (
                                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs h-5 px-1">
                                      Online
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs h-5 px-1">
                                      Offline
                                    </Badge>
                                  )}
                                  {offer.user?.kycVerified && (
                                    <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs h-5 px-1">
                                      <Shield className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                      <span className="hidden sm:inline">Verified</span>
                                      <span className="sm:hidden">KYC</span>
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 mt-1">
                                  <Activity className="h-2 w-2 sm:h-3 sm:w-3 text-yellow-400 flex-shrink-0" />
                                  <span>{parseFloat(offer.user?.averageRating || "0").toFixed(1)}</span>
                                  <span>({offer.user?.ratingCount || 0})</span>
                                  <span>•</span>
                                  <span>{offer.user?.completedTrades || 0} trades</span>
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="flex items-center gap-1 text-xs h-6 px-2 self-start sm:self-auto">
                              <DollarSign className="h-2 w-2 sm:h-3 sm:w-3" />
                              <span className="hidden sm:inline">{offer.paymentMethod?.replace('_', ' ').toUpperCase() || 'Bank Transfer'}</span>
                              <span className="sm:hidden">{(offer.paymentMethod || 'bank_transfer').split('_')[0].toUpperCase()}</span>
                            </Badge>
                          </div>

                          {/* Mobile optimized stats grid */}
                          <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            <div className="text-center sm:text-left">
                              <p className="text-xs text-gray-600">Available</p>
                              <p className="font-semibold text-sm sm:text-base">{parseFloat(offer.amount || "0").toFixed(2)}</p>
                              <p className="text-xs text-gray-500">USDT</p>
                            </div>
                            <div className="text-center sm:text-left">
                              <p className="text-xs text-gray-600">Rate</p>
                              <p className="font-semibold text-green-600 text-sm sm:text-base">₦{parseFloat(offer.rate || "0").toLocaleString()}</p>
                            </div>
                            <div className="text-center sm:text-left">
                              <p className="text-xs text-gray-600">Limits</p>
                              <p className="font-semibold text-xs sm:text-sm">
                                {offer.minAmount && offer.maxAmount
                                  ? `${parseFloat(offer.minAmount).toFixed(2)}-${parseFloat(offer.maxAmount).toFixed(2)}`
                                  : parseFloat(offer.amount || "0").toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">USDT</p>
                            </div>
                          </div>

                          {/* Mobile optimized action buttons */}
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => {
                                // Store selected offer data in sessionStorage for the trade modal
                                sessionStorage.setItem('selectedOffer', JSON.stringify(offer));
                                setLocation(`/trade-direct/${offer.id}`);
                              }}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-sm py-2 h-9"
                              disabled={!user || offer.userId === user?.id}
                            >
                              <span className="hidden sm:inline">Buy USDT</span>
                              <span className="sm:hidden">Buy</span>
                            </Button>
                            <Button
                              onClick={() => {
                                // Create a direct message to the offer owner
                                if (user && offer.userId !== user.id) {
                                  setLocation(`/user-chat/${offer.userId}`);
                                }
                              }}
                              variant="outline"
                              size="sm"
                              className="px-3 h-9"
                              disabled={!user || offer.userId === user?.id}
                            >
                              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="ml-1 hidden sm:inline">Chat</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setLocation('/marketplace')}>
                    View All Buy Offers
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sell" className="space-y-3 sm:space-y-4 mt-4">
              {featuredOffers?.sellOffers?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No sell offers available</p>
                  <Button onClick={() => setLocation('/marketplace')}>
                    View All Offers
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {featuredOffers?.sellOffers?.map((offer: any) => (
                    <Card key={offer.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3 sm:p-4">
                        <div className="space-y-3">
                          {/* Mobile optimized header */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${offer.user && offer.user.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                  <span className="font-medium text-sm sm:text-base truncate">{offer.user?.username || offer.user?.firstName || offer.user?.email?.split('@')[0] || 'Unknown'}</span>
                                  {offer.user && offer.user.isOnline ? (
                                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs h-5 px-1">
                                      Online
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs h-5 px-1">
                                      Offline
                                    </Badge>
                                  )}
                                  {offer.user?.kycVerified && (
                                    <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs h-5 px-1">
                                      <Shield className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                      <span className="hidden sm:inline">Verified</span>
                                      <span className="sm:hidden">KYC</span>
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 mt-1">
                                  <Activity className="h-2 w-2 sm:h-3 sm:w-3 text-yellow-400 flex-shrink-0" />
                                  <span>{parseFloat(offer.user?.averageRating || "0").toFixed(1)}</span>
                                  <span>({offer.user?.ratingCount || 0})</span>
                                  <span>•</span>
                                  <span>{offer.user?.completedTrades || 0} trades</span>
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="flex items-center gap-1 text-xs h-6 px-2 self-start sm:self-auto">
                              <DollarSign className="h-2 w-2 sm:h-3 sm:w-3" />
                              <span className="hidden sm:inline">{offer.paymentMethod?.replace('_', ' ').toUpperCase() || 'Bank Transfer'}</span>
                              <span className="sm:hidden">{(offer.paymentMethod || 'bank_transfer').split('_')[0].toUpperCase()}</span>
                            </Badge>
                          </div>

                          {/* Mobile optimized stats grid */}
                          <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            <div className="text-center sm:text-left">
                              <p className="text-xs text-gray-600">Selling</p>
                              <p className="font-semibold text-sm sm:text-base">{parseFloat(offer.amount || "0").toFixed(2)}</p>
                              <p className="text-xs text-gray-500">USDT</p>
                            </div>
                            <div className="text-center sm:text-left">
                              <p className="text-xs text-gray-600">Rate</p>
                              <p className="font-semibold text-red-600 text-sm sm:text-base">₦{parseFloat(offer.rate || "0").toLocaleString()}</p>
                            </div>
                            <div className="text-center sm:text-left">
                              <p className="text-xs text-gray-600">Limits</p>
                              <p className="font-semibold text-xs sm:text-sm">
                                {offer.minAmount && offer.maxAmount
                                  ? `${parseFloat(offer.minAmount).toFixed(2)}-${parseFloat(offer.maxAmount).toFixed(2)}`
                                  : parseFloat(offer.amount || "0").toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">USDT</p>
                            </div>
                          </div>

                          {/* Mobile optimized action buttons */}
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => {
                                // Store selected offer data in sessionStorage for the trade modal
                                sessionStorage.setItem('selectedOffer', JSON.stringify(offer));
                                setLocation(`/trade-direct/${offer.id}`);
                              }}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-sm py-2 h-9"
                              disabled={!user || offer.userId === user?.id}
                            >
                              <span className="hidden sm:inline">Sell USDT</span>
                              <span className="sm:hidden">Sell</span>
                            </Button>
                            <Button
                              onClick={() => {
                                // Create a direct message to the offer owner
                                if (user && offer.userId !== user.id) {
                                  setLocation(`/user-chat/${offer.userId}`);
                                }
                              }}
                              variant="outline"
                              size="sm"
                              className="px-3 h-9"
                              disabled={!user || offer.userId === user?.id}
                            >
                              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="ml-1 hidden sm:inline">Chat</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setLocation('/marketplace')}>
                    View All Sell Offers
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Market Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center p-3 bg-gray-50 rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Offers</p>
                <p className="font-bold text-blue-600">{marketStats?.totalOffers || 0}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Best Buy Rate</p>
                <p className="font-bold text-green-600">
                  ₦{marketStats?.bestBuyRate?.toLocaleString() || 'N/A'}
                </p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Best Sell Rate</p>
                <p className="font-bold text-red-600">
                  ₦{marketStats?.bestSellRate?.toLocaleString() || 'N/A'}
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">24h Volume</p>
                <p className="font-bold text-purple-600">
                  ₦{marketStats?.last24hVolume?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setSelectedTransaction(null);
        }}
      />

      {/* Offer Detail Modal */}
      <Dialog open={showOfferModal} onOpenChange={setShowOfferModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedOffer?.type === 'buy' ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              Offer Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedOffer && (
            <div className="space-y-4">
              {/* Offer Type and Status */}
              <div className="flex items-center justify-between">
                <Badge 
                  className={selectedOffer.type === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
                  size="lg"
                >
                  {selectedOffer.type.toUpperCase()} USDT
                </Badge>
                <Badge variant={selectedOffer.status === 'active' ? 'default' : 'secondary'}>
                  {selectedOffer.status.toUpperCase()}
                </Badge>
              </div>

              {/* Main Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-semibold">${parseFloat(selectedOffer.amount || 0).toFixed(2)} USDT</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Rate</p>
                  <p className="font-semibold text-green-600">₦{parseFloat(selectedOffer.rate || 0).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Min Amount</p>
                  <p className="font-semibold">${parseFloat(selectedOffer.minAmount || 0).toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Max Amount</p>
                  <p className="font-semibold">${parseFloat(selectedOffer.maxAmount || 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Payment Method</p>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {selectedOffer.paymentMethod?.replace('_', ' ').toUpperCase() || 'Bank Transfer'}
                </Badge>
              </div>

              {/* Total Value */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-lg font-bold text-blue-600">
                  ₦{(parseFloat(selectedOffer.amount || 0) * parseFloat(selectedOffer.rate || 0)).toLocaleString()}
                </p>
              </div>

              {/* Terms */}
              {selectedOffer.terms && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Terms & Conditions</p>
                  <p className="text-sm bg-gray-50 p-2 rounded">{selectedOffer.terms}</p>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                Created on {new Date(selectedOffer.createdAt).toLocaleDateString()}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowOfferModal(false);
                    setLocation('/manage-offers');
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Offer
                </Button>
                <Button 
                  onClick={() => {
                    setShowOfferModal(false);
                    setLocation('/marketplace');
                  }}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View in Market
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}