import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { EnhancedMarketplace } from "@/components/enhanced-marketplace";
import { CreateOfferModal } from "@/components/create-offer-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Marketplace() {
  const [showCreateOffer, setShowCreateOffer] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Mobile-Optimized Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">P2P Marketplace</h1>
            <p className="text-gray-600 text-sm sm:text-base">Trade USDT/Naira with verified users instantly</p>
          </div>
          <Button 
            onClick={() => setShowCreateOffer(true)} 
            size="lg" 
            className="w-full sm:w-auto flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Offer
          </Button>
        </div>

        <EnhancedMarketplace />

        <CreateOfferModal
          open={showCreateOffer}
          onOpenChange={setShowCreateOffer}
        />
      </div>
    </div>
  );
}