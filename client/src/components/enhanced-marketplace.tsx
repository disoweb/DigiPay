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
import { TradeModal } from "./trade-modal";
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
  Smartphone
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

  const { data: offers = [], isLoading, refetch } = useQuery<Offer[]>({
    queryKey: ['/api/offers'],
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  const { data: marketStats } = useQuery({
    queryKey: ['/api/market/stats'],
    refetchInterval: 10000,
  });

  // Filter and sort offers
  const filteredOffers = offers.filter(offer => {
    if (offer.type !== activeTab) return false;
    if (offer.status !== 'active') return false;
    if (offer.userId === user?.id) return false; // Hide own offers

    // Payment method filter
    if (filters.paymentMethod !== 'all' && offer.paymentMethod !== filters.paymentMethod) {
      return false;
    }

    // Amount filters
    const offerAmount = parseFloat(offer.amount);
    if (filters.minAmount && offerAmount < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && offerAmount > parseFloat(filters.maxAmount)) return false;

    // Rate filters
    const offerRate = parseFloat(offer.rate);
    if (filters.minRate && offerRate < parseFloat(filters.minRate)) return false;
    if (filters.maxRate && offerRate > parseFloat(filters.maxRate)) return false;

    // Verification filter
    if (filters.verifiedOnly && !offer.user.kycVerified) return false;

    // Search filter
    if (searchTerm && !offer.user.email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    const aValue = filters.sortBy === 'rate' ? parseFloat(a.rate) : parseFloat(a.amount);
    const bValue = filters.sortBy === 'rate' ? parseFloat(b.rate) : parseFloat(b.amount);

    return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const initiateTradeMutation = useMutation({
    mutationFn: async ({ offerId, amount }: { offerId: number; amount: string }) => {
      const response = await apiRequest("POST", "/api/trades", { offerId, amount });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Trade Initiated",
        description: `Trade #${data.trade.id} has been created successfully!`,
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
    const relevantOffers = offers.filter(o => o.type === type && o.status === 'active');
    if (relevantOffers.length === 0) return null;

    const rates = relevantOffers
      .map(o => parseFloat(o.rate))
      .filter(rate => !isNaN(rate) && rate > 0);

    if (rates.length === 0) return null;
    return type === 'buy' ? Math.min(...rates) : Math.max(...rates);
  };

  const getPaymentMethodIcon = (method: string) => {
    const IconComponent = paymentMethodIcons[method as keyof typeof paymentMethodIcons] || Wallet;
    return <IconComponent className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                ₦{getBestRate('sell')?.toLocaleString() || 'N/A'}
              </p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Best Sell Rate</p>
              <p className="font-bold text-red-600">
                ₦{getBestRate('buy')?.toLocaleString() || 'N/A'}
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
            Buy USDT ({offers.filter(o => o.type === 'sell' && o.status === 'active').length} offers)
          </TabsTrigger>
          <TabsTrigger value="sell" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Sell USDT ({offers.filter(o => o.type === 'buy' && o.status === 'active').length} offers)
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
                <Card key={offer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{offer.user.email}</span>
                            {offer.user.kycVerified && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs">
                                {(() => {
                                  const rating = parseFloat(offer.user?.averageRating || "0");
                                  return !isNaN(rating) ? rating.toFixed(1) : '0.0';
                                })()} ({offer.user?.ratingCount || 0})
                              </span>
                            </div>
                          </div>
                          <Badge className={getPaymentMethodIcon(offer.paymentMethod)}>
                            {getPaymentMethodIcon(offer.paymentMethod)}
                            <span className="ml-1">
                              {paymentMethodLabels[offer.paymentMethod as keyof typeof paymentMethodLabels]}
                            </span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Available</p>
                            <p className="font-semibold">
                              {!isNaN(parseFloat(offer.amount)) ? parseFloat(offer.amount).toFixed(2) : '0.00'} USDT
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Rate</p>
                            <p className="font-semibold text-green-600">
                              ₦{!isNaN(parseFloat(offer.rate)) ? parseFloat(offer.rate).toLocaleString() : '0'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Limits</p>
                            <p className="font-semibold">
                              {offer.minAmount && offer.maxAmount 
                                ? `${!isNaN(parseFloat(offer.minAmount)) ? parseFloat(offer.minAmount).toFixed(2) : '0.00'} - ${!isNaN(parseFloat(offer.maxAmount)) ? parseFloat(offer.maxAmount).toFixed(2) : '0.00'} USDT`
                                : `${!isNaN(parseFloat(offer.amount)) ? parseFloat(offer.amount).toFixed(2) : '0.00'} USDT`}
                            </p>
                          </div>
                        </div>

                        {offer.terms && (
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <strong>Terms:</strong> {offer.terms}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {offer.timeLimit && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {offer.timeLimit} min payment window
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {offer.user.completedTrades || 0} completed trades
                          </div>
                        </div>
                      </div>

                      <div className="md:w-32">
                        <Button 
                          onClick={() => handleTrade(offer)}
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={!user}
                        >
                          Buy USDT
                        </Button>
                      </div>
                    </div>
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
                <Card key={offer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{offer.user.email}</span>
                            {offer.user.kycVerified && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs">
                                {(() => {
                                  const rating = parseFloat(offer.user?.averageRating || "0");
                                  return !isNaN(rating) ? rating.toFixed(1) : '0.0';
                                })()} ({offer.user?.ratingCount || 0})
                              </span>
                            </div>
                          </div>
                          <Badge className={getPaymentMethodIcon(offer.paymentMethod)}>
                            {getPaymentMethodIcon(offer.paymentMethod)}
                            <span className="ml-1">
                              {paymentMethodLabels[offer.paymentMethod as keyof typeof paymentMethodLabels]}
                            </span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Buying</p>
                            <p className="font-semibold">{parseFloat(offer.amount).toFixed(2)} USDT</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Rate</p>
                            <p className="font-semibold text-red-600">₦{parseFloat(offer.rate).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Limits</p>
                            <p className="font-semibold">
                              {offer.minAmount && offer.maxAmount 
                                ? `${parseFloat(offer.minAmount).toFixed(2)} - ${parseFloat(offer.maxAmount).toFixed(2)} USDT`
                                : `${parseFloat(offer.amount).toFixed(2)} USDT`}
                            </p>
                          </div>
                        </div>

                        {offer.terms && (
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <strong>Terms:</strong> {offer.terms}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {offer.timeLimit && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {offer.timeLimit} min payment window
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {offer.user.completedTrades || 0} completed trades
                          </div>
                        </div>
                      </div>

                      <div className="md:w-32">
                        <Button 
                          onClick={() => handleTrade(offer)}
                          className="w-full bg-red-600 hover:bg-red-700"
                          disabled={!user}
                        >
                          Sell USDT
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Trade Modal */}
      {selectedOffer && (
        <TradeModal
          isOpen={showTradeModal}
          onClose={() => setShowTradeModal(false)}
          offer={selectedOffer}
          onSubmit={handleTradeSubmit}
          isLoading={initiateTradeMutation.isPending}
        />
      )}
    </div>
  );
}