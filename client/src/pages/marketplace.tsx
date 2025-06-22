
import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { EnhancedMarketplace } from "@/components/enhanced-marketplace";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Plus, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";

export default function Marketplace() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

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
            {/* Buy/Sell Toggle Buttons */}
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant={activeTab === "buy" ? "default" : "outline"}
                onClick={() => setActiveTab("buy")}
                className={`flex-1 sm:flex-none h-12 flex items-center justify-center gap-2 text-sm font-medium ${
                  activeTab === "buy" 
                    ? "bg-red-600 hover:bg-red-700 text-white" 
                    : "bg-white hover:bg-gray-50 border-red-600 text-red-600"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>🔴 Buy</span>
                <span className="text-xs bg-red-800 text-white px-2 py-1 rounded-full ml-1">
                  2
                </span>
              </Button>
              <Button
                type="button"
                variant={activeTab === "sell" ? "default" : "outline"}
                onClick={() => setActiveTab("sell")}
                className={`flex-1 sm:flex-none h-12 flex items-center justify-center gap-2 text-sm font-medium ${
                  activeTab === "sell" 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : "bg-white hover:bg-gray-50 border-green-600 text-green-600"
                }`}
              >
                <TrendingDown className="h-4 w-4" />
                <span>🟢 Sell</span>
                <span className="text-xs bg-green-800 text-white px-2 py-1 rounded-full ml-1">
                  2
                </span>
              </Button>
            </div>
          </div>
        </div>

        <EnhancedMarketplace />
      </div>
    </div>
  );
}
