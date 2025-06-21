import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle, CreditCard, Building2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Trade } from "@shared/schema";

interface PaymentInstructionsProps {
  trade: Trade;
  userRole: 'buyer' | 'seller';
  onPaymentMarked?: () => void;
}

export function PaymentInstructions({ trade, userRole, onPaymentMarked }: PaymentInstructionsProps) {
  const [markingPaid, setMarkingPaid] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    });
  };

  const handleMarkAsPaid = async () => {
    setMarkingPaid(true);
    try {
      const response = await fetch(`/api/trades/${trade.id}/mark-paid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("digipay_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to mark as paid");
      }

      toast({
        title: "Payment marked",
        description: "The seller will be notified to confirm your payment",
      });

      onPaymentMarked?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMarkingPaid(false);
    }
  };

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

  // Buyer view
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Instructions
        </CardTitle>
        <CardDescription>
          Send payment to the seller's account details below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-orange-200 text-orange-800">
              Amount to Pay
            </Badge>
          </div>
          <p className="text-2xl font-bold text-orange-900">
            ₦{parseFloat(trade.fiatAmount).toLocaleString()}
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

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-sm text-red-800">
            <p className="font-medium mb-2">Important Instructions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Send the exact amount: ₦{parseFloat(trade.fiatAmount).toLocaleString()}</li>
              <li>Use the account details provided above</li>
              <li>Keep your payment receipt/reference</li>
              <li>Mark payment as completed after sending</li>
            </ul>
          </div>
        </div>

        {trade.status === "payment_pending" && (
          <Button 
            onClick={handleMarkAsPaid}
            disabled={markingPaid}
            className="w-full"
            size="lg"
          >
            {markingPaid ? (
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