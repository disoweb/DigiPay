import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Clock,
  ArrowRight,
  Plus,
  Shield,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Activity,
  MessageCircle,
  Inbox
} from "lucide-react";
import { MessagingSystem } from "@/components/messaging-system";

export function TradingDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

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

  // Force refetch when component mounts and user is available
  useEffect(() => {
    if (user?.id && refetchTrades) {
      const timer = setTimeout(() => {
        refetchTrades();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user?.id, refetchTrades]);

  const { data: offers = [], error: offersError } = useQuery({
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
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Calculate total portfolio value in NGN
  const usdtInNgn = parseFloat(user?.usdtBalance || "0") * 1485; // Using exchange rate
  const ngnBalance = parseFloat(user?.nairaBalance || "0");
  const totalPortfolioValue = usdtInNgn + ngnBalance;

  return (
    <div className="space-y-6">
      {/* Total Portfolio Value Card */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="text-center">
            <h2 className="text-lg font-medium text-white/90 mb-2">Total Portfolio Value</h2>
            <div className="text-4xl font-bold mb-6">
              ₦{totalPortfolioValue.toLocaleString()}
            </div>

            <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
              <div className="text-center">
                <p className="text-white/90 text-sm mb-1">NGN</p>
                <p className="text-xl font-semibold">₦{ngnBalance.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-white/90 text-sm mb-1">USDT</p>
                <p className="text-xl font-semibold">${parseFloat(user?.usdtBalance || "0").toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
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
                  <div key={trade.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium">Trade #{trade.id}</p>
                        <p className="text-sm text-gray-600">
                          ${parseFloat(trade.amount).toFixed(2)} @ ₦{parseFloat(trade.rate).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(trade.status)}>
                        {trade.status.replace('_', ' ').toUpperCase()}
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
                        onClick={() => setLocation(`/trades/${trade.id}/chat`)}
                        className="px-3 py-1 h-7 text-xs ml-auto"
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
                  <div key={offer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                  <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                          {isUserBuyer ? 'from' : 'to'} {partner?.email} • {new Date(trade.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₦{parseFloat(trade.fiatAmount).toLocaleString()}</p>
                      <Badge className={getStatusColor(trade.status)} size="sm">
                        {trade.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                );
              })}
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
            
            <TabsContent value="buy" className="space-y-4 mt-4">
              {featuredOffers?.buyOffers?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No buy offers available</p>
                  <Button onClick={() => setLocation('/marketplace')}>
                    View All Offers
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {featuredOffers?.buyOffers?.map((offer: any) => (
                    <Card key={offer.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${offer.user?.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{offer.user?.email || 'Unknown'}</span>
                                  {offer.user?.isOnline ? (
                                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                      Online
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs">
                                      Offline
                                    </Badge>
                                  )}
                                  {offer.user?.kycVerified && (
                                    <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Verified
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Activity className="h-3 w-3 text-yellow-400" />
                                  <span>{parseFloat(offer.user?.averageRating || "0").toFixed(1)}</span>
                                  <span>({offer.user?.ratingCount || 0})</span>
                                  <span>•</span>
                                  <span>{offer.user?.completedTrades || 0} trades</span>
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {offer.paymentMethod?.replace('_', ' ').toUpperCase() || 'Bank Transfer'}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Available</p>
                              <p className="font-semibold">{parseFloat(offer.amount || "0").toFixed(2)} USDT</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Rate</p>
                              <p className="font-semibold text-green-600">₦{parseFloat(offer.rate || "0").toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Limits</p>
                              <p className="font-semibold text-sm">
                                {offer.minAmount && offer.maxAmount
                                  ? `${parseFloat(offer.minAmount).toFixed(2)} - ${parseFloat(offer.maxAmount).toFixed(2)}`
                                  : parseFloat(offer.amount || "0").toFixed(2)} USDT
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              onClick={() => setLocation('/marketplace')}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              disabled={!user}
                            >
                              Buy USDT
                            </Button>
                            <Button
                              onClick={() => setLocation('/marketplace')}
                              variant="outline"
                              size="icon"
                              disabled={!user}
                            >
                              <MessageCircle className="h-4 w-4" />
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

            <TabsContent value="sell" className="space-y-4 mt-4">
              {featuredOffers?.sellOffers?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No sell offers available</p>
                  <Button onClick={() => setLocation('/marketplace')}>
                    View All Offers
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {featuredOffers?.sellOffers?.map((offer: any) => (
                    <Card key={offer.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${offer.user?.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{offer.user?.email || 'Unknown'}</span>
                                  {offer.user?.isOnline ? (
                                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                      Online
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs">
                                      Offline
                                    </Badge>
                                  )}
                                  {offer.user?.kycVerified && (
                                    <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Verified
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Activity className="h-3 w-3 text-yellow-400" />
                                  <span>{parseFloat(offer.user?.averageRating || "0").toFixed(1)}</span>
                                  <span>({offer.user?.ratingCount || 0})</span>
                                  <span>•</span>
                                  <span>{offer.user?.completedTrades || 0} trades</span>
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {offer.paymentMethod?.replace('_', ' ').toUpperCase() || 'Bank Transfer'}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Buying</p>
                              <p className="font-semibold">{parseFloat(offer.amount || "0").toFixed(2)} USDT</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Rate</p>
                              <p className="font-semibold text-red-600">₦{parseFloat(offer.rate || "0").toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Limits</p>
                              <p className="font-semibold text-sm">
                                {offer.minAmount && offer.maxAmount
                                  ? `${parseFloat(offer.minAmount).toFixed(2)} - ${parseFloat(offer.maxAmount).toFixed(2)}`
                                  : parseFloat(offer.amount || "0").toFixed(2)} USDT
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              onClick={() => setLocation('/marketplace')}
                              className="flex-1 bg-red-600 hover:bg-red-700"
                              disabled={!user}
                            >
                              Sell USDT
                            </Button>
                            <Button
                              onClick={() => setLocation('/marketplace')}
                              variant="outline"
                              size="icon"
                              disabled={!user}
                            >
                              <MessageCircle className="h-4 w-4" />
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
    </div>
  );
}