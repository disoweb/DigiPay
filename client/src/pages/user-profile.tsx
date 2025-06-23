import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { 
  User, 
  Star, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Shield,
  MessageCircle,
  Calendar,
  Activity
} from "lucide-react";

type UserProfile = {
  id: number;
  email: string;
  fullName?: string;
  location?: string;
  bio?: string;
  averageRating: string;
  ratingCount: number;
  tradeCount: number;
  completionRate: string;
  preferredPaymentMethods?: string;
  tradingHours?: string;
  isOnline: boolean;
  lastSeen?: string;
  createdAt: string;
};

type UserTrade = {
  id: number;
  amount: string;
  rate: string;
  status: string;
  type: string;
  createdAt: string;
};

type UserRating = {
  id: number;
  rating: number;
  comment?: string;
  createdAt: string;
  rater: {
    email: string;
  };
};

export default function UserProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/${id}/profile`],
    enabled: !!id,
  });

  const { data: trades = [] } = useQuery<UserTrade[]>({
    queryKey: [`/api/users/${id}/trades`],
    enabled: !!id && activeTab === "trades",
  });

  const { data: ratings = [] } = useQuery<UserRating[]>({
    queryKey: [`/api/users/${id}/ratings`],
    enabled: !!id && activeTab === "reviews",
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto p-4 py-8">
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto p-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          </div>
        </div>
      </div>
    );
  }

  const paymentMethods = profile.preferredPaymentMethods 
    ? JSON.parse(profile.preferredPaymentMethods) 
    : [];

  const tradingHours = profile.tradingHours 
    ? JSON.parse(profile.tradingHours) 
    : null;

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto p-4 py-8">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {profile.fullName?.charAt(0).toUpperCase() || profile.email.charAt(0).toUpperCase()}
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.fullName || profile.email.split('@')[0]}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      {renderStars(Math.round(parseFloat(profile.averageRating)))}
                      <span className="text-sm text-gray-600 ml-1">
                        {parseFloat(profile.averageRating).toFixed(1)} ({profile.ratingCount} reviews)
                      </span>
                    </div>
                  </div>
                  
                  {profile.location && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  profile && profile.isOnline 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-600"
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    profile && profile.isOnline ? "bg-green-500" : "bg-gray-400"
                  }`} />
                  {profile && profile.isOnline ? "Online" : "Offline"}
                </div>
                
                {!profile && profile.isOnline && profile.lastSeen && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last seen: {new Date(profile.lastSeen).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{profile.tradeCount}</div>
                <div className="text-sm text-gray-600">Total Trades</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{parseFloat(profile.completionRate).toFixed(0)}%</div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
              
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{parseFloat(profile.averageRating).toFixed(1)}</div>
                <div className="text-sm text-gray-600">Avg Rating</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                </div>
                <div className="text-sm text-gray-600">Days Active</div>
              </div>
            </div>

            {currentUser?.id !== profile.id && (
              <div className="flex gap-3 mt-6">
                <Button className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start Trade
                </Button>
                <Button variant="outline">
                  Report User
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trades">Trade History</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {profile.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {paymentMethods.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {paymentMethods.map((method: string, index: number) => (
                        <Badge key={index} variant="outline" className="mr-2 mb-2">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {tradingHours && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Trading Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {tradingHours.start} - {tradingHours.end} {tradingHours.timezone}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="trades" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                {trades.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No public trade history</p>
                ) : (
                  <div className="space-y-3">
                    {trades.slice(0, 10).map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <Badge variant={trade.type === "sell" ? "destructive" : "default"}>
                            {trade.type === "sell" ? "Sell" : "Buy"} USDT
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            {trade.amount} USDT at ₦{parseFloat(trade.rate).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={
                            trade.status === "completed" ? "bg-green-50 text-green-600" : ""
                          }>
                            {trade.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(trade.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {ratings.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No reviews yet</p>
                ) : (
                  <div className="space-y-4">
                    {ratings.map((rating) => (
                      <div key={rating.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {renderStars(rating.rating)}
                            </div>
                            <span className="text-sm text-gray-600">
                              by {rating.rater.email.split('@')[0]}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(rating.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {rating.comment && (
                          <p className="text-sm text-gray-700">{rating.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Verification Status</span>
                  <Badge variant="outline" className="bg-green-50 text-green-600">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <span className="text-gray-900">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Response Time</span>
                  <span className="text-gray-900">Usually within 5 minutes</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}