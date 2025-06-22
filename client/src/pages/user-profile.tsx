import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { User, Phone, CreditCard, Shield, Star, Users } from "lucide-react";

export default function UserProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const { data: trades = [] } = useQuery({
    queryKey: ['/api/trades'],
  });

  const completedTrades = trades.filter(trade => trade.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>
</Card>

          {/* Trading Profile */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Trading Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">KYC Status:</span>
                    <Badge variant={user?.kycVerified ? "default" : "secondary"}>
                      {user?.kycVerified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{user?.averageRating || '0.0'} ({user?.ratingCount || 0})</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">USDT Balance:</span>
                    <span className="font-medium">{parseFloat(user?.usdtBalance || '0').toFixed(8)} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Naira Balance:</span>
                    <span className="font-medium">₦{parseFloat(user?.nairaBalance || '0').toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed Trades:</span>
                    <span className="font-medium">{completedTrades.length}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-3">Trade Performance</h4>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate</span>
                  <div className="flex items-center gap-2">
                    <Progress value={completedTrades.length > 0 ? 100 : 0} className="w-20" />
                    <span className="text-sm font-medium">{completedTrades.length > 0 ? '100' : '0'}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}