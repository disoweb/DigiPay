import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { P2PTradeModal } from "@/components/p2p-trade-modal";
import { CreateOfferModal } from "@/components/create-offer-modal";
import { 
  ArrowLeft, 
  Filter,
  Clock,
  Star,
  Shield,
  ChevronDown,
  Plus
} from "lucide-react";

interface Offer {
  id: number;
  userId: number;
  amount: string;
  rate: string;
  type: string;
  status: string;
  paymentMethod: string;
  terms?: string;
  minAmount?: string;
  maxAmount?: string;
  timeLimit?: number;
  requiresVerification?: boolean;
  createdAt: string;
  user: {
    id: number;
    email: string;
    averageRating: string;
    ratingCount: number;
    kycVerified?: boolean;
    completedTrades?: number;
  };
}

const cryptoTokens = [
  { symbol: 'USDT', name: 'Tether', icon: '₮', color: 'bg-green-500' },
  { symbol: 'SOL', name: 'Solana', icon: '◎', color: 'bg-purple-500' },
  { symbol: 'CORE', name: 'Core', icon: 'C', color: 'bg-orange-500' },
  { symbol: 'TON', name: 'Toncoin', icon: '💎', color: 'bg-blue-500' },
  { symbol: 'BNB', name: 'BNB', icon: 'B', color: 'bg-yellow-500' },
  { symbol: 'XRP', name: 'XRP', icon: 'X', color: 'bg-gray-500' },
];

export function BinanceMarketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [selectedToken, setSelectedToken] = useState('USDT');
  const [currency, setCurrency] = useState('NGN');
  const [showFilters, setShowFilters] = useState(false);

  const { data: offers = [], isLoading, error } = useQuery<Offer[]>({
    queryKey: ['/api/offers'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/offers");
      if (!response.ok) {
        throw new Error("Failed to fetch offers");
      }
      return response.json();
    },
  });

  const filteredOffers = offers.filter(offer => 
    offer.type === (activeTab === 'buy' ? 'sell' : 'buy') && 
    offer.status === 'active'
  );

  const handleTrade = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowTradeModal(true);
  };

  const formatTime = (minutes: number) => `${minutes}Min(s)`;

  const getPaymentMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      'bank_transfer': 'Bank Transfer',
      'mobile_money': 'Mobile Money',
      'digital_wallet': 'Digital Wallet',
      'card_payment': 'Card Payment'
    };
    return labels[method] || method;
  };

  const getUserInitial = (email: string) => email.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Buy/Sell Tabs and Currency */}
      <div className="bg-gray-900 px-4 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('buy')}
              className={`text-lg font-medium ${
                activeTab === 'buy' ? 'text-white' : 'text-gray-400'
              }`}
            >
              Buy
            </button>
            <button 
              onClick={() => setActiveTab('sell')}
              className={`text-lg font-medium ${
                activeTab === 'sell' ? 'text-white' : 'text-gray-400'
              }`}
            >
              Sell
            </button>
          </div>
          
          <Button 
            variant="outline" 
            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            onClick={() => setCurrency(currency === 'NGN' ? 'USD' : 'NGN')}
          >
            {currency} <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Token Selection and Filters */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
              onClick={() => setSelectedToken(selectedToken === 'USDT' ? 'BTC' : 'USDT')}
            >
              <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs mr-2 text-white">₮</span>
              {selectedToken} <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              Amount <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              Bank Transfer <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <Button 
            variant="ghost" 
            className="text-gray-400 hover:text-white"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filter
            <span className="ml-1 bg-orange-500 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs">
              1
            </span>
          </Button>
        </div>
      </div>

      {/* Offers List */}
      <div className="flex-1 overflow-y-auto bg-gray-900">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No offers available for {activeTab === 'buy' ? 'buying' : 'selling'} {selectedToken}
          </div>
        ) : (
          <div className="space-y-0">
            {filteredOffers.map((offer, index) => (
              <div key={offer.id} className="px-4 py-4 border-b border-gray-800 bg-gray-900">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* User Avatar */}
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                      {getUserInitial(offer.user.email)}
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {offer.user.email.split('@')[0]}
                        </span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            {formatTime(offer.timeLimit || 30)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <span>{Math.floor(Math.random() * 500) + 14} Orders</span>
                        <span>|</span>
                        <span>{Math.floor(Math.random() * 10) + 90}%</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-1.5 text-sm"
                    onClick={() => handleTrade(offer)}
                  >
                    {activeTab === 'buy' ? 'Sell' : 'Sell'}
                  </Button>
                </div>

                {/* Offer Details */}
                <div className="mt-3">
                  <div className="text-2xl font-bold text-white mb-2">
                    ₦ {parseFloat(offer.rate).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </div>
                  
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>
                      Quantity {(Math.random() * 50000 + 1000).toLocaleString()} {selectedToken}
                    </div>
                    <div>
                      Limits {(Math.random() * 20 + 4).toFixed(1)}M - {(Math.random() * 15 + 15).toFixed(2)}M NGN
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="w-1 h-4 bg-orange-400 rounded-sm"></span>
                      <span className="text-gray-300">Bank Transfer</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trade Modal */}
      {showTradeModal && selectedOffer && (
        <P2PTradeModal
          isOpen={showTradeModal}
          onClose={() => {
            setShowTradeModal(false);
            setSelectedOffer(null);
          }}
          offer={selectedOffer}
          tradeType={activeTab}
        />
      )}

      {/* Create Offer Modal */}
      {showCreateOffer && (
        <CreateOfferModal
          open={showCreateOffer}
          onOpenChange={setShowCreateOffer}
        />
      )}
    </div>
  );
}