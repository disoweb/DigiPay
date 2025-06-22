import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Clock } from "lucide-react";

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

interface P2PTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: Offer;
  tradeType: 'buy' | 'sell';
}

export function P2PTradeModal({ isOpen, onClose, offer, tradeType }: P2PTradeModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'fiat' | 'crypto'>('fiat');
  const [amount, setAmount] = useState('100000');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');

  const rate = parseFloat(offer.rate);
  const fiatAmount = parseFloat(amount);
  const cryptoAmount = fiatAmount / rate;

  const createTradeMutation = useMutation({
    mutationFn: async (tradeData: any) => {
      const response = await apiRequest("POST", "/api/trades", tradeData);
      if (!response.ok) {
        throw new Error("Failed to create trade");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trade Created",
        description: "Your trade has been successfully created.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create trade. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTrade = () => {
    createTradeMutation.mutate({
      offerId: offer.id,
      amount: cryptoAmount.toString(),
      userId: user?.id,
    });
  };

  const formatTime = (minutes: number) => `${minutes}Min(s)`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-auto h-screen sm:h-auto sm:max-h-[90vh] bg-white text-gray-900 border-gray-200 p-0 overflow-y-auto rounded-none sm:rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-600 hover:text-gray-900 p-1">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <DialogTitle className="text-base sm:text-lg font-medium text-gray-900">
              {tradeType === 'buy' ? 'Buy USDT' : 'Sell USDT'}
            </DialogTitle>
          </div>
        </div>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Price Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Price</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-green-600">
                  {rate.toLocaleString()} NGN
                </span>
                <span className="text-xs text-gray-500">14s</span>
              </div>
            </div>
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
              The price is higher than 2.21% of the reference price.
            </div>
          </div>

          {/* Trade Details */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Quantity</span>
              <span className="text-gray-900">{cryptoAmount.toFixed(4)} USDT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Method</span>
              <span className="text-gray-900">Bank Transfer</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Duration</span>
              <span className="text-gray-900">{formatTime(offer.timeLimit || 15)}</span>
            </div>
          </div>

          {/* Amount Input Tabs */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'fiat' | 'crypto')}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                <TabsTrigger value="fiat" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  With Fiat
                </TabsTrigger>
                <TabsTrigger value="crypto" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  With Crypto
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="fiat" className="space-y-4">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <Input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-transparent border-none text-gray-900 text-lg flex-1 p-0 focus:ring-0"
                    placeholder="100000"
                  />
                  <span className="text-gray-600 font-medium">NGN</span>
                  <Button variant="ghost" className="text-blue-600 text-sm p-0 h-auto">
                    All
                  </Button>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">I will receive</span>
                  <span className="text-gray-900 font-medium">{cryptoAmount.toFixed(4)} USDT</span>
                </div>
              </TabsContent>

              <TabsContent value="crypto" className="space-y-4">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <Input
                    placeholder="Please enter amount"
                    className="bg-transparent border-none text-gray-900 text-lg flex-1 p-0 focus:ring-0"
                  />
                  <span className="text-gray-600 font-medium">USDT</span>
                  <Button variant="ghost" className="text-blue-600 text-sm p-0 h-auto">
                    All
                  </Button>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">I will receive</span>
                  <span className="text-gray-900 font-medium">-- NGN</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available for Sale</span>
                  <span className="text-gray-900 font-medium">0.0000 USDT</span>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                      <SelectItem value="Card Payment">Card Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Action Button */}
          <Button 
            onClick={handleTrade}
            disabled={createTradeMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 sm:py-4 rounded-lg text-base"
          >
            {createTradeMutation.isPending ? "Creating Trade..." : (tradeType === 'buy' ? 'Buy' : 'Sell')}
          </Button>

          {/* Warning Text */}
          <div className="text-xs sm:text-sm text-gray-600 text-center bg-gray-50 p-2 sm:p-3 rounded">
            {tradeType === 'buy' 
              ? "If there is risk, the withdrawal may be delayed by up to 24 hours."
              : "Please wait for the counterparty to make payment. The tokens for this sale will be transferred out of your Funding Account."
            }
          </div>
        </div>

        {/* Advertiser Terms */}
        <div className="border-t border-gray-200 p-3 sm:p-4 space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Advertiser Terms</h3>
          <p className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-2 sm:p-3 rounded leading-relaxed">
            {tradeType === 'buy' 
              ? "pay before clicking paid, don't stress me. no third party payment. Drop your phone number"
              : "Thank you for trading with me. Kindly drop your active WhatsApp number so I can reach you in case there's any delay in releasing the coins. Please note that once I mark the order as \"Paid,\" it means the payment has already been made. I'd appreciate it if you could stay online to avoid any unnecessary delays."
            }
          </p>
        </div>

        {/* Transaction Info */}
        <div className="border-t border-gray-200 p-3 sm:p-4 space-y-3 sm:space-y-4 pb-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Transaction Info</h3>
          
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600">Seller Nickname</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 font-medium text-sm">{offer.user.email.split('@')[0]}</span>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Online</span>
              </div>
            </div>
            
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Good Rating %</span>
              <span className="text-gray-900">100 %</span>
            </div>
            
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Completed Order(s) in 30 Days</span>
              <span className="text-gray-900">{offer.user.completedTrades || 45} Order(s)</span>
            </div>
            
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-600">30-Day Order Completion Rate (%)</span>
              <span className="text-gray-900">100 %</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}