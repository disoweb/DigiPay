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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Community Ratings</h1>
              <p className="text-gray-600">See what traders are saying about each other</p>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {ratings.length} Reviews
            </Badge>
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
                <Card key={rating.id} className="border-l-4 border-l-yellow-400">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-500 text-white">
                            {rating.rater ? getInitials(rating.rater.email) : "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {rating.rater?.email.replace(/(.{2}).*(@.*)/, '$1***$2') || "Anonymous"}
                          </p>
                          <p className="text-sm text-gray-600">
                            rated{" "}
                            <span className="font-medium">
                              {rating.ratedUser?.email.replace(/(.{2}).*(@.*)/, '$1***$2') || "Unknown"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {renderStars(rating.rating)}
                        </div>
                        <Badge variant="outline">
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