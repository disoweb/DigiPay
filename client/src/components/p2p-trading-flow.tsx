import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Clock, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Upload, 
  MessageCircle,
  CreditCard,
  Timer,
  ArrowRight,
  Wallet,
  Star
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
  buyerInstructions?: string;
  sellerInstructions?: string;
  createdAt: string;
  buyer?: { id: number; email: string; averageRating: string };
  seller?: { id: number; email: string; averageRating: string };
  offer?: { type: string; paymentMethod?: string };
}

interface P2PTradingFlowProps {
  tradeId: number;
  userRole: 'buyer' | 'seller';
}

export function P2PTradingFlow({ tradeId, userRole }: P2PTradingFlowProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentProof, setPaymentProof] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);

  const { data: trade, isLoading } = useQuery<Trade>({
    queryKey: [`/api/trades/${tradeId}`],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Calculate time remaining for payment
  useEffect(() => {
    if (trade?.paymentDeadline) {
      const deadline = new Date(trade.paymentDeadline).getTime();
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, deadline - now);
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          clearInterval(interval);
          queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] });
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [trade?.paymentDeadline, tradeId, queryClient]);

  const markPaymentMadeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/trades/${tradeId}/payment-made`, {
        paymentReference,
        paymentProof,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Marked",
        description: "Payment proof submitted successfully. Waiting for seller confirmation.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark payment",
        variant: "destructive",
      });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/trades/${tradeId}/confirm-payment`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trade Completed",
        description: "Payment confirmed and trade completed successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm payment",
        variant: "destructive",
      });
    },
  });

  const raiseDisputeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/trades/${tradeId}/dispute`, {
        reason: disputeReason,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dispute Raised",
        description: "Your dispute has been submitted to admin for review.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to raise dispute",
        variant: "destructive",
      });
    },
  });

  const cancelTradeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/trades/${tradeId}/cancel`, {
        reason: "User cancellation",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trade Cancelled",
        description: "Trade has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel trade",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!trade) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Trade not found</p>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'payment_pending': return 'bg-blue-100 text-blue-800';
      case 'payment_made': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTradeSteps = () => {
    const steps = [
      { label: 'Trade Initiated', completed: true },
      { label: 'Payment Window', completed: trade.status !== 'pending' },
      { label: 'Payment Made', completed: ['payment_made', 'completed'].includes(trade.status) },
      { label: 'Trade Completed', completed: trade.status === 'completed' },
    ];
    return steps;
  };

  const steps = getTradeSteps();
  const currentStep = steps.findIndex(step => !step.completed);
  const progress = ((steps.filter(step => step.completed).length - 1) / (steps.length - 1)) * 100;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile-Optimized Trade Overview */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-lg">Trade #{trade.id}</span>
            <Badge className={getStatusColor(trade.status)}>
              {trade.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <Label className="text-xs text-gray-500">Amount</Label>
              <p className="font-semibold text-sm md:text-base">{parseFloat(trade.amount).toFixed(2)} USDT</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Label className="text-xs text-gray-500">Rate</Label>
              <p className="font-semibold text-sm md:text-base">₦{parseFloat(trade.rate).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Label className="text-xs text-gray-500">Total</Label>
              <p className="font-semibold text-sm md:text-base">₦{parseFloat(trade.fiatAmount).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Label className="text-xs text-gray-500">Your Role</Label>
              <p className="font-semibold capitalize text-sm md:text-base">{userRole}</p>
            </div>
          </div>

          {/* Payment Timer */}
          {trade.status === 'payment_pending' && timeRemaining > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Payment Window</span>
              </div>
              <p className="text-sm text-blue-700 mb-2">
                Time remaining: {formatTime(timeRemaining)}
              </p>
              <Progress value={(timeRemaining / (15 * 60 * 1000)) * 100} className="h-2" />
            </div>
          )}

          {/* Progress Steps */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-500">Progress</Label>
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    step.completed ? 'bg-green-500' : index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                  <span className="ml-2 text-sm">{step.label}</span>
                  {index < steps.length - 1 && (
                    <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2 mt-2" />
          </div>
        </CardContent>
      </Card>

      {/* Escrow Protection */}
      {trade.escrowAddress && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Escrow Protection Active</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Funds are securely held in escrow until trade completion
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Cards Based on Status and Role */}
      {trade.status === 'payment_pending' && userRole === 'buyer' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Make Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Payment Instructions</h4>
              <p className="text-sm text-blue-700">
                {trade.buyerInstructions || 'Please send payment using the agreed method and upload proof below.'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="paymentReference">Payment Reference</Label>
                <Input
                  id="paymentReference"
                  placeholder="Enter payment reference/transaction ID"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="paymentProof">Payment Proof</Label>
                <Textarea
                  id="paymentProof"
                  placeholder="Upload screenshot or provide payment details"
                  value={paymentProof}
                  onChange={(e) => setPaymentProof(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={() => markPaymentMadeMutation.mutate()}
                disabled={!paymentReference.trim() || markPaymentMadeMutation.isPending}
                className="w-full"
              >
                {markPaymentMadeMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Mark Payment as Made
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {trade.status === 'payment_made' && userRole === 'seller' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Confirm Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Payment Details</h4>
              <p className="text-sm text-green-700 mb-2">
                <strong>Reference:</strong> {trade.paymentReference}
              </p>
              {trade.paymentProof && (
                <p className="text-sm text-green-700">
                  <strong>Proof:</strong> {trade.paymentProof}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => confirmPaymentMutation.mutate()}
                disabled={confirmPaymentMutation.isPending}
                className="flex-1"
              >
                {confirmPaymentMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Payment Received
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dispute/Cancel Actions */}
      {['payment_pending', 'payment_made'].includes(trade.status) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="disputeReason">Dispute Reason</Label>
                <Textarea
                  id="disputeReason"
                  placeholder="Describe the issue you're facing..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => raiseDisputeMutation.mutate()}
                  disabled={!disputeReason.trim() || raiseDisputeMutation.isPending}
                  className="flex-1"
                >
                  {raiseDisputeMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Raising Dispute...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Raise Dispute
                    </>
                  )}
                </Button>

                {trade.status === 'payment_pending' && (
                  <Button
                    variant="outline"
                    onClick={() => cancelTradeMutation.mutate()}
                    disabled={cancelTradeMutation.isPending}
                    className="flex-1"
                  >
                    {cancelTradeMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Trade'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trade Completed */}
      {trade.status === 'completed' && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">Trade Completed Successfully!</h3>
                <p className="text-sm text-green-700">
                  The trade has been completed and funds have been released.
                </p>
              </div>
              <Button variant="outline" className="mt-4">
                <Star className="h-4 w-4 mr-2" />
                Rate Your Trading Partner
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trade Disputed */}
      {trade.status === 'disputed' && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">Trade Under Dispute</h3>
                <p className="text-sm text-red-700">
                  This trade is being reviewed by our admin team. Please wait for resolution.
                </p>
                {trade.disputeReason && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Reason:</strong> {trade.disputeReason}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}