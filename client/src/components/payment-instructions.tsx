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
  trade: any;
  userRole: 'buyer' | 'seller';
  onPaymentMarked: () => void;
}

export function PaymentInstructions({ trade, userRole, onPaymentMarked }: PaymentInstructionsProps) {
  const { toast } = useToast();
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleMarkPayment = async () => {
    setIsMarkingPaid(true);
    try {
      const token = localStorage.getItem('token');
      const response = await apiRequest("POST", `/api/trades/${trade.id}/payment-made`);

      const data = await response.json();
      toast({
        title: "Payment Marked",
        description: "Payment has been marked as made",
      });
      onPaymentMarked();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark payment",
        variant: "destructive",
      });
    } finally {
      setIsMarkingPaid(false);
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
              disabled={isMarkingPaid}
              className="w-full"
              size="lg"
            >
              {isMarkingPaid ? (
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Your Payment Details
          </CardTitle>
          <CardDescription>
            These are your payment details that the buyer will use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Waiting for Payment:</p>
                <p>The buyer has 15 minutes to complete the payment and provide proof.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
}