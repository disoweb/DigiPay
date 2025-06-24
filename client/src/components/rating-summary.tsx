import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, Award, Shield } from "lucide-react";

interface RatingSummaryProps {
  user: {
    averageRating?: string;
    ratingCount?: number;
    kycVerified?: boolean;
    totalTrades?: number;
  };
  compact?: boolean;
}

export function RatingSummary({ user, compact = false }: RatingSummaryProps) {
  const rating = parseFloat(user.averageRating || "0");
  const count = user.ratingCount || 0;
  const totalTrades = user.totalTrades || 0;

  const getReputationLevel = () => {
    if (rating >= 4.8 && totalTrades >= 100) return { label: "Elite", color: "bg-purple-100 text-purple-800", icon: Award };
    if (rating >= 4.5 && totalTrades >= 50) return { label: "Expert", color: "bg-blue-100 text-blue-800", icon: TrendingUp };
    if (rating >= 4.0 && totalTrades >= 20) return { label: "Trusted", color: "bg-green-100 text-green-800", icon: Shield };
    if (rating >= 3.5 && totalTrades >= 10) return { label: "Active", color: "bg-yellow-100 text-yellow-800", icon: Star };
    return { label: "New", color: "bg-gray-100 text-gray-800", icon: Star };
  };

  const reputation = getReputationLevel();
  const ReputationIcon = reputation.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-3 w-3 ${
                star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{rating.toFixed(1)}</span>
        <span className="text-xs text-gray-500">({count})</span>
        {user.kycVerified && (
          <Badge className="bg-green-100 text-green-800 text-xs">
            <Shield className="h-2 w-2 mr-1" />
            Verified
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{rating.toFixed(1)}</div>
                <div className="text-xs text-gray-600">{count} reviews</div>
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <Badge className={reputation.color}>
                <ReputationIcon className="h-3 w-3 mr-1" />
                {reputation.label} Trader
              </Badge>
              {user.kycVerified && (
                <Badge className="bg-green-100 text-green-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold">{totalTrades}</div>
            <div className="text-xs text-gray-600">Total Trades</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}