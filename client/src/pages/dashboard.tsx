import { Navbar } from "@/components/navbar";
import { TradingDashboard } from "@/components/trading-dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Redirect admin users to admin dashboard
  if (user.isAdmin) {
    return <Redirect to="/admin" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, {user.email.split('@')[0]}!
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Here's an overview of your P2P trading activities
          </p>
        </div>

        {/* KYC Warning */}
        {!user.kycVerified && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <p className="text-yellow-800 font-medium">
                  Complete your KYC verification to unlock full trading features and higher limits.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <TradingDashboard />
      </div>
    </div>
  );
}