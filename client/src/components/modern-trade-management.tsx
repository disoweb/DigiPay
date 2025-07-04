import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  MessageCircle,
  AlertTriangle,
  Eye,
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  Shield,
  RefreshCw,
  ArrowLeft,
  Search,
  Filter,
  X,
  ChevronRight,
  Activity,
  CheckCircle2,
  XCircle,
  Timer,
  Users,
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

export function ModernTradeManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'completed' | 'disputed' | 'expired'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [hiddenCanceledTrades, setHiddenCanceledTrades] = useState<Set<number>>(new Set());

  const { data: trades = [], isLoading, error, refetch, isSuccess } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/trades");
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 15000,
    retry: 2,
    staleTime: 10000,
    refetchOnWindowFocus: false,
  });

  // Auto-hide canceled trades after 9 minutes
  useEffect(() => {
    const canceledTrades = trades.filter(trade => trade.status === 'canceled');
    
    canceledTrades.forEach(trade => {
      const tradeCreatedTime = new Date(trade.createdAt).getTime();
      const nineMinutesLater = tradeCreatedTime + (9 * 60 * 1000);
      const timeUntilHide = nineMinutesLater - Date.now();
      
      if (timeUntilHide > 0 && !hiddenCanceledTrades.has(trade.id)) {
        setTimeout(() => {
          setHiddenCanceledTrades(prev => new Set([...prev, trade.id]));
        }, timeUntilHide);
      } else if (timeUntilHide <= 0) {
        setHiddenCanceledTrades(prev => new Set([...prev, trade.id]));
      }
    });
  }, [trades, hiddenCanceledTrades]);



  // Reopen trade mutation
  const reopenTradeMutation = useMutation({
    mutationFn: async (tradeId: number) => {
      const response = await apiRequest("POST", `/api/trades/${tradeId}/reopen`);
      if (!response.ok) throw new Error('Failed to reopen trade');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      toast({ title: "Success", description: "Trade reopened successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reopen trade", variant: "destructive" });
    },
  });

  // Filter trades
  // Calculate visible trades (use trades directly since useQuery handles loading states)
  const visibleTrades = trades.filter(trade => 
    trade.status !== 'canceled' || !hiddenCanceledTrades.has(trade.id)
  );

  const activeTrades = visibleTrades.filter(trade => 
    ["payment_pending", "payment_made"].includes(trade.status) && trade.status !== "expired"
  );

  // Filter expired trades (expired within last 24 hours for reopen functionality)
  const expiredTrades = visibleTrades.filter(trade => {
    if (trade.status !== 'expired') return false;
    
    // Check if expired within last 24 hours (more practical for users)
    const updatedAt = new Date(trade.updatedAt || trade.createdAt);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return updatedAt > twentyFourHoursAgo;
  });



  const filteredTrades = (() => {
    let filtered;
    switch (selectedStatus) {
      case 'active':
        filtered = activeTrades;
        break;
      case 'completed':
        filtered = visibleTrades.filter(trade => trade.status === 'completed');
        break;
      case 'disputed':
        filtered = visibleTrades.filter(trade => trade.status === 'disputed');
        break;
      case 'expired':
        filtered = expiredTrades;
        break;
      default:
        filtered = visibleTrades;
    }
    
    if (searchTerm) {
      filtered = filtered.filter(trade => 
        trade.id.toString().includes(searchTerm) ||
        (trade.buyer?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trade.seller?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  })();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'payment_pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'payment_made': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
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
      case 'expired': return <XCircle className="h-3 w-3" />;
      case 'disputed': return <AlertTriangle className="h-3 w-3" />;
      case 'canceled': return <XCircle className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const formatStatus = (status: string) => {
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

  const getTradeRole = (trade: Trade) => {
    return trade.buyerId === user?.id ? 'buyer' : 'seller';
  };

  const getTradePartner = (trade: Trade) => {
    return trade.buyerId === user?.id ? trade.seller : trade.buyer;
  };

  const completedCount = visibleTrades.filter(t => t.status === 'completed').length;
  const disputedCount = visibleTrades.filter(t => t.status === 'disputed').length;
  
  const quickFilters = [
    { key: 'active', label: 'Active', count: activeTrades.length, icon: Activity, color: 'text-green-600' },
    { key: 'completed', label: 'Completed', count: completedCount, icon: CheckCircle2, color: 'text-blue-600' },
    { key: 'expired', label: 'Expired', count: expiredTrades.length, icon: Timer, color: 'text-red-600' },
    { key: 'disputed', label: 'Disputed', count: disputedCount, icon: AlertTriangle, color: 'text-orange-600' },
    { key: 'all', label: 'All', count: visibleTrades.length, icon: Users, color: 'text-purple-600' },
  ];

  // Smart default selection: active -> completed -> all
  useEffect(() => {
    if (!isLoading && trades.length > 0) {
      if (selectedStatus === 'active' && activeTrades.length === 0) {
        if (completedCount > 0) {
          setSelectedStatus('completed');
        } else {
          setSelectedStatus('all');
        }
      }
    }
  }, [activeTrades.length, completedCount, isLoading, trades.length, selectedStatus]);



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold">My Trades</h1>
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold">My Trades</h1>
            <div className="w-8" />
          </div>
        </div>
        
        <div className="p-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <h3 className="font-medium text-red-900 mb-2">Failed to load trades</h3>
              <p className="text-red-700 text-sm mb-4">Please check your connection and try again</p>
              <Button onClick={() => refetch()} variant="outline" className="border-red-300">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">My Trades</h1>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by trade ID, partner, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 h-10 border-gray-200 focus:border-blue-500"
          />
          {searchTerm && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick Filter Pills */}
      <div className="p-4 bg-white border-b">
        <div className="relative">
          {/* Gradient fade indicators for mobile scrolling */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none sm:hidden"></div>
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none sm:hidden"></div>
          
          <div className="flex gap-1 pb-2 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory">
            {quickFilters.filter(filter => filter.count > 0).map((filter) => {
              const Icon = filter.icon;
              const isActive = selectedStatus === filter.key;
              return (
                <Button
                  key={filter.key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus(filter.key as any)}
                  className={`flex-shrink-0 whitespace-nowrap snap-start ${isActive ? '' : 'border-gray-200'}`}
                >
                  <Icon className={`h-3 w-3 mr-1 ${isActive ? 'text-white' : filter.color}`} />
                  <span className="hidden sm:inline">{filter.label}</span>
                  <span className="sm:hidden">{filter.label.slice(0, 3)}</span>
                  <Badge 
                    variant="secondary" 
                    className={`ml-1 ${isActive ? 'bg-white/20 text-white' : ''}`}
                  >
                    {filter.count}
                  </Badge>
                </Button>
              );
            })}
            {/* Always show "All" filter if not already visible */}
            {!quickFilters.filter(filter => filter.count > 0).find(f => f.key === 'all') && (
              <Button
                variant={selectedStatus === 'all' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus('all')}
                className={`flex-shrink-0 whitespace-nowrap snap-start ${selectedStatus === 'all' ? '' : 'border-gray-200'}`}
              >
                <Users className={`h-3 w-3 mr-1 ${selectedStatus === 'all' ? 'text-white' : 'text-purple-600'}`} />
                <span className="hidden sm:inline">All</span>
                <span className="sm:hidden">All</span>
                <Badge 
                  variant="secondary" 
                  className={`ml-1 ${selectedStatus === 'all' ? 'bg-white/20 text-white' : ''}`}
                >
                  {trades.length}
                </Badge>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Trade List */}
      <div className="p-4">
        {/* Expired trades info banner */}
        {selectedStatus === 'expired' && expiredTrades.length > 0 && (
          <Card className="mb-4 border-orange-200 bg-orange-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-orange-800">
                <Clock className="h-4 w-4" />
                <p className="text-sm">
                  Expired trades are shown for 24 hours, then automatically removed. Click "Reopen" to restart with a new 24-hour deadline.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredTrades.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                {selectedStatus === 'expired' ? (
                  <Timer className="h-8 w-8 text-gray-400" />
                ) : (
                  <Search className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedStatus === 'expired' ? 'No expired trades' : 'No trades found'}
              </h3>
              <p className="text-gray-500 mb-4">
                {selectedStatus === 'expired' 
                  ? 'Expired trades from the last hour will appear here.'
                  : searchTerm 
                    ? 'Try adjusting your search terms' 
                    : 'No trades found in this category'
                }
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTrades.map((trade) => {
              const role = getTradeRole(trade);
              const partner = getTradePartner(trade);
              const isExpiringSoon = trade.status === 'payment_pending' && 
                trade.paymentDeadline && 
                new Date(trade.paymentDeadline).getTime() - Date.now() < 5 * 60 * 1000 &&
                new Date(trade.paymentDeadline).getTime() > Date.now();

              const isExpiredTrade = trade.status === 'expired';
              
              return (
                <Card 
                  key={trade.id}
                  className={`transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
                    isExpiredTrade ? 'border-red-200 bg-red-50 shadow-sm' :
                    isExpiringSoon ? 'border-orange-300 bg-orange-50 shadow-sm' : 'border-gray-200'
                  }`}
                >
                  <CardContent className="p-4">
                    {/* Trade Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">Trade #{trade.id}</h3>
                        <Badge className={`${getStatusColor(trade.status)} flex items-center gap-1`}>
                          {getStatusIcon(trade.status)}
                          {formatStatus(trade.status)}
                        </Badge>
                      </div>
                      {isExpiringSoon && (
                        <Badge variant="outline" className="border-orange-500 text-orange-700">
                          <Clock className="h-3 w-3 mr-1" />
                          Expires Soon
                        </Badge>
                      )}
                    </div>

                    {/* Trade Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Role</span>
                        <span className="font-medium text-sm capitalize text-gray-900">{role}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Amount</span>
                        <span className="font-medium text-sm text-gray-900">
                          ${parseFloat(trade.amount || '0').toFixed(2)} USDT
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Rate</span>
                        <span className="font-medium text-sm text-gray-900">
                          ₦{parseFloat(trade.rate || '0').toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Partner</span>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                              {(partner?.email || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm text-gray-900 truncate max-w-24">
                            {partner?.username || partner?.email?.split('@')[0] || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      {trade.paymentDeadline && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Deadline</span>
                          <span className="font-medium text-xs text-gray-900">
                            {new Date(trade.paymentDeadline).toLocaleDateString()} {new Date(trade.paymentDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator className="mb-4" />

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 h-9"
                        onClick={() => setLocation(`/trades/${trade.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-2" />
                        View Details
                      </Button>
                      {trade.status === 'expired' ? (
                        <Button 
                          size="sm"
                          className="flex-1 h-9 bg-blue-600 hover:bg-blue-700"
                          onClick={() => reopenTradeMutation.mutate(trade.id)}
                          disabled={reopenTradeMutation.isPending}
                        >
                          {reopenTradeMutation.isPending ? (
                            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3 mr-2" />
                          )}
                          Reopen
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          className="flex-1 h-9 bg-blue-600 hover:bg-blue-700"
                          onClick={() => setLocation(`/chat/${trade.id}`)}
                        >
                          <MessageCircle className="h-3 w-3 mr-2" />
                          Chat
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Padding for Mobile Navigation */}
      <div className="h-20" />
    </div>
  );
}