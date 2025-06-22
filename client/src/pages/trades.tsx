import { Navbar } from "@/components/navbar";
import { TradeManagement } from "@/components/trade-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { BarChart3, Plus, TrendingUp } from "lucide-react";

export default function Trades() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Please log in to view your trades.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              My Trades
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage and track all your P2P trading activities
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.open('/marketplace', '_blank')}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Browse Offers
            </Button>
            <Button 
              onClick={() => window.open('/offer-creation', '_blank')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Offer
            </Button>
          </div>
        </div>

        <TradeManagement />
      </div>
    </div>
  );
}