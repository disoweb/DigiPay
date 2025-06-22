
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { 
  Users,
  Shield,
  Star,
  AlertTriangle
} from "lucide-react";

interface UserProfileSectionProps {
  completedTrades?: number;
  disputedTrades?: number;
  successRate?: number;
}

export function UserProfileSection({ 
  completedTrades = 0, 
  disputedTrades = 0, 
  successRate = 0 
}: UserProfileSectionProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Email:</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">KYC Status:</span>
              {user.kycVerified ? (
                <Badge className="text-green-600 bg-green-100">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge className="text-yellow-600 bg-yellow-100">
                  Pending
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rating:</span>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="font-medium">
                  {parseFloat(user.averageRating || "0").toFixed(1)} ({user.ratingCount || 0})
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">USDT Balance:</span>
              <span className="font-medium">{parseFloat(user.usdtBalance || "0").toFixed(8)} USDT</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Naira Balance:</span>
              <span className="font-medium">₦{parseFloat(user.nairaBalance || "0").toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completed Trades:</span>
              <span className="font-medium">{completedTrades}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Trade Performance</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Success Rate</span>
                <span>{successRate.toFixed(1)}%</span>
              </div>
              <Progress value={successRate} className="h-2" />
            </div>
            {disputedTrades > 0 && (
              <Alert className="mt-2">
                <AlertTriangle className="h-3 w-3" />
                <AlertDescription className="text-xs">
                  {disputedTrades} disputed trade(s) need attention
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
