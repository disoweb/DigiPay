import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
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

export function OfferCard({ offer, onTrade }: OfferCardProps) {
  const total = parseFloat(offer.amount) * parseFloat(offer.rate);
  const timeAgo = new Date(offer.createdAt).toLocaleDateString();

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge 
            variant="secondary"
            className={
              offer.type === "sell" 
                ? "bg-red-100 text-red-800" 
                : "bg-green-100 text-green-800"
            }
          >
            {offer.type.toUpperCase()}
          </Badge>
          <span className="text-sm text-gray-500">{timeAgo}</span>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold">{parseFloat(offer.amount).toFixed(2)} USDT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Rate:</span>
            <span className="font-semibold">₦{parseFloat(offer.rate).toLocaleString()}/USDT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold">₦{total.toLocaleString()}</span>
          </div>
          
          {offer.user && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center">
                <span className="text-gray-600 mr-2">Trader:</span>
                <span className="font-medium">{offer.user.email}</span>
              </div>
              <div className="flex items-center">
                <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                <span className="text-xs text-gray-600">
                  {parseFloat(offer.user.averageRating).toFixed(1)} ({offer.user.ratingCount})
                </span>
              </div>
            </div>
          )}
        </div>
        
        <Button 
          onClick={onTrade}
          className={`w-full mt-4 ${
            offer.type === "sell" 
              ? "bg-red-600 hover:bg-red-700" 
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {offer.type === "sell" ? "Buy USDT" : "Sell USDT"}
        </Button>
      </CardContent>
    </Card>
  );
}
