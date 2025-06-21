import { useState } from "react";
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
import { Plus } from "lucide-react";
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

  const { data: offers = [], isLoading } = useQuery<EnrichedOffer[]>({
    queryKey: ["/api/offers"],
  });

  const filteredOffers = offers.filter((offer) => {
    if (filters.type !== "all" && offer.type !== filters.type) return false;
    if (filters.minAmount && parseFloat(offer.amount) < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && parseFloat(offer.amount) > parseFloat(filters.maxAmount)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
              <p className="text-gray-600 mt-1">Browse and create USDT trading offers</p>
            </div>
            <Button 
              onClick={() => setShowCreateOffer(true)}
              className="mt-4 sm:mt-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Offer
            </Button>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Min Amount</Label>
                  <Input
                    type="number"
                    placeholder="Min"
                    className="w-24"
                    value={filters.minAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Amount</Label>
                  <Input
                    type="number"
                    placeholder="Max"
                    className="w-24"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setFilters({ type: "all", minAmount: "", maxAmount: "" })}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Offers Grid */}
          {isLoading ? (
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
          ) : filteredOffers.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-gray-500 text-lg">No offers found matching your criteria</p>
                <Button 
                  onClick={() => setShowCreateOffer(true)}
                  className="mt-4"
                >
                  Create First Offer
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
