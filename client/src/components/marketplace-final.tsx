
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  Search, 
  Filter, 
  Star, 
  Shield, 
  MessageCircle, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Users,
  AlertCircle,
  Zap,
  ArrowUpDown,
  Eye,
  ChevronDown,
  RefreshCw,
  TrendingDown,
  Smartphone,
  Wallet,
  CreditCard,
  Timer
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  email: string;
  averageRating: string;
  ratingCount: number;
  completedTrades: number;
  kycVerified: boolean;
  isOnline?: boolean;
}

interface Offer {
  id: number;
  userId: number;
  type: 'buy' | 'sell';
  amount: string;
  rate: string;
  paymentMethod: string;
  minLimit?: string;
  maxLimit?: string;
  minAmount?: string;
  maxAmount?: string;
  user: User;
}

interface MarketStats {
  totalOffers: number;
  onlineTraders: number;
  buyOffers: number;
  sellOffers: number;
  bestBuyRate?: number;
  bestSellRate?: number;
}

function safeParseFloat(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('NGN', '₦');
}

function OfferCard({ offer, onStartTrade, onMessage, canContact }: { 
  offer: Offer; 
  onStartTrade: (offer: Offer) => void;
  onMessage: (offer: Offer) => void;
  canContact: (offer: Offer) => boolean;
}) {
  const isBuyOffer = offer.type === 'buy';
  
  return (
    <Card className="hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        {/* Mobile-First Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-4 h-4 rounded-full flex-shrink-0 ${offer.user?.isOnline ? 'bg-green-400 shadow-lg shadow-green-200 animate-pulse' : 'bg-gray-400'}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900 truncate text-lg">
                    {offer.user?.email?.split('@')[0] || 'Unknown'}
                  </span>
                  {offer.user?.kycVerified && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300 px-2 py-1">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {safeParseFloat(offer.user?.averageRating).toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({offer.user?.ratingCount || 0})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 font-medium">
                      {offer.user?.completedTrades || 0} trades
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`text-xs font-medium px-3 py-1 ${
                offer.user?.isOnline 
                  ? 'border-green-300 text-green-700 bg-green-50' 
                  : 'border-gray-300 text-gray-500 bg-gray-50'
              }`}
            >
              {offer.user?.isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 space-y-4">
          {/* Rate & Amount - Mobile Optimized */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Rate per USDT</div>
              <div className={`text-2xl font-black mb-1 ${isBuyOffer ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(safeParseFloat(offer.rate))}
              </div>
              <div className="flex items-center justify-center gap-1">
                {isBuyOffer ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className="text-xs text-gray-500 font-medium">Best Rate</span>
              </div>
            </div>
            
            <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="text-xs text-blue-600 mb-2 font-medium uppercase tracking-wide">Available</div>
              <div className="text-2xl font-black text-blue-700 mb-1">
                {safeParseFloat(offer.amount).toFixed(2)}
              </div>
              <div className="flex items-center justify-center gap-1">
                <Wallet className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-blue-600 font-medium">USDT</span>
              </div>
            </div>
          </div>

          {/* Payment & Limits - Mobile Card Layout */}
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-500 font-medium">Payment Method</span>
                </div>
                <Badge variant="outline" className="bg-white border-gray-300 text-gray-700 font-medium">
                  {offer.paymentMethod?.replace('_', ' ').toUpperCase() || 'Bank Transfer'}
                </Badge>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-500 font-medium">Trading Limits</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">
                    {safeParseFloat(offer.minLimit || offer.minAmount).toFixed(2)} USDT
                  </div>
                  <div className="text-xs text-gray-500">
                    to {safeParseFloat(offer.maxLimit || offer.maxAmount).toFixed(2)} USDT
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => onStartTrade(offer)}
              disabled={!canContact(offer)}
              className={`flex-1 h-12 text-base font-semibold rounded-full transition-all duration-200 border-0 ${
                isBuyOffer 
                  ? 'bg-white text-black hover:bg-gray-50 shadow-sm' 
                  : 'bg-gray-600 text-white hover:bg-gray-700 shadow-sm'
              } ${!canContact(offer) ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
              size="lg"
            >
              {isBuyOffer ? 'Buy USDT' : 'Sell USDT'}
            </Button>
            
            <Button
              onClick={() => onMessage(offer)}
              disabled={!canContact(offer)}
              variant="outline"
              className="h-12 px-4 rounded-full border border-gray-300 hover:bg-gray-50 transition-all duration-200 active:scale-95"
              size="lg"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MarketplaceFinal() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "buy" | "sell">("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"rate" | "amount" | "rating">("rate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: offers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/offers'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/offers");
      if (!response.ok) {
        throw new Error(`Failed to fetch offers: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const { data: marketStats }: { data: MarketStats | undefined } = useQuery({
    queryKey: ['/api/market/stats'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/market/stats");
      if (!response.ok) {
        throw new Error(`Failed to fetch market stats: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 60000,
  });

  const handleStartTrade = (offer: Offer) => {
    if (!user) {
      setLocation('/auth');
      return;
    }
    
    if (!canContactOffer(offer)) {
      return;
    }

    console.log("Starting trade with offer:", offer);
    // Store the offer data in sessionStorage to ensure it's available on the trade page
    sessionStorage.setItem('selectedOffer', JSON.stringify(offer));
    setLocation(`/trade-direct/${offer.id}`);
  };

  const handleMessageTrader = (offer: Offer) => {
    if (!user) {
      setLocation('/auth');
      return;
    }
    
    if (offer?.user?.id) {
      setLocation(`/user-chat/${offer.user.id}`);
    }
  };

  const canContactOffer = (offer: Offer): boolean => {
    if (!offer || !offer.user) return false;
    if (offer.userId === user?.id) return false;
    return true;
  };



  const sortOffers = (offersList: Offer[]) => {
    return [...offersList].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'rate':
          comparison = safeParseFloat(a.rate) - safeParseFloat(b.rate);
          break;
        case 'amount':
          comparison = safeParseFloat(a.amount) - safeParseFloat(b.amount);
          break;
        case 'rating':
          comparison = safeParseFloat(a.user?.averageRating) - safeParseFloat(b.user?.averageRating);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const filteredOffers = sortOffers(offers.filter((offer: Offer) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesEmail = offer.user?.email?.toLowerCase().includes(searchLower);
      const matchesAmount = offer.amount.includes(searchTerm);
      const matchesRate = offer.rate.includes(searchTerm);
      
      if (!matchesEmail && !matchesAmount && !matchesRate) {
        return false;
      }
    }

    // Type filter
    if (filterType !== "all" && offer.type !== filterType) {
      return false;
    }

    // Payment method filter
    if (paymentMethodFilter !== "all" && offer.paymentMethod !== paymentMethodFilter) {
      return false;
    }

    // Amount filters
    if (minAmount && safeParseFloat(offer.amount) < safeParseFloat(minAmount)) {
      return false;
    }

    if (maxAmount && safeParseFloat(offer.amount) > safeParseFloat(maxAmount)) {
      return false;
    }

    return true;
  }));

  const buyOffers = filteredOffers.filter((offer: Offer) => offer.type === 'buy');
  const sellOffers = filteredOffers.filter((offer: Offer) => offer.type === 'sell');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-6"></div>
          <div className="absolute inset-0 rounded-full bg-blue-50 opacity-20"></div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Marketplace</h3>
        <p className="text-gray-500 text-center max-w-sm leading-relaxed">
          Finding the best USDT rates from verified traders...
        </p>
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
          <Timer className="h-4 w-4 animate-pulse" />
          <span>Real-time data loading</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Alert className="border-red-200 bg-red-50 rounded-xl">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">
            Unable to load marketplace data. Please check your connection and try again.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          className="w-full h-12 rounded-xl font-medium"
          size="lg"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Retry Loading
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Mobile-First Market Overview */}
      <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <span className="text-gray-900">Live Market</span>
              <div className="text-sm font-normal text-gray-600">Real-time trading data</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white shadow-sm">
              <div className="text-2xl font-black text-blue-600 mb-1">{marketStats?.totalOffers || offers.length}</div>
              <div className="text-xs text-gray-600 font-medium">Total Offers</div>
            </div>
            <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white shadow-sm">
              <div className="text-2xl font-black text-green-600 mb-1">
                {offers.filter(o => o.user && o.user.isOnline).length}
              </div>
              <div className="text-xs text-gray-600 font-medium">Online Now</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white shadow-sm">
              <div className="text-2xl font-black text-purple-600 mb-1">{buyOffers.length}</div>
              <div className="text-xs text-gray-600 font-medium">Buy Orders</div>
            </div>
            <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white shadow-sm">
              <div className="text-2xl font-black text-orange-600 mb-1">{sellOffers.length}</div>
              <div className="text-xs text-gray-600 font-medium">Sell Orders</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Search & Filters */}
      <Card className="border-0 shadow-lg rounded-2xl">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Enhanced Search */}
            <div className="relative">
              <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search traders, amounts, or rates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base border-gray-200 focus:border-blue-400 rounded-xl"
              />
            </div>
            
            {/* Mobile-Optimized Filter Bar */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-shrink-0 rounded-xl font-medium"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
              
              <Button
                variant={sortBy === 'rate' ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSortBy('rate');
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className="flex-shrink-0 rounded-xl font-medium"
              >
                Rate
                <ArrowUpDown className="h-3 w-3 ml-1" />
              </Button>
              
              <Button
                variant={sortBy === 'amount' ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSortBy('amount');
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className="flex-shrink-0 rounded-xl font-medium"
              >
                Amount
                <ArrowUpDown className="h-3 w-3 ml-1" />
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Type</Label>
                    <Select value={filterType} onValueChange={(value: "all" | "buy" | "sell") => setFilterType(value)}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="buy">Buy Offers</SelectItem>
                        <SelectItem value="sell">Sell Offers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Min Amount (USDT)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Max Amount (USDT)</Label>
                    <Input
                      type="number"
                      placeholder="∞"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Mobile Tabs */}
      <Tabs defaultValue="buy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-2 h-16 rounded-2xl">
          <TabsTrigger 
            value="buy" 
            className="flex items-center gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white text-base font-bold rounded-xl transition-all duration-200"
          >
            <TrendingUp className="h-5 w-5" />
            <div className="text-left">
              <div className="text-sm font-bold">Buy USDT</div>
              <div className="text-xs opacity-80">{buyOffers.length} offers</div>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="sell" 
            className="flex items-center gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white text-base font-bold rounded-xl transition-all duration-200"
          >
            <DollarSign className="h-5 w-5" />
            <div className="text-left">
              <div className="text-sm font-bold">Sell USDT</div>
              <div className="text-xs opacity-80">{sellOffers.length} offers</div>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4 mt-8">
          {buyOffers.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
              <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Eye className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Buy Offers Available</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto leading-relaxed">
                {filteredOffers.length === 0 && offers.length > 0 
                  ? "Try adjusting your filters to see more offers" 
                  : "Be the first to create a buy offer and start trading"}
              </p>
              <Button 
                onClick={() => setLocation('/create-offer')} 
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold px-8 py-3 rounded-xl shadow-lg"
                size="lg"
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                Create Buy Offer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {buyOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onStartTrade={handleStartTrade}
                  onMessage={handleMessageTrader}
                  canContact={canContactOffer}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sell" className="space-y-4 mt-8">
          {sellOffers.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border border-red-100">
              <div className="p-4 bg-red-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Eye className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Sell Offers Available</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto leading-relaxed">
                {filteredOffers.length === 0 && offers.length > 0 
                  ? "Try adjusting your filters to see more offers" 
                  : "Be the first to create a sell offer and start trading"}
              </p>
              <Button 
                onClick={() => setLocation('/create-offer')} 
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-8 py-3 rounded-xl shadow-lg"
                size="lg"
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Create Sell Offer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sellOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onStartTrade={handleStartTrade}
                  onMessage={handleMessageTrader}
                  canContact={canContactOffer}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>


    </div>
  );
}
