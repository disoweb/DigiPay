
import { Navbar } from "@/components/navbar";
import { MarketplaceFinal } from "@/components/marketplace-final";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Plus, ArrowLeft } from "lucide-react";

export default function Marketplace() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Mobile-Optimized Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setLocation("/dashboard")} 
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">P2P Marketplace</h1>
              <p className="text-gray-600 text-sm sm:text-base">Trade USDT/Naira with verified users instantly</p>
            </div>
            <Button 
              onClick={() => setLocation("/create-offer")} 
              size="lg" 
              className="w-full sm:w-auto flex-shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Offer
            </Button>
          </div>
        </div>

        <MarketplaceFinal />
      </div>
    </div>
  );
}
