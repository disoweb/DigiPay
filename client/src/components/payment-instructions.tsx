import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle, CreditCard, Building2, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Trade } from "@shared/schema";

interface PaymentInstructionsProps {
  trade: Trade;
  userRole: 'buyer' | 'seller';
  onPaymentMarked: () => void;
  onPaymentConfirmed?: () => void;
}

export function PaymentInstructions({ trade, userRole, onPaymentMarked, onPaymentConfirmed }: PaymentInstructionsProps) {
  const { toast } = useToast();
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const markPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/trades/${trade.id}/payment-made`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark payment");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Marked",
        description: "Payment has been marked as made",
      });
      onPaymentMarked();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark payment",
        variant: "destructive",
      });
    },
  });

  const handleMarkPayment = () => {
    markPaymentMutation.mutate();
  };

  const handleConfirmPayment = async () => {
    setIsConfirmingPayment(true);
    try {
      const response = await apiRequest("POST", `/api/trades/${trade.id}/confirm-payment`);

      const data = await response.json();
      toast({
        title: "Payment Confirmed",
        description: "Payment confirmed and USDT released from escrow",
      });
      onPaymentConfirmed?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm payment",
        variant: "destructive",
      });
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  // Always show payment details for buyers immediately when they are buying
  if (userRole === 'buyer') {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Seller's Payment Details
          </CardTitle>
          <CardDescription>
            Use these details to send your payment of ₦{parseFloat(trade.fiatAmount).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                Amount to Pay
              </Badge>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              ₦{parseFloat(trade.fiatAmount).toLocaleString()}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              For {parseFloat(trade.amount).toFixed(2)} USDT at ₦{parseFloat(trade.rate).toLocaleString()}/USDT
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Bank Name</label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-mono">{trade.bankName || "First Bank"}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(trade.bankName || "First Bank", "Bank name")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Account Number</label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-mono">{trade.accountNumber || "1234567890"}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(trade.accountNumber || "1234567890", "Account number")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Account Name</label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-mono">{trade.accountName || "John Doe"}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(trade.accountName || "John Doe", "Account name")}
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
                Important Payment Instructions:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Send exactly ₦{parseFloat(trade.fiatAmount).toLocaleString()} - no more, no less</li>
                <li>Transfer to the account details shown above</li>
                <li>Save your payment receipt/confirmation</li>
                <li>Click "I Have Made Payment" button after sending</li>
                <li>Wait for seller confirmation to receive your USDT</li>
              </ul>
            </div>
          </div>

          {trade.status === "payment_pending" && (
            <Button
              onClick={handleMarkPayment}
              disabled={markPaymentMutation.isPending}
              className="w-full"
              size="lg"
            >
              {markPaymentMutation.isPending ? (
                "Marking as Paid..."
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  I Have Made Payment
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (userRole === 'seller') {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            Your Payment Details
          </CardTitle>
          <CardDescription>
            The buyer will send ₦{parseFloat(trade.fiatAmount).toLocaleString()} to these details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-100 p-4 rounded-lg border border-green-300">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-green-200 text-green-800">
                Amount to Receive
              </Badge>
            </div>
            <p className="text-2xl font-bold text-green-900">
              ₦{parseFloat(trade.fiatAmount).toLocaleString()}
            </p>
            <p className="text-sm text-green-700 mt-1">
              For {parseFloat(trade.amount).toFixed(2)} USDT at ₦{parseFloat(trade.rate).toLocaleString()}/USDT
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Bank Name</label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-mono">{trade.bankName || "First Bank"}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(trade.bankName || "First Bank", "Bank name")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Account Number</label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-mono">{trade.accountNumber || "1234567890"}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(trade.accountNumber || "1234567890", "Account number")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Account Name</label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-mono">{trade.accountName || "John Doe"}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(trade.accountName || "John Doe", "Account name")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {trade.status === "payment_pending" && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Waiting for Buyer Payment:</p>
                  <p>The buyer has been provided with your payment details. Wait for them to complete the payment and mark it as made.</p>
                </div>
              </div>
            </div>
          )}

          {trade.status === "payment_made" && (
            <>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium mb-1">Payment Marked as Made:</p>
                    <p>The buyer has indicated they've sent the payment. Check your bank account and confirm receipt to release the USDT from escrow.</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleConfirmPayment}
                disabled={isConfirmingPayment}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isConfirmingPayment ? (
                  "Confirming Payment..."
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Payment Received
                  </>
                )}
              </Button>
            </>
          )}

          {trade.status === "completed" && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Trade Completed:</p>
                  <p>Payment confirmed and USDT has been released from escrow to the buyer.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
}