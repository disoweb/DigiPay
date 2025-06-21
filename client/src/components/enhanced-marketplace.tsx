import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  Star, 
  Shield, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Filter,
  Search,
  Zap,
  CheckCircle
} from "lucide-react";
import type { Offer } from "@shared/schema";

type EnrichedOffer = Offer & {
  user: {
    id: number;
    email: string;
    averageRating: string;
    ratingCount: number;
  } | null;
};

interface TradeModalProps {
  offer: EnrichedOffer;
  isOpen: boolean;
  onClose: () => void;
}

function TradeModal({ offer, isOpen, onClose }: TradeModalProps) {
  const [amount, setAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const createTradeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/trades", {
        offerId: offer.id,
        amount: parseFloat(amount),
      });
      return response.json();
    },
    onSuccess: (trade) => {
      toast({
        title: "Trade Created",
        description: "Trade initiated successfully! You'll be redirected to the trade page.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      onClose();
      setLocation(`/trades/${trade.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create trade",
        variant: "destructive",
      });
    },
  });

  const maxAmount = parseFloat(offer.amount);
  const tradeAmount = parseFloat(amount) || 0;
  const totalCost = tradeAmount * parseFloat(offer.rate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {offer.type === "sell" ? (
              <TrendingDown className="h-5 w-5 text-red-500" />
            ) : (
              <TrendingUp className="h-5 w-5 text-green-500" />
            )}
            {offer.type === "sell" ? "Buy" : "Sell"} USDT
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Offer Details */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Available:</span>
              <span className="font-medium">{parseFloat(offer.amount).toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Rate:</span>
              <span className="font-medium">₦{parseFloat(offer.rate).toLocaleString()}/USDT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Seller:</span>
              <div className="flex items-center gap-1">
                <span className="font-medium">{offer.user?.email.split('@')[0]}</span>
                <div className="flex items-center gap-1 text-yellow-600">
                  <Star className="h-3 w-3" />
                  <span className="text-xs">{parseFloat(offer.user?.averageRating || "0").toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDT)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={maxAmount}
              step="0.01"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Min: 1 USDT</span>
              <span>Max: {maxAmount.toFixed(2)} USDT</span>
            </div>
          </div>

          {/* Trade Summary */}
          {tradeAmount > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
              <h4 className="font-medium text-blue-900">Trade Summary</h4>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">You will receive:</span>
                <span className="font-medium text-blue-900">{tradeAmount.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">You will pay:</span>
                <span className="font-medium text-blue-900">₦{totalCost.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
            <Shield className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-900">Escrow Protection</p>
              <p className="text-green-700">Funds are held securely until trade completion</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createTradeMutation.mutate()}
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount || createTradeMutation.isPending}
              className="flex-1"
            >
              {createTradeMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Start Trade
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface EnhancedOfferCardProps {
  offer: EnrichedOffer;
  onTrade: () => void;
}

function EnhancedOfferCard({ offer, onTrade }: EnhancedOfferCardProps) {
  const { user } = useAuth();
  const total = parseFloat(offer.amount) * parseFloat(offer.rate);
  const timeAgo = new Date(offer.createdAt).toLocaleDateString();
  const isOwnOffer = offer.userId === user?.id;

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge 
            variant="secondary"
            className={
              offer.type === "sell" 
                ? "bg-red-100 text-red-800 border-red-200" 
                : "bg-green-100 text-green-800 border-green-200"
            }
          >
            {offer.type === "sell" ? "SELL" : "BUY"} USDT
          </Badge>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="font-semibold text-lg">{parseFloat(offer.amount).toFixed(2)} USDT</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Rate:</span>
            <span className="font-semibold text-green-600">₦{parseFloat(offer.rate).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total:</span>
            <span className="font-semibold text-blue-600">₦{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium">{offer.user?.email.split('@')[0] || 'Anonymous'}</p>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-gray-600">
                {parseFloat(offer.user?.averageRating || "0").toFixed(1)} ({offer.user?.ratingCount || 0})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span className="text-xs">Verified</span>
          </div>
        </div>

        <Button
          onClick={onTrade}
          disabled={isOwnOffer}
          className="w-full"
          variant={isOwnOffer ? "outline" : "default"}
        >
          {isOwnOffer ? "Your Offer" : (
            <>
              {offer.type === "sell" ? "Buy Now" : "Sell Now"}
              <Zap className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export function EnhancedMarketplace() {
  const [selectedOffer, setSelectedOffer] = useState<EnrichedOffer | null>(null);
  const [filters, setFilters] = useState({
    type: "all",
    minAmount: "",
    maxAmount: "",
    minRate: "",
    maxRate: "",
    search: ""
  });

  const { data: offers = [], isLoading, error } = useQuery<EnrichedOffer[]>({
    queryKey: ["/api/offers"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter and sort offers
  const filteredOffers = useMemo(() => {
    let filtered = offers.filter(offer => {
      if (filters.type !== "all" && offer.type !== filters.type) return false;
      
      const amount = parseFloat(offer.amount);
      const rate = parseFloat(offer.rate);
      
      if (filters.minAmount && amount < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && amount > parseFloat(filters.maxAmount)) return false;
      if (filters.minRate && rate < parseFloat(filters.minRate)) return false;
      if (filters.maxRate && rate > parseFloat(filters.maxRate)) return false;
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const userEmail = offer.user?.email.toLowerCase() || "";
        if (!userEmail.includes(searchLower)) return false;
      }
      
      return offer.status === "active";
    });

    // Sort by best rates
    return filtered.sort((a, b) => {
      if (a.type === "sell") {
        return parseFloat(a.rate) - parseFloat(b.rate); // Lowest sell price first
      } else {
        return parseFloat(b.rate) - parseFloat(a.rate); // Highest buy price first
      }
    });
  }, [offers, filters]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Failed to load offers. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Active Offers</p>
                <p className="font-semibold">{offers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs text-gray-500">Best Buy Rate</p>
                <p className="font-semibold">
                  ₦{Math.max(...offers.filter(o => o.type === "buy").map(o => parseFloat(o.rate)), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Best Sell Rate</p>
                <p className="font-semibold">
                  ₦{Math.min(...offers.filter(o => o.type === "sell").map(o => parseFloat(o.rate)), Infinity).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Total Volume</p>
                <p className="font-semibold">
                  {offers.reduce((sum, offer) => sum + parseFloat(offer.amount), 0).toFixed(0)} USDT
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="buy">Buy Offers</SelectItem>
                  <SelectItem value="sell">Sell Offers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="search">Search User</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="User email..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="minAmount">Min Amount</Label>
              <Input
                id="minAmount"
                type="number"
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="maxAmount">Max Amount</Label>
              <Input
                id="maxAmount"
                type="number"
                placeholder="1000"
                value={filters.maxAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="minRate">Min Rate</Label>
              <Input
                id="minRate"
                type="number"
                placeholder="1400"
                value={filters.minRate}
                onChange={(e) => setFilters(prev => ({ ...prev, minRate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="maxRate">Max Rate</Label>
              <Input
                id="maxRate"
                type="number"
                placeholder="1600"
                value={filters.maxRate}
                onChange={(e) => setFilters(prev => ({ ...prev, maxRate: e.target.value }))}
              />
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setFilters({
              type: "all",
              minAmount: "",
              maxAmount: "",
              minRate: "",
              maxRate: "",
              search: ""
            })}
          >
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOffers.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No offers match your criteria</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredOffers.map((offer) => (
            <EnhancedOfferCard
              key={offer.id}
              offer={offer}
              onTrade={() => setSelectedOffer(offer)}
            />
          ))
        )}
      </div>

      {/* Trade Modal */}
      {selectedOffer && (
        <TradeModal
          offer={selectedOffer}
          isOpen={!!selectedOffer}
          onClose={() => setSelectedOffer(null)}
        />
      )}
    </div>
  );
}