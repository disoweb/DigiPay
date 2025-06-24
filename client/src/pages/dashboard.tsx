import { Navbar } from "@/components/navbar";
import { TradingDashboard } from "@/components/trading-dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 
                  className="text-2xl sm:text-3xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors" 
                  onClick={() => setLocation("/")}
                >
                  DigiPay
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Welcome back, {user.email.split('@')[0]}!
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setLocation("/marketplace")} 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 h-8 text-sm"
                >
                  Buy
                </Button>
                <Button 
                  onClick={() => setLocation("/marketplace")} 
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 h-8 text-sm"
                >
                  Sell
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            <ErrorBoundary>
              <TradingDashboard />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}