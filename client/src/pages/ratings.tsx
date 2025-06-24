import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Calendar, MessageSquare } from "lucide-react";

type Rating = {
  id: number;
  tradeId: number;
  raterId: number;
  ratedUserId: number;
  rating: number;
  comment: string;
  createdAt: string;
  rater: { id: number; email: string } | null;
  ratedUser: { id: number; email: string } | null;
  trade: any;
};

export default function Ratings() {
  const { data: ratings = [], isLoading } = useQuery<Rating[]>({
    queryKey: ["/api/ratings"],
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split("")
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading ratings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center bg-yellow-100 text-yellow-800 rounded-full px-3 py-1 text-sm font-medium">
              <Star className="w-4 h-4 mr-2" />
              {ratings.length} Community Reviews
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Community Ratings</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real feedback from verified traders in our community. Build trust through transparency.
            </p>
          </div>

          {ratings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Ratings Yet</h3>
                <p className="text-gray-600">
                  Complete your first trade to start rating other users!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {ratings.map((rating) => (
                <Card key={rating.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-l-4 border-l-yellow-400">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg">
                            {rating.rater ? getInitials(rating.rater.email) : "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">
                            {rating.rater?.email.replace(/(.{2}).*(@.*)/, '$1***$2') || "Anonymous"}
                          </p>
                          <p className="text-sm text-gray-600">
                            rated{" "}
                            <span className="font-semibold text-primary cursor-pointer hover:underline">
                              {rating.ratedUser?.email.replace(/(.{2}).*(@.*)/, '$1***$2') || "Unknown"}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Trade completed successfully
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                          {renderStars(rating.rating)}
                        </div>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          Trade #{rating.tradeId}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {rating.comment && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-700 text-sm leading-relaxed">
                            "{rating.comment}"
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(rating.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}