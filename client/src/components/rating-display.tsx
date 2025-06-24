import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User, MessageSquare, TrendingUp, Award } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Rating {
  id: number;
  tradeId: number;
  rating: number;
  comment?: string;
  categories?: string;
  createdAt: string;
  rater: { id: number; email: string };
}

interface RatingDisplayProps {
  userId: number;
  showDetails?: boolean;
  compact?: boolean;
}

export function RatingDisplay({ userId, showDetails = true, compact = false }: RatingDisplayProps) {
  const { data: userProfile } = useQuery({
    queryKey: [`/api/users/${userId}/profile`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${userId}/profile`);
      return response.json();
    },
  });

  const { data: ratings = [] } = useQuery<Rating[]>({
    queryKey: [`/api/users/${userId}/ratings`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${userId}/ratings`);
      return response.json();
    },
  });

  const averageRating = userProfile?.averageRating ? parseFloat(userProfile.averageRating) : 0;
  const totalRatings = userProfile?.ratingCount || ratings.length;

  const renderStars = (rating: number, size = "h-4 w-4") => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach((rating) => {
      distribution[rating.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const distribution = getRatingDistribution();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {renderStars(averageRating)}
        <span className="font-medium">{averageRating.toFixed(1)}</span>
        <span className="text-sm text-gray-500">({totalRatings})</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          User Ratings & Reviews
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Summary */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mt-1">
              {renderStars(averageRating, "h-5 w-5")}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {totalRatings} review{totalRatings !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center gap-2 text-sm">
                <span className="w-4">{stars}</span>
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${totalRatings > 0 ? (distribution[stars as keyof typeof distribution] / totalRatings) * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="w-8 text-right">
                  {distribution[stars as keyof typeof distribution]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Badges */}
        {averageRating > 0 && (
          <div className="flex flex-wrap gap-2">
            {averageRating >= 4.5 && (
              <Badge className="bg-green-100 text-green-800">Excellent Trader</Badge>
            )}
            {averageRating >= 4.0 && averageRating < 4.5 && (
              <Badge className="bg-blue-100 text-blue-800">Great Trader</Badge>
            )}
            {totalRatings >= 50 && (
              <Badge className="bg-purple-100 text-purple-800">Experienced</Badge>
            )}
            {totalRatings >= 100 && (
              <Badge className="bg-yellow-100 text-yellow-800">Veteran Trader</Badge>
            )}
          </div>
        )}

        {/* Recent Reviews */}
        {showDetails && ratings.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recent Reviews</h4>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {ratings.slice(0, 5).map((rating) => (
                <div key={rating.id} className="border-l-4 border-blue-200 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-gray-100 rounded-full">
                        <User className="h-3 w-3 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium">
                        {rating.rater.email.replace(/(.{2}).*(@.*)/, '$1***$2')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(rating.rating, "h-3 w-3")}
                      <span className="text-xs text-gray-500">
                        {new Date(rating.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {rating.comment && (
                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-2">
                      <MessageSquare className="h-3 w-3 inline mr-1" />
                      {rating.comment}
                    </div>
                  )}
                  
                  <Badge variant="outline" className="text-xs mt-2">
                    Trade #{rating.tradeId}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {ratings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Star className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No ratings yet</p>
            <p className="text-sm">Complete trades to build your reputation</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}