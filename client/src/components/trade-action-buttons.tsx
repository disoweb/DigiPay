import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Flag, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Star
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Trade {
  id: number;
  status: string;
  buyerId: number;
  sellerId: number;
  amount: string;
  fiatAmount: string;
  paymentDeadline?: string;
}

interface TradeActionButtonsProps {
  trade: Trade;
  currentUserId: number;
  userRole: 'buyer' | 'seller';
  onTradeUpdated: () => void;
}

export function TradeActionButtons({ trade, currentUserId, userRole, onTradeUpdated }: TradeActionButtonsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<'confirm_payment' | 'release_funds' | 'cancel_trade' | null>(null);

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/trades/${trade.id}/confirm-payment`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Payment Confirmed", description: "Payment has been marked as sent" });
      onTradeUpdated();
      setShowConfirmDialog(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to confirm payment", 
        variant: "destructive" 
      });
    },
  });

  const releaseFundsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/trades/${trade.id}/release-funds`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Funds Released", description: "Trade completed successfully" });
      onTradeUpdated();
      setShowConfirmDialog(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to release funds", 
        variant: "destructive" 
      });
    },
  });

  const cancelTradeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/trades/${trade.id}/cancel`, {
        reason: "User cancellation"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Trade Cancelled", description: "Trade has been cancelled" });
      onTradeUpdated();
      setShowConfirmDialog(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to cancel trade", 
        variant: "destructive" 
      });
    },
  });

  const handleAction = (type: 'confirm_payment' | 'release_funds' | 'cancel_trade') => {
    setActionType(type);
    setShowConfirmDialog(true);
  };

  const executeAction = () => {
    switch (actionType) {
      case 'confirm_payment':
        confirmPaymentMutation.mutate();
        break;
      case 'release_funds':
        releaseFundsMutation.mutate();
        break;
      case 'cancel_trade':
        cancelTradeMutation.mutate();
        break;
    }
  };

  const getActionText = () => {
    switch (actionType) {
      case 'confirm_payment':
        return {
          title: "Confirm Payment Sent",
          description: "Are you sure you have sent the payment? This action cannot be undone.",
          button: "Confirm Payment"
        };
      case 'release_funds':
        return {
          title: "Release Funds",
          description: "Are you sure you want to release the USDT to the buyer? This will complete the trade.",
          button: "Release Funds"
        };
      case 'cancel_trade':
        return {
          title: "Cancel Trade",
          description: "Are you sure you want to cancel this trade? The escrow will be returned to the seller.",
          button: "Cancel Trade"
        };
      default:
        return { title: "", description: "", button: "" };
    }
  };

  const isPaymentPending = trade.status === 'payment_pending';
  const isPaymentMade = trade.status === 'payment_made';
  const canCancel = ['payment_pending'].includes(trade.status);

  // Check if payment deadline has passed
  const isExpired = trade.paymentDeadline && new Date() > new Date(trade.paymentDeadline);

  return (
    <>
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-blue-900">Trade Actions</h3>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                {userRole === 'buyer' ? 'Buyer' : 'Seller'}
              </Badge>
            </div>

            {/* Payment Deadline Warning */}
            {isPaymentPending && trade.paymentDeadline && (
              <Alert className={`border-2 ${isExpired ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'}`}>
                <Clock className={`h-4 w-4 ${isExpired ? 'text-red-600' : 'text-yellow-600'}`} />
                <AlertDescription className={isExpired ? 'text-red-800' : 'text-yellow-800'}>
                  <strong>{isExpired ? 'Payment Expired!' : 'Payment Deadline:'}</strong>{' '}
                  {new Date(trade.paymentDeadline).toLocaleString()}
                  {isExpired && ' - Contact support or raise a dispute'}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              {/* Buyer Actions */}
              {userRole === 'buyer' && isPaymentPending && (
                <Button 
                  onClick={() => handleAction('confirm_payment')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={confirmPaymentMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {confirmPaymentMutation.isPending ? "Confirming..." : "I Have Paid"}
                </Button>
              )}

              {/* Seller Actions */}
              {userRole === 'seller' && isPaymentMade && (
                <Button 
                  onClick={() => handleAction('release_funds')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={releaseFundsMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {releaseFundsMutation.isPending ? "Releasing..." : "Release Funds"}
                </Button>
              )}

              {/* Cancel Action (available to both parties in certain states) */}
              {canCancel && (
                <Button 
                  variant="outline"
                  onClick={() => handleAction('cancel_trade')}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  disabled={cancelTradeMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {cancelTradeMutation.isPending ? "Cancelling..." : "Cancel Trade"}
                </Button>
              )}
            </div>

            {/* Status-specific instructions */}
            <div className="text-sm text-gray-600 space-y-1">
              {userRole === 'buyer' && isPaymentPending && (
                <p>• Send payment using the provided details and click "I Have Paid"</p>
              )}
              {userRole === 'buyer' && isPaymentMade && (
                <p>• Waiting for seller to confirm payment and release funds</p>
              )}
              {userRole === 'seller' && isPaymentPending && (
                <p>• Waiting for buyer to send payment</p>
              )}
              {userRole === 'seller' && isPaymentMade && (
                <p>• Verify payment in your account and release funds when confirmed</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'cancel_trade' ? (
                <XCircle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              {getActionText().title}
            </DialogTitle>
            <DialogDescription>
              {getActionText().description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === 'confirm_payment' && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Only confirm if you have actually sent the payment. False confirmations may result in disputes.
                </AlertDescription>
              </Alert>
            )}

            {actionType === 'release_funds' && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Only release funds after confirming payment in your bank account. This action cannot be undone.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={executeAction}
                disabled={confirmPaymentMutation.isPending || releaseFundsMutation.isPending || cancelTradeMutation.isPending}
                className={actionType === 'cancel_trade' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
              >
                {(confirmPaymentMutation.isPending || releaseFundsMutation.isPending || cancelTradeMutation.isPending) 
                  ? "Processing..." 
                  : getActionText().button
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}