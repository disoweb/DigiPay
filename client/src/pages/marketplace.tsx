import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { OfferCard } from "@/components/offer-card";
import { CreateOfferModal } from "@/components/create-offer-modal";
import { TradeModal } from "@/components/trade-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
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
  const [filters, setFilters] = useState({
    type: "all",
    minAmount: "",
    maxAmount: "",
  });

  const { data: offers = [], isLoading, error } = useQuery<EnrichedOffer[]>({
    queryKey: ["/api/offers"],
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      if (filters.type !== "all" && offer.type !== filters.type) return false;
      if (filters.minAmount && parseFloat(offer.amount) < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && parseFloat(offer.amount) > parseFloat(filters.maxAmount)) return false;
      return true;
    });
  }, [offers, filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header - Modernized */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium mb-2">
              <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></div>
              {offers.length} Active Offers
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">USDT Marketplace</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Trade USDT with verified users at competitive rates. Secure, fast, and transparent.
            </p>
            <Button 
              onClick={() => setShowCreateOffer(true)}
              size="lg"
              className="px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create New Offer
            </Button>
          </div>

          {/* Filters - Enhanced */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span>Filter by:</span>
                </div>
                <div className="flex flex-wrap gap-3 flex-1">
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="w-40 bg-white border-gray-200">
                      <SelectValue placeholder="Offer Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="buy">Buy USDT</SelectItem>
                      <SelectItem value="sell">Sell USDT</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Min Amount"
                    className="w-32 bg-white border-gray-200"
                    value={filters.minAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Max Amount"
                    className="w-32 bg-white border-gray-200"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  />
                  <Button
                    variant="outline"
                    onClick={() => setFilters({ type: "all", minAmount: "", maxAmount: "" })}
                    className="px-6"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Offers Grid */}
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-gray-600">Loading offers...</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardContent className="p-6">
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
            </div>
          ) : error ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-red-500 text-lg mb-4">Failed to load offers</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : filteredOffers.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-gray-500 text-lg mb-4">
                  {offers.length === 0 ? "No offers available" : "No offers found matching your criteria"}
                </p>
                <Button 
                  onClick={() => setShowCreateOffer(true)}
                  className="mt-2"
                >
                  {offers.length === 0 ? "Create First Offer" : "Create New Offer"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOffers.map((offer) => (
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
