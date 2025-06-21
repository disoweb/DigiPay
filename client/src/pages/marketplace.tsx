
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { OfferCard } from "@/components/offer-card";
import { CreateOfferModal } from "@/components/create-offer-modal";
import { TradeModal } from "@/components/trade-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Filter, 
  Search, 
  TrendingUp, 
  Users, 
  Globe, 
  RefreshCw,
  SlidersHorizontal,
  Target,
  Activity,
  Zap
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

export default function Marketplace() {
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<EnrichedOffer | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    type: "all",
    minAmount: "",
    maxAmount: "",
    sortBy: "newest",
  });

  const { data: offers = [], isLoading, refetch } = useQuery<EnrichedOffer[]>({
    queryKey: ["/api/offers"],
  });

  const filteredOffers = offers.filter((offer) => {
    if (filters.type !== "all" && offer.type !== filters.type) return false;
    if (filters.minAmount && parseFloat(offer.amount) < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && parseFloat(offer.amount) > parseFloat(filters.maxAmount)) return false;
    if (searchTerm && !offer.user?.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const sortedOffers = [...filteredOffers].sort((a, b) => {
    switch (filters.sortBy) {
      case "amount-high":
        return parseFloat(b.amount) - parseFloat(a.amount);
      case "amount-low":
        return parseFloat(a.amount) - parseFloat(b.amount);
      case "rate-high":
        return parseFloat(b.rate) - parseFloat(a.rate);
      case "rate-low":
        return parseFloat(a.rate) - parseFloat(b.rate);
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const marketStats = {
    totalOffers: offers.length,
    buyOffers: offers.filter(o => o.type === "buy").length,
    sellOffers: offers.filter(o => o.type === "sell").length,
    activeTraders: Math.floor(offers.length * 0.7),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header - Mobile Optimized */}
          <div className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%23ffffff%22%20fill-opacity=%220.1%22%3E%3Ccircle%20cx=%227%22%20cy=%227%22%20r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">USDT Marketplace 🚀</h1>
                  <p className="text-blue-100 text-sm sm:text-base">
                    Browse and create secure P2P trading offers
                  </p>
                </div>
                <Button 
                  onClick={() => setShowCreateOffer(true)}
                  className="bg-white text-primary hover:bg-gray-50 font-semibold shadow-lg"
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Create Offer
                </Button>
              </div>
              
              {/* Live Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center justify-center mb-1">
                    <Target className="h-4 w-4 mr-2" />
                    <span className="text-xs font-medium">Total Offers</span>
                  </div>
                  <p className="text-xl font-bold text-center">{marketStats.totalOffers}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <span className="text-xs font-medium">Buy Orders</span>
                  </div>
                  <p className="text-xl font-bold text-center text-emerald-300">{marketStats.buyOffers}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center justify-center mb-1">
                    <Activity className="h-4 w-4 mr-2" />
                    <span className="text-xs font-medium">Sell Orders</span>
                  </div>
                  <p className="text-xl font-bold text-center text-orange-300">{marketStats.sellOffers}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="text-xs font-medium">Online</span>
                  </div>
                  <p className="text-xl font-bold text-center text-yellow-300">{marketStats.activeTraders}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters - Mobile First */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by trader name..."
                    className="pl-10 h-12 text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Quick Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filters.type === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, type: "all" }))}
                  >
                    All Offers
                  </Button>
                  <Button
                    variant={filters.type === "buy" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, type: "buy" }))}
                    className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Buy USDT
                  </Button>
                  <Button
                    variant={filters.type === "sell" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, type: "sell" }))}
                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                  >
                    <Activity className="h-4 w-4 mr-1" />
                    Sell USDT
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-1" />
                    More Filters
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Min Amount (USDT)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={filters.minAmount}
                        onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Max Amount (USDT)</Label>
                      <Input
                        type="number"
                        placeholder="∞"
                        value={filters.maxAmount}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Sort By</Label>
                      <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="amount-high">Highest Amount</SelectItem>
                          <SelectItem value="amount-low">Lowest Amount</SelectItem>
                          <SelectItem value="rate-high">Best Rate</SelectItem>
                          <SelectItem value="rate-low">Lowest Rate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Active Filters Display */}
                {(filters.type !== "all" || filters.minAmount || filters.maxAmount || searchTerm) && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-600">Active filters:</span>
                    {filters.type !== "all" && (
                      <Badge variant="secondary" className="capitalize">
                        {filters.type} offers
                      </Badge>
                    )}
                    {filters.minAmount && (
                      <Badge variant="secondary">
                        Min: {filters.minAmount} USDT
                      </Badge>
                    )}
                    {filters.maxAmount && (
                      <Badge variant="secondary">
                        Max: {filters.maxAmount} USDT
                      </Badge>
                    )}
                    {searchTerm && (
                      <Badge variant="secondary">
                        Search: {searchTerm}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilters({ type: "all", minAmount: "", maxAmount: "", sortBy: "newest" });
                        setSearchTerm("");
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {sortedOffers.length} {sortedOffers.length === 1 ? 'Offer' : 'Offers'}
              </h2>
              {sortedOffers.length > 0 && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                  <Zap className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
            </div>
          </div>

          {/* Offers Grid - Mobile Optimized */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedOffers.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="max-w-md mx-auto">
                  <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No offers found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || filters.type !== "all" || filters.minAmount || filters.maxAmount
                      ? "Try adjusting your search criteria or filters"
                      : "Be the first to create an offer and start trading!"
                    }
                  </p>
                  <Button 
                    onClick={() => setShowCreateOffer(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Offer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {sortedOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onTrade={() => setSelectedOffer(offer)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateOfferModal 
        open={showCreateOffer} 
        onOpenChange={setShowCreateOffer} 
      />

      {selectedOffer && (
        <TradeModal
          offer={selectedOffer}
          open={!!selectedOffer}
          onOpenChange={(open) => !open && setSelectedOffer(null)}
        />
      )}
    </div>
  );
}
