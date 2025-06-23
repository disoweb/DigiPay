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
  Zap
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
    
    // User must be logged in
    if (offer.userId === user?.id) return false;
    
    // Additional checks can be added here
    return true;
  };

  const handleStartTrade = () => {
    if (contactOffer) {
      setLocation(`/trade-direct/${contactOffer.id}`);
      setShowContactModal(false);
    }
  };

  const filteredOffers = offers.filter((offer: Offer) => {
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
  });

  const buyOffers = filteredOffers.filter((offer: Offer) => offer.type === 'buy');
  const sellOffers = filteredOffers.filter((offer: Offer) => offer.type === 'sell');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load marketplace data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
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
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Offers</p>
              <p className="font-bold text-blue-600">{marketStats?.totalOffers || offers.length}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Online Traders</p>
              <p className="font-bold text-blue-600">
                {offers.filter(o => o.user && o.user.isOnline).length}
              </p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Buy Offers</p>
              <p className="font-bold text-purple-600">{buyOffers.length}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Sell Offers</p>
              <p className="font-bold text-green-600">{sellOffers.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by trader email, amount, or rate..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Type</Label>
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
              <Label>Min Amount (USDT)</Label>
              <Input
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </div>

            <div>
              <Label>Max Amount (USDT)</Label>
              <Input
                type="number"
                placeholder="∞"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offers Tabs */}
      <Tabs defaultValue="buy" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Buy USDT ({buyOffers.length})
          </TabsTrigger>
          <TabsTrigger value="sell" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Sell USDT ({sellOffers.length})
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
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${offer.user?.isOnline || false ? 'bg-green-400' : 'bg-gray-400'}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{offer.user?.email?.split('@')[0] || 'Unknown'}</span>
                              {offer.user?.isOnline || false ? (
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
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>{safeParseFloat(offer.user?.averageRating).toFixed(1)}</span>
                                <span>({offer.user?.ratingCount || 0})</span>
                              </span>
                              <span>{offer.user?.completedTrades || 0} trades</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <Badge variant="outline" className="mb-2">
                            {offer.paymentMethod?.replace('_', ' ').toUpperCase() || 'Bank Transfer'}
                          </Badge>
                          <div className="text-2xl font-bold text-green-600">
                            ₦{safeParseFloat(offer.rate).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Available</p>
                          <p className="font-semibold">{safeParseFloat(offer.amount).toFixed(2)} USDT</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Limits</p>
                          <p className="font-semibold">
                            ₦{safeParseFloat(offer.minLimit).toLocaleString()} - ₦{safeParseFloat(offer.maxLimit).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Button
                            onClick={() => handleContactTrader(offer)}
                            disabled={!canContactOffer(offer)}
                            className="w-full"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            {offer.type === 'buy' ? 'Sell to' : 'Buy from'} Trader
                          </Button>
                        </div>
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
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${offer.user?.isOnline || false ? 'bg-green-400' : 'bg-gray-400'}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{offer.user?.email?.split('@')[0] || 'Unknown'}</span>
                              {offer.user?.isOnline || false ? (
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
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>{safeParseFloat(offer.user?.averageRating).toFixed(1)}</span>
                                <span>({offer.user?.ratingCount || 0})</span>
                              </span>
                              <span>{offer.user?.completedTrades || 0} trades</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <Badge variant="outline" className="mb-2">
                            {offer.paymentMethod?.replace('_', ' ').toUpperCase() || 'Bank Transfer'}
                          </Badge>
                          <div className="text-2xl font-bold text-red-600">
                            ₦{safeParseFloat(offer.rate).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Available</p>
                          <p className="font-semibold">{safeParseFloat(offer.amount).toFixed(2)} USDT</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Limits</p>
                          <p className="font-semibold">
                            ₦{safeParseFloat(offer.minLimit).toLocaleString()} - ₦{safeParseFloat(offer.maxLimit).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Button
                            onClick={() => handleContactTrader(offer)}
                            disabled={!canContactOffer(offer)}
                            variant="outline"
                            className="w-full"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            {offer.type === 'buy' ? 'Sell to' : 'Buy from'} Trader
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Contact Trader Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Trader</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${contactOffer?.user?.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                <span className="font-medium">{contactOffer?.user?.email || 'Unknown'}</span>
                {contactOffer?.user && contactOffer?.user?.isOnline ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">Online</Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500 border-gray-300">Offline</Badge>
                )}
              </div>
              <div className="text-sm text-gray-600">
                Rate: ₦{safeParseFloat(contactOffer?.rate).toLocaleString()} per USDT
              </div>
              <div className="text-sm text-gray-600">
                Available: {safeParseFloat(contactOffer?.amount).toFixed(2)} USDT
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={handleStartTrade} className="w-full">
                <Zap className="h-4 w-4 mr-2" />
                Start Trade
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
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}