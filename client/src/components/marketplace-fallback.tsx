import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { 
  Star, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Zap,
  CheckCircle,
  RefreshCw,
  AlertCircle
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

interface OfferCardProps {
  offer: EnrichedOffer;
  onTrade: () => void;
}

function SimpleOfferCard({ offer, onTrade }: OfferCardProps) {
  const { user } = useAuth();
  const total = parseFloat(offer.amount) * parseFloat(offer.rate);
  const timeAgo = new Date(offer.createdAt).toLocaleDateString();
  const isOwnOffer = offer.userId === user?.id;

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge 
            variant="secondary"
            className={
              offer.type === "sell" 
                ? "bg-red-100 text-red-800 text-xs" 
                : "bg-green-100 text-green-800 text-xs"
            }
          >
            {offer.type === "sell" ? "SELL" : "BUY"}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span className="hidden sm:inline">{timeAgo}</span>
            <span className="sm:hidden">{new Date(offer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="font-semibold text-base">{parseFloat(offer.amount).toFixed(2)} USDT</span>
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

        <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{offer.user?.email.split('@')[0] || 'Anonymous'}</p>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-gray-600">
                {parseFloat(offer.user?.averageRating || "0").toFixed(1)} ({offer.user?.ratingCount || 0})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span className="text-xs hidden sm:inline">Verified</span>
          </div>
        </div>

        <Button
          onClick={onTrade}
          disabled={isOwnOffer}
          className="w-full text-sm"
          variant={isOwnOffer ? "outline" : "default"}
          size="sm"
        >
          {isOwnOffer ? "Your Offer" : (
            <>
              {offer.type === "sell" ? "Buy Now" : "Sell Now"}
              <Zap className="h-3 w-3 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export function MarketplaceFallback() {
  const [selectedOffer, setSelectedOffer] = useState<EnrichedOffer | null>(null);

  const { data: offers = [], isLoading, error, refetch } = useQuery<EnrichedOffer[]>({
    queryKey: ["/api/offers"],
    queryFn: async () => {
      const token = localStorage.getItem('digipay_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/offers", {
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to load offers: ${res.status}`);
      }

      return res.json();
    },
    retry: 3,
    retryDelay: 1000,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Offers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-sm border-red-200">
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
      {/* Market Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Active Offers</p>
                <p className="font-semibold text-sm">{offers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs text-gray-500">Best Buy</p>
                <p className="font-semibold text-sm">
                  ₦{offers.filter(o => o.type === "buy").length > 0 
                    ? Math.max(...offers.filter(o => o.type === "buy").map(o => parseFloat(o.rate))).toLocaleString()
                    : "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Best Sell</p>
                <p className="font-semibold text-sm">
                  ₦{offers.filter(o => o.type === "sell").length > 0 
                    ? Math.min(...offers.filter(o => o.type === "sell").map(o => parseFloat(o.rate))).toLocaleString()
                    : "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-blue-100 rounded">
                <span className="text-xs font-bold text-blue-600">V</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Volume</p>
                <p className="font-semibold text-sm">
                  {offers.reduce((sum, offer) => sum + parseFloat(offer.amount), 0).toFixed(0)} USDT
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.length === 0 ? (
          <div className="col-span-full">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No offers available</h3>
                <p className="text-gray-500">Be the first to create an offer!</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          offers.map((offer) => (
            <SimpleOfferCard
              key={offer.id}
              offer={offer}
              onTrade={() => setSelectedOffer(offer)}
            />
          ))
        )}
      </div>

      {/* Simple Trade Modal Placeholder */}
      {selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Trade {selectedOffer.type === "sell" ? "Buy" : "Sell"} USDT</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Trading functionality will be available soon.</p>
              <Button 
                onClick={() => setSelectedOffer(null)} 
                className="w-full"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}