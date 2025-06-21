import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, CheckCircle, AlertCircle, DollarSign } from "lucide-react";
import type { Trade } from "@shared/schema";

interface TradeStatusProps {
  trade: Trade;
  userRole: 'buyer' | 'seller' | 'other';
  onUpdate?: () => void;
}

export function TradeStatus({ trade, userRole, onUpdate }: TradeStatusProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const paymentMadeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/trades/${trade.id}/payment-made`);
    },
    onSuccess: () => {
      toast({
        title: "Payment Confirmed",
        description: "Payment marked as made. Waiting for seller confirmation.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      onUpdate?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm payment",
        variant: "destructive",
      });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/trades/${trade.id}/confirm-payment`);
    },
    onSuccess: () => {
      toast({
        title: "Trade Completed",
        description: "Payment confirmed and USDT released successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      onUpdate?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm payment",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = () => {
    switch (trade.status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "payment_pending":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200"><Clock className="h-3 w-3 mr-1" />Payment Pending</Badge>;
      case "payment_made":
        return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200"><AlertCircle className="h-3 w-3 mr-1" />Payment Made</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "expired":
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200"><AlertCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{trade.status}</Badge>;
    }
  };

  const getTimeRemaining = () => {
    if (!trade.paymentDeadline || trade.status !== "payment_pending") return null;
    
    const deadline = new Date(trade.paymentDeadline);
    const now = new Date();
    const timeLeft = deadline.getTime() - now.getTime();
    
    if (timeLeft <= 0) return "Expired";
    
    const minutes = Math.floor(timeLeft / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
  };

  const renderActions = () => {
    if (trade.status === "payment_pending" && userRole === "buyer") {
      return (
        <Button
          onClick={() => paymentMadeMutation.mutate()}
          disabled={paymentMadeMutation.isPending}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          I Have Made Payment
        </Button>
      );
    }

    if (trade.status === "payment_made" && userRole === "seller") {
      return (
        <Button
          onClick={() => confirmPaymentMutation.mutate()}
          disabled={confirmPaymentMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Confirm Payment Received
        </Button>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Trade Status</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Amount</p>
            <p className="font-semibold">{trade.amount} USDT</p>
          </div>
          <div>
            <p className="text-gray-600">Rate</p>
            <p className="font-semibold">₦{trade.rate}/USDT</p>
          </div>
        </div>

        {trade.status === "payment_pending" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">Payment Deadline</span>
              <span className="text-sm font-semibold text-blue-900">
                {getTimeRemaining()}
              </span>
            </div>
          </div>
        )}

        {trade.status === "payment_made" && userRole === "seller" && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              Buyer has marked payment as made. Please verify and confirm payment received.
            </p>
          </div>
        )}

        {trade.status === "completed" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              Trade completed successfully! USDT has been released.
            </p>
          </div>
        )}

        {renderActions()}
      </CardContent>
    </Card>
  );
}