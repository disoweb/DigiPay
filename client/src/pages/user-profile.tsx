import React from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { RatingDisplay } from "@/components/rating-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Star, 
  Shield, 
  Clock, 
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  MessageSquare
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function UserProfile() {
  const { userId } = useParams();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/profile`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${userId}/profile`);
      return response.json();
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-6 px-4">
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-6 px-4">
          <div className="text-center">User not found</div>
        </div>
      </div>
    );
  }

  const getReputationBadge = (averageRating: number, totalTrades: number) => {
    if (averageRating >= 4.8 && totalTrades >= 100) return { label: "Elite Trader", color: "bg-purple-100 text-purple-800" };
    if (averageRating >= 4.5 && totalTrades >= 50) return { label: "Expert Trader", color: "bg-blue-100 text-blue-800" };
    if (averageRating >= 4.0 && totalTrades >= 20) return { label: "Trusted Trader", color: "bg-green-100 text-green-800" };
    if (averageRating >= 3.5 && totalTrades >= 10) return { label: "Active Trader", color: "bg-yellow-100 text-yellow-800" };
    return { label: "New Trader", color: "bg-gray-100 text-gray-800" };
  };

  const reputationBadge = getReputationBadge(parseFloat(profile.averageRating), profile.totalTrades);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.firstName && profile.lastName 
                      ? `${profile.firstName} ${profile.lastName}` 
                      : profile.username || profile.email.split('@')[0]
                    }
                  </h1>
                  <p className="text-gray-600">{profile.email.replace(/(.{2}).*(@.*)/, '$1***$2')}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={reputationBadge.color}>
                      {reputationBadge.label}
                    </Badge>
                    {profile.kycVerified && (
                      <Badge className="bg-green-100 text-green-800">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {profile.isOnline && (
                      <Badge className="bg-emerald-100 text-emerald-800">
                        Online
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= parseFloat(profile.averageRating) 
                          ? "text-yellow-400 fill-current" 
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-lg font-bold">{profile.averageRating}/5.0</p>
                <p className="text-sm text-gray-600">{profile.ratingCount} reviews</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Trading Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{profile.totalTrades}</div>
              <div className="text-sm text-gray-600">Total Trades</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{profile.completedTrades}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{profile.disputedTrades}</div>
              <div className="text-sm text-gray-600">Disputes</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{profile.successRate}%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Member Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Member Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Member Since:</span>
                <span className="font-medium">
                  {new Date(profile.memberSince).toLocaleDateString()}
                </span>
              </div>
              {profile.lastSeen && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Seen:</span>
                  <span className="font-medium">
                    {new Date(profile.lastSeen).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">KYC Status:</span>
                <span className={`font-medium ${profile.kycVerified ? 'text-green-600' : 'text-orange-600'}`}>
                  {profile.kycVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Rating Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center gap-2">
                  <span className="w-4 text-sm">{stars}</span>
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${profile.ratingCount > 0 ? ((profile.ratingDistribution[stars] || 0) / profile.ratingCount) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="w-8 text-sm text-right">
                    {profile.ratingDistribution[stars] || 0}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Ratings and Reviews */}
        <RatingDisplay userId={parseInt(userId!)} showDetails={true} />

        {/* Action Buttons */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-center gap-4">
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline">
                View Active Offers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}