
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
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                Marketplace
              </h1>
              <Button 
                onClick={() => setLocation("/create-offer")} 
                size="lg" 
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Create Offer</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </div>
            <p className="text-gray-600 text-sm sm:text-base">Trade USDT/Naira with verified users instantly</p>
          </div>
        </div>

        <MarketplaceFinal />
      </div>
    </div>
  );
}
