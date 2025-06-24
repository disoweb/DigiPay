import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Clock, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  DollarSign,
  Calendar,
  TrendingUp,
  MessageCircle,
  ArrowLeft,
  Copy,
  ExternalLink,
  Timer,
  Activity,
  Eye,
  Phone,
  Mail,
  CreditCard,
  Banknote,
  RefreshCw,
  CheckCircle2
} from "lucide-react";

interface Trade {
  id: number;
  offerId: number;
  buyerId: number;
  sellerId: number;
  amount: string;
  rate: string;
  fiatAmount: string;
  status: string;
  escrowAddress?: string;
  paymentDeadline?: string;
  paymentMadeAt?: string;
  sellerConfirmedAt?: string;
  disputeReason?: string;
  paymentReference?: string;
  paymentProof?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  createdAt: string;
  buyer?: { id: number; email: string; averageRating?: string };
  seller?: { id: number; email: string; averageRating?: string };
  offer?: { type: string; paymentMethod?: string };
}

export function ModernTradeDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: trade, isLoading, error, refetch } = useQuery<Trade>({
    queryKey: ['/api/trades', id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/trades/${id}`);
      if (!response.ok) throw new Error('Failed to fetch trade');
      return response.json();
    },
    refetchInterval: 10000,
  });

  const markPaymentMadeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/trades/${id}/payment-made`);
      if (!response.ok) throw new Error('Failed to mark payment as made');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trades', id] });
      toast({ title: "Success", description: "Payment marked as made" });
    },
  });

  const completeTradeMultation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/trades/${id}/complete`);
      if (!response.ok) throw new Error('Failed to complete trade');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trades', id] });
      toast({ title: "Success", description: "Trade completed successfully" });
    },
  });

  const cancelTradeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/trades/${id}/cancel`);
      if (!response.ok) throw new Error('Failed to cancel trade');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trades', id] });
      toast({ title: "Success", description: "Trade cancelled" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/trades')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold">Trade Details</h1>
            <div className="w-8" />
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/trades')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold">Trade Details</h1>
            <div className="w-8" />
          </div>
        </div>
        
        <div className="p-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <h3 className="font-medium text-red-900 mb-2">Trade not found</h3>
              <p className="text-red-700 text-sm mb-4">This trade may have been removed or you don't have access to it</p>
              <Button onClick={() => refetch()} variant="outline" className="border-red-300">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isBuyer = trade.buyerId === user?.id;
  const isSeller = trade.sellerId === user?.id;
  const isUserInTrade = isBuyer || isSeller;
  const partner = isBuyer ? trade.seller : trade.buyer;

  // Mock online status - in real app this would come from WebSocket or API
  const getOnlineStatus = () => {
    const lastSeen = Math.floor(Math.random() * 10); // Random minutes for demo
    if (lastSeen < 1) return { status: 'online', text: 'Online', color: 'bg-green-500', textColor: 'text-green-600' };
    if (lastSeen < 5) return { status: 'recent', text: 'Active', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    return { status: 'offline', text: 'Offline', color: 'bg-gray-400', textColor: 'text-gray-500' };
  };

  const onlineStatus = getOnlineStatus();

  // Mock completion rate - in real app this would come from user stats
  const getCompletionRate = () => {
    return Math.floor(Math.random() * 20) + 80; // 80-100% for demo
  };

  const completionRate = getCompletionRate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'payment_pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'payment_made': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'disputed': return 'bg-red-100 text-red-800 border-red-200';
      case 'canceled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'payment_pending': return <Timer className="h-3 w-3" />;
      case 'payment_made': return <Clock className="h-3 w-3" />;
      case 'completed': return <CheckCircle2 className="h-3 w-3" />;
      case 'disputed': return <AlertTriangle className="h-3 w-3" />;
      case 'canceled': return <XCircle className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  const getTradeProgress = () => {
    switch (trade.status) {
      case 'payment_pending': return 25;
      case 'payment_made': return 75;
      case 'completed': return 100;
      default: return 0;
    }
  };

  const canMarkPaymentMade = isBuyer && trade.status === 'payment_pending';
  const canComplete = isSeller && trade.status === 'payment_made';
  const canCancel = isUserInTrade && ['payment_pending', 'payment_made'].includes(trade.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/trades')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Trade #{trade.id}</h1>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Trade Status Card */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(trade.status)} flex items-center gap-1`}>
                  {getStatusIcon(trade.status)}
                  {formatStatus(trade.status)}
                </Badge>
              </div>
              <span className="text-sm text-gray-600">
                {new Date(trade.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{getTradeProgress()}%</span>
              </div>
              <Progress value={getTradeProgress()} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Trade Details Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Trade Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-semibold text-lg">${parseFloat(trade.amount).toFixed(2)}</p>
                <p className="text-xs text-gray-500">USDT</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Rate</p>
                <p className="font-semibold text-lg">₦{parseFloat(trade.rate).toLocaleString()}</p>
                <p className="text-xs text-gray-500">per USDT</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-bold text-xl text-green-600">
                  ₦{(parseFloat(trade.amount) * parseFloat(trade.rate)).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Your Role</p>
                <Badge variant="outline" className="capitalize">
                  {isBuyer ? 'Buyer' : 'Seller'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partner Details Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Trading Partner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {(partner?.email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Online Status Indicator */}
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${onlineStatus.color} border-2 border-white rounded-full`}></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{partner?.email?.split('@')[0] || 'Unknown'}</p>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 ${onlineStatus.color} rounded-full`}></div>
                    <span className={`text-xs ${onlineStatus.textColor}`}>{onlineStatus.text}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {onlineStatus.status === 'online' ? 'Active now' : 
                   onlineStatus.status === 'recent' ? 'Active 3 min ago' : 
                   'Last seen 2 hours ago'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(`/chat/${trade.id}`)}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Chat
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              {partner?.averageRating && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Rating</p>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${
                            star <= Math.floor(parseFloat(partner.averageRating || '0'))
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {parseFloat(partner.averageRating).toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Completion Rate</p>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${completionRate >= 90 ? 'text-green-600' : completionRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {completionRate}%
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${completionRate >= 90 ? 'bg-green-500' : completionRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details Card - Enhanced for Buyers */}
        {isBuyer && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Seller's Payment Details
              </CardTitle>
              <div className="text-sm text-blue-700 mt-1">
                Send payment to these details
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                    Amount to Pay
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  ₦{(parseFloat(trade.amount) * parseFloat(trade.rate)).toLocaleString()}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  For {parseFloat(trade.amount).toFixed(2)} USDT at ₦{parseFloat(trade.rate).toLocaleString()}/USDT
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-700">Bank Name</label>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                    <span className="font-mono text-gray-900">{trade.bankName || "First Bank"}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(trade.bankName || "First Bank", "Bank name")}
                      className="text-blue-600 hover:bg-blue-100"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-700">Account Number</label>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                    <span className="font-mono text-gray-900">{trade.accountNumber || "1234567890"}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(trade.accountNumber || "1234567890", "Account number")}
                      className="text-blue-600 hover:bg-blue-100"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-700">Account Name</label>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                    <span className="font-mono text-gray-900">{trade.accountName || "John Doe"}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(trade.accountName || "John Doe", "Account name")}
                      className="text-blue-600 hover:bg-blue-100"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Payment Instructions:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Send exactly ₦{(parseFloat(trade.amount) * parseFloat(trade.rate)).toLocaleString()}</li>
                    <li>Use the account details shown above</li>
                    <li>Save your payment receipt</li>
                    <li>Click "I Have Made Payment" after sending</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Details Card for Sellers */}
        {isSeller && (trade.bankName || trade.accountNumber) && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Your Payment Details
              </CardTitle>
              <div className="text-sm text-green-700 mt-1">
                Buyer will send payment to these details
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {trade.bankName && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bank</span>
                  <span className="font-medium">{trade.bankName}</span>
                </div>
              )}
              {trade.accountName && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Account Name</span>
                  <span className="font-medium">{trade.accountName}</span>
                </div>
              )}
              {trade.accountNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Account Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium font-mono">{trade.accountNumber}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(trade.accountNumber!, 'Account number')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Deadline Card */}
        {trade.paymentDeadline && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-900">Payment Deadline</span>
              </div>
              <p className="text-sm text-orange-800">
                {new Date(trade.paymentDeadline).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {isUserInTrade && (
          <div className="space-y-3">
            {canMarkPaymentMade && (
              <Button
                onClick={() => markPaymentMadeMutation.mutate()}
                disabled={markPaymentMadeMutation.isPending}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700"
              >
                {markPaymentMadeMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Confirming Payment...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    I Have Made Payment
                  </>
                )}
              </Button>
            )}

            {canComplete && (
              <Button
                onClick={() => completeTradeMultation.mutate()}
                disabled={completeTradeMultation.isPending}
                className="w-full h-12 bg-green-600 hover:bg-green-700"
              >
                {completeTradeMultation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Completing Trade...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete Trade
                  </>
                )}
              </Button>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setLocation(`/chat/${trade.id}`)}
                className="flex-1 h-10"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
              
              {canCancel && (
                <Button
                  variant="outline"
                  onClick={() => cancelTradeMutation.mutate()}
                  disabled={cancelTradeMutation.isPending}
                  className="flex-1 h-10 border-red-300 text-red-600 hover:bg-red-50"
                >
                  {cancelTradeMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Padding */}
      <div className="h-20" />
    </div>
  );
}