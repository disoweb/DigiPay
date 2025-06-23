
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
  RefreshCw
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
  minLimit: string;
  maxLimit: string;
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

function OfferCard({ offer, onContact, canContact }: { 
  offer: Offer; 
  onContact: (offer: Offer) => void; 
  canContact: (offer: Offer) => boolean;
}) {
  const isBuyOffer = offer.type === 'buy';
  
  return (
    <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-gray-300">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Header with trader info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${offer.user?.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 truncate">
                    {offer.user?.email?.split('@')[0] || 'Unknown'}
                  </span>
                  {offer.user?.kycVerified && (
                    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600">
                      {safeParseFloat(offer.user?.averageRating).toFixed(1)} ({offer.user?.ratingCount || 0})
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {offer.user?.completedTrades || 0} trades
                  </span>
                </div>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`text-xs ${offer.user?.isOnline ? 'border-green-200 text-green-700 bg-green-50' : 'border-gray-200 text-gray-500'}`}
            >
              {offer.user?.isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {/* Main offer details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Rate</div>
              <div className={`text-lg font-bold ${isBuyOffer ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(safeParseFloat(offer.rate))}
              </div>
              <div className="text-xs text-gray-500">per USDT</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Available</div>
              <div className="text-lg font-bold text-gray-900">
                {safeParseFloat(offer.amount).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">USDT</div>
            </div>
          </div>

          {/* Payment method and limits */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col">
              <div className="text-xs text-gray-500 mb-1">Payment Method</div>
              <Badge variant="outline" className="w-fit">
                {offer.paymentMethod?.replace('_', ' ').toUpperCase() || 'Bank Transfer'}
              </Badge>
            </div>
            
            <div className="flex flex-col sm:text-right">
              <div className="text-xs text-gray-500 mb-1">Limits</div>
              <div className="text-sm font-medium text-gray-700">
                {formatCurrency(safeParseFloat(offer.minLimit))} - {formatCurrency(safeParseFloat(offer.maxLimit))}
              </div>
            </div>
          </div>

          {/* Action button */}
          <Button
            onClick={() => onContact(offer)}
            disabled={!canContact(offer)}
            className={`w-full ${isBuyOffer ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            size="lg"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {isBuyOffer ? 'Sell to' : 'Buy from'} Trader
          </Button>
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
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactOffer, setContactOffer] = useState<Offer | null>(null);
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

  const handleContactTrader = (offer: Offer) => {
    if (!user) {
      setLocation('/auth');
      return;
    }
    setContactOffer(offer);
    setShowContactModal(true);
  };

  const canContactOffer = (offer: Offer): boolean => {
    if (!offer || !offer.user) return false;
    if (offer.userId === user?.id) return false;
    return true;
  };

  const handleStartTrade = () => {
    if (contactOffer) {
      setLocation(`/trade-direct/${contactOffer.id}`);
      setShowContactModal(false);
    }
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
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 text-lg">Loading marketplace...</p>
        <p className="text-gray-400 text-sm">Finding the best rates for you</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load marketplace data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} variant="outline" className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Overview - Mobile Optimized */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Live Market Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
              <p className="text-xs text-gray-500 mb-1">Total Offers</p>
              <p className="font-bold text-lg text-blue-600">{marketStats?.totalOffers || offers.length}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-green-100">
              <p className="text-xs text-gray-500 mb-1">Online Now</p>
              <p className="font-bold text-lg text-green-600">
                {offers.filter(o => o.user && o.user.isOnline).length}
              </p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
              <p className="text-xs text-gray-500 mb-1">Buy Orders</p>
              <p className="font-bold text-lg text-purple-600">{buyOffers.length}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-orange-100">
              <p className="text-xs text-gray-500 mb-1">Sell Orders</p>
              <p className="font-bold text-lg text-orange-600">{sellOffers.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Quick Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search traders, amounts, or rates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-400"
              />
            </div>
            
            {/* Quick filters row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-shrink-0"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
              
              <Button
                variant={sortBy === 'rate' ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSortBy('rate');
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className="flex-shrink-0"
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
                className="flex-shrink-0"
              >
                Amount
                <ArrowUpDown className="h-3 w-3 ml-1" />
              </Button>
            </div>

            {/* Advanced Filters - Collapsible */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <Label className="text-sm">Type</Label>
                  <Select value={filterType} onValueChange={(value: "all" | "buy" | "sell") => setFilterType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="buy">Buy Offers</SelectItem>
                      <SelectItem value="sell">Sell Offers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm">Min Amount (USDT)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm">Max Amount (USDT)</Label>
                  <Input
                    type="number"
                    placeholder="∞"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Tabs */}
      <Tabs defaultValue="buy" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 h-12">
          <TabsTrigger 
            value="buy" 
            className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white text-sm font-medium"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Buy USDT</span>
            <span className="sm:hidden">Buy</span>
            <Badge variant="secondary" className="ml-1 bg-green-100 text-green-800 text-xs">
              {buyOffers.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="sell" 
            className="flex items-center gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white text-sm font-medium"
          >
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Sell USDT</span>
            <span className="sm:hidden">Sell</span>
            <Badge variant="secondary" className="ml-1 bg-red-100 text-red-800 text-xs">
              {sellOffers.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4 mt-6">
          {buyOffers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Buy Offers Found</h3>
              <p className="text-gray-500 mb-4">
                {filteredOffers.length === 0 && offers.length > 0 
                  ? "Try adjusting your filters to see more offers" 
                  : "Be the first to create a buy offer"}
              </p>
              <Button onClick={() => setLocation('/create-offer')} className="bg-green-600 hover:bg-green-700">
                Create Buy Offer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {buyOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onContact={handleContactTrader}
                  canContact={canContactOffer}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sell" className="space-y-4 mt-6">
          {sellOffers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sell Offers Found</h3>
              <p className="text-gray-500 mb-4">
                {filteredOffers.length === 0 && offers.length > 0 
                  ? "Try adjusting your filters to see more offers" 
                  : "Be the first to create a sell offer"}
              </p>
              <Button onClick={() => setLocation('/create-offer')} className="bg-red-600 hover:bg-red-700">
                Create Sell Offer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sellOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onContact={handleContactTrader}
                  canContact={canContactOffer}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Enhanced Contact Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Contact Trader
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {contactOffer && (
              <>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${contactOffer?.user?.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                    <span className="font-semibold">{contactOffer?.user?.email || 'Unknown'}</span>
                    <Badge variant={contactOffer?.user?.isOnline ? "default" : "secondary"} className="text-xs">
                      {contactOffer?.user?.isOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Rate:</span>
                      <div className="font-semibold">{formatCurrency(safeParseFloat(contactOffer?.rate))}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Available:</span>
                      <div className="font-semibold">{safeParseFloat(contactOffer?.amount).toFixed(2)} USDT</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button onClick={handleStartTrade} className="w-full" size="lg">
                    <Zap className="h-4 w-4 mr-2" />
                    Start Trade Now
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      if (contactOffer?.user?.id) {
                        setLocation(`/user-chat/${contactOffer.user.id}`);
                        setShowContactModal(false);
                      }
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message First
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
