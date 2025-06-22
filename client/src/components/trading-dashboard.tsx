import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity,
  Users,
  Shield,
  Star,
  MessageCircle
} from "lucide-react";

export function TradingDashboard() {
  const { user } = useAuth();

  const { data: trades = [] } = useQuery({
    queryKey: ['/api/trades'],
    refetchInterval: 5000,
  });

  const { data: offers = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/offers`],
    enabled: !!user?.id,
  });

  const { data: marketStats } = useQuery({
    queryKey: ['/api/market/stats'],
    refetchInterval: 10000,
  });

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

  const activeOffers = offers.filter((o: any) => o.status === 'active');
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

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* User Profile Summary */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">KYC Status:</span>
                  {user.kycVerified ? (
                    <Badge className="text-green-600 bg-green-100">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge className="text-yellow-600 bg-yellow-100">
                      Pending
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rating:</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="font-medium">
                      {parseFloat(user.averageRating || "0").toFixed(1)} ({user.ratingCount || 0})
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">USDT Balance:</span>
                  <span className="font-medium">{parseFloat(user.usdtBalance || "0").toFixed(8)} USDT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Naira Balance:</span>
                  <span className="font-medium">₦{parseFloat(user.nairaBalance || "0").toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed Trades:</span>
                  <span className="font-medium">{completedTrades.length}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Trade Performance</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Success Rate</span>
                    <span>{successRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={successRate} className="h-2" />
                </div>
                {disputedTrades.length > 0 && (
                  <Alert className="mt-2">
                    <AlertTriangle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      {disputedTrades.length} disputed trade(s) need attention
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Trade #{trade.id}</p>
                      <p className="text-sm text-gray-600">
                        {parseFloat(trade.amount).toFixed(2)} USDT @ ₦{parseFloat(trade.rate).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(trade.status)}>
                        {trade.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {trade.paymentDeadline && (
                        <p className="text-xs text-gray-500 mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(trade.paymentDeadline).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {activeTrades.length > 3 && (
                  <Button variant="outline" size="sm" className="w-full">
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeOffers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">No active offers</p>
                <Button size="sm" onClick={() => window.open('/offer-creation', '_blank')}>
                  Create Your First Offer
                </Button>
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
                        {parseFloat(offer.amount).toFixed(2)} USDT @ ₦{parseFloat(offer.rate).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={offer.type === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}>
                      {offer.type === 'buy' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {offer.type.toUpperCase()}
                    </Badge>
                  </div>
                ))}
                {activeOffers.length > 3 && (
                  <Button variant="outline" size="sm" className="w-full">
                    Manage All Offers
                  </Button>
                )}
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
                          {isUserBuyer ? 'Bought' : 'Sold'} {parseFloat(trade.amount).toFixed(2)} USDT
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

      {/* Market Overview */}
      {marketStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Market Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Offers</p>
                <p className="font-bold text-blue-600">{marketStats.totalOffers}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Best Buy Rate</p>
                <p className="font-bold text-green-600">
                  ₦{marketStats.bestBuyRate?.toLocaleString() || 'N/A'}
                </p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Best Sell Rate</p>
                <p className="font-bold text-red-600">
                  ₦{marketStats.bestSellRate?.toLocaleString() || 'N/A'}
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">24h Volume</p>
                <p className="font-bold text-purple-600">
                  ₦{marketStats.last24hVolume?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}