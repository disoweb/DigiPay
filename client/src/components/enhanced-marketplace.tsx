import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { TradeModal } from "@/components/trade-modal";
import { BinanceStyleFlow } from "@/components/binance-style-flow";
import { 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Search, 
  Star, 
  Shield, 
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  Wallet,
  CreditCard,
  Building,
  Smartphone,
  RefreshCw,
  Loader2
} from "lucide-react";

interface Offer {
  id: number;
  userId: number;
  amount: string;
  rate: string;
  type: string;
  status: string;
  paymentMethod: string;
  terms?: string;
  minAmount?: string;
  maxAmount?: string;
  timeLimit?: number;
  requiresVerification?: boolean;
  createdAt: string;
  user: {
    id: number;
    email: string;
    averageRating: string;
    ratingCount: number;
    kycVerified?: boolean;
    completedTrades?: number;
  };
}

const paymentMethodIcons = {
  bank_transfer: Building,
  mobile_money: Smartphone,
  digital_wallet: Wallet,
  card_payment: CreditCard,
};

const paymentMethodLabels = {
  bank_transfer: "Bank Transfer",
  mobile_money: "Mobile Money",
  digital_wallet: "Digital Wallet",
  card_payment: "Card Payment",
};

export function EnhancedMarketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [filters, setFilters] = useState({
    paymentMethod: 'all',
    minAmount: '',
    maxAmount: '',
    minRate: '',
    maxRate: '',
    verifiedOnly: false,
    sortBy: 'rate',
    sortOrder: 'asc'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const { data: offers = [], isLoading, error, refetch } = useQuery<Offer[]>({
    queryKey: ['/api/offers'],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/offers");
        if (!response.ok) {
          throw new Error(`Failed to fetch offers: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Offers fetch error:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: 10000, // Reduce frequency to prevent overwhelming
    refetchOnWindowFocus: false,
    staleTime: 5000,
  });

  const { data: marketStats } = useQuery({
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
        return null;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  });

  // Filter and sort offers with better error handling
  const filteredOffers = offers.filter(offer => {
    try {
      if (!offer || typeof offer !== 'object') return false;
      if (offer.status !== 'active') return false;
      if (offer.userId === user?.id) return false; // Hide own offers

      // For "buy" tab, show "sell" offers (user wants to buy from sellers)
      // For "sell" tab, show "buy" offers (user wants to sell to buyers)
      const targetOfferType = activeTab === 'buy' ? 'sell' : 'buy';
      if (offer.type !== targetOfferType) return false;

      // Payment method filter
      if (filters.paymentMethod !== 'all' && offer.paymentMethod !== filters.paymentMethod) {
        return false;
      }

      // Amount filters - with safe parsing
      const offerAmount = parseFloat(offer.amount || "0");
      if (filters.minAmount && !isNaN(parseFloat(filters.minAmount))) {
        if (offerAmount < parseFloat(filters.minAmount)) return false;
      }
      if (filters.maxAmount && !isNaN(parseFloat(filters.maxAmount))) {
        if (offerAmount > parseFloat(filters.maxAmount)) return false;
      }

      // Rate filters - with safe parsing
      const offerRate = parseFloat(offer.rate || "0");
      if (filters.minRate && !isNaN(parseFloat(filters.minRate))) {
        if (offerRate < parseFloat(filters.minRate)) return false;
      }
      if (filters.maxRate && !isNaN(parseFloat(filters.maxRate))) {
        if (offerRate > parseFloat(filters.maxRate)) return false;
      }

      // Verification filter
      if (filters.verifiedOnly && !offer.user?.kycVerified) return false;

      // Search filter
      if (searchTerm && offer.user?.email) {
        if (!offer.user.email.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
      }

      return true;
    } catch (filterError) {
      console.error("Filter error:", filterError);
      return false;
    }
  }).sort((a, b) => {
    try {
      const aValue = filters.sortBy === 'rate' ? parseFloat(a.rate || "0") : parseFloat(a.amount || "0");
      const bValue = filters.sortBy === 'rate' ? parseFloat(b.rate || "0") : parseFloat(b.amount || "0");

      if (isNaN(aValue) || isNaN(bValue)) return 0;
      return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    } catch (sortError) {
      console.error("Sort error:", sortError);
      return 0;
    }
  });

  const initiateTradeMutation = useMutation({
    mutationFn: async ({ offerId, amount }: { offerId: number; amount: string }) => {
      const response = await apiRequest("POST", "/api/trades", { offerId, amount });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Trade failed' }));
        throw new Error(errorData.error || 'Failed to initiate trade');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Trade Initiated",
        description: `Trade #${data.trade?.id || 'N/A'} has been created successfully!`,
      });
      setShowTradeModal(false);
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
    },
    onError: (error: any) => {
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to initiate trade",
        variant: "destructive",
      });
    },
  });

  const handleTrade = (offer: Offer) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start trading",
        variant: "destructive",
      });
      return;
    }

    setSelectedOffer(offer);
    setShowTradeModal(true);
  };

  const handleTradeSubmit = (amount: string) => {
    if (selectedOffer) {
      initiateTradeMutation.mutate({
        offerId: selectedOffer.id,
        amount,
      });
    }
  };

  const getBestRate = (type: 'buy' | 'sell') => {
    // For buy rate, we look at sell offers (what users are selling for) - lowest rate is best for buyers
    // For sell rate, we look at buy offers (what users are buying for) - highest rate is best for sellers
    const targetOfferType = type === 'buy' ? 'sell' : 'buy';
    const relevantOffers = offers.filter(o => 
      o.type === targetOfferType && 
      o.status === 'active'
    );

    if (!relevantOffers.length) return null;

    const rates = relevantOffers.map(o => safeParseFloat(o.rate)).filter(rate => !isNaN(rate) && rate > 0);
    if (!rates.length) return null;

    // For buy rate (looking at sell offers), we want the lowest rate (best for buyers)
    // For sell rate (looking at buy offers), we want the highest rate (best for sellers)
    return type === 'buy' ? Math.min(...rates) : Math.max(...rates);
  };

  const getPaymentMethodIcon = (method: string) => {
    const IconComponent = paymentMethodIcons[method as keyof typeof paymentMethodIcons] || Wallet;
    return <IconComponent className="h-4 w-4" />;
  };

  const safeParseFloat = (value: string | undefined, fallback: number = 0) => {
    const parsed = parseFloat(value || "0");
    return isNaN(parsed) ? fallback : parsed;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading marketplace...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load marketplace</h3>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : "Unable to connect to the server"}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Best Buy Rate</p>
              <p className="font-bold text-green-600">
                ₦{getBestRate('buy')?.toLocaleString() || 'N/A'}
              </p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Best Sell Rate</p>
              <p className="font-bold text-red-600">
                ₦{getBestRate('sell')?.toLocaleString() || 'N/A'}
              </p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Active Offers</p>
              <p className="font-bold text-blue-600">{offers.length}</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Online Traders</p>
              <p className="font-bold text-purple-600">
                {new Set(offers.map(o => o.userId)).size}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Traders</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by trader email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Label>Payment Method</Label>
              <Select value={filters.paymentMethod} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, paymentMethod: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                  <SelectItem value="card_payment">Card Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="minAmount">Min Amount (USDT)</Label>
              <Input
                id="minAmount"
                type="number"
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="maxAmount">Max Amount (USDT)</Label>
              <Input
                id="maxAmount"
                type="number"
                placeholder="∞"
                value={filters.maxAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="minRate">Min Rate (₦)</Label>
              <Input
                id="minRate"
                type="number"
                placeholder="0"
                value={filters.minRate}
                onChange={(e) => setFilters(prev => ({ ...prev, minRate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="maxRate">Max Rate (₦)</Label>
              <Input
                id="maxRate"
                type="number"
                placeholder="∞"
                value={filters.maxRate}
                onChange={(e) => setFilters(prev => ({ ...prev, maxRate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="verifiedOnly"
                checked={filters.verifiedOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="verifiedOnly">Verified traders only</Label>
            </div>

            <Select value={filters.sortBy} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, sortBy: value }))
            }>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rate">Sort by Rate</SelectItem>
                <SelectItem value="amount">Sort by Amount</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
              }))}
            >
              {filters.sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {filters.sortOrder === 'asc' ? 'Low to High' : 'High to Low'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Offers Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'buy' | 'sell')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Buy USDT ({offers.filter(o => o.type === 'sell' && o.status === 'active' && o.userId !== user?.id).length} offers)
          </TabsTrigger>
          <TabsTrigger value="sell" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Sell USDT ({offers.filter(o => o.type === 'buy' && o.status === 'active' && o.userId !== user?.id).length} offers)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4">
          {filteredOffers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No buy offers available matching your criteria.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {filteredOffers.map((offer) => (
                <Card key={offer.id} className="hover:shadow-md transition-shadow border-0 shadow-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-3">
                      {/* Mobile Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">{offer.user?.email || 'Unknown'}</span>
                            {offer.user?.kycVerified && (
                              <Badge variant="outline" className="text-green-600 border-green-600 text-xs px-1 py-0">
                                <Shield className="h-2 w-2 mr-1" />
                                <span className="hidden sm:inline">Verified</span>
                                <span className="sm:hidden">✓</span>
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span>{safeParseFloat(offer.user?.averageRating).toFixed(1)}</span>
                              <span>({offer.user?.ratingCount || 0})</span>
                            </div>
                            <span>•</span>
                            <span>{offer.user?.completedTrades || 0} trades</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-1">
                          {getPaymentMethodIcon(offer.paymentMethod)}
                          <span className="hidden sm:inline ml-1">
                            {paymentMethodLabels[offer.paymentMethod as keyof typeof paymentMethodLabels] || offer.paymentMethod}
                          </span>
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600 text-xs">Available</p>
                          <p className="font-semibold">{safeParseFloat(offer.amount).toFixed(2)} USDT</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Rate</p>
                          <p className="font-semibold text-green-600">
                            ₦{safeParseFloat(offer.rate).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Limits</p>
                          <p className="font-semibold">
                            {offer.minAmount && offer.maxAmount
                              ? `${safeParseFloat(offer.minAmount).toFixed(2)} - ${safeParseFloat(offer.maxAmount).toFixed(2)} USDT`
                              : `${safeParseFloat(offer.amount).toFixed(2)} USDT`}
                          </p>
                        </div>
                      </div>

                      {offer.terms && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <strong>Terms:</strong> {offer.terms}
                        </div>
                      )}

                      {/* <div className="flex items-center gap-4 text-xs text-gray-500">
                        {offer.timeLimit && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {offer.timeLimit} min payment window
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {offer.user?.completedTrades || 0} completed trades
                        </div>
                      </div> */}
                    </div>

                    <Button
                      onClick={() => handleTrade(offer)}
                      className="w-full bg-green-600 hover:bg-green-700 text-sm"
                      disabled={!user}
                    >
                      Buy USDT
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sell" className="space-y-4">
          {filteredOffers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No sell offers available matching your criteria.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {filteredOffers.map((offer) => (
                <Card key={offer.id} className="hover:shadow-md transition-shadow border-0 shadow-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-3">
                      {/* Mobile Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">{offer.user?.email || 'Unknown'}</span>
                            {offer.user?.kycVerified && (
                              <Badge variant="outline" className="text-green-600 border-green-600 text-xs px-1 py-0">
                                <Shield className="h-2 w-2 mr-1" />
                                <span className="hidden sm:inline">Verified</span>
                                <span className="sm:hidden">✓</span>
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span>{safeParseFloat(offer.user?.averageRating).toFixed(1)}</span>
                              <span>({offer.user?.ratingCount || 0})</span>
                            </div>
                            <span>•</span>
                            <span>{offer.user?.completedTrades || 0} trades</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-1">
                          {getPaymentMethodIcon(offer.paymentMethod)}
                          <span className="hidden sm:inline ml-1">
                            {paymentMethodLabels[offer.paymentMethod as keyof typeof paymentMethodLabels] || offer.paymentMethod}
                          </span>
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600 text-xs">Buying</p>
                          <p className="font-semibold">{safeParseFloat(offer.amount).toFixed(2)} USDT</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Rate</p>
                          <p className="font-semibold text-red-600">₦{safeParseFloat(offer.rate).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Limits</p>
                          <p className="font-semibold">
                            {offer.minAmount && offer.maxAmount
                              ? `${safeParseFloat(offer.minAmount).toFixed(2)} - ${safeParseFloat(offer.maxAmount).toFixed(2)} USDT`
                              : `${safeParseFloat(offer.amount).toFixed(2)} USDT`}
                          </p>
                        </div>
                      </div>

                      {offer.terms && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <strong>Terms:</strong> {offer.terms}
                        </div>
                      )}

                      {/* <div className="flex items-center gap-4 text-xs text-gray-500">
                        {offer.timeLimit && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {offer.timeLimit} min payment window
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {offer.user?.completedTrades || 0} completed trades
                        </div>
                      </div> */}
                    </div>

                    <Button
                      onClick={() => handleTrade(offer)}
                      className="w-full bg-red-600 hover:bg-red-700 text-sm"
                      disabled={!user}
                    >
                      Sell USDT
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Trade Modal */}
      {selectedOffer && (
        <BinanceStyleFlow
          isOpen={!!selectedOffer}
          onClose={() => setSelectedOffer(null)}
          offer={selectedOffer!}
        />
      )}
    </div>
  );
}