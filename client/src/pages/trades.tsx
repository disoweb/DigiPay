import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  Clock, 
  DollarSign, 
  User, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye
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
  createdAt: string;
  buyer?: { id: number; email: string; averageRating: string };
  seller?: { id: number; email: string; averageRating: string };
  offer?: { type: string; paymentMethod?: string };
}

export default function Trades() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: trades = [], isLoading, error } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
    queryFn: async () => {
      const token = localStorage.getItem('digipay_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/trades", {
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to load trades: ${res.status}`);
      }

      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter trades for current user
  const userTrades = trades.filter(trade => 
    trade.buyerId === user?.id || trade.sellerId === user?.id
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'payment_pending': return 'bg-blue-100 text-blue-800';
      case 'payment_made': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'disputed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-600" />;
      case 'expired': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600">Failed to load trades. Please try again.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Trades</h1>
          <p className="text-gray-600">Track your P2P trading activity</p>
        </div>

        {/* Trade Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Trades</p>
                  <p className="text-2xl font-bold text-gray-900">{userTrades.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userTrades.filter(t => t.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userTrades.filter(t => ['payment_pending', 'payment_made'].includes(t.status)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Volume</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userTrades.reduce((sum, trade) => sum + parseFloat(trade.amount), 0).toFixed(0)} USDT
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trades List */}
        <div className="space-y-4">
          {userTrades.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No trades found</h3>
                <p className="text-gray-500 mb-4">
                  You haven't created any trades yet. Visit the marketplace to start trading.
                </p>
                <Button onClick={() => setLocation('/marketplace')}>
                  Go to Marketplace
                </Button>
              </CardContent>
            </Card>
          ) : (
            userTrades.map((trade) => {
              const userRole = trade.buyerId === user?.id ? 'buyer' : 'seller';
              const otherUser = userRole === 'buyer' ? trade.seller : trade.buyer;
              const isUrgent = trade.status === 'payment_pending' && trade.paymentDeadline && 
                new Date(trade.paymentDeadline) < new Date(Date.now() + 5 * 60 * 1000); // 5 minutes left

              return (
                <Card key={trade.id} className={`border-0 shadow-sm hover:shadow-md transition-shadow ${isUrgent ? 'ring-2 ring-red-200' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(trade.status)}
                          <span className="font-semibold">Trade #{trade.id}</span>
                        </div>
                        <Badge className={getStatusColor(trade.status)}>
                          {trade.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {userRole === 'buyer' && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Buying
                          </Badge>
                        )}
                        {userRole === 'seller' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Selling
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(trade.createdAt).toLocaleDateString()}
                        </p>
                        {isUrgent && (
                          <p className="text-xs text-red-600 font-medium">
                            Payment deadline approaching
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Amount</p>
                        <p className="font-semibold">{parseFloat(trade.amount).toFixed(2)} USDT</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Rate</p>
                        <p className="font-semibold">₦{parseFloat(trade.rate).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="font-semibold">₦{parseFloat(trade.fiatAmount).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Trading with</p>
                        <p className="font-semibold">{otherUser?.email.split('@')[0] || 'Unknown'}</p>
                      </div>
                    </div>

                    {trade.paymentDeadline && ['payment_pending', 'payment_made'].includes(trade.status) && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            Payment deadline: {new Date(trade.paymentDeadline).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        {trade.escrowAddress && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            Escrow protected
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={() => setLocation(`/trades/${trade.id}`)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}