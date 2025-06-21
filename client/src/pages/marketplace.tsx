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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">P2P Marketplace</h1>
            <p className="text-gray-600">Trade USDT/Naira with verified users instantly</p>
          </div>
          <Button onClick={() => setShowCreateOffer(true)} size="lg">
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