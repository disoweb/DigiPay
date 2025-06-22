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
import { BinanceStyleFlow } from "@/components/binance-style-flow";
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
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <span className="text-gray-400">Express</span>
              <span className="text-white font-bold text-xl">P2P</span>
              <span className="text-gray-400">Block Trade</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buy/Sell Tabs and Currency */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'buy' | 'sell')} className="w-auto">
            <TabsList className="bg-gray-700 border-gray-600">
              <TabsTrigger value="buy" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Buy
              </TabsTrigger>
              <TabsTrigger value="sell" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Sell
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            variant="outline" 
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            onClick={() => setCurrency(currency === 'NGN' ? 'USD' : 'NGN')}
          >
            {currency} <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Token Selection and Filters */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              onClick={() => setSelectedToken(selectedToken === 'USDT' ? 'BTC' : 'USDT')}
            >
              <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs mr-2">₮</span>
              {selectedToken} <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              Amount <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              All Payment Methods <ChevronDown className="h-4 w-4 ml-1" />
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
              2
            </span>
          </Button>
        </div>

        {/* Crypto Token Pills */}
        <div className="flex gap-2 overflow-x-auto">
          {cryptoTokens.map((token) => (
            <Button
              key={token.symbol}
              variant="ghost"
              size="sm"
              className={`flex-shrink-0 ${
                selectedToken === token.symbol 
                  ? 'bg-gray-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              onClick={() => setSelectedToken(token.symbol)}
            >
              <span className={`w-4 h-4 ${token.color} rounded-full flex items-center justify-center text-xs mr-2`}>
                {token.icon}
              </span>
              {token.symbol}
            </Button>
          ))}
        </div>
      </div>

      {/* Offers List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No offers available for {activeTab === 'buy' ? 'buying' : 'selling'} {selectedToken}
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredOffers.map((offer) => (
              <div key={offer.id} className="px-4 py-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* User Avatar */}
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold">
                      {getUserInitial(offer.user.email)}
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {offer.user.email.split('@')[0]}
                        </span>
                        {offer.user.kycVerified && (
                          <Shield className="h-4 w-4 text-green-500" />
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            {formatTime(offer.timeLimit || 15)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{offer.user.completedTrades || 0} Orders</span>
                        <span>|</span>
                        <div className="flex items-center gap-1">
                          <span>{Math.round(parseFloat(offer.user.averageRating) * 20)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="bg-green-500 hover:bg-green-600 text-black font-medium px-6"
                    onClick={() => handleTrade(offer)}
                  >
                    {activeTab === 'buy' ? 'Buy' : 'Sell'}
                  </Button>
                </div>

                {/* Offer Details */}
                <div className="mt-3 ml-11">
                  <div className="text-2xl font-bold text-white mb-1">
                    ₦ {parseFloat(offer.rate).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </div>
                  
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>
                      Quantity {parseFloat(offer.amount || '0').toFixed(4)} {selectedToken}
                    </div>
                    <div>
                      Limits {((parseFloat(offer.minAmount || '100') / 1000).toFixed(0))}K - {((parseFloat(offer.maxAmount || '3440') / 1000).toFixed(2))}M NGN
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                      <span>{getPaymentMethodLabel(offer.paymentMethod || 'bank_transfer')}</span>
                      {offer.requiresVerification && (
                        <span className="text-orange-400 text-xs">Verification</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex justify-around">
          {[
            { label: 'P2P', icon: '🏠', active: true },
            { label: 'Orders', icon: '📋', active: false },
            { label: 'Ads', icon: '📢', active: false },
            { label: 'Profile', icon: '👤', active: false },
          ].map((item, index) => (
            <div 
              key={index}
              className={`flex flex-col items-center gap-1 py-1 ${
                item.active ? 'text-yellow-400' : 'text-gray-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          onClick={() => setShowCreateOffer(true)}
          className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-black shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Trade Modal */}
      {showTradeModal && selectedOffer && (
        <BinanceStyleFlow
          isOpen={showTradeModal}
          onClose={() => {
            setShowTradeModal(false);
            setSelectedOffer(null);
          }}
          offer={selectedOffer}
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