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
          <p className="text-gray-600 text-sm sm:text-base">
            Here's an overview of your P2P trading activities
          </p>
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