import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { BinanceStyleFlow } from "@/components/binance-style-flow";
import { 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Search, 
  Star, 
  Shield, 
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  Wallet,
  CreditCard,
  Building,
  Smartphone,
  RefreshCw,
  Loader2,
  MessageCircle,
  Send
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
    isOnline?: boolean;
    lastSeen?: string;
  };
}

const paymentMethodIcons = {
  bank_transfer: Building,
  mobile_money: Smartphone,
  digital_wallet: Wallet,
  card_payment: CreditCard,
};

const paymentMethodLabels = {
  bank_transfer: "Bank Transfer",
  mobile_money: "Mobile Money",
  digital_wallet: "Digital Wallet",
  card_payment: "Card Payment",
};

export function MarketplaceWithStatus() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactOffer, setContactOffer] = useState<Offer | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [filters, setFilters] = useState({
    paymentMethod: 'all',
    minAmount: '',
    maxAmount: '',
    minRate: '',
    maxRate: '',
    verifiedOnly: false,
    sortBy: 'rate',
    sortOrder: 'asc'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const { data: offers = [], isLoading, error, refetch } = useQuery<Offer[]>({
    queryKey: ['/api/offers'],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/offers");
        if (!response.ok) {
          throw new Error(`Failed to fetch offers: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Offers fetch error:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: 10000,
    refetchOnWindowFocus: false,
    staleTime: 5000,
  });

  const handleContactTrader = (offer: Offer) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to contact traders",
        variant: "destructive",
      });
      return;
    }
    setContactOffer(offer);
    setContactMessage(`Hi! I'm interested in your ${offer.type} offer for ${offer.amount} USDT at ₦${parseFloat(offer.rate).toLocaleString()}. Could we discuss the details?`);
    setShowContactModal(true);
  };

  const sendDirectMessage = async () => {
    if (!contactOffer || !contactMessage.trim()) return;

    try {
      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${contactOffer.user?.email}. They will be notified when they come online.`,
      });
      
      setShowContactModal(false);
      setContactMessage('');
    } catch (error) {
      toast({
        title: "Message Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    const IconComponent = paymentMethodIcons[method as keyof typeof paymentMethodIcons] || Wallet;
    return <IconComponent className="h-4 w-4" />;
  };

  const safeParseFloat = (value: string | undefined, fallback: number = 0) => {
    const parsed = parseFloat(value || "0");
    return isNaN(parsed) ? fallback : parsed;
  };

  // Filter offers based on active tab and user preferences
  const filteredOffers = offers.filter(offer => {
    try {
      if (!offer || !offer.user) return false;

      // Tab filtering: buy tab shows sell offers (what user can buy), sell tab shows buy offers (what user can sell to)
      if (activeTab === 'buy' && offer.type !== 'sell') return false;
      if (activeTab === 'sell' && offer.type !== 'buy') return false;

      // Exclude user's own offers
      if (offer.userId === user?.id) return false;

      // Only show active offers
      if (offer.status !== 'active') return false;

      return true;
    } catch (filterError) {
      console.error("Filter error:", filterError);
      return false;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading marketplace...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load marketplace</h3>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : "Unable to connect to the server"}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Active Offers</p>
              <p className="font-bold text-green-600">{offers.length}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Online Traders</p>
              <p className="font-bold text-blue-600">
                {offers.filter(o => o.user?.isOnline).length}
              </p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Buy Offers</p>
              <p className="font-bold text-purple-600">
                {offers.filter(o => o.type === 'sell' && o.status === 'active' && o.userId !== user?.id).length}
              </p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Sell Offers</p>
              <p className="font-bold text-orange-600">
                {offers.filter(o => o.type === 'buy' && o.status === 'active' && o.userId !== user?.id).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offers Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'buy' | 'sell')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy">Buy USDT</TabsTrigger>
          <TabsTrigger value="sell">Sell USDT</TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4">
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
              <Card key={offer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${offer.user?.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{offer.user?.email || 'Unknown'}</span>
                            {offer.user?.isOnline && (
                              <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                Online
                              </Badge>
                            )}
                            {offer.user?.kycVerified && (
                              <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span>{safeParseFloat(offer.user?.averageRating).toFixed(1)}</span>
                            <span>({offer.user?.ratingCount || 0})</span>
                            <span>•</span>
                            <span>{offer.user?.completedTrades || 0} trades</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getPaymentMethodIcon(offer.paymentMethod)}
                        {paymentMethodLabels[offer.paymentMethod as keyof typeof paymentMethodLabels] || offer.paymentMethod}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Available</p>
                        <p className="font-semibold">{safeParseFloat(offer.amount).toFixed(2)} USDT</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Rate</p>
                        <p className="font-semibold text-green-600">₦{safeParseFloat(offer.rate).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Limits</p>
                        <p className="font-semibold text-sm">
                          {offer.minAmount && offer.maxAmount
                            ? `${safeParseFloat(offer.minAmount).toFixed(2)} - ${safeParseFloat(offer.maxAmount).toFixed(2)}`
                            : safeParseFloat(offer.amount).toFixed(2)} USDT
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setSelectedOffer(offer)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={!user}
                      >
                        Buy USDT
                      </Button>
                      <Button
                        onClick={() => handleContactTrader(offer)}
                        variant="outline"
                        size="icon"
                        disabled={!user}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sell" className="space-y-4">
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
              <Card key={offer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${offer.user?.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{offer.user?.email || 'Unknown'}</span>
                            {offer.user?.isOnline && (
                              <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                Online
                              </Badge>
                            )}
                            {offer.user?.kycVerified && (
                              <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span>{safeParseFloat(offer.user?.averageRating).toFixed(1)}</span>
                            <span>({offer.user?.ratingCount || 0})</span>
                            <span>•</span>
                            <span>{offer.user?.completedTrades || 0} trades</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getPaymentMethodIcon(offer.paymentMethod)}
                        {paymentMethodLabels[offer.paymentMethod as keyof typeof paymentMethodLabels] || offer.paymentMethod}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Buying</p>
                        <p className="font-semibold">{safeParseFloat(offer.amount).toFixed(2)} USDT</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Rate</p>
                        <p className="font-semibold text-red-600">₦{safeParseFloat(offer.rate).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Limits</p>
                        <p className="font-semibold text-sm">
                          {offer.minAmount && offer.maxAmount
                            ? `${safeParseFloat(offer.minAmount).toFixed(2)} - ${safeParseFloat(offer.maxAmount).toFixed(2)}`
                            : safeParseFloat(offer.amount).toFixed(2)} USDT
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setSelectedOffer(offer)}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        disabled={!user}
                      >
                        Sell USDT
                      </Button>
                      <Button
                        onClick={() => handleContactTrader(offer)}
                        variant="outline"
                        size="icon"
                        disabled={!user}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Trade Modal */}
      {selectedOffer && (
        <BinanceStyleFlow
          isOpen={!!selectedOffer}
          onClose={() => setSelectedOffer(null)}
          offer={selectedOffer!}
        />
      )}

      {/* Contact Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Trader</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${contactOffer?.user?.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                <span className="font-medium">{contactOffer?.user?.email || 'Unknown'}</span>
                {contactOffer?.user?.isOnline ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">Online</Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500 border-gray-300">Offline</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {contactOffer?.type === 'sell' ? 'Selling' : 'Buying'} {contactOffer?.amount} USDT at ₦{parseFloat(contactOffer?.rate || '0').toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowContactModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={sendDirectMessage} className="flex-1" disabled={!contactMessage.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}